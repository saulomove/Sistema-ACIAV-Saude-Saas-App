# Scripts de manutenção do banco

## `import-credenciados.ts` — importação em massa

Importa credenciados a partir da planilha "Credenciados ACIAV Saúde" (Google Sheets).

### Pré-requisitos

1. **Acesso SSH à VPS** (`root@31.97.240.184`).
2. **Conhecer o `DATABASE_URL`** da VPS — está em `/var/www/aciav-saude/apps/api-core/.env`.
3. Node 20+ + `npm` na máquina local.

### Setup do tunnel SSH (rodar local apontando pra Postgres da VPS)

Mantenha **Terminal A** aberto durante todo o import:

```bash
ssh -N -L 15432:localhost:5432 root@31.97.240.184
```

Em **Terminal B** (na raiz do monorepo, na sua máquina local):

```bash
# Pega o DATABASE_URL da VPS:
ssh root@31.97.240.184 "grep DATABASE_URL /var/www/aciav-saude/apps/api-core/.env"
# Substitui o host:port por localhost:15432 e exporta:
export DATABASE_URL="postgresql://aciav:SENHA_AQUI@localhost:15432/aciav_saude"

# Garante deps:
npm install --no-audit --no-fund
npx prisma generate --schema packages/database/prisma/schema.prisma
```

### Backup obrigatório antes do COMMIT

Pelo SSH, na VPS:

```bash
sudo -u postgres pg_dump aciav_saude | gzip > /root/aciav-pre-import-$(date +%Y%m%d-%H%M%S).sql.gz
ls -lh /root/aciav-pre-import-*.sql.gz | tail -1
```

### Fluxo: dry-run → revisão → commit

#### 1) Dry-run (não escreve nada no banco)

```bash
npm run import:credenciados -w @aciav-saude/database -- \
  --google-sheet 1RgqsUe3a61JgaEd-Xj0rPTdj2S72W4jKGxQ2giT4AIM \
  --unit-name "Videira" \
  --dry-run
```

Vai gerar:

- `/tmp/import-report-<timestamp>.csv` — relatório legível
- `/tmp/import-report-<timestamp>.json` — payload completo (auditoria)

E imprimir o resumo:

```
Linhas totais         : 143
Separadores ignorados : 3
Linhas vazias         : 18
Pra criar             : 95
Services pra criar    : 132
Categorias novas      : 23
Duplicatas (skip)     : 25
Erros                 : 0
```

#### 2) Revisão

Abre o `import-report-*.csv` no Excel/Numbers/Google Sheets. Cada linha mostra:

- linha (no CSV original)
- tipo (`individual` ou `institutional`)
- displayName, professionalName, clinicName
- specialty + category mapeada
- whatsapp + phone classificados
- endereço dividido (cidade / rua / número / bairro)
- qtd_services + resumo dos preços
- notes (observações, ex.: "Endereço vazio na planilha", "Sem valor de serviço definido")

**Confira em particular**:
- Linhas marcadas como `Duplicata: já existe no banco` (vão ser skip)
- Linhas com `notes` não-vazio (problemas detectados)
- Be Health, Vital Cardio do Dr. Roberto, FARMASESI — verificar se os services compostos foram split corretamente

#### 3) Commit (executa de verdade)

⚠️ Antes de rodar, garanta que o backup foi feito.

```bash
npm run import:credenciados -w @aciav-saude/database -- \
  --google-sheet 1RgqsUe3a61JgaEd-Xj0rPTdj2S72W4jKGxQ2giT4AIM \
  --unit-name "Videira" \
  --commit
```

### Flags

| Flag | Default | Descrição |
|------|---------|-----------|
| `--csv <path>` | `./scripts/.csv-input/credenciados.csv` | Caminho do CSV local (alternativa ao Google Sheets) |
| `--google-sheet <id>` | — | ID do Google Sheets (ex.: `1RgqsUe3a61JgaEd-Xj0rPTdj2S72W4jKGxQ2giT4AIM`) |
| `--unit-name "Videira"` | `Videira` | Busca a unit por `contains`, case-insensitive |
| `--dry-run` | ✅ default | Simula, gera relatório, **NÃO escreve no banco** |
| `--commit` | — | Executa de verdade |

### Decisões alinhadas com o cliente

1. **Match de duplicata**: 100% por `(clinicName + professionalName)` lowercase + trim. Já existe? **SKIP** (não atualiza, mantém o que tá).
2. **Categorias granulares**: Pediatria, Ortopedia, Cardiologia, Oftalmologia… criadas em `Category` na unit. Mapeamento explícito em `SPECIALTY_TO_CATEGORY` no script.
3. **Provider individual vs institucional**: heurística por prefixo (`Dr./Dra.`), pelos prefixos institucionais conhecidos (`Clinica`, `Hospital`, `Farmácia`…) ou nome próprio (2+ palavras capitalizadas).
4. **Telefone**: 9 dígitos com inicial `9` → `whatsapp`; 8 dígitos → `phone` (fixo); 1 número só → `whatsapp` por default. DDD 49 adicionado quando faltante.
5. **Texto composto**: split em múltiplos services para Be Health (6 services), Vital Cardio do Dr. Roberto (2 services), e tratamento simples pra FARMASESI (1 service em % faixa).
6. **Email**: opcional (planilha não tem). Sem `AuthUser` auto-criado.
7. **CEP**: vazio (planilha não tem). Admin completa depois conforme captação.
8. **Status**: todos importados como `status: true` (ativos).

### Re-rodar

O script é **idempotente**: se você rodar 2x, na 2ª vez todos os providers já vão estar registrados e cair em "Duplicata: já existe no banco" — nada novo é criado. Útil pra testar.
