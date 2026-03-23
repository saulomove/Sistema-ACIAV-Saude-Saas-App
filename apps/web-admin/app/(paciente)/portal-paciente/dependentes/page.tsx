'use client';

import { motion } from 'framer-motion';
import { Users, UserPlus, CheckCircle2 } from 'lucide-react';

export default function DependentesPage() {
    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
    };

    const dependentes = [
        { id: 1, nome: "Maria Joaquina", parentesco: "Cônjuge", cpf: "111.222.333-44", status: "Ativo" },
        { id: 2, nome: "João Marcos", parentesco: "Filho(a)", cpf: "555.666.777-88", status: "Em Análise" },
    ];

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="max-w-4xl mx-auto space-y-8"
        >
            <motion.div variants={itemVariants} className="flex justify-between items-end pb-6 border-b border-gray-100">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Meus Dependentes</h1>
                    <p className="text-slate-500 mt-2 font-medium">Cadastre e gerencie o acesso da sua família à rede ACIAV Saúde.</p>
                </div>
                <button className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-xl flex items-center gap-2">
                    <UserPlus size={20} /> Adicionar Novo
                </button>
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {dependentes.map((dep) => (
                    <motion.div
                        key={dep.id}
                        whileHover={{ y: -4 }}
                        className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col justify-between group overflow-hidden relative"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-primary/5 transition-colors"></div>
                        <div className="relative z-10 flex items-start gap-4">
                            <div className="w-14 h-14 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                <Users size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 group-hover:text-primary transition-colors">{dep.nome}</h3>
                                <p className="text-sm text-slate-500 font-medium mb-1">{dep.parentesco} • {dep.cpf}</p>
                                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold mt-2 ${dep.status === 'Ativo' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-orange-100 text-secondary border border-orange-200'}`}>
                                    {dep.status === 'Ativo' && <CheckCircle2 size={12} className="mr-1 inline-block" />} {dep.status}
                                </span>
                            </div>
                        </div>
                        <div className="relative z-10 mt-6 pt-4 border-t border-gray-100 flex gap-3">
                            {dep.status === 'Ativo' && (
                                <button className="flex-1 py-2 text-sm font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors">
                                    Ver Carteirinha
                                </button>
                            )}
                            <button className="flex-1 py-2 text-sm font-bold text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                                Remover
                            </button>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

        </motion.div>
    );
}
