'use client';

import { QrCode, ArrowRight, MapPin, HeartPulse, ShieldAlert } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function PortalPacientePage() {
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
            className="max-w-3xl mx-auto space-y-10"
        >
            {/* Saudação */}
            <motion.div variants={itemVariants}>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Olá, Saulo!</h1>
                <p className="text-slate-500 mt-2 font-medium">Sua carteirinha digital e histórico de benefícios num só lugar.</p>
            </motion.div>

            {/* A Carteirinha Digital (Premium Glass & Glow) */}
            <motion.div
                variants={itemVariants}
                whileHover={{ y: -5, scale: 1.01, transition: { duration: 0.3 } }}
                className="relative rounded-[2rem] overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,113,120,0.3)] bg-white border border-gray-100 p-8 pt-10 aspect-[1.6/1] max-w-md mx-auto group cursor-pointer"
            >
                {/* Abstract Background Accents inside card */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-primary/20 transition-colors duration-500"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-secondary/10 rounded-full blur-2xl -ml-10 -mb-10 group-hover:bg-secondary/20 transition-colors duration-500"></div>

                {/* Card Content */}
                <div className="relative z-10 flex flex-col justify-between h-full">

                    {/* Top: Logo & Valid */}
                    <div className="flex justify-between items-start">
                        <div className="w-40 relative h-12">
                            <Image
                                src="/logo-aciav-saude.png"
                                alt="ACIAV Saúde"
                                fill
                                className="object-contain object-left drop-shadow-sm"
                                priority
                            />
                        </div>
                        <div className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-black tracking-widest border border-primary/20 shadow-sm flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span> ATIVA
                        </div>
                    </div>

                    {/* Middle: User Info */}
                    <div className="space-y-1 mt-4">
                        <h2 className="text-3xl font-black tracking-tight text-slate-800">SAULO MACHADO</h2>
                        <p className="text-slate-500 font-mono text-sm tracking-widest flex items-center gap-2">
                            123.456.789-00
                        </p>
                    </div>

                    {/* Bottom: Company & QR */}
                    <div className="flex justify-between items-end border-t border-gray-100 pt-5 mt-4">
                        <div>
                            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Empresa Vinculada</p>
                            <p className="font-bold text-sm text-secondary">Karikal Comércio e Indústria</p>
                        </div>
                        <div className="bg-white p-2.5 rounded-2xl shadow-md border border-gray-100 group-hover:scale-110 transition-transform duration-300">
                            <QrCode size={48} className="text-primary" strokeWidth={1.5} />
                        </div>
                    </div>

                </div>
            </motion.div>

            <motion.p variants={itemVariants} className="text-center text-sm font-medium text-slate-400 max-w-sm mx-auto flex items-center justify-center gap-2 bg-slate-50 py-3 px-4 rounded-xl border border-gray-100">
                <ShieldAlert size={16} className="text-primary" /> Apresente este QR Code no credenciado.
            </motion.p>

            {/* Quick Actions (Dashboard Sections) */}
            <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">

                {/* Extrato Rápido */}
                <motion.div
                    variants={itemVariants}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 hover:border-primary/30 transition-all group cursor-pointer relative overflow-hidden"
                >
                    <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-primary/5 blur-2xl group-hover:bg-primary/10 transition-colors"></div>
                    <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-5 group-hover:bg-primary group-hover:text-white transition-colors duration-300 shadow-sm">
                        <HeartPulse size={26} strokeWidth={2.5} />
                    </div>
                    <h3 className="font-bold text-slate-800 text-xl mb-2">Economia Acumulada</h3>
                    <p className="text-slate-500 font-medium text-sm mb-6 leading-relaxed">Veja quanto você já economizou utilizando a nossa rede neste ano.</p>
                    <div className="flex items-end justify-between">
                        <span className="text-3xl font-black tracking-tight text-primary">R$ 1.250,00</span>
                        <div className="w-10 h-10 rounded-full bg-slate-50 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                            <ArrowRight size={20} className="text-slate-400 group-hover:text-primary transition-colors translate-x-0 group-hover:translate-x-1" />
                        </div>
                    </div>
                </motion.div>

                {/* Guia Médico */}
                <motion.div
                    variants={itemVariants}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 hover:border-secondary/30 transition-all group cursor-pointer relative overflow-hidden"
                >
                    <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-secondary/5 blur-2xl group-hover:bg-secondary/10 transition-colors"></div>
                    <div className="w-14 h-14 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center mb-5 group-hover:bg-secondary group-hover:text-white transition-colors duration-300 shadow-sm">
                        <MapPin size={26} strokeWidth={2.5} />
                    </div>
                    <h3 className="font-bold text-slate-800 text-xl mb-2">Encontrar Parceiros</h3>
                    <p className="text-slate-500 font-medium text-sm mb-6 leading-relaxed">Busque profissionais, clínicas e farmácias credenciadas perto de você.</p>
                    <div className="flex items-end justify-between">
                        <span className="text-sm font-bold text-slate-400 group-hover:text-secondary transition-colors uppercase tracking-wider">Acessar Guia Médico</span>
                        <div className="w-10 h-10 rounded-full bg-slate-50 group-hover:bg-secondary/10 flex items-center justify-center transition-colors">
                            <ArrowRight size={20} className="text-slate-400 group-hover:text-secondary transition-colors translate-x-0 group-hover:translate-x-1" />
                        </div>
                    </div>
                </motion.div>

            </motion.div>

        </motion.div>
    );
}
