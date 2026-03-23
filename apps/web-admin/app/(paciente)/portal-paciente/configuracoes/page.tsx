'use client';

import { motion } from 'framer-motion';
import { User, Mail, Lock, Smartphone, Bell, EyeOff } from 'lucide-react';

export default function ConfiguracoesPage() {
    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="max-w-4xl mx-auto space-y-8"
        >
            <motion.div variants={itemVariants} className="pb-6 border-b border-gray-100">
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Configurações da Conta</h1>
                <p className="text-slate-500 mt-2 font-medium">Gerencie seus dados pessoais, senha e preferências do aplicativo.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Menu de Configs (Desktop Left) */}
                <motion.div variants={itemVariants} className="md:col-span-1 space-y-1">
                    <button className="w-full flex items-center gap-3 px-4 py-3 bg-primary/10 text-primary border border-primary/20 font-bold rounded-xl transition-colors text-left">
                        <User size={18} /> Dados Pessoais
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors text-left">
                        <Lock size={18} /> Senha e Segurança
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors text-left">
                        <Bell size={18} /> Notificações
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors text-left">
                        <EyeOff size={18} /> Privacidade
                    </button>
                </motion.div>

                {/* Área Principal de Config (Right) */}
                <motion.div variants={itemVariants} className="md:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10"></div>

                        <div className="flex items-center gap-6 mb-8 relative z-10">
                            <div className="w-20 h-20 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-black shadow-lg shadow-primary/30">
                                SM
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">Saulo Machado</h3>
                                <p className="text-sm text-slate-500 font-medium font-mono mt-1">CPF: 123.456.789-00</p>
                                <button className="mt-2 text-sm font-bold text-primary hover:text-primary-dark transition-colors">
                                    Alterar Foto
                                </button>
                            </div>
                        </div>

                        <form className="space-y-5 relative z-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Nome Completo</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input type="text" defaultValue="Saulo Machado" className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-slate-50 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700">Celular / WhatsApp</label>
                                    <div className="relative">
                                        <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input type="tel" defaultValue="(49) 99999-9999" className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-slate-50 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">E-mail Principal</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input type="email" defaultValue="saulo.machado@example.com" className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-slate-50 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all" />
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
                                <button type="button" className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-50 border border-transparent transition-colors">
                                    Cancelar
                                </button>
                                <button type="button" className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5">
                                    Salvar Alterações
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}
