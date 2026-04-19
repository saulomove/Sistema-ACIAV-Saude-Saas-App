import { redirect } from 'next/navigation';
import { getSessionUser, serverFetch } from '../../../lib/server-api';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, MapPin, HeartPulse, ShieldAlert, Star, Sparkles } from 'lucide-react';
import QrCodeImage from '../../../components/QrCodeImage';

interface PatientCard {
  id: string;
  fullName: string;
  cpf: string;
  pointsBalance: number;
  company?: { corporateName: string };
  dependents: Array<{ id: string; fullName: string; type: string; status: boolean }>;
  _count: { transactions: number };
}

interface PatientSummary {
  totalSaved: number;
  totalTransactions: number;
  lastVisit: string | null;
}

function maskCPF(cpf: string) {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function fmtMoney(v: number) {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default async function PortalPacientePage() {
  const user = await getSessionUser();
  if (!user || user.role !== 'patient') redirect('/login');

  const [card, summary] = await Promise.all([
    serverFetch<PatientCard>(`/users/me/card`),
    serverFetch<PatientSummary>(`/portal-paciente/summary`),
  ]);

  const totalEconomia = Number(summary?.totalSaved ?? 0);
  const totalVisitas = summary?.totalTransactions ?? 0;
  const firstName = card?.fullName?.split(' ')[0] ?? 'Paciente';
  const cpfFormatted = card?.cpf ? maskCPF(card.cpf) : '---';
  const companyName = card?.company?.corporateName ?? '';

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Saudação */}
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Olá, {firstName}!</h1>
        <p className="text-slate-500 mt-2 font-medium">Sua carteirinha digital e histórico de benefícios num só lugar.</p>
      </div>

      {/* KPI — Economia Acumulada */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#007178] to-[#005f65] p-6 md:p-8 text-white shadow-[0_20px_60px_-15px_rgba(0,113,120,0.4)]">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-8 -mb-8" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
              <Sparkles size={22} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest font-bold text-white/70">Sua economia com a ACIAV Saúde</p>
              <p className="text-3xl md:text-4xl font-black tracking-tight mt-1">{fmtMoney(totalEconomia)}</p>
              <p className="text-sm text-white/70 mt-1">
                em {totalVisitas} atendimento{totalVisitas === 1 ? '' : 's'} na rede credenciada.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Carteirinha Digital */}
      <div className="relative rounded-[2rem] overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,113,120,0.3)] bg-white border border-gray-100 p-8 pt-10 max-w-md mx-auto">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#007178]/10 rounded-full blur-3xl -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-teal-50 rounded-full blur-2xl -ml-10 -mb-10" />

        <div className="relative z-10 flex flex-col gap-6">
          {/* Top */}
          <div className="flex justify-between items-start">
            <div className="w-40 relative h-12">
              <Image src="/logo-aciav-saude.png" alt="ACIAV Saúde" fill className="object-contain object-left" priority />
            </div>
            <div className="bg-[#007178]/10 text-[#007178] px-4 py-1.5 rounded-full text-xs font-black tracking-widest border border-[#007178]/20 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#007178] animate-pulse" /> ATIVA
            </div>
          </div>

          {/* Name & CPF */}
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-800 uppercase">{card?.fullName ?? '---'}</h2>
            <p className="text-slate-500 font-mono text-sm tracking-widest mt-1">{cpfFormatted}</p>
          </div>

          {/* Bottom */}
          <div className="flex justify-between items-end border-t border-gray-100 pt-5">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Empresa Vinculada</p>
              <p className="font-bold text-sm text-slate-700">{companyName || '—'}</p>
              {card && (
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <Star size={10} className="text-amber-400 fill-amber-400" />
                  {card.pointsBalance} pontos acumulados
                </p>
              )}
            </div>
            <div className="bg-white p-2.5 rounded-2xl shadow-md border border-gray-100">
              <QrCodeImage value={card?.cpf ?? card?.id ?? 'aciav'} size={64} />
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-sm font-medium text-slate-400 max-w-sm mx-auto flex items-center justify-center gap-2 bg-slate-50 py-3 px-4 rounded-xl border border-gray-100">
        <ShieldAlert size={16} className="text-[#007178]" /> Apresente este QR Code no credenciado.
      </p>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/portal-paciente/historico" className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:border-[#007178]/30 hover:-translate-y-1 transition-all group block">
          <div className="w-14 h-14 bg-[#007178]/10 text-[#007178] rounded-2xl flex items-center justify-center mb-5 group-hover:bg-[#007178] group-hover:text-white transition-colors">
            <HeartPulse size={26} strokeWidth={2.5} />
          </div>
          <h3 className="font-bold text-slate-800 text-xl mb-2">Economia Acumulada</h3>
          <p className="text-slate-500 font-medium text-sm mb-6 leading-relaxed">Veja quanto você já economizou utilizando a rede ACIAV Saúde.</p>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-black tracking-tight text-[#007178]">{fmtMoney(totalEconomia)}</span>
            <div className="w-10 h-10 rounded-full bg-slate-50 group-hover:bg-[#007178]/10 flex items-center justify-center transition-colors">
              <ArrowRight size={20} className="text-slate-400 group-hover:text-[#007178] transition-colors" />
            </div>
          </div>
        </Link>

        <Link href="/portal-paciente/guia" className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:border-teal-200 hover:-translate-y-1 transition-all group block">
          <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-teal-600 group-hover:text-white transition-colors">
            <MapPin size={26} strokeWidth={2.5} />
          </div>
          <h3 className="font-bold text-slate-800 text-xl mb-2">Encontrar Parceiros</h3>
          <p className="text-slate-500 font-medium text-sm mb-6 leading-relaxed">Busque profissionais, clínicas e farmácias credenciadas.</p>
          <div className="flex items-end justify-between">
            <span className="text-sm font-bold text-slate-400 group-hover:text-teal-600 transition-colors uppercase tracking-wider">Acessar Guia Médico</span>
            <div className="w-10 h-10 rounded-full bg-slate-50 group-hover:bg-teal-50 flex items-center justify-center transition-colors">
              <ArrowRight size={20} className="text-slate-400 group-hover:text-teal-600 transition-colors" />
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
