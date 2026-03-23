import { Settings, Save, Lock, UserCog, Database, PaintBucket } from 'lucide-react';

export default function ConfiguracoesPage() {
    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Settings className="text-primary" />
                        Configurações do Sistema
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Ajuste os parâmetros visuais, de acesso e de integrações do sistema ACIAV Saúde.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2">
                        <Save size={16} /> Salvar Alterações
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Menu Lateral das Configurações */}
                <div className="md:col-span-1 space-y-2">
                    <button className="w-full flex items-center gap-3 px-4 py-3 bg-white text-primary border border-primary/20 rounded-xl font-bold text-sm shadow-sm">
                        <PaintBucket size={18} /> Aparência (White Label)
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-white hover:text-primary rounded-xl font-medium text-sm transition-colors">
                        <UserCog size={18} /> Permissões de Acesso
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-white hover:text-primary rounded-xl font-medium text-sm transition-colors">
                        <Lock size={18} /> Segurança / Autenticação
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-white hover:text-primary rounded-xl font-medium text-sm transition-colors">
                        <Database size={18} /> Backup & Integrações
                    </button>
                </div>

                {/* Formulário Principal */}
                <div className="md:col-span-3 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-lg text-slate-800 mb-6">Identidade Visual da Unidade</h3>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Nome da Plataforma (Título)</label>
                                <input
                                    type="text"
                                    defaultValue="ACIAV Saúde"
                                    className="w-full bg-slate-50 border border-gray-200 rounded-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Subdomínio Personalizado</label>
                                <div className="flex items-center">
                                    <span className="bg-slate-100 border border-r-0 border-gray-200 text-slate-500 px-4 py-2.5 rounded-l-lg text-sm">https://</span>
                                    <input
                                        type="text"
                                        defaultValue="videira"
                                        className="w-full bg-slate-50 border border-t-gray-200 border-b-gray-200 border-l-gray-200 border-r-0 px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-mono"
                                    />
                                    <span className="bg-slate-100 border border-l-0 border-gray-200 text-slate-500 px-4 py-2.5 rounded-r-lg text-sm">.aciavsaude.com.br</span>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 pt-6">
                            <h4 className="font-bold text-sm text-slate-800 mb-4">Paleta de Cores Principais</h4>
                            <div className="flex items-center gap-8">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-2">Cor Primária (Teal/Marca)</label>
                                    <div className="flex items-center gap-3">
                                        <input type="color" defaultValue="#00796B" className="w-10 h-10 rounded cursor-pointer border-none p-0 outline-none" />
                                        <span className="font-mono text-sm uppercase text-slate-700">#00796B</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-2">Cor Secundária (Laranja/Ações)</label>
                                    <div className="flex items-center gap-3">
                                        <input type="color" defaultValue="#E65100" className="w-10 h-10 rounded cursor-pointer border-none p-0 outline-none" />
                                        <span className="font-mono text-sm uppercase text-slate-700">#E65100</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 pt-6">
                            <h4 className="font-bold text-sm text-slate-800 mb-4">Logotipo</h4>
                            <div className="flex items-start gap-4">
                                <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer text-slate-400">
                                    <span className="text-xs font-bold text-center px-4">Clique para fazer upload (PNG transparente)</span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-slate-600 mb-2">Recomendamos enviar uma imagem PNG sem fundo, com no mínimo 500x500px para garantir qualidade nas carteirinhas digitais e na Web.</p>
                                    <button className="text-sm text-primary font-bold hover:underline">Baixar Logo Atual</button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
