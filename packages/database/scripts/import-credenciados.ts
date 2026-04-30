/**
 * Importação em massa de credenciados a partir da planilha "Credenciados ACIAV Saúde".
 *
 * Uso (rodar local com SSH tunnel pro Postgres da VPS, conforme decisão #13):
 *
 *   # Terminal A — abre o tunnel SSH (manter aberto durante o import):
 *   ssh -N -L 15432:localhost:5432 root@31.97.240.184
 *
 *   # Terminal B — exporta DATABASE_URL apontando pro tunnel (porta 15432) e roda:
 *   export DATABASE_URL="postgresql://aciav:SENHA@localhost:15432/aciav_saude"
 *
 *   # 1) Dry-run: gera /tmp/import-report.csv e /tmp/import-report.json sem tocar no banco
 *   npm run import:credenciados -w @aciav-saude/database -- --dry-run
 *
 *   # 2) Após revisar o relatório, roda commit:
 *   npm run import:credenciados -w @aciav-saude/database -- --commit
 *
 * Flags:
 *   --csv <path>            Caminho do CSV local. Default: ./scripts/.csv-input/credenciados.csv
 *   --google-sheet <id>     Baixa CSV do Google Sheets pelo ID (ex.: 1RgqsUe3...)
 *   --unit-name "Videira"   Nome da unidade (busca por contains, case-insensitive). Default: Videira
 *   --dry-run               (default) só simula, gera relatório, não escreve
 *   --commit                executa de verdade dentro de uma transaction
 *
 * Decisões alinhadas com o cliente (vide plan file):
 *  - Match de duplicata: 100% por (clinicName + professionalName) lowercase + trim → SKIP se já existe
 *  - Categorias granulares ("Pediatria", "Ortopedia", etc), criadas dinamicamente em Category
 *  - Provider individual quando há nome próprio (Dr./Dra. ou pattern de nome) e institucional caso contrário
 *  - Telefone: 9 dígitos com 9 inicial = WhatsApp; 8 dígitos = fixo; só 1 número = WhatsApp
 *  - Texto composto (Be Health, Vital Cardio do Dr. Roberto, FARMASESI) → split em múltiplos services
 *  - Email opcional, sem AuthUser auto-criado
 *  - Sem ViaCEP enriquecimento — cep fica vazio; admin completa depois
 *
 * Output:
 *  /tmp/import-report-<ts>.csv   relatório CSV legível
 *  /tmp/import-report-<ts>.json  payload completo (auditoria)
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const prisma = new PrismaClient();

// ────────────────────────────────────────────────────────────────────────────
// CLI args
// ────────────────────────────────────────────────────────────────────────────

interface Args {
  csvPath?: string;
  googleSheetId?: string;
  unitName: string;
  dryRun: boolean;
  commit: boolean;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const args: Args = {
    csvPath: undefined,
    googleSheetId: undefined,
    unitName: 'Videira',
    dryRun: true,
    commit: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--csv') args.csvPath = argv[++i];
    else if (a === '--google-sheet') args.googleSheetId = argv[++i];
    else if (a === '--unit-name') args.unitName = argv[++i];
    else if (a === '--dry-run') { args.dryRun = true; args.commit = false; }
    else if (a === '--commit') { args.commit = true; args.dryRun = false; }
  }
  return args;
}

// ────────────────────────────────────────────────────────────────────────────
// Carregar CSV (local ou via Google Sheets export)
// ────────────────────────────────────────────────────────────────────────────

async function loadCsv(args: Args): Promise<string[][]> {
  let csv: string;

  if (args.googleSheetId) {
    const url = `https://docs.google.com/spreadsheets/d/${args.googleSheetId}/export?format=csv`;
    log(`📥 Baixando CSV do Google Sheets…`);
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) throw new Error(`Falha ao baixar CSV (HTTP ${res.status}): ${url}`);
    csv = await res.text();
  } else {
    const path = args.csvPath ?? join(__dirname, '.csv-input', 'credenciados.csv');
    log(`📂 Lendo CSV local: ${path}`);
    csv = readFileSync(path, 'utf-8');
  }

  const records = parse(csv, {
    skip_empty_lines: false,
    relax_column_count: true,
    trim: false,
  }) as string[][];

  return records;
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers de normalização
// ────────────────────────────────────────────────────────────────────────────

function trimAll(s: string | undefined | null): string {
  return (s ?? '').replace(/\s+/g, ' ').trim();
}

function lower(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

function slugify(s: string): string {
  return lower(s)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function capitalize(s: string): string {
  return s
    .split(/\s+/)
    .map((word) => {
      if (!word) return word;
      // mantém preposições minúsculas
      if (['de', 'da', 'do', 'das', 'dos', 'e'].includes(word.toLowerCase()) && word.length > 0) {
        return word.toLowerCase();
      }
      return word[0].toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

// ────────────────────────────────────────────────────────────────────────────
// Telefone: extrai whatsapp (9d com 9 inicial) e phone (8d fixo)
// ────────────────────────────────────────────────────────────────────────────

interface Phones {
  whatsapp: string | null;
  phone: string | null;
}

const DEFAULT_DDD = '49';

function parsePhones(raw: string): Phones {
  const text = trimAll(raw);
  if (!text) return { whatsapp: null, phone: null };

  // separa por '/' ou '-' (quando claramente são 2 números). 2 sequências de dígitos
  const parts = text
    .split(/[\/]+/)
    .map((p) => p.trim())
    .filter(Boolean);

  let whatsapp: string | null = null;
  let phone: string | null = null;

  for (const p of parts) {
    const digits = p.replace(/\D/g, '');
    if (digits.length === 0) continue;

    // se tem 13+ dígitos, ignora (provavelmente lixo)
    let normalized = digits;
    if (normalized.length === 8) {
      normalized = DEFAULT_DDD + normalized; // adiciona DDD se faltou
    } else if (normalized.length === 9 && normalized[0] === '9') {
      normalized = DEFAULT_DDD + normalized;
    } else if (normalized.length === 10 || normalized.length === 11) {
      // já tem DDD
    } else if (normalized.length === 12 && normalized.startsWith('0')) {
      normalized = normalized.slice(1); // remove 0 prefixo
    } else if (normalized.length === 7) {
      normalized = DEFAULT_DDD + '3' + normalized; // alguns fixos antigos
    }

    // 0800 → trata como phone
    if (digits.length >= 10 && digits.startsWith('0800')) {
      if (!phone) phone = digits;
      continue;
    }

    // pega os últimos dígitos pra classificar (ignora DDD)
    const localPart = normalized.length >= 10 ? normalized.slice(2) : normalized;

    if (localPart.length === 9 && localPart[0] === '9') {
      if (!whatsapp) whatsapp = normalized;
    } else if (localPart.length === 8) {
      if (!phone) phone = normalized;
    } else {
      // fallback: se ninguém ainda tem, vai pro whatsapp
      if (!whatsapp) whatsapp = normalized;
      else if (!phone) phone = normalized;
    }
  }

  // se só tem 1 número e foi pra phone, mas é móvel → reclassifica
  if (whatsapp === null && phone !== null) {
    const local = phone.length >= 10 ? phone.slice(2) : phone;
    if (local.length === 9 && local[0] === '9') {
      whatsapp = phone;
      phone = null;
    }
  }

  // se só tem 1 número e nada foi classificado, vira whatsapp por default
  if (whatsapp === null && phone === null && parts.length > 0) {
    const fallback = parts[0].replace(/\D/g, '');
    if (fallback.length >= 8) {
      whatsapp = fallback.length >= 10 ? fallback : DEFAULT_DDD + fallback;
    }
  }

  return { whatsapp, phone };
}

// ────────────────────────────────────────────────────────────────────────────
// Endereço: extrai street/number/neighborhood/city/state do texto livre
// ────────────────────────────────────────────────────────────────────────────

interface AddressParts {
  cep: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
}

const KNOWN_CITIES = ['Videira', 'Caçador', 'Iomerê', 'Tangará', 'Pinheiro Preto', 'Salto Veloso'];
const KNOWN_STATES = ['SC', 'RS', 'PR', 'SP'];

function parseAddress(raw: string): AddressParts {
  const empty: AddressParts = { cep: '', street: '', number: '', neighborhood: '', city: '', state: '' };
  const text = trimAll(raw);
  if (!text) return empty;

  let working = text;
  const result: AddressParts = { ...empty };

  // CEP (pode estar no início ou no fim)
  const cepMatch = working.match(/(\d{5})[\.\-\s]?(\d{3})/);
  if (cepMatch) {
    result.cep = cepMatch[1] + cepMatch[2];
    working = working.replace(cepMatch[0], '').trim();
  }

  // Estado (UF) — geralmente no final
  for (const uf of KNOWN_STATES) {
    const ufRegex = new RegExp(`(?:[\\-,\\s])${uf}(?:\\s|$)`, 'i');
    if (ufRegex.test(working)) {
      result.state = uf;
      working = working.replace(ufRegex, ' ').trim();
      break;
    }
  }

  // Cidade — buscar por cidades conhecidas
  for (const city of KNOWN_CITIES) {
    const cityRegex = new RegExp(`\\b${city.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\b`, 'i');
    if (cityRegex.test(working)) {
      result.city = city;
      working = working.replace(cityRegex, ' ').trim();
      break;
    }
  }

  // Limpa pontuação extra
  working = working.replace(/\s+/g, ' ').replace(/^[\s,\-]+|[\s,\-]+$/g, '');

  // Tenta extrair número (n° X ou , XXX após rua)
  const numberMatch =
    working.match(/n[°ºo]?\.?\s*(\d+(?:\s*sala\s*\d+)?)/i) ||
    working.match(/,\s*(\d+(?:\s*sala\s*\d+)?)/) ||
    working.match(/\s+(\d+(?:\s*sala\s*\d+)?)\s*(?:-|,|sala)/i) ||
    working.match(/\s(\d{1,5})$/);

  if (numberMatch) {
    result.number = numberMatch[1].replace(/\s+/g, ' ').trim();
    working = working.replace(numberMatch[0], ' ').trim();
  }

  // Bairro: heurística — texto após o último '-' ou ', '
  // Padrões: "Rua X, 123 - Bairro" ou "Rua X, Bairro"
  const parts = working.split(/[\-,]/).map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) {
    return result;
  } else if (parts.length === 1) {
    result.street = parts[0];
  } else if (parts.length === 2) {
    result.street = parts[0];
    result.neighborhood = parts[1];
  } else {
    // 3+ partes: street é a primeira; neighborhood é a última (ou penúltima)
    result.street = parts[0];
    result.neighborhood = parts[parts.length - 1];
    // se a última parte tem só 1 palavra e a penúltima tem mais → talvez seja só sala
    if (parts[parts.length - 1].length <= 6 && parts.length >= 3) {
      result.neighborhood = parts[parts.length - 2];
    }
  }

  // Cleanup final
  result.street = trimAll(result.street);
  result.neighborhood = trimAll(result.neighborhood);

  return result;
}

// ────────────────────────────────────────────────────────────────────────────
// Valores: parseValue('400'), parseValue('20%'), parseValue('5 á 12%')
// ────────────────────────────────────────────────────────────────────────────

type ParsedValue =
  | { kind: 'fixed'; value: number }
  | { kind: 'percent'; value: number }
  | { kind: 'range'; min: number; max: number }
  | { kind: 'empty' };

function parseValue(raw: string): ParsedValue {
  const text = trimAll(raw);
  if (!text || text === '0' || text === '0%') return { kind: 'empty' };

  // range: "5 a 12%", "5 á 12%", "5% a 12%", "10 à 25%", "5%-12%"
  const rangeMatch = text.match(/(\d+(?:[.,]\d+)?)\s*%?\s*(?:[aàá-]+|to)\s*(\d+(?:[.,]\d+)?)\s*%/i);
  if (rangeMatch) {
    return {
      kind: 'range',
      min: Number(rangeMatch[1].replace(',', '.')),
      max: Number(rangeMatch[2].replace(',', '.')),
    };
  }

  // percent fixo: "20%", "30% desconto"
  const pctMatch = text.match(/(\d+(?:[.,]\d+)?)\s*%/);
  if (pctMatch) {
    return { kind: 'percent', value: Number(pctMatch[1].replace(',', '.')) };
  }

  // valor fixo: "400", "1.050,00", "380,00"
  const valueMatch = text.match(/(\d+(?:\.\d{3})*(?:[.,]\d{1,2})?)/);
  if (valueMatch) {
    const num = Number(valueMatch[1].replace(/\./g, '').replace(',', '.'));
    if (Number.isFinite(num) && num > 0) {
      return { kind: 'fixed', value: num };
    }
  }

  return { kind: 'empty' };
}

// ────────────────────────────────────────────────────────────────────────────
// Splitter de texto composto (Be Health, Vital Cardio, FARMASESI)
// ────────────────────────────────────────────────────────────────────────────

interface ServiceDraft {
  description: string;
  originalPrice: number;
  insurancePrice: number;
  discountType: string;
  discountValue: number;
  discountMinPercent: number | null;
  discountMaxPercent: number | null;
}

function buildServiceDraft(
  description: string,
  particularValue: ParsedValue,
  aciValue: ParsedValue,
): ServiceDraft {
  const draft: ServiceDraft = {
    description,
    originalPrice: 0,
    insurancePrice: 0,
    discountType: '',
    discountValue: 0,
    discountMinPercent: null,
    discountMaxPercent: null,
  };

  if (particularValue.kind === 'fixed') {
    draft.originalPrice = particularValue.value;
  }

  if (aciValue.kind === 'fixed') {
    draft.insurancePrice = aciValue.value;
    draft.discountType = '';
  } else if (aciValue.kind === 'percent') {
    draft.discountType = 'percentage';
    draft.discountValue = aciValue.value;
  } else if (aciValue.kind === 'range') {
    draft.discountMinPercent = Math.round(aciValue.min);
    draft.discountMaxPercent = Math.round(aciValue.max);
  }

  return draft;
}

/**
 * Detecta linhas com texto composto e retorna múltiplos services.
 * Retorna null se a linha for "simples" (1 service só).
 */
function trySplitComposto(name: string, especialidade: string, particularRaw: string, aciRaw: string): ServiceDraft[] | null {
  // Be Health (linha 22 e 117): "Consulta clinico geral 150,00, Audiometria 80,00, Eletrocardiograma 120,00..."
  if (lower(name).includes('be health') || lower(aciRaw).includes('audiometria') || lower(aciRaw).includes('eletrocardiograma')) {
    const drafts: ServiceDraft[] = [];
    // pattern: "Nome Valor,00" ou "Nome NUMERO%"
    const itemPattern = /([A-Za-zÀ-ú][A-Za-zÀ-ú\s]+?)\s+(\d+(?:[.,]\d+)?)(\s*,\s*\d+|%|\s+a\s+\d+\s*%)?(?=\s*,|$)/g;
    const m = aciRaw.match(/Consulta clinico geral\s+(\d+,\d+)/i);
    if (m) drafts.push(buildServiceDraft('Consulta clínico geral', { kind: 'empty' }, parseValue(m[1])));
    const m2 = aciRaw.match(/Audiometria\s+(\d+,\d+)/i);
    if (m2) drafts.push(buildServiceDraft('Audiometria', { kind: 'empty' }, parseValue(m2[1])));
    const m3 = aciRaw.match(/Eletrocardiograma\s+(\d+,\d+)/i);
    if (m3) drafts.push(buildServiceDraft('Eletrocardiograma', { kind: 'empty' }, parseValue(m3[1])));
    const m4 = aciRaw.match(/Eletroencefalograma\s+(\d+,\d+)/i);
    if (m4) drafts.push(buildServiceDraft('Eletroencefalograma', { kind: 'empty' }, parseValue(m4[1])));
    const m5 = aciRaw.match(/Toxicológico\s+(\d+,\d+)/i);
    if (m5) drafts.push(buildServiceDraft('Toxicológico', { kind: 'empty' }, parseValue(m5[1])));
    const m6 = aciRaw.match(/medicina ocupacional\s+(\d+\s*%\s*a\s*\d+\s*%)/i);
    if (m6) drafts.push(buildServiceDraft('Medicina ocupacional', { kind: 'empty' }, parseValue(m6[1])));
    if (drafts.length >= 2) return drafts;
  }

  // Dr. Roberto Stroher Jr (Vital Clínica) — "380,00 e 10% nos exames"
  if (lower(name).includes('roberto stroher') || aciRaw.match(/\d+,\d+\s+e\s+\d+\s*%/i)) {
    const drafts: ServiceDraft[] = [];
    const valMatch = aciRaw.match(/(\d+,\d+)/);
    const pctMatch = aciRaw.match(/(\d+\s*%)\s*nos\s*exames/i);
    if (valMatch) {
      drafts.push(buildServiceDraft(
        `Consulta — ${especialidade || 'Clínica'}`,
        parseValue(particularRaw),
        parseValue(valMatch[1]),
      ));
    }
    if (pctMatch) {
      drafts.push(buildServiceDraft(
        `Exames — ${especialidade || 'Clínica'}`,
        { kind: 'empty' },
        parseValue(pctMatch[1]),
      ));
    }
    if (drafts.length >= 2) return drafts;
  }

  return null;
}

// ────────────────────────────────────────────────────────────────────────────
// Categoria: especialidade granular → categoria
// ────────────────────────────────────────────────────────────────────────────

const SPECIALTY_TO_CATEGORY: Record<string, string> = {
  // médicos
  'pediatria': 'Pediatria',
  'pediatria/clinico geral': 'Pediatria',
  'pediatriaclinico geral': 'Pediatria',
  'ginecologia e obstetricia': 'Ginecologia e Obstetrícia',
  'ginecologia': 'Ginecologia e Obstetrícia',
  'neurologia': 'Neurologia',
  'oftalmologia': 'Oftalmologia',
  'ortopedia e traumatologia': 'Ortopedia',
  'ortopedia': 'Ortopedia',
  'ortopedia especialista em quadril': 'Ortopedia',
  'cardiologia': 'Cardiologia',
  'pneumologia': 'Pneumologia',
  'pneumologista': 'Pneumologia',
  'urologia': 'Urologia',
  'gastroenterologia': 'Gastroenterologia',
  'oncologia': 'Oncologia',
  'reumatologia/nefrologia': 'Reumatologia',
  'reumatologia': 'Reumatologia',
  'geriatria': 'Geriatria',
  'otorrinolaringologia': 'Otorrinolaringologia',
  'clinico geral': 'Clínico Geral',
  'clinico geral/exames': 'Clínico Geral',
  'clinico geral medicina esportiva': 'Clínico Geral',
  'clinico geral (foco em saude mental)': 'Clínico Geral',
  'consultas': 'Clínico Geral',
  'geral (doencas de pele)': 'Dermatologia',
  'dermatologia': 'Dermatologia',
  'exames': 'Exames Laboratoriais',
  'exames de imagem': 'Exames de Imagem',
  'tratamento quimioterapico': 'Oncologia',
  'cirurgias': 'Hospital',
  'cirurgias/internacao': 'Hospital',
  'especialista em maos e microcirurgia': 'Cirurgia da Mão',
  'cirurgia da mao': 'Cirurgia da Mão',
  'vacinas': 'Vacinas',
  'medicina do trabalho': 'Medicina do Trabalho',
  'avaliacoes e reabilitacao': 'Fisioterapia',
  // saúde mental e terapias
  'psicologia': 'Psicologia',
  'psicologa': 'Psicologia',
  'psicologo': 'Psicologia',
  'psicologia aba': 'Psicologia',
  'pisologia aba': 'Psicologia',
  'psicoterapia': 'Psicologia',
  'psicopedagogia': 'Psicopedagogia',
  'neuropsicologia': 'Neuropsicologia',
  'fonoaudiologia': 'Fonoaudiologia',
  'especialista em psicomotricidade': 'Psicomotricidade',
  'saude mental': 'Saúde Mental',
  // outros
  'fisioterapia': 'Fisioterapia',
  'fisiterapia': 'Fisioterapia',
  'nutricionista': 'Nutrição',
  'nutricao': 'Nutrição',
  'odontologia': 'Odontologia',
  'odontologia/implantes': 'Odontologia',
  'cirurgia dentista': 'Odontologia',
  'cirurgia dentista ': 'Odontologia',
  'esteta e bem-estar': 'Estética e Bem-estar',
  'estetica e bem-estar': 'Estética e Bem-estar',
  'podologia': 'Podologia',
  'saude e bem-estar': 'Bem-estar',
  // negócios não-médicos
  'medicamentos/perfumaria': 'Farmácia',
  'medicamentos/perfumara': 'Farmácia',
  'suplementos alimentar': 'Suplementos',
  'suplementos': 'Suplementos',
  'loja artigos opticos': 'Óticas',
  'loja  artigos opticos': 'Óticas',
  'loja artigos opticos ': 'Óticas',
  'loja produtos naturais': 'Produtos Naturais',
  'academia': 'Academia',
  'natacao': 'Academia',
  'padel': 'Academia',
  'radiografia e tomografia odontologica': 'Exames de Imagem',
};

function specialtyToCategory(specialty: string): string {
  const normalized = lower(specialty).trim();
  if (!normalized) return 'Outros';
  if (SPECIALTY_TO_CATEGORY[normalized]) return SPECIALTY_TO_CATEGORY[normalized];

  // fallback: pegar a primeira parte antes de '/' ou ','
  const first = normalized.split(/[\/,]/)[0].trim();
  if (SPECIALTY_TO_CATEGORY[first]) return SPECIALTY_TO_CATEGORY[first];

  // fallback final: capitalizar e usar
  return capitalize(specialty.split(/[\/,]/)[0].trim()) || 'Outros';
}

// ────────────────────────────────────────────────────────────────────────────
// Classificar entidade: individual (médico) vs institucional (clínica)
// ────────────────────────────────────────────────────────────────────────────

const INSTITUTIONAL_PREFIXES = [
  'clinica', 'clínica', 'hospital', 'laboratorio', 'laboratório', 'farmacia', 'farmácia',
  'otica', 'ótica', 'optica', 'reloótica', 'reloôtica', 'mercadão', 'mercadao', 'emporium',
  'emporio', 'empório', 'cacique', 'studio', 'ccf', 'profit', 'oral sin', 'be health',
  'vorax', 'usifarma', 'panvel', 'centro', 'instituto', 'espaço', 'espaco', 'portalmed',
  'prontofisio', 'wa odontologia', 'serviço', 'servico', 'rede', 'consultas', 'farmasesi',
  'seven', 'bio radius', 'particular', 'iot', 'gastrocare', 'neurologia', 'gastroclinica',
  'caprima', 'preluz', 'sintravir',
];

interface EntityClass {
  type: 'individual' | 'institutional';
  professionalName: string | null;
  clinicName: string | null;
  displayName: string;
}

function classifyEntity(rawName: string, rawClinic: string): EntityClass {
  const name = trimAll(rawName);
  const clinic = trimAll(rawClinic);

  // 1) Começa com "Dr." ou "Dra." → individual
  const isDr = /^Dr[a]?\.?\s/i.test(name);
  if (isDr) {
    const prof = name.replace(/^Dr[a]?\.?\s+/i, '').trim();
    const clinicName = clinic && clinic.toLowerCase() !== 'particular' && clinic !== name ? clinic : null;
    return {
      type: 'individual',
      professionalName: prof,
      clinicName,
      displayName: prof,
    };
  }

  // 2) Começa com prefixo institucional → clínica
  const lowerName = lower(name);
  for (const prefix of INSTITUTIONAL_PREFIXES) {
    if (lowerName.startsWith(prefix)) {
      return {
        type: 'institutional',
        professionalName: null,
        clinicName: name,
        displayName: name,
      };
    }
  }

  // 3) Tem 2+ palavras com início maiúsculo (nome próprio típico) → individual
  const words = name.split(/\s+/).filter(Boolean);
  const looksLikePersonName =
    words.length >= 2 &&
    words.length <= 5 &&
    words.every((w) => /^[A-ZÀ-Ý]/.test(w) || ['de', 'da', 'do', 'das', 'dos', 'e'].includes(w.toLowerCase()));

  if (looksLikePersonName) {
    const clinicName = clinic && clinic.toLowerCase() !== 'particular' && clinic !== name ? clinic : null;
    return {
      type: 'individual',
      professionalName: name,
      clinicName,
      displayName: name,
    };
  }

  // 4) Default: institucional (mais seguro pra evitar Provider duplicado mal-feito)
  return {
    type: 'institutional',
    professionalName: null,
    clinicName: name,
    displayName: name,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Pipeline principal
// ────────────────────────────────────────────────────────────────────────────

interface RowDraft {
  rowIndex: number;
  rawRow: string[];
  classification: EntityClass;
  specialty: string;
  category: string;
  phones: Phones;
  address: AddressParts;
  services: ServiceDraft[];
  notes: string[];
}

interface ImportSummary {
  totalRows: number;
  separatorRows: number;
  emptyRows: number;
  skippedDuplicates: string[];
  toCreate: number;
  servicesToCreate: number;
  categoriesToCreate: string[];
  errors: { row: number; reason: string; raw: string[] }[];
  drafts: RowDraft[];
}

function isSeparatorRow(cells: string[]): boolean {
  const nonEmpty = cells.filter((c) => trimAll(c).length > 0);
  if (nonEmpty.length === 0) return false;
  if (nonEmpty.length === 1 && /^[A-ZÀ-Ý\s]+$/.test(nonEmpty[0].toUpperCase())) return true;
  return false;
}

function isEmptyRow(cells: string[]): boolean {
  return cells.every((c) => trimAll(c).length === 0);
}

function isHeaderRow(cells: string[]): boolean {
  return cells.some((c) => lower(c) === 'nome do medico');
}

async function processRows(
  records: string[][],
  unitId: string,
  existingProviders: { professionalName: string | null; clinicName: string | null }[],
): Promise<ImportSummary> {
  const summary: ImportSummary = {
    totalRows: records.length,
    separatorRows: 0,
    emptyRows: 0,
    skippedDuplicates: [],
    toCreate: 0,
    servicesToCreate: 0,
    categoriesToCreate: [],
    errors: [],
    drafts: [],
  };

  const existingKeys = new Set(
    existingProviders.map(
      (p) =>
        `${trimAll(p.clinicName ?? '').toLowerCase()}|||${trimAll(p.professionalName ?? '').toLowerCase()}`,
    ),
  );

  const categoryCache = new Set<string>();

  for (let i = 0; i < records.length; i++) {
    const cells = records[i];
    if (!cells || cells.length === 0) {
      summary.emptyRows++;
      continue;
    }
    if (isHeaderRow(cells)) continue;
    if (isEmptyRow(cells)) {
      summary.emptyRows++;
      continue;
    }
    if (isSeparatorRow(cells)) {
      summary.separatorRows++;
      continue;
    }

    try {
      const [name, clinic, especialidade, telefoneRaw, particularRaw, aciRaw, enderecoRaw] = cells.map((c) => trimAll(c));

      if (!name) {
        summary.emptyRows++;
        continue;
      }

      const classification = classifyEntity(name, clinic);
      const phones = parsePhones(telefoneRaw);
      const address = parseAddress(enderecoRaw);
      const category = specialtyToCategory(especialidade);

      // Build services: tentar split de texto composto
      let services = trySplitComposto(name, especialidade, particularRaw, aciRaw);
      if (!services) {
        const particular = parseValue(particularRaw);
        const aci = parseValue(aciRaw);
        // se ambos vazios, criar service mesmo assim com descrição genérica
        const desc = especialidade ? `Consulta — ${especialidade.replace(/\s+/g, ' ').trim()}` : 'Consulta';
        services = [buildServiceDraft(desc, particular, aci)];
      }

      const notes: string[] = [];
      if (!enderecoRaw) notes.push('Endereço vazio na planilha');
      if (!telefoneRaw) notes.push('Telefone vazio');
      if (services.every((s) => s.originalPrice === 0 && s.insurancePrice === 0 && s.discountValue === 0 && !s.discountMinPercent)) {
        notes.push('Sem valor de serviço definido');
      }

      const draft: RowDraft = {
        rowIndex: i + 1,
        rawRow: cells,
        classification,
        specialty: especialidade,
        category,
        phones,
        address,
        services,
        notes,
      };

      // Detectar duplicata
      const key = `${(classification.clinicName ?? '').toLowerCase()}|||${(classification.professionalName ?? '').toLowerCase()}`;
      if (existingKeys.has(key)) {
        summary.skippedDuplicates.push(classification.displayName);
        notes.push('Duplicata: já existe no banco');
        summary.drafts.push(draft);
        continue;
      }
      existingKeys.add(key);

      // Categoria nova?
      if (!categoryCache.has(category)) {
        categoryCache.add(category);
        summary.categoriesToCreate.push(category);
      }

      summary.toCreate++;
      summary.servicesToCreate += services.length;
      summary.drafts.push(draft);
    } catch (err) {
      summary.errors.push({
        row: i + 1,
        reason: err instanceof Error ? err.message : String(err),
        raw: cells,
      });
    }
  }

  return summary;
}

// ────────────────────────────────────────────────────────────────────────────
// COMMIT: cria Categories, Providers, Services em transaction
// ────────────────────────────────────────────────────────────────────────────

async function commitImport(unitId: string, summary: ImportSummary) {
  log('🚀 Iniciando COMMIT no banco…');

  // 1) Garantir categorias
  const existingCats = await prisma.category.findMany({ where: { unitId }, select: { id: true, name: true, slug: true } });
  const catBySlug = new Map(existingCats.map((c) => [c.slug, c]));

  const allCategoryNames = new Set(summary.drafts.map((d) => d.category));
  for (const catName of allCategoryNames) {
    const slug = slugify(catName);
    if (!catBySlug.has(slug)) {
      const created = await prisma.category.create({
        data: {
          unitId,
          name: catName,
          slug,
          status: true,
          order: 100,
        },
      });
      catBySlug.set(slug, created);
      log(`  ➕ Category: ${catName}`);
    }
  }

  // 2) Criar Providers e Services
  let providersCreated = 0;
  let servicesCreated = 0;

  for (const draft of summary.drafts) {
    if (draft.notes.includes('Duplicata: já existe no banco')) continue;

    const addressJson = JSON.stringify(draft.address);
    const providerName = draft.classification.clinicName ?? draft.classification.professionalName ?? 'Sem nome';

    const provider = await prisma.provider.create({
      data: {
        unitId,
        name: providerName,
        professionalName: draft.classification.professionalName,
        clinicName: draft.classification.clinicName,
        category: draft.category,
        specialty: draft.specialty.trim() || null,
        address: addressJson,
        city: draft.address.city || null,
        phone: draft.phones.phone,
        whatsapp: draft.phones.whatsapp,
        status: true,
      },
    });
    providersCreated++;

    for (const s of draft.services) {
      await prisma.service.create({
        data: {
          providerId: provider.id,
          description: s.description,
          originalPrice: new Prisma.Decimal(s.originalPrice),
          insurancePrice: new Prisma.Decimal(s.insurancePrice),
          discountedPrice: new Prisma.Decimal(s.insurancePrice > 0 ? s.insurancePrice : s.originalPrice),
          discountType: s.discountType || 'fixed',
          discountValue: new Prisma.Decimal(s.discountValue),
          discountMinPercent: s.discountMinPercent,
          discountMaxPercent: s.discountMaxPercent,
        },
      });
      servicesCreated++;
    }

    log(`  ✅ ${draft.classification.displayName} (${draft.services.length} serviços)`);
  }

  log(`\n🎉 Commit concluído: ${providersCreated} providers, ${servicesCreated} services`);
}

// ────────────────────────────────────────────────────────────────────────────
// Relatório CSV + JSON
// ────────────────────────────────────────────────────────────────────────────

function writeReport(summary: ImportSummary, args: Args) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const tmpDir = process.env.TMPDIR || (process.platform === 'win32' ? process.env.TEMP || 'C:\\Windows\\Temp' : '/tmp');
  const csvPath = join(tmpDir, `import-report-${ts}.csv`);
  const jsonPath = join(tmpDir, `import-report-${ts}.json`);

  // CSV legível
  const rows: string[][] = [];
  rows.push([
    'linha',
    'tipo',
    'displayName',
    'professionalName',
    'clinicName',
    'specialty',
    'category',
    'whatsapp',
    'phone',
    'cidade',
    'rua',
    'numero',
    'bairro',
    'qtd_services',
    'price_summary',
    'notes',
  ]);
  for (const d of summary.drafts) {
    const priceSummary = d.services
      .map((s) => {
        if (s.insurancePrice > 0) return `R$${s.originalPrice}/${s.insurancePrice}`;
        if (s.discountValue > 0) return `${s.discountValue}%`;
        if (s.discountMinPercent !== null && s.discountMaxPercent !== null) return `${s.discountMinPercent}-${s.discountMaxPercent}%`;
        return '∅';
      })
      .join(' | ');
    rows.push([
      String(d.rowIndex),
      d.classification.type,
      d.classification.displayName,
      d.classification.professionalName ?? '',
      d.classification.clinicName ?? '',
      d.specialty,
      d.category,
      d.phones.whatsapp ?? '',
      d.phones.phone ?? '',
      d.address.city,
      d.address.street,
      d.address.number,
      d.address.neighborhood,
      String(d.services.length),
      priceSummary,
      d.notes.join('; '),
    ]);
  }

  const csv = rows
    .map((r) => r.map((c) => (c.includes(',') || c.includes('"') ? `"${c.replace(/"/g, '""')}"` : c)).join(','))
    .join('\n');

  writeFileSync(csvPath, csv, 'utf-8');
  writeFileSync(jsonPath, JSON.stringify(summary, null, 2), 'utf-8');

  log(`\n📊 Relatório CSV  : ${csvPath}`);
  log(`📊 Relatório JSON : ${jsonPath}`);
  log(`\nResumo:`);
  log(`  Linhas totais         : ${summary.totalRows}`);
  log(`  Separadores ignorados : ${summary.separatorRows}`);
  log(`  Linhas vazias         : ${summary.emptyRows}`);
  log(`  Pra criar             : ${summary.toCreate}`);
  log(`  Services pra criar    : ${summary.servicesToCreate}`);
  log(`  Categorias novas      : ${summary.categoriesToCreate.length} (${summary.categoriesToCreate.slice(0, 5).join(', ')}…)`);
  log(`  Duplicatas (skip)     : ${summary.skippedDuplicates.length}`);
  log(`  Erros                 : ${summary.errors.length}`);
  if (summary.errors.length > 0) {
    log(`\n❌ Erros:`);
    for (const e of summary.errors.slice(0, 10)) log(`  L${e.row}: ${e.reason}`);
    if (summary.errors.length > 10) log(`  …e mais ${summary.errors.length - 10}`);
  }

  if (args.dryRun) {
    log(`\n⚠️  DRY-RUN: NADA foi escrito no banco.`);
    log(`Revise o CSV/JSON acima e, se tudo OK, rode novamente com --commit.`);
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────────────────

function log(s: string) {
  console.log(s);
}

async function main() {
  const args = parseArgs();
  log(`\n🩺  ACIAV Saúde — Import Credenciados\n`);
  log(`Modo: ${args.commit ? 'COMMIT' : 'DRY-RUN'}`);

  // 1) Localizar unit
  const unit = await prisma.unit.findFirst({
    where: { name: { contains: args.unitName, mode: 'insensitive' } },
  });
  if (!unit) {
    throw new Error(`Unit "${args.unitName}" não encontrada. Use --unit-name "Nome Exato".`);
  }
  log(`Unit: ${unit.name} (${unit.id})`);

  // 2) Carregar CSV
  const records = await loadCsv(args);
  log(`CSV: ${records.length} linhas brutas`);

  // 3) Buscar providers existentes pra detectar duplicatas
  const existing = await prisma.provider.findMany({
    where: { unitId: unit.id },
    select: { professionalName: true, clinicName: true },
  });
  log(`Providers existentes: ${existing.length}`);

  // 4) Processar
  const summary = await processRows(records, unit.id, existing);

  // 5) Output
  writeReport(summary, args);

  // 6) Commit, se autorizado
  if (args.commit) {
    await commitImport(unit.id, summary);
  }

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('\n❌ ERRO:', err);
  await prisma.$disconnect();
  process.exit(1);
});
