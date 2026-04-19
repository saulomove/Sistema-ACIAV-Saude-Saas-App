'use client';

import { MapPin, Phone, Mail, MessageCircle, Stethoscope, Percent, Clock, Star, Calendar } from 'lucide-react';

interface Service {
  id: string;
  description: string;
  originalPrice: number;
  discountedPrice: number;
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
  registration?: string | null;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  bio?: string | null;
  photoUrl?: string | null;
  rankingScore: number;
  services?: Service[];
  _count?: { transactions: number; services: number };
}

function addressLine(addr?: string | null, city?: string | null) {
  if (!addr && !city) return '';
  let text = '';
  if (addr) {
    try {
      const parsed = JSON.parse(addr);
      if (parsed && typeof parsed === 'object') {
        const pieces: string[] = [];
        if (parsed.street) pieces.push(String(parsed.street));
        if (parsed.number) pieces.push(String(parsed.number));
        if (parsed.neighborhood) pieces.push(String(parsed.neighborhood));
        if (parsed.city) pieces.push(String(parsed.city));
        text = pieces.join(', ');
      } else {
        text = String(addr);
      }
    } catch {
      text = addr;
    }
  }
  if (city && !text.toLowerCase().includes(city.toLowerCase())) {
    text = text ? `${text}, ${city}` : city;
  }
  return text;
}

function mapsLink(addr?: string | null, city?: string | null) {
  const q = addressLine(addr, city);
  if (!q) return '#';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

function whatsLink(raw?: string | null, message?: string) {
  const d = (raw || '').replace(/\D/g, '');
  if (!d) return null;
  const q = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/55${d}${q}`;
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

function trackClick(providerId: string, channel: 'whatsapp' | 'phone' | 'maps' | 'email' | 'details') {
  fetch(`/internal/api/providers/${providerId}/click`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel }),
    keepalive: true,
  }).catch(() => { /* fire-and-forget */ });
}

export default function ProviderDetailClient({ provider }: { provider: Provider }) {
  const addr = addressLine(provider.address, provider.city);
  const whats = whatsLink(
    provider.whatsapp,
    `Olá, sou beneficiário ACIAV Saúde e gostaria de agendar um atendimento com ${provider.professionalName || provider.clinicName || provider.name}.`,
  );
  const services = provider.services ?? [];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
        <div className="flex flex-col md:flex-row gap-6">
          {provider.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={provider.photoUrl} alt="" className="w-32 h-32 rounded-3xl object-cover bg-slate-100 flex-shrink-0" />
          ) : (
            <div className="w-32 h-32 bg-[#007178]/10 text-[#007178] rounded-3xl flex items-center justify-center flex-shrink-0">
              <Stethoscope size={56} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-black text-slate-800">{provider.name}</h1>
            {provider.clinicName && provider.clinicName !== provider.name && (
              <p className="text-lg text-slate-600 font-bold mt-1">{provider.clinicName}</p>
            )}
            <p className="text-sm font-bold text-slate-500 mt-2">
              {provider.category}{provider.specialty ? ` — ${provider.specialty}` : ''}
            </p>
            {provider.registration && (
              <p className="text-xs text-slate-400 font-mono mt-1">{provider.registration}</p>
            )}
            {provider.rankingScore > 0 && (
              <div className="flex items-center gap-1 mt-3 text-amber-500">
                <Star size={16} className="fill-amber-400" />
                <span className="text-sm font-bold text-slate-700">{provider.rankingScore.toFixed(1)}</span>
                {provider._count?.transactions ? (
                  <span className="text-xs text-slate-400 ml-1">({provider._count.transactions} atendimentos)</span>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {provider.bio && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Sobre</h3>
            <p className="text-sm text-slate-700 whitespace-pre-line">{provider.bio}</p>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
          {addr && (
            <div className="flex items-start gap-3">
              <MapPin size={18} className="text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Endereço</p>
                <p className="text-sm text-slate-700 font-medium">{addr}</p>
              </div>
            </div>
          )}
          {provider.phone && (
            <div className="flex items-start gap-3">
              <Phone size={18} className="text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Telefone</p>
                <p className="text-sm text-slate-700 font-medium">{provider.phone}</p>
              </div>
            </div>
          )}
          {provider.email && (
            <div className="flex items-start gap-3">
              <Mail size={18} className="text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">E-mail</p>
                <p className="text-sm text-slate-700 font-medium">{provider.email}</p>
              </div>
            </div>
          )}
          {provider.whatsapp && (
            <div className="flex items-start gap-3">
              <MessageCircle size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">WhatsApp</p>
                <p className="text-sm text-slate-700 font-medium">{provider.whatsapp}</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100 flex flex-wrap gap-2">
          {whats && (
            <a
              href={whats}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackClick(provider.id, 'whatsapp')}
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-sm"
            >
              <MessageCircle size={16} /> Agendar pelo WhatsApp
            </a>
          )}
          {provider.phone && (
            <a
              href={`tel:${provider.phone.replace(/\D/g, '')}`}
              onClick={() => trackClick(provider.id, 'phone')}
              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-bold px-5 py-2.5 rounded-xl text-sm"
            >
              <Phone size={16} /> Ligar
            </a>
          )}
          {addr && (
            <a
              href={mapsLink(provider.address, provider.city)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackClick(provider.id, 'maps')}
              className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold px-5 py-2.5 rounded-xl text-sm border border-blue-100"
            >
              <MapPin size={16} /> Ver no Maps
            </a>
          )}
          {provider.email && (
            <a
              href={`mailto:${provider.email}`}
              onClick={() => trackClick(provider.id, 'email')}
              className="inline-flex items-center gap-2 bg-slate-50 text-slate-700 hover:bg-slate-100 font-bold px-5 py-2.5 rounded-xl text-sm border border-slate-100"
            >
              <Mail size={16} /> Enviar e-mail
            </a>
          )}
        </div>
      </div>

      {services.length > 0 && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-6">
            <Percent size={20} className="text-[#007178]" /> Tabela de Serviços & Descontos
          </h2>
          <div className="divide-y divide-gray-100">
            {services.map((s) => {
              const orig = Number(s.originalPrice);
              const disc = Number(s.discountedPrice);
              const maxP = s.discountMaxPercent ?? (orig > 0 ? Math.round(((orig - disc) / orig) * 100) : 0);
              const minP = s.discountMinPercent ?? maxP;
              const hasRange = minP !== maxP;
              return (
                <div key={s.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <p className="font-bold text-slate-800">{s.description}</p>
                    <p className="text-xs text-slate-400 mt-0.5 line-through">Particular: {formatCurrency(orig)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-[#007178]">
                      {hasRange
                        ? `${formatCurrency(orig * (1 - maxP / 100))} a ${formatCurrency(orig * (1 - minP / 100))}`
                        : formatCurrency(disc > 0 ? disc : orig * (1 - maxP / 100))}
                    </p>
                    <p className="text-xs font-bold text-emerald-600 mt-0.5">
                      {hasRange ? `${minP}% a ${maxP}%` : `${maxP}%`} OFF
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
        <Clock size={20} className="text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-amber-800 text-sm">Como aproveitar o desconto?</p>
          <p className="text-amber-700 text-sm mt-1">
            Entre em contato pelo WhatsApp ou telefone acima e mencione que é <strong>beneficiário ACIAV Saúde</strong> ao agendar.
            No dia do atendimento, apresente sua carteirinha digital ou física.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-gray-100 flex items-center gap-3 text-slate-500 text-sm">
        <Calendar size={18} className="text-slate-400" />
        Os atendimentos são registrados pela administração ACIAV Saúde e aparecem no seu histórico de economia.
      </div>
    </div>
  );
}
