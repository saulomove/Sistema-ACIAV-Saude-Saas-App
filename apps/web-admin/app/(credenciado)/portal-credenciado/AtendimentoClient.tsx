'use client';

import { useState } from 'react';
import { Search, ShieldCheck, CheckCircle2, User, Stethoscope, Loader2, AlertCircle, X } from 'lucide-react';
import { api } from '../../../lib/api-client';

interface Service {
  id: string;
  description: string;
  originalPrice: number;
  discountedPrice: number;
}

interface UserFound {
  id: string;
  fullName: string;
  cpf: string;
  status: boolean;
  company?: { corporateName: string };
  dependents: Array<{ id: string; fullName: string; type: string; status: boolean }>;
}

function formatCPF(v: string) {
  return v.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function fmtMoney(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function AtendimentoClient({
  providerId,
  unitId,
  services,
}: {
  providerId: string;
  unitId: string;
  services: Service[];
}) {
  const [cpf, setCpf] = useState('');
  const [searching, setSearching] = useState(false);
  const [patient, setPatient] = useState<UserFound | null>(null);
  const [searchError, setSearchError] = useState('');

  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [registering, setRegistering] = useState(false);
  const [success, setSuccess] = useState(false);
  const [txError, setTxError] = useState('');

  const selectedService = services.find((s) => s.id === selectedServiceId);
  const economy = selectedService ? Number(selectedService.originalPrice) - Number(selectedService.discountedPrice) : 0;

  const attendees = patient
    ? [
        { id: patient.id, label: `${patient.fullName} (Titular)` },
        ...patient.dependents.filter((d) => d.status).map((d) => ({
          id: d.id,
          label: `${d.fullName} (Dependente)`,
        })),
      ]
    : [];

  async function handleSearch() {
    const cpfClean = cpf.replace(/\D/g, '');
    if (cpfClean.length !== 11) { setSearchError('CPF inválido.'); return; }
    setSearching(true);
    setSearchError('');
    setPatient(null);
    setSuccess(false);
    try {
      const result = await api.get(`/users/validate/${cpfClean}?unitId=${unitId}`) as UserFound;
      setPatient(result);
      setSelectedPatientId(result.id);
      setSelectedServiceId(services[0]?.id ?? '');
    } catch {
      setSearchError('Beneficiário não encontrado ou inativo nesta unidade.');
    } finally {
      setSearching(false);
    }
  }

  async function handleRegister() {
    if (!selectedPatientId || !selectedServiceId) { setTxError('Selecione o beneficiário e o serviço.'); return; }
    setRegistering(true);
    setTxError('');
    try {
      await api.post('/transactions', {
        userId: selectedPatientId,
        providerId,
        serviceId: selectedServiceId,
        amountSaved: economy,
      });
      setSuccess(true);
      setPatient(null);
      setCpf('');
      setSelectedPatientId('');
      setSelectedServiceId('');
    } catch (e: unknown) {
      setTxError(e instanceof Error ? e.message : 'Erro ao registrar atendimento.');
    } finally {
      setRegistering(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Balcão de Atendimento</h1>
        <p className="text-slate-500 text-sm mt-1">Busque o beneficiário pelo CPF, selecione o serviço e registre o atendimento.</p>
      </div>

      {/* Sucesso */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center gap-3">
          <CheckCircle2 className="text-emerald-500 shrink-0" size={24} />
          <div>
            <p className="font-bold text-emerald-800">Atendimento registrado com sucesso!</p>
            <p className="text-sm text-emerald-600">O beneficiário recebeu os pontos de fidelidade.</p>
          </div>
          <button onClick={() => setSuccess(false)} className="ml-auto text-emerald-400 hover:text-emerald-700"><X size={18} /></button>
        </div>
      )}

      {/* Busca */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Search className="text-[#007178]" size={20} /> Consultar Beneficiário por CPF
        </h2>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={cpf}
            onChange={(e) => setCpf(formatCPF(e.target.value))}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="000.000.000-00"
            className="flex-1 bg-slate-50 border-2 border-gray-200 rounded-xl px-6 py-3.5 text-lg tracking-widest text-slate-700 focus:outline-none focus:border-[#007178] font-mono"
          />
          <button
            onClick={handleSearch}
            disabled={searching}
            className="bg-[#007178] hover:bg-[#005f65] disabled:opacity-50 text-white px-7 py-3.5 rounded-xl font-bold transition-colors flex items-center gap-2"
          >
            {searching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
            {searching ? 'Buscando...' : 'Validar'}
          </button>
        </div>
        {searchError && (
          <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-2.5 rounded-lg">
            <AlertCircle size={15} /> {searchError}
          </div>
        )}
      </div>

      {/* Resultado + Lançamento */}
      {patient && (
        <div className="bg-white rounded-2xl border-2 border-[#007178]/30 shadow-sm overflow-hidden">
          {/* Paciente */}
          <div className="bg-[#007178]/5 px-6 py-5 flex items-center gap-4 border-b border-[#007178]/10">
            <div className="w-14 h-14 bg-[#007178]/10 rounded-full flex items-center justify-center">
              <User size={28} className="text-[#007178]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-slate-800">{patient.fullName}</h3>
                <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle2 size={12} /> ATIVO
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                CPF: {patient.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
                {patient.company && ` · ${patient.company.corporateName}`}
              </p>
            </div>
          </div>

          {/* Lançar serviço */}
          <div className="px-6 py-6 space-y-5">
            <h4 className="font-bold text-slate-800 flex items-center gap-2">
              <Stethoscope size={18} className="text-[#007178]" /> Lançar Serviço
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Quem será atendido?</label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#007178]/20 bg-slate-50"
                >
                  {attendees.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Serviço</label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#007178]/20 bg-slate-50"
                >
                  {services.length === 0 && <option value="">Nenhum serviço cadastrado</option>}
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.description} — {fmtMoney(Number(s.discountedPrice))}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedService && (
              <div className="bg-slate-50 border border-gray-100 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">
                    Valor particular: <span className="line-through">{fmtMoney(Number(selectedService.originalPrice))}</span>
                  </p>
                  <p className="text-sm font-bold text-emerald-600 mt-0.5">
                    Economia do beneficiário: {fmtMoney(economy)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Paciente paga:</p>
                  <p className="text-3xl font-black text-[#007178]">{fmtMoney(Number(selectedService.discountedPrice))}</p>
                </div>
              </div>
            )}

            {txError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-2.5 rounded-lg">{txError}</p>
            )}

            <button
              onClick={handleRegister}
              disabled={registering || services.length === 0}
              className="w-full bg-[#007178] hover:bg-[#005f65] disabled:opacity-50 text-white py-4 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
            >
              {registering ? <Loader2 size={20} className="animate-spin" /> : <ShieldCheck size={20} />}
              {registering ? 'Registrando...' : 'Registrar Atendimento'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
