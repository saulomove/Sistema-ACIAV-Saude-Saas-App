import { BarChart3, Users, Building, Stethoscope, Receipt } from 'lucide-react';
import ExportExcelButton from '../../../components/ExportExcelButton';

const cards = [
  {
    title: 'Beneficiários',
    description: 'Lista completa de titulares e dependentes, com empresa, CPF e contato.',
    endpoint: 'users' as const,
    icon: Users,
    color: 'bg-blue-50 text-blue-600',
  },
  {
    title: 'Empresas',
    description: 'Razão social, CNPJ, quantidade de beneficiários e regra de pagamento.',
    endpoint: 'companies' as const,
    icon: Building,
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    title: 'Credenciados',
    description: 'Prestadores cadastrados, categoria, serviços e atendimentos.',
    endpoint: 'providers' as const,
    icon: Stethoscope,
    color: 'bg-violet-50 text-violet-600',
  },
  {
    title: 'Transações',
    description: 'Atendimentos realizados com valor economizado — ideal para a contabilidade.',
    endpoint: 'transactions' as const,
    icon: Receipt,
    color: 'bg-amber-50 text-amber-600',
  },
];

export default function RelatoriosPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <BarChart3 className="text-primary" /> Relatórios
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Exporte os dados do sistema em Excel para enviar à contabilidade ou para análises externas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.endpoint}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4"
            >
              <div className="flex items-start gap-3">
                <div className={`w-11 h-11 rounded-xl ${c.color} flex items-center justify-center shrink-0`}>
                  <Icon size={22} />
                </div>
                <div>
                  <h2 className="font-bold text-slate-800">{c.title}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{c.description}</p>
                </div>
              </div>
              <div className="mt-auto">
                <ExportExcelButton endpoint={c.endpoint} variant="solid" label={`Exportar ${c.title}`} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg p-4">
        As exportações respeitam a sua unidade atual e são limitadas a 5 downloads por minuto.
      </div>
    </div>
  );
}
