'use client';

import { motion } from 'framer-motion';
import { Gift, Zap, Trophy, ArrowRight, Lock } from 'lucide-react';

export default function ResgatarPremiosPage() {
    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
    };

    const premios = [
        { id: 1, nome: "Cesta Básica Completa", pontos: 5000, img: "https://images.unsplash.com/photo-1608686207856-001b95cf60ca?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80", status: "disponivel" },
        { id: 2, nome: "Vale Compras R$ 100", pontos: 2500, img: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80", status: "disponivel" },
        { id: 3, nome: "Smart TV 50''", pontos: 45000, img: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80", status: "bloqueado" },
        { id: 4, nome: "Smartphone Intermediário", pontos: 35000, img: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80", status: "bloqueado" },
    ];

    const pontosAtuais = 6200;

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="max-w-4xl mx-auto space-y-8"
        >
            <motion.div variants={itemVariants} className="pb-6 border-b border-gray-100 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Clube de Vantagens</h1>
                    <p className="text-slate-500 mt-2 font-medium">Troque as moedas acumuladas pelo uso consciente do plano por prêmios.</p>
                </div>

                {/* Score Card */}
                <div className="bg-gradient-to-r from-secondary to-[#ff8c00] p-[2px] rounded-2xl shadow-lg">
                    <div className="bg-white rounded-[14px] px-6 py-3 flex items-center gap-4">
                        <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center text-secondary">
                            <Trophy size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Seu Saldo</p>
                            <p className="text-2xl font-black text-slate-800">{pontosAtuais.toLocaleString()} <span className="text-sm font-bold text-secondary">pts</span></p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Vitrine de Prêmios */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {premios.map((premio) => (
                    <motion.div
                        key={premio.id}
                        whileHover={premio.status === 'disponivel' ? { y: -6, scale: 1.02 } : {}}
                        className={`bg-white rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border ${premio.status === 'disponivel' ? 'border-gray-100 hover:border-secondary/30 cursor-pointer' : 'border-gray-100 opacity-75 cursor-not-allowed'} transition-all group relative flex flex-col`}
                    >
                        {/* Imagem (Removido Next/Image p/ simplificar PoC no Framer Motion scale) */}
                        <div className="h-40 w-full relative overflow-hidden bg-slate-100">
                            {premio.status === 'bloqueado' && (
                                <div className="absolute inset-0 bg-slate-900/40 z-10 flex items-center justify-center backdrop-blur-[2px]">
                                    <Lock className="text-white opacity-80" size={32} />
                                </div>
                            )}
                            <img src={premio.img} alt={premio.nome} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>

                        {/* Conteúdo */}
                        <div className="p-6 flex flex-col flex-1">
                            <h3 className="text-lg font-bold text-slate-800 mb-2 leading-tight">{premio.nome}</h3>
                            <div className="mt-auto pt-4 flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-secondary font-black">
                                    <Zap size={18} fill="currentColor" /> {premio.pontos.toLocaleString()} pts
                                </div>
                                {premio.status === 'disponivel' && (
                                    <div className="w-8 h-8 rounded-full bg-secondary/10 text-secondary flex items-center justify-center group-hover:bg-secondary group-hover:text-white transition-colors">
                                        <ArrowRight size={16} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Status Bar */}
                        {premio.status === 'bloqueado' && (
                            <div className="h-1.5 w-full bg-slate-100">
                                <div className="h-full bg-slate-300" style={{ width: `${(pontosAtuais / premio.pontos) * 100}%` }}></div>
                            </div>
                        )}
                        {premio.status === 'disponivel' && (
                            <div className="h-1.5 w-full bg-secondary"></div>
                        )}
                    </motion.div>
                ))}
            </motion.div>

        </motion.div>
    );
}
