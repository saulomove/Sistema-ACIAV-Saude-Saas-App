import { redirect } from 'next/navigation';
import { getSessionUser, serverFetch } from '../../../../lib/server-api';
import { UserPlus, Search } from 'lucide-react';

interface Dependente {
  id: string;
  fullName: string;
  cpf: string;
  status: boolean;
  createdAt: string;
  company?: { corporateName: string };
}

export default async function DependentesPage() {
  const user = await getSessionUser();
  if (!user || user.role !== 'rh') redirect('/login');

  const result = user.companyId
    ? await serverFetch<{ data: Dependente[] }>(`/users?companyId=${user.companyId}&type=dependente`)
    : null;

  const lista = result?.data ?? [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <UserPlus className="text-secondary" /> Dependentes
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Visualização dos dependentes vinculados aos colaboradores da sua empresa.
        </p>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 text-sm text-blue-700">
        Os dependentes são cadastrados pelo próprio beneficiário pelo aplicativo ou pela central de atendimento.
        O RH visualiza apenas — sem permissão de edição.
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {lista.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <UserPlus size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nenhum dependente cadastrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Nome</th>
                  <th className="px-6 py-4">CPF</th>
                  <th className="px-6 py-4">Cadastrado em</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {lista.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{d.fullName}</td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                      {d.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {new Date(d.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${d.status ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {d.status ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary */}
      {lista.length > 0 && (
        <p className="text-sm text-slate-400 text-center">
          Total: <strong className="text-slate-600">{lista.length}</strong> dependentes cadastrados
        </p>
      )}
    </div>
  );
}
