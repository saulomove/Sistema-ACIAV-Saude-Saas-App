'use client';

import { useState, type MouseEvent } from 'react';
import { Megaphone, Send, MessageCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../../../../lib/api-client';

const CATEGORIAS = [
  { value: 'reclamacao', label: 'Reclamação' },
  { value: 'sugestao', label: 'Sugestão' },
  { value: 'elogio', label: 'Elogio' },
  { value: 'duvida', label: 'Dúvida' },
];

function categoriaLabel(v: string) {
  return CATEGORIAS.find((c) => c.value === v)?.label ?? v;
}

function waLink(raw: string | null, message: string) {
  const d = (raw || '').replace(/\D/g, '');
  if (!d) return null;
  return `https://wa.me/55${d}?text=${encodeURIComponent(message)}`;
}

// Máscara de CPF p/ o WhatsApp (padrão Receita: esconde os 3 primeiros e os 2
// verificadores). O CPF completo fica só no painel da ACIAV, não no canal externo.
function maskCpf(raw: string): string {
  const d = (raw || '').replace(/\D/g, '');
  if (d.length !== 11) return d ? '***' : '';
  return `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**`;
}

export default function OuvidoriaClient({
  supportWhatsapp,
  nome,
  cpf,
}: {
  supportWhatsapp: string | null;
  nome: string;
  cpf: string;
}) {
  const [categoria, setCategoria] = useState('reclamacao');
  const [assunto, setAssunto] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const hasWhats = (supportWhatsapp || '').replace(/\D/g, '').length > 0;

  function validate(): string {
    if (assunto.trim().length < 3) return 'Informe um assunto (mínimo 3 caracteres).';
    if (mensagem.trim().length < 10) return 'Descreva sua manifestação (mínimo 10 caracteres).';
    return '';
  }

  function buildMessage(): string {
    const linhas = [
      '*Ouvidoria ACIAV Saúde*',
      `Categoria: ${categoriaLabel(categoria)}`,
      `Assunto: ${assunto.trim()}`,
      `Nome: ${nome || '—'}`,
    ];
    if (cpf) linhas.push(`CPF: ${maskCpf(cpf)}`);
    linhas.push('', mensagem.trim());
    return linhas.join('\n');
  }

  // O botão é um <a> real (padrão do app, compatível com o Capacitor): abre o WhatsApp
  // nativamente. Em paralelo, registra a manifestação no backend (trilha/LGPD).
  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    if (submitting) {
      e.preventDefault();
      return;
    }
    const err = validate();
    if (err) {
      e.preventDefault();
      setError(err);
      return;
    }
    setError('');
    setSubmitting(true);
    api
      .post('/ouvidoria', { categoria, assunto: assunto.trim(), mensagem: mensagem.trim() })
      .then(() => setSent(true))
      .catch((err2: unknown) =>
        setError(err2 instanceof Error ? err2.message : 'Não foi possível registrar. Tente novamente.'),
      )
      .finally(() => setSubmitting(false));
    // Sem WhatsApp cadastrado na unidade: não navega, apenas registra.
    if (!hasWhats) e.preventDefault();
  }

  if (sent) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-800">Manifestação registrada!</h1>
          <p className="text-slate-500 mt-2">
            {hasWhats
              ? 'Sua mensagem foi registrada e o WhatsApp da ACIAV foi aberto para você concluir o envio.'
              : 'Recebemos sua manifestação. A ACIAV entrará em contato pelos canais oficiais.'}
          </p>
          {hasWhats && (
            <a
              href={waLink(supportWhatsapp, buildMessage()) ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-sm mt-6"
            >
              <MessageCircle size={16} /> Abrir o WhatsApp novamente
            </a>
          )}
          <button
            onClick={() => {
              setSent(false);
              setAssunto('');
              setMensagem('');
              setCategoria('reclamacao');
            }}
            className="block mx-auto mt-4 text-sm text-slate-400 hover:text-slate-600 font-medium"
          >
            Enviar outra manifestação
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
          <span className="w-11 h-11 rounded-2xl bg-[#007178]/10 text-[#007178] flex items-center justify-center">
            <Megaphone size={22} />
          </span>
          Ouvidoria
        </h1>
        <p className="text-slate-500 mt-2 font-medium">
          Envie uma reclamação, sugestão, elogio ou dúvida. Ao enviar, sua mensagem abre no WhatsApp da ACIAV Saúde.
        </p>
      </div>

      {hasWhats ? (
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3 text-sm text-emerald-800">
          <MessageCircle size={18} className="text-emerald-500 shrink-0" />
          Atendimento pelo WhatsApp da sua unidade ACIAV Saúde.
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 text-sm text-amber-800">
          <AlertCircle size={18} className="text-amber-500 shrink-0" />
          O WhatsApp da sua unidade ainda não está configurado — sua manifestação será registrada mesmo assim.
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-5">
        {/* Categoria */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Categoria</label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIAS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategoria(c.value)}
                className={
                  'px-4 py-2.5 rounded-xl text-sm font-bold border transition-colors ' +
                  (categoria === c.value
                    ? 'bg-[#007178] text-white border-[#007178]'
                    : 'bg-white text-slate-600 border-gray-200 hover:border-[#007178]/40')
                }
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Assunto */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Assunto</label>
          <input
            type="text"
            value={assunto}
            onChange={(e) => setAssunto(e.target.value)}
            maxLength={120}
            placeholder="Resumo em poucas palavras"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#007178] focus:ring-2 focus:ring-[#007178]/20 outline-none text-slate-800"
          />
        </div>

        {/* Mensagem */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Mensagem</label>
          <textarea
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            rows={5}
            maxLength={2000}
            placeholder="Descreva sua manifestação com detalhes"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#007178] focus:ring-2 focus:ring-[#007178]/20 outline-none text-slate-800 resize-none"
          />
          <p className="text-xs text-slate-400 mt-1 text-right">{mensagem.length}/2000</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" /> {error}
          </div>
        )}

        <a
          href={hasWhats ? (waLink(supportWhatsapp, buildMessage()) ?? '#') : '#'}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
          aria-disabled={submitting}
          className={
            'w-full inline-flex items-center justify-center gap-2 font-bold px-5 py-3.5 rounded-xl text-sm shadow-sm transition-colors ' +
            (submitting
              ? 'bg-slate-300 text-white cursor-wait pointer-events-none'
              : 'bg-[#007178] hover:bg-[#005f65] text-white')
          }
        >
          <Send size={16} /> {submitting ? 'Enviando…' : hasWhats ? 'Enviar pelo WhatsApp' : 'Enviar manifestação'}
        </a>

        <p className="text-xs text-slate-400 text-center">
          Enviado como <strong className="text-slate-500">{nome || 'beneficiário'}</strong>. Sua manifestação é
          registrada na ACIAV Saúde.
        </p>
      </div>
    </div>
  );
}
