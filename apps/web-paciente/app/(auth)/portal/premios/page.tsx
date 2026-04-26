import { redirect } from 'next/navigation';
import { getSessionUser, serverFetch } from '../../../../lib/server-api';
import { Gift, Star, Lock, Trophy } from 'lucide-react';

interface PatientCard {
  pointsBalance: number;
}

interface Reward {
  id: string;
  name: string;
  pointsRequired: number;
  stock: number;
  provider: { name: string };
}

export default async function ResgatarPremiosPage() {
  const user = await getSessionUser();
  if (!user || user.role !== 'patient') redirect('/login');

  const unitId = user.unitId ?? '';

  // Fetch patient points and all rewards from all providers in this unit
  const card = await serverFetch<PatientCard>(`/users/me/card`);
  const userPoints = card?.pointsBalance ?? 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="pb-6 border-b border-gray-100">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Resgatar Prêmios</h1>
        <p className="text-slate-500 mt-2 font-medium">Troque seus pontos de fidelidade por recompensas exclusivas.</p>
      </div>

      {/* Saldo de Pontos */}
      <div className="bg-gradient-to-br from-[#007178] to-[#005f65] rounded-2xl p-6 text-white flex items-center justify-between shadow-lg">
        <div>
          <p className="text-white/70 text-sm font-bold uppercase tracking-widest mb-1">Seus Pontos</p>
          <p className="text-5xl font-black">{userPoints.toLocaleString('pt-BR')}</p>
          <p className="text-white/60 text-sm mt-1">1 ponto = R$1 economizado</p>
        </div>
        <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center">
          <Trophy size={40} className="text-white/80" />
        </div>
      </div>

      {/* Como funciona */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
        <Star size={20} className="text-amber-500 shrink-0 mt-0.5 fill-amber-400" />
        <div>
          <p className="font-bold text-amber-800 text-sm">Como acumular pontos?</p>
          <p className="text-amber-700 text-sm mt-1">
            A cada atendimento registrado por um credenciado ACIAV Saúde, você ganha <strong>1 ponto para cada R$1 economizado</strong>.
            Quanto mais você usa o plano, mais pontos acumula!
          </p>
        </div>
      </div>

      {/* Prêmios - Em breve */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-2">
          <Gift size={20} className="text-[#007178]" />
          <h2 className="font-bold text-slate-800">Catálogo de Prêmios</h2>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <Lock size={40} className="mb-3 opacity-30" />
          <p className="font-medium text-slate-600">Catálogo em construção</p>
          <p className="text-sm mt-1 text-center px-8 max-w-sm">
            Os prêmios disponíveis para resgate aparecerão aqui. Em breve os parceiros ACIAV Saúde estarão cadastrando recompensas exclusivas para você.
          </p>
          <div className="mt-4 bg-[#007178]/10 text-[#007178] px-4 py-2 rounded-xl text-sm font-bold">
            Você tem {userPoints} ponto{userPoints !== 1 ? 's' : ''} disponíve{userPoints !== 1 ? 'is' : 'l'}
          </div>
        </div>
      </div>
    </div>
  );
}
