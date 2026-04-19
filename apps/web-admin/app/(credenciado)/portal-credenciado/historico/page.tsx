import { redirect } from 'next/navigation';
import { getSessionUser, serverFetch } from '../../../../lib/server-api';
import { Clock, DollarSign, Users } from 'lucide-react';
import HistoricoFiltros from './HistoricoFiltros';

interface Transaction {
  id: string;
  createdAt: string;
  amountSaved: number;
  user: { fullName: string; cpf: string };
  service: { description: string; discountedPrice: number; originalPrice: number };
}

interface TxResponse {
  items: Transaction[];
  total: number;
  page: number;
  limit: number;
}

function fmtMoney(v: number) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtDate(d: string) {
  return new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function maskCPF(cpf: string) {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export default async function HistoricoPage({
  searchParams,
}: {
  searchParams: Promise<{ startDate?: string; endDate?: string }>;
}) {
  const user = await getSessionUser();
  if (!user || user.role !== 'provider') redirect('/login');

  const providerId = user.providerId ?? '';
  const params = await searchParams;
  const qs = new URLSearchParams();
  qs.set('providerId', providerId);
  qs.set('limit', '100');
  if (params.startDate) qs.set('startDate', params.startDate);
  if (params.endDate) qs.set('endDate', params.endDate);

  const data = await serverFetch<TxResponse>(`/transactions/by-provider?${qs.toString()}`) ?? { items: [], total: 0, page: 1, limit: 100 };
  const transactions = data.items;

  const totalAtendimentos = data.total;
  const totalFaturamento = transactions.reduce((sum, t) => sum + Number(t.service.discountedPrice), 0);
  const pacientesUnicos = new Set(transactions.map((t) => t.user.cpf)).size;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Histórico de Atendimentos</h1>
        <p className="text-slate-500 text-sm mt-1">Todos os atendimentos registrados pela ACIAV para esta clínica.</p>
      </div>

      <HistoricoFiltros initialStart={params.startDate ?? ''} initialEnd={params.endDate ?? ''} />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={18} className="text-[#007178]" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Atendimentos</p>
          </div>
          <p className="text-3xl font-black text-slate-800">{totalAtendimentos}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Users size={18} className="text-[#007178]" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Pacientes</p>
          </div>
          <p className="text-3xl font-black text-slate-800">{pacientesUnicos}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={18} className="text-[#007178]" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Faturamento</p>
          </div>
          <p className="text-2xl font-black text-slate-800">{fmtMoney(totalFaturamento)}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Clock size={40} className="mb-3 opacity-30" />
            <p className="font-medium">Nenhum atendimento encontrado</p>
            <p className="text-sm mt-1">Ajuste os filtros ou aguarde novos registros da ACIAV.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-100 text-xs text-slate-500 uppercase tracking-wide">
                  <th className="text-left px-6 py-3 font-bold">Data</th>
                  <th className="text-left px-6 py-3 font-bold">Paciente</th>
                  <th className="text-left px-6 py-3 font-bold">Serviço</th>
                  <th className="text-right px-6 py-3 font-bold">Valor Pago</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">{fmtDate(t.createdAt)}</td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-700">{t.user.fullName}</p>
                      <p className="text-xs text-slate-400">{maskCPF(t.user.cpf)}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{t.service.description}</td>
                    <td className="px-6 py-4 text-right font-bold text-[#007178]">{fmtMoney(Number(t.service.discountedPrice))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {data.total > 100 && (
        <p className="text-center text-xs text-slate-400">Exibindo os 100 atendimentos mais recentes de {data.total} no total.</p>
      )}
    </div>
  );
}
