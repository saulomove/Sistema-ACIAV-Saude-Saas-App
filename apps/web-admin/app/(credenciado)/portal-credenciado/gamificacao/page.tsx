import { redirect } from 'next/navigation';
import { getSessionUser, serverFetch } from '../../../../lib/server-api';
import { Gift, Trophy, Star, TrendingUp } from 'lucide-react';

interface Transaction {
  id: string;
  amountSaved: number;
  user: { fullName: string; cpf: string };
}

interface TxResponse {
  items: Transaction[];
  total: number;
}

interface Reward {
  id: string;
  name: string;
  pointsRequired: number;
  stock: number;
}

function maskCPF(cpf: string) {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export default async function GamificacaoPage() {
  const user = await getSessionUser();
  if (!user || user.role !== 'provider') redirect('/login');

  const providerId = user.providerId ?? '';

  const [txData, rewards] = await Promise.all([
    serverFetch<TxResponse>(`/transactions/by-provider?providerId=${providerId}&limit=100`) ?? { items: [], total: 0 },
    serverFetch<Reward[]>(`/providers/${providerId}/rewards`).catch(() => null) ?? [],
  ]);

  const txItems = (txData as TxResponse).items ?? [];

  // Top pacientes por economia gerada
  const patientMap = new Map<string, { name: string; cpf: string; totalSaved: number; visits: number }>();
  for (const t of txItems) {
    const key = t.user.cpf;
    const existing = patientMap.get(key);
    if (existing) {
      existing.totalSaved += Number(t.amountSaved);
      existing.visits += 1;
    } else {
      patientMap.set(key, { name: t.user.fullName, cpf: t.user.cpf, totalSaved: Number(t.amountSaved), visits: 1 });
    }
  }
  const topPatients = Array.from(patientMap.values()).sort((a, b) => b.visits - a.visits).slice(0, 10);

  const rewardList = Array.isArray(rewards) ? rewards : [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Gamificação & Prêmios</h1>
        <p className="text-slate-500 text-sm mt-1">Veja os pacientes mais frequentes e os prêmios disponíveis.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ranking de pacientes */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Trophy size={18} className="text-amber-500" />
            <h2 className="font-bold text-slate-800">Top Pacientes</h2>
          </div>
          {topPatients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Star size={32} className="mb-2 opacity-30" />
              <p className="text-sm">Nenhum atendimento registrado ainda.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {topPatients.map((p, i) => (
                <li key={p.cpf} className="flex items-center gap-4 px-6 py-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0
                    ${i === 0 ? 'bg-amber-100 text-amber-600' : i === 1 ? 'bg-slate-100 text-slate-500' : i === 2 ? 'bg-orange-100 text-orange-500' : 'bg-gray-50 text-slate-400'}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-700 truncate">{p.name}</p>
                    <p className="text-xs text-slate-400">{maskCPF(p.cpf)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-[#007178]">{p.visits}x</p>
                    <p className="text-xs text-slate-400">visitas</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Prêmios cadastrados */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Gift size={18} className="text-[#007178]" />
            <h2 className="font-bold text-slate-800">Prêmios Disponíveis</h2>
          </div>
          {rewardList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Gift size={32} className="mb-2 opacity-30" />
              <p className="text-sm text-center px-6">Nenhum prêmio cadastrado. Entre em contato com o administrador para configurar prêmios.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {rewardList.map((r) => (
                <li key={r.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="font-medium text-slate-700">{r.name}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Star size={11} className="text-amber-400" /> {r.pointsRequired} pontos necessários
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${r.stock > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                      {r.stock > 0 ? `${r.stock} em estoque` : 'Esgotado'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Info card */}
      <div className="bg-[#007178]/5 border border-[#007178]/20 rounded-2xl p-5 flex items-start gap-3">
        <TrendingUp size={20} className="text-[#007178] shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-[#007178] text-sm">Como funciona a gamificação?</p>
          <p className="text-slate-600 text-sm mt-1">
            A cada atendimento registrado, o paciente ganha <strong>1 ponto por real economizado</strong>.
            Os pontos acumulados podem ser trocados por prêmios cadastrados pelos parceiros.
            O ranking de pacientes mais frequentes incentiva a fidelização.
          </p>
        </div>
      </div>
    </div>
  );
}
