'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, Phone, Mail, MessageCircle, Stethoscope, Filter, Percent, ArrowRight } from 'lucide-react';

interface Service {
  id: string;
  description: string;
  originalPrice: number;
  insurancePrice?: number | null;
  discountedPrice: number;
  discountType?: string | null;
  discountValue?: number | null;
  discountMinPercent?: number | null;
  discountMaxPercent?: number | null;
}

interface Provider {
  id: string;
  name: string;
  professionalName?: string | null;
  clinicName?: string | null;
  category: string;
  specialty?: string | null;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  bio?: string | null;
  photoUrl?: string | null;
  rankingScore: number;
  services?: Service[];
  _count: { transactions: number; services: number };
}

interface Props {
  providers: Provider[];
  cities: string[];
  categories: string[];
  initialCity: string;
  initialCategory: string;
  initialSortBy: string;
}

function parseAddress(addr?: string | null) {
  if (!addr) return null;
  try {
    const parsed = JSON.parse(addr);
    if (typeof parsed === 'object' && parsed !== null) return parsed as Record<string, string>;
  } catch {
    // addr não é JSON — retorna como string
  }
  return { text: addr };
}

function addressLine(addr?: string | null, city?: string | null) {
  const parsed = parseAddress(addr);
  const pieces: string[] = [];
  if (parsed) {
    if (parsed.street) pieces.push(String(parsed.street));
    if (parsed.number) pieces.push(String(parsed.number));
    if (parsed.neighborhood) pieces.push(String(parsed.neighborhood));
    if (parsed.city) pieces.push(String(parsed.city));
    if (!pieces.length && parsed.text) pieces.push(String(parsed.text));
  }
  if (city && !pieces.some((p) => p.toLowerCase().includes(city.toLowerCase()))) pieces.push(city);
  return pieces.join(', ');
}

// Versão sem a cidade — para o card mostrar cidade num badge separado
function streetLine(addr?: string | null) {
  const parsed = parseAddress(addr);
  if (!parsed) return '';
  const pieces: string[] = [];
  if (parsed.street) pieces.push(String(parsed.street));
  if (parsed.number) pieces.push(String(parsed.number));
  if (parsed.neighborhood) pieces.push(String(parsed.neighborhood));
  if (!pieces.length && parsed.text) pieces.push(String(parsed.text));
  return pieces.join(', ');
}

function cityLabel(addr?: string | null, city?: string | null) {
  if (city) return city;
  const parsed = parseAddress(addr);
  if (parsed?.city) return String(parsed.city);
  return '';
}

function mapsLink(addr?: string | null, city?: string | null) {
  const q = addressLine(addr, city);
  if (!q) return '#';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

function whatsLink(raw?: string | null) {
  const d = (raw || '').replace(/\D/g, '');
  return d ? `https://wa.me/55${d}` : null;
}

function servicePercents(s: Service): { min: number; max: number } | null {
  const orig = Number(s.originalPrice);
  const insurance = Number(s.insurancePrice ?? 0);
  if (insurance > 0 && orig > 0) {
    const pct = Math.round(((orig - insurance) / orig) * 100);
    return { min: pct, max: pct };
  }
  if (s.discountType === 'percentage' && Number(s.discountValue ?? 0) > 0 && s.discountMinPercent == null && s.discountMaxPercent == null) {
    const pct = Math.round(Number(s.discountValue));
    return { min: pct, max: pct };
  }
  if (s.discountMinPercent != null || s.discountMaxPercent != null) {
    const max = s.discountMaxPercent ?? s.discountMinPercent ?? 0;
    const min = s.discountMinPercent ?? max;
    return { min, max };
  }
  if (orig > 0) {
    const disc = Number(s.discountedPrice);
    const pct = Math.round(((orig - disc) / orig) * 100);
    if (pct > 0) return { min: pct, max: pct };
  }
  return null;
}

function bestDiscount(services?: Service[]): { minPct: number; maxPct: number; hasRange: boolean } {
  if (!services || services.length === 0) return { minPct: 0, maxPct: 0, hasRange: false };
  let lowest = Infinity;
  let highest = 0;
  let hasRange = false;
  for (const s of services) {
    const pct = servicePercents(s);
    if (!pct) continue;
    if (pct.max > 0) hasRange = true;
    if (pct.min < lowest) lowest = pct.min;
    if (pct.max > highest) highest = pct.max;
  }
  if (lowest === Infinity) lowest = 0;
  return { minPct: lowest, maxPct: highest, hasRange };
}

export default function GuiaClient({ providers, cities, categories, initialCity, initialCategory, initialSortBy }: Props) {
  const router = useRouter();

  function setParam(key: string, value: string) {
    const url = new URL(window.location.href);
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
    router.push(url.pathname + (url.searchParams.toString() ? '?' + url.searchParams.toString() : ''));
  }

  function trackClick(providerId: string, channel: 'whatsapp' | 'phone' | 'maps' | 'email' | 'details') {
    fetch(`/internal/api/providers/${providerId}/click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel }),
      keepalive: true,
    }).catch(() => { /* fire-and-forget */ });
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="pb-6 border-b border-gray-100">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Guia Médico</h1>
        <p className="text-slate-500 mt-2 font-medium">Encontre os melhores médicos, clínicas e laboratórios com desconto.</p>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap items-end gap-3">
        <Filter size={16} className="text-slate-400 mb-2" />
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5">Cidade</label>
          <select
            value={initialCity}
            onChange={(e) => setParam('city', e.target.value)}
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
            onChange={(e) => setParam('category', e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#007178]/30 focus:border-[#007178]"
          >
            <option value="">Todas</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5">Ordenar por</label>
          <select
            value={initialSortBy}
            onChange={(e) => setParam('sortBy', e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#007178]/30 focus:border-[#007178]"
          >
            <option value="discount">Maior desconto</option>
            <option value="ranking">Mais bem avaliados</option>
          </select>
        </div>
        <div className="ml-auto text-xs text-slate-500">{providers.length} credenciados</div>
      </div>

      {providers.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <Stethoscope className="mx-auto h-12 w-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-800">Nenhum credenciado encontrado</h3>
          <p className="text-slate-500 mt-2 text-sm">Ajuste os filtros e tente novamente.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {providers.map((p) => {
            const disc = bestDiscount(p.services);
            const addrLine = addressLine(p.address, p.city);
            const street = streetLine(p.address);
            const city = cityLabel(p.address, p.city);
            const whatsHref = whatsLink(p.whatsapp);
            return (
              <div key={p.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:border-[#007178]/30 transition-all flex flex-col">
                <div className="flex justify-between items-start mb-4 gap-3">
                  {p.photoUrl ? (
                    <img src={p.photoUrl} alt="" className="w-20 h-20 rounded-2xl object-cover flex-shrink-0 ring-1 ring-slate-100" />
                  ) : (
                    <div className="w-20 h-20 bg-[#007178]/10 text-[#007178] rounded-2xl flex items-center justify-center flex-shrink-0">
                      <Stethoscope size={32} />
                    </div>
                  )}
                  {disc.hasRange && (
                    <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-black border border-emerald-100 flex items-center gap-1 shrink-0">
                      <Percent size={12} />
                      {disc.minPct === disc.maxPct ? `${disc.maxPct}% OFF` : `${disc.minPct}% – ${disc.maxPct}% OFF`}
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-bold text-slate-800">{p.name}</h3>
                <p className="text-sm font-bold text-slate-500 mt-1">
                  {p.category}{p.specialty ? ` — ${p.specialty}` : ''}
                </p>
                {p.bio && <p className="text-sm text-slate-400 mt-2 line-clamp-2">{p.bio}</p>}

                {disc.hasRange && (
                  <p className="text-xs text-slate-500 mt-2">
                    Desconto na plataforma ACIAV Saúde{' '}
                    <span className="font-bold text-[#007178]">
                      {disc.minPct === disc.maxPct ? `de ${disc.maxPct}%` : `de ${disc.minPct}% a ${disc.maxPct}%`}
                    </span>
                  </p>
                )}

                {/* Cidade — destaque visual em chip teal */}
                {city && (
                  <div className="mt-3 inline-flex items-center gap-1.5 self-start bg-[#007178]/10 text-[#007178] text-xs font-bold px-2.5 py-1 rounded-full">
                    <MapPin size={12} className="shrink-0" />
                    {city}
                  </div>
                )}

                {/* Endereco (rua + numero + bairro) em linha menor abaixo */}
                <div className="space-y-1 mt-2">
                  {street && (
                    <div className="text-xs text-slate-400 line-clamp-2">{street}</div>
                  )}
                  {!street && addrLine && (
                    <div className="text-xs text-slate-400 line-clamp-2">{addrLine}</div>
                  )}
                  {p.phone && (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Phone size={14} className="shrink-0 text-slate-400" />
                      <span>{p.phone}</span>
                    </div>
                  )}
                </div>

                <div className="mt-auto pt-4 flex flex-wrap gap-2">
                  {whatsHref && (
                    <a
                      href={whatsHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackClick(p.id, 'whatsapp')}
                      className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold px-3 py-1.5 rounded-lg"
                    >
                      <MessageCircle size={13} /> WhatsApp
                    </a>
                  )}
                  {p.phone && (
                    <a
                      href={`tel:${p.phone.replace(/\D/g, '')}`}
                      onClick={() => trackClick(p.id, 'phone')}
                      className="inline-flex items-center gap-1 bg-slate-50 text-slate-700 hover:bg-slate-100 text-xs font-bold px-3 py-1.5 rounded-lg"
                    >
                      <Phone size={13} /> Ligar
                    </a>
                  )}
                  {addrLine && (
                    <a
                      href={mapsLink(p.address, p.city)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackClick(p.id, 'maps')}
                      className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold px-3 py-1.5 rounded-lg"
                    >
                      <MapPin size={13} /> Maps
                    </a>
                  )}
                  {p.email && (
                    <a
                      href={`mailto:${p.email}`}
                      onClick={() => trackClick(p.id, 'email')}
                      className="inline-flex items-center gap-1 bg-slate-50 text-slate-700 hover:bg-slate-100 text-xs font-bold px-3 py-1.5 rounded-lg"
                    >
                      <Mail size={13} /> E-mail
                    </a>
                  )}
                  <Link
                    href={`/portal/guia/${p.id}`}
                    onClick={() => trackClick(p.id, 'details')}
                    className="ml-auto inline-flex items-center gap-1 bg-[#007178] text-white hover:bg-[#005f65] text-xs font-bold px-3 py-1.5 rounded-lg"
                  >
                    Ver detalhes <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
