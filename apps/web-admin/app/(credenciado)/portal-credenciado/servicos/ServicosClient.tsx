'use client';

import { Info, Wrench, MessageCircle } from 'lucide-react';

interface Service {
  id: string;
  description: string;
  originalPrice: number;
  insurancePrice: number;
  discountedPrice: number;
  discountType: string;
  discountValue: number;
  discountMinPercent?: number | null;
  discountMaxPercent?: number | null;
}

function fmtMoney(v: number) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function discountPct(orig: number, disc: number) {
  if (!orig || orig === 0) return 0;
  return Math.round(((orig - disc) / orig) * 100);
}

function rangeLabel(s: Service): string {
  const maxPct = s.discountMaxPercent ?? discountPct(Number(s.originalPrice), Number(s.discountedPrice));
  const minPct = s.discountMinPercent ?? maxPct;
  return minPct === maxPct ? `${maxPct}%` : `${minPct}% – ${maxPct}%`;
}

function whatsLinkForService(raw: string | null | undefined, s: Service): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  const price = fmtMoney(Number(s.originalPrice));
  const msg = `Olá, gostaria de alterar o valor do serviço "${s.description}" (atualmente ${price}) para R$ 0,00.`;
  return `https://wa.me/55${digits}?text=${encodeURIComponent(msg)}`;
}

export default function ServicosClient({
  initialServices,
  supportWhatsapp,
}: {
  providerId: string;
  initialServices: Service[];
  supportWhatsapp?: string | null;
}) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Serviços Disponíveis</h1>
        <p className="text-slate-500 text-sm mt-1">
          Tabela de serviços e valores definidos pela ACIAV Saúde para os pacientes conveniados.
        </p>
      </div>

      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700">
        <Info size={18} className="mt-0.5 shrink-0" />
        <span>
          Os serviços e valores são definidos pela <strong>ACIAV Saúde</strong>. Para solicitar
          alteração de valor, clique no botão <strong>WhatsApp</strong> ao lado de cada serviço —
          a mensagem já é enviada pronta para a administração.
        </span>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {initialServices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Wrench size={40} className="mb-3 opacity-30" />
            <p className="font-medium">Nenhum serviço cadastrado</p>
            <p className="text-sm mt-1">
              A ACIAV Saúde ainda não cadastrou serviços para sua clínica.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-100 text-xs text-slate-500 uppercase tracking-wide">
                <th className="text-left px-6 py-3 font-bold">Serviço</th>
                <th className="text-right px-6 py-3 font-bold">Valor Particular</th>
                <th className="text-right px-6 py-3 font-bold">Faixa de Desconto</th>
                <th className="text-right px-6 py-3 font-bold">Solicitar alteração</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {initialServices.map((s) => {
                const waHref = whatsLinkForService(supportWhatsapp, s);
                return (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-700">{s.description}</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-700">
                      {fmtMoney(s.originalPrice)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full">
                        {rangeLabel(s)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {waHref ? (
                        <a
                          href={waHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <MessageCircle size={13} /> Solicitar
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
