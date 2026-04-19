import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser, serverFetch } from '../../../lib/server-api';
import { Clock, Wrench, DollarSign, Users, MessageCircle, Info } from 'lucide-react';

interface Service {
  id: string;
  description: string;
  originalPrice: number;
  discountedPrice: number;
}

interface Transaction {
  id: string;
  createdAt: string;
  user: { fullName: string };
  service: { description: string; discountedPrice: number };
}

interface TxResponse {
  items: Transaction[];
  total: number;
}

interface Unit {
  id: string;
  supportWhatsapp?: string | null;
}

function fmtMoney(v: number) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtDate(d: string) {
  return new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function whatsLink(raw?: string | null) {
  const d = (raw || '').replace(/\D/g, '');
  return d ? `https://wa.me/55${d}?text=${encodeURIComponent('Olá, preciso de suporte no portal do credenciado.')}` : null;
}

export default async function PortalCredenciadoPage() {
  const user = await getSessionUser();
  if (!user || user.role !== 'provider') redirect('/login');

  const providerId = user.providerId ?? '';
  const unitId = user.unitId ?? '';

  const [services, txData, unit] = await Promise.all([
    serverFetch<Service[]>(`/providers/${providerId}/services`),
    serverFetch<TxResponse>(`/transactions/by-provider?providerId=${providerId}&limit=5`),
    unitId ? serverFetch<Unit>(`/units/${unitId}`) : Promise.resolve(null),
  ]);

  const servicesList = Array.isArray(services) ? services : [];
  const latestTx = txData?.items ?? [];
  const totalAtendimentos = txData?.total ?? 0;
  const supportHref = whatsLink(unit?.supportWhatsapp);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Painel do Credenciado</h1>
        <p className="text-slate-500 text-sm mt-1">
          Consulte sua tabela de serviços e o histórico de atendimentos realizados na sua clínica.
        </p>
      </div>

      {/* Banner read-only */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col md:flex-row items-start gap-4">
        <Info size={22} className="text-amber-500 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-bold text-amber-800">Portal somente para consulta</p>
          <p className="text-amber-700 text-sm mt-1">
            A partir de agora, os atendimentos são registrados diretamente pela administração da ACIAV Saúde.
            Para solicitar mudanças no cadastro, na tabela de serviços ou em qualquer outro dado, fale com a nossa equipe.
          </p>
        </div>
        {supportHref && (
          <a
            href={supportHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm shrink-0"
          >
            <MessageCircle size={16} /> Falar com a ACIAV
          </a>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={18} className="text-[#007178]" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Atendimentos</p>
          </div>
          <p className="text-3xl font-black text-slate-800">{totalAtendimentos}</p>
          <p className="text-xs text-slate-400 mt-1">Total registrado até hoje</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Wrench size={18} className="text-[#007178]" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Serviços na tabela</p>
          </div>
          <p className="text-3xl font-black text-slate-800">{servicesList.length}</p>
          <p className="text-xs text-slate-400 mt-1">Definidos pela ACIAV</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-2">
            <Users size={18} className="text-[#007178]" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Atalhos</p>
          </div>
          <div className="flex flex-col gap-2 mt-2">
            <Link href="/portal-credenciado/servicos" className="text-sm font-bold text-[#007178] hover:underline">
              Ver tabela de serviços →
            </Link>
            <Link href="/portal-credenciado/historico" className="text-sm font-bold text-[#007178] hover:underline">
              Ver histórico completo →
            </Link>
          </div>
        </div>
      </div>

      {/* Últimos atendimentos */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-[#007178]" />
            <h2 className="font-bold text-slate-800">Últimos atendimentos</h2>
          </div>
          <Link href="/portal-credenciado/historico" className="text-xs text-[#007178] font-bold hover:underline">
            Ver todos
          </Link>
        </div>
        {latestTx.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Clock size={32} className="mb-3 opacity-30" />
            <p className="font-medium">Nenhum atendimento registrado ainda</p>
            <p className="text-xs mt-1">Os atendimentos que a ACIAV registrar aparecerão aqui.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-100 text-xs text-slate-500 uppercase tracking-wide">
                <th className="text-left px-6 py-3 font-bold">Data</th>
                <th className="text-left px-6 py-3 font-bold">Paciente</th>
                <th className="text-left px-6 py-3 font-bold">Serviço</th>
                <th className="text-right px-6 py-3 font-bold">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {latestTx.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-3 text-slate-500 whitespace-nowrap">{fmtDate(t.createdAt)}</td>
                  <td className="px-6 py-3 text-slate-700 font-medium">{t.user.fullName}</td>
                  <td className="px-6 py-3 text-slate-600">{t.service.description}</td>
                  <td className="px-6 py-3 text-right font-bold text-[#007178]">
                    <span className="inline-flex items-center gap-1">
                      <DollarSign size={12} className="text-slate-400" />
                      {fmtMoney(Number(t.service.discountedPrice))}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
