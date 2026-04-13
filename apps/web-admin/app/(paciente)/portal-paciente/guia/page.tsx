import { redirect } from 'next/navigation';
import { getSessionUser, serverFetch } from '../../../../lib/server-api';
import { Search, MapPin, Stethoscope, Phone } from 'lucide-react';

interface Provider {
  id: string;
  name: string;
  professionalName?: string;
  clinicName?: string;
  category: string;
  specialty?: string;
  address?: string;
  phone?: string;
  whatsapp?: string;
  bio?: string;
  photoUrl?: string;
  rankingScore: number;
  _count: { transactions: number; services: number };
}

export default async function GuiaMedicoPage() {
  const user = await getSessionUser();
  if (!user || user.role !== 'patient') redirect('/login');

  const unitId = user.unitId ?? '';
  const providersRes = await serverFetch<{ data: Provider[] }>(`/providers?unitId=${unitId}`);
  const providers = providersRes?.data ?? [];

  function parseAddress(addr?: string) {
    if (!addr) return null;
    try { return JSON.parse(addr); } catch { return { city: addr }; }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="pb-6 border-b border-gray-100">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Guia Médico</h1>
        <p className="text-slate-500 mt-2 font-medium">Encontre os melhores médicos, clínicas e laboratórios com desconto.</p>
      </div>

      {/* Busca */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#007178]" size={20} />
            <input
              type="text"
              placeholder="Buscar por credenciado..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#007178]/20 text-slate-700 font-medium"
              disabled
            />
          </div>
        </div>
      </div>

      {providers.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <Stethoscope className="mx-auto h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-800">Nenhum credenciado encontrado</h3>
          <p className="text-slate-500 mt-2 text-sm">Ainda não há parceiros cadastrados para a sua unidade.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {providers.map((p) => {
            const addr = parseAddress(p.address);
            return (
              <div key={p.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:border-[#007178]/30 hover:-translate-y-1 transition-all group">
                <div className="flex justify-between items-start mb-4">
                  {p.photoUrl ? (
                    <img src={p.photoUrl} alt="" className="w-14 h-14 rounded-2xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 bg-[#007178]/10 text-[#007178] rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#007178] group-hover:text-white transition-colors">
                      <Stethoscope size={24} />
                    </div>
                  )}
                  <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-black border border-emerald-100">
                    {p._count.services} serviço{p._count.services !== 1 ? 's' : ''}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-800 group-hover:text-[#007178] transition-colors">{p.name}</h3>
                <p className="text-sm font-bold text-slate-500 mt-1">
                  {p.category}{p.specialty ? ` — ${p.specialty}` : ''}
                </p>
                {p.professionalName && p.clinicName && (
                  <p className="text-xs text-slate-400 mt-1">{p.professionalName}</p>
                )}
                {p.bio && <p className="text-sm text-slate-400 mt-2 line-clamp-2">{p.bio}</p>}
                <div className="space-y-1.5 mt-3">
                  {addr && (
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <MapPin size={14} className="shrink-0" />
                      <span>{addr.city ?? addr.street ?? JSON.stringify(addr)}</span>
                    </div>
                  )}
                  {p.whatsapp && (
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Phone size={14} className="shrink-0" />
                      <span>{p.whatsapp}</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-slate-400">
                  <span>{p._count.transactions} atendimento{p._count.transactions !== 1 ? 's' : ''} realizados</span>
                  <span className="font-bold text-[#007178]">Score: {p.rankingScore.toFixed(1)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
