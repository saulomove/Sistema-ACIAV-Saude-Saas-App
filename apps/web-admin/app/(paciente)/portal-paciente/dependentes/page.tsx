import { redirect } from 'next/navigation';
import { getSessionUser, serverFetch } from '../../../../lib/server-api';
import { Users, CheckCircle2, XCircle } from 'lucide-react';

interface Dependent {
  id: string;
  fullName: string;
  cpf: string;
  type: string;
  status: boolean;
}

interface PatientCard {
  dependents: Dependent[];
}

function maskCPF(cpf: string) {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function typeLabel(type: string) {
  const map: Record<string, string> = {
    conjuge: 'Cônjuge',
    filho: 'Filho(a)',
    pai: 'Pai/Mãe',
    dependente: 'Dependente',
  };
  return map[type?.toLowerCase()] ?? type;
}

export default async function DependentesPage() {
  const user = await getSessionUser();
  if (!user || user.role !== 'patient') redirect('/login');

  const card = await serverFetch<PatientCard>(`/users/me/card`);
  const dependents = card?.dependents ?? [];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-end pb-6 border-b border-gray-100">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Meus Dependentes</h1>
          <p className="text-slate-500 mt-2 font-medium">Membros da família cadastrados no seu plano ACIAV Saúde.</p>
        </div>
      </div>

      {dependents.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <Users className="mx-auto h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-800">Nenhum dependente cadastrado</h3>
          <p className="text-slate-500 mt-2 text-sm">Entre em contato com o RH da sua empresa para adicionar dependentes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {dependents.map((dep) => (
            <div key={dep.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-[#007178]/10 text-[#007178] rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Users size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{dep.fullName}</h3>
                  <p className="text-sm text-slate-500">{typeLabel(dep.type)} · {maskCPF(dep.cpf)}</p>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold mt-2 ${dep.status ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                    {dep.status ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                    {dep.status ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-slate-50 border border-gray-200 rounded-2xl p-5 text-sm text-slate-500">
        <strong className="text-slate-700">Precisa adicionar ou remover dependentes?</strong> Entre em contato com o setor de RH da sua empresa. Somente colaboradores com acesso ao Portal RH podem gerenciar dependentes.
      </div>
    </div>
  );
}
