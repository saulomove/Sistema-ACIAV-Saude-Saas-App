import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSessionUser } from '../../../../lib/server-api';
import { Gift, Lock } from 'lucide-react';

export default async function GamificacaoPage() {
  const user = await getSessionUser();
  if (!user || user.role !== 'provider') redirect('/login');

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-500 flex items-center justify-center mb-4">
          <Gift size={28} />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Lock size={18} className="text-slate-400" /> Gamificação em breve
        </h1>
        <p className="text-slate-500 mt-3 max-w-md">
          Estamos preparando um módulo de prêmios e gamificação para incentivar a fidelidade dos pacientes.
          Em breve você poderá cadastrar recompensas e acompanhar o ranking.
        </p>
        <Link
          href="/portal-credenciado"
          className="mt-6 bg-[#007178] hover:bg-[#005f65] text-white px-5 py-2.5 rounded-xl font-bold text-sm"
        >
          Voltar ao painel
        </Link>
      </div>
    </div>
  );
}
