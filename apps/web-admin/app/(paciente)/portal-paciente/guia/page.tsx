'use client';

import { motion } from 'framer-motion';
import { Search, MapPin, Stethoscope, Star, ChevronRight, Phone, Navigation } from 'lucide-react';

export default function GuiaMedicoPage() {
    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
    };

    const parceiros = [
        { id: 1, nome: "Clínica Vida & Saúde", especialidade: "Clínico Geral", endereco: "Centro, Videira - SC", distancia: "1.2 km", desconto: "30%", rating: 4.8 },
        { id: 2, nome: "Sorriso Metálico Odonto", especialidade: "Odontologia", endereco: "Dois Pinheiros, Videira - SC", distancia: "2.5 km", desconto: "20%", rating: 4.9 },
        { id: 3, nome: "Farmácia Preço Popular", especialidade: "Medicamentos", endereco: "Centro, Fraiburgo - SC", distancia: "14 km", desconto: "15%", rating: 4.7 },
        { id: 4, nome: "Laboratório Biocentro", especialidade: "Exames Laboratoriais", endereco: "Centro, Videira - SC", distancia: "1.5 km", desconto: "25%", rating: 4.9 },
    ];

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="max-w-4xl mx-auto space-y-8"
        >
            <motion.div variants={itemVariants} className="pb-6 border-b border-gray-100">
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Guia Médico</h1>
                <p className="text-slate-500 mt-2 font-medium">Encontre os melhores médicos, clínicas e laboratórios com desconto.</p>
            </motion.div>

            {/* Busca e Filtros */}
            <motion.div variants={itemVariants} className="bg-white p-4 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={20} />
                        <input type="text" placeholder="Nome do profissional ou especialidade..." className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-slate-700 font-medium" />
                    </div>
                    <div className="md:w-64 relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <select className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-slate-700 font-medium appearance-none">
                            <option>Videira, SC</option>
                            <option>Fraiburgo, SC</option>
                            <option>Caçador, SC</option>
                        </select>
                    </div>
                    <button className="bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
                        Buscar
                    </button>
                </div>
            </motion.div>

            {/* Lista de Credenciados */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {parceiros.map((parceiro) => (
                    <motion.div
                        key={parceiro.id}
                        whileHover={{ y: -4, transition: { duration: 0.2 } }}
                        className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col justify-between group cursor-pointer relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-primary/10 transition-colors"></div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                                    <Stethoscope size={24} />
                                </div>
                                <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-black tracking-widest border border-emerald-100">
                                    {parceiro.desconto} OFF
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-slate-800 tracking-tight group-hover:text-primary transition-colors">{parceiro.nome}</h3>
                            <p className="text-sm font-bold text-slate-500 mt-1">{parceiro.especialidade}</p>

                            <div className="mt-4 space-y-2">
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <MapPin size={16} className="text-slate-400" />
                                    <span>{parceiro.endereco} ({parceiro.distancia})</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <Star size={16} className="text-amber-400 fill-amber-400" />
                                    <span className="font-bold text-slate-700">{parceiro.rating}</span>
                                    <span>(120 avaliações)</span>
                                </div>
                            </div>
                        </div>

                        <div className="relative z-10 mt-6 pt-4 border-t border-gray-100 flex gap-3">
                            <button className="flex-1 py-3 text-sm font-bold text-primary bg-primary/5 hover:bg-primary/10 rounded-xl transition-colors flex items-center justify-center gap-2">
                                <Phone size={16} /> Ligar
                            </button>
                            <button className="flex-1 py-3 text-sm font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors flex items-center justify-center gap-2">
                                <Navigation size={16} /> Rota
                            </button>
                        </div>
                    </motion.div>
                ))}
            </motion.div>
        </motion.div>
    );
}
