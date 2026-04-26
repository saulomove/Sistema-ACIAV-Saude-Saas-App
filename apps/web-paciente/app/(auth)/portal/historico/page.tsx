import { redirect } from 'next/navigation';
import { getSessionUser, serverFetch } from '../../../../lib/server-api';
import { Activity, Stethoscope, AlertCircle } from 'lucide-react';

interface Transaction {
  id: string;
  createdAt: string;
  amountSaved: number;
  provider: { name: string; category: string };
  service: { description: string; discountedPrice: number; originalPrice: number };
}

function fmtMoney(v: number) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default async function HistoricoUsoPage() {
  const user = await getSessionUser();
  if (!user || user.role !== 'patient') redirect('/login');

  const userId = user.userId ?? '';
  const transactions = await serverFetch<Transaction[]>(`/users/${userId}/transactions`) ?? [];

  const totalEconomia = transactions.reduce((sum, t) => sum + Number(t.amountSaved), 0);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-100">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Histórico de Uso</h1>
          <p className="text-slate-500 mt-2 font-medium">Extrato de utilizações e economia gerada na rede credenciada.</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl px-6 py-4 shadow-sm text-right">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Economizado</p>
          <p className="text-3xl font-black text-[#007178]">{fmtMoney(totalEconomia)}</p>
        </div>
      </div>

      <div className="space-y-4">
        {transactions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <AlertCircle className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-800">Nenhum uso registrado</h3>
            <p className="text-slate-500 mt-2">Você ainda não utilizou a rede credenciada.</p>
          </div>
        ) : (
          transactions.map((item) => (
            <div key={item.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 bg-[#007178]/10 text-[#007178]">
                  <Stethoscope size={24} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{fmtDate(item.createdAt)} · {item.provider.category}</p>
                  <h3 className="text-lg font-bold text-slate-800 mt-0.5">{item.provider.name}</h3>
                  <p className="text-sm text-slate-500">{item.service.description}</p>
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-gray-100 text-right min-w-[200px] shrink-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-slate-500">Valor Particular:</span>
                  <span className="text-xs text-slate-400 line-through">{fmtMoney(Number(item.service.originalPrice))}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-700">Você Pagou:</span>
                  <span className="text-sm font-black text-slate-800">{fmtMoney(Number(item.service.discountedPrice))}</span>
                </div>
                <div className="pt-2 border-t border-[#007178]/10 flex justify-between items-center">
                  <span className="text-xs font-bold text-[#007178]">ECONOMIA:</span>
                  <span className="text-base font-black text-[#007178]">+ {fmtMoney(Number(item.amountSaved))}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {transactions.length > 0 && (
        <div className="bg-[#007178]/5 border border-[#007178]/20 rounded-2xl p-5 flex items-center gap-3">
          <Activity size={20} className="text-[#007178] shrink-0" />
          <p className="text-sm text-slate-600">
            Você realizou <strong>{transactions.length} atendimento{transactions.length !== 1 ? 's' : ''}</strong> e economizou <strong className="text-[#007178]">{fmtMoney(totalEconomia)}</strong> utilizando a rede ACIAV Saúde.
          </p>
        </div>
      )}
    </div>
  );
}
