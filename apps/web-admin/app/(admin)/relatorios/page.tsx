import { BarChart3, Clock } from 'lucide-react';

export default function RelatoriosPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <BarChart3 className="text-primary" /> Relatórios
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Relatórios de atendimentos, utilização e impacto por unidade.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Clock size={32} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-slate-700 mb-2">Em desenvolvimento</h2>
        <p className="text-slate-400 text-sm max-w-sm mx-auto">
          O módulo de relatórios está previsto para o Sprint 9.
          Incluirá relatórios de atendimentos, logs de alterações e exportação em PDF/Excel.
        </p>
      </div>
    </div>
  );
}
