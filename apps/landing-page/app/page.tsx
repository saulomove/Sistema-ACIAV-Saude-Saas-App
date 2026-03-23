import { HeartPulse, ShieldCheck, Stethoscope, Search, CheckCircle2, Building2, Store, Users, MapPin, ArrowRight } from 'lucide-react';
import Image from 'next/image';

export default function Home() {
    return (
        <div className="flex flex-col min-h-screen">
            {/* 1. HERO SECTION */}
            <section className="relative pt-24 pb-32 overflow-hidden bg-gradient-to-br from-surface-light via-white to-orange-50/50">
                <div className="absolute inset-0 z-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col items-center text-center animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-primary/10 text-brand-primary font-bold text-sm mb-8 ring-1 ring-brand-primary/20">
                        <HeartPulse size={16} /> O maior clube de benefícios da região
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-tight max-w-4xl">
                        A saúde que você <br />
                        merece, com a <span className="gradient-text">economia</span> que a sua empresa precisa.
                    </h1>
                    <p className="mt-8 text-xl text-slate-600 max-w-2xl leading-relaxed">
                        Conectamos colaboradores, empresas e credenciados num ecossistema único de saúde. Aplicativo com carteirinha digital, descontos exclusivos e gamificação.
                    </p>
                    <div className="mt-12 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                        <button className="bg-brand-primary hover:bg-brand-primary-dark text-white px-8 py-4 rounded-xl text-lg font-bold transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center justify-center gap-2">
                            Baixe o App Agora <ArrowRight size={20} />
                        </button>
                        <button className="bg-white border-2 border-slate-200 hover:border-brand-secondary hover:text-brand-secondary text-slate-700 px-8 py-4 rounded-xl text-lg font-bold transition-all flex items-center justify-center gap-2">
                            <Building2 size={20} /> Seja uma Empresa Parceira
                        </button>
                    </div>
                </div>
            </section>

            {/* 2. PUBLIC SEARCH (BUSCADOR DE CREDENCIADOS) */}
            <section id="credenciados" className="py-24 bg-white relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Encontre Nossos Parceiros</h2>
                        <p className="text-lg text-slate-600">Veja quem já faz parte da nossa rede de saúde e descontos.</p>
                    </div>

                    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 p-4 relative -mt-6 z-20">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input type="text" placeholder="Qual especialidade você procura?" className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 text-slate-700" />
                            </div>
                            <div className="flex-1 relative">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <select className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 text-slate-700 appearance-none">
                                    <option>Todas as Cidades</option>
                                    <option>Videira, SC</option>
                                    <option>Caçador, SC</option>
                                </select>
                            </div>
                            <button className="bg-brand-secondary hover:bg-[#c44400] text-white px-8 py-4 rounded-xl font-bold transition-colors">
                                Buscar
                            </button>
                        </div>
                    </div>

                    {/* Cards Categoria */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-16 max-w-5xl mx-auto">
                        {[
                            { title: 'Médicos', icon: Stethoscope, color: 'text-blue-500', bg: 'bg-blue-50' },
                            { title: 'Odontologia', icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                            { title: 'Farmácias', icon: Store, color: 'text-brand-secondary', bg: 'bg-orange-50' },
                            { title: 'Terapias', icon: HeartPulse, color: 'text-purple-500', bg: 'bg-purple-50' }
                        ].map((cat, i) => {
                            const Icon = cat.icon;
                            return (
                                <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 text-center hover:shadow-xl transition-all cursor-pointer group hover:-translate-y-1">
                                    <div className={`w-16 h-16 mx-auto rounded-full ${cat.bg} ${cat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                        <Icon size={32} />
                                    </div>
                                    <h3 className="font-bold text-slate-800 text-lg">{cat.title}</h3>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* 3. SEÇÃO B2B (EMPRESAS) */}
            <section id="empresas" className="py-24 bg-slate-900 relative overflow-hidden text-white">
                {/* Abstract shape */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-brand-primary rounded-full blur-3xl opacity-20"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-brand-secondary rounded-full blur-3xl opacity-20"></div>

                <div className="max-w-7xl mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <h2 className="text-3xl md:text-5xl font-black mb-6 leading-tight">Valorize seu time de verdade.</h2>
                        <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                            Reduza o turnover da sua empresa oferecendo um benefício real. Nossa plataforma permite à sua equipe acessar os melhores profissionais de saúde com custos acessíveis, pagando do próprio bolso ou com subsídio da empresa, tudo gerido num painel simples para o RH.
                        </p>
                        <ul className="space-y-4 mb-10">
                            {['Gestão 100% digital via Painel do RH', 'Importação automática de planilhas', 'Sem mensalidades abusivas', 'Dashboard de impacto social da sua empresa'].map((benefit, i) => (
                                <li key={i} className="flex items-center gap-3 text-lg text-slate-200">
                                    <CheckCircle2 className="text-brand-secondary" size={24} /> {benefit}
                                </li>
                            ))}
                        </ul>
                        <button className="bg-brand-secondary hover:bg-[#c44400] text-white px-8 py-4 rounded-xl text-lg font-bold transition-all shadow-lg hover:shadow-brand-secondary/30">
                            Quero Cadastrar Minha Empresa
                        </button>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent z-10 bottom-0 top-1/2"></div>
                        <img
                            src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80"
                            alt="Dashboard de RH"
                            className="rounded-2xl shadow-2xl border border-slate-700/50 object-cover"
                        />
                    </div>
                </div>
            </section>

            {/* 4. FOOTER */}
            <footer className="bg-white py-12 border-t border-gray-100">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-32 relative h-8">
                            <Image
                                src="/logo-aciav-saude.png"
                                alt="ACIAV Saúde"
                                fill
                                className="object-contain object-left"
                            />
                        </div>
                    </div>
                    <p className="text-slate-500 font-medium">Feito com ❤️ por Saulo . Agencia ArtDesign | © 2026 ACIAV Saúde.</p>
                    <div className="flex gap-6 text-sm font-medium text-slate-600">
                        <a href="#" className="hover:text-brand-primary">Privacidade</a>
                        <a href="#" className="hover:text-brand-primary">Termos de Uso</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
