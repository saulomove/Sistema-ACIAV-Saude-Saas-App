import { DollarSign, Clock } from 'lucide-react';

export default function FaturamentoPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <DollarSign className="text-secondary" /> Faturamento SaaS
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Gestão de cobranças, planos e receita por unidade.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
        <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Clock size={32} className="text-secondary" />
        </div>
        <h2 className="text-xl font-bold text-slate-700 mb-2">Em desenvolvimento</h2>
        <p className="text-slate-400 text-sm max-w-sm mx-auto">
          O módulo de faturamento SaaS está previsto para o Sprint 8.
          Incluirá gestão de planos, cobranças por unidade e relatórios de receita.
        </p>
      </div>
    </div>
  );
}
