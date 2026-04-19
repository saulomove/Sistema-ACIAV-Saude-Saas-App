'use client';

import { useRouter } from 'next/navigation';
import { MapPin, Phone, Mail, MessageCircle, Stethoscope, Filter } from 'lucide-react';

interface Provider {
  id: string;
  name: string;
  clinicName?: string | null;
  category: string;
  specialty?: string | null;
  city?: string | null;
  address?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  photoUrl?: string | null;
}

interface Props {
  providers: Provider[];
  cities: string[];
  categories: string[];
  initialCity: string;
  initialCategory: string;
}

function mapsLink(address?: string | null, city?: string | null) {
  const q = [address, city].filter(Boolean).join(' ');
  if (!q) return '#';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

function whatsLink(raw?: string | null) {
  const d = (raw || '').replace(/\D/g, '');
  return d ? `https://wa.me/55${d}` : '#';
}

export default function CredenciadosRHClient({ providers, cities, categories, initialCity, initialCategory }: Props) {
  const router = useRouter();

  function applyFilter(key: 'city' | 'category', value: string) {
    const url = new URL(window.location.href);
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
    router.push(url.pathname + '?' + url.searchParams.toString());
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Stethoscope className="text-secondary" /> Rede de Credenciados
        </h1>
        <p className="text-slate-500 text-sm mt-1">Consulte a rede disponível para os colaboradores da sua empresa.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-wrap items-end gap-3">
        <Filter size={16} className="text-slate-400 mb-2" />
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5">Cidade</label>
          <select
            value={initialCity}
            onChange={(e) => applyFilter('city', e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#007178]/30 focus:border-[#007178]"
          >
            <option value="">Todas</option>
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5">Categoria</label>
          <select
            value={initialCategory}
            onChange={(e) => applyFilter('category', e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#007178]/30 focus:border-[#007178]"
          >
            <option value="">Todas</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="ml-auto text-xs text-slate-500">
          {providers.length} credenciados
        </div>
      </div>

      {providers.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-xl py-16 text-center text-slate-400">
          <Stethoscope size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhum credenciado encontrado</p>
          <p className="text-xs mt-1">Ajuste os filtros e tente novamente.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {providers.map((p) => (
            <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#007178]/10 text-[#007178] flex items-center justify-center font-bold">
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-800 truncate">{p.name}</h3>
                  {p.clinicName && <p className="text-xs text-slate-500 truncate">{p.clinicName}</p>}
                </div>
              </div>

              <div className="mt-3 space-y-1 text-xs text-slate-500">
                <div>
                  <span className="inline-block bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full mr-1">{p.category}</span>
                  {p.specialty && <span>{p.specialty}</span>}
                </div>
                {(p.address || p.city) && (
                  <p className="flex items-start gap-1.5">
                    <MapPin size={13} className="text-slate-400 shrink-0 mt-0.5" />
                    <span>{[p.address, p.city].filter(Boolean).join(' — ')}</span>
                  </p>
                )}
              </div>

              <div className="mt-auto pt-4 flex flex-wrap gap-2">
                {p.whatsapp && (
                  <a
                    href={whatsLink(p.whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold px-3 py-1.5 rounded-lg"
                  >
                    <MessageCircle size={13} /> WhatsApp
                  </a>
                )}
                {p.phone && (
                  <a
                    href={`tel:${p.phone.replace(/\D/g, '')}`}
                    className="inline-flex items-center gap-1 bg-slate-50 text-slate-700 hover:bg-slate-100 text-xs font-bold px-3 py-1.5 rounded-lg"
                  >
                    <Phone size={13} /> Ligar
                  </a>
                )}
                {(p.address || p.city) && (
                  <a
                    href={mapsLink(p.address, p.city)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold px-3 py-1.5 rounded-lg"
                  >
                    <MapPin size={13} /> Maps
                  </a>
                )}
                {p.email && (
                  <a
                    href={`mailto:${p.email}`}
                    className="inline-flex items-center gap-1 bg-slate-50 text-slate-700 hover:bg-slate-100 text-xs font-bold px-3 py-1.5 rounded-lg"
                  >
                    <Mail size={13} /> E-mail
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
