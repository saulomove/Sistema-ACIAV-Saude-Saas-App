import { redirect } from 'next/navigation';
import { getSessionUser, serverFetch } from '../../../../lib/server-api';
import ConfiguracoesClient from './ConfiguracoesClient';

interface Provider {
  id: string;
  name?: string | null;
  professionalName?: string | null;
  clinicName?: string | null;
  registration?: string | null;
  category?: string | null;
  specialty?: string | null;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  bio?: string | null;
  businessHours?: string | null;
  photoUrl?: string | null;
}

interface Unit {
  id: string;
  supportWhatsapp?: string | null;
}

export default async function ConfiguracoesCredPage() {
  const user = await getSessionUser();
  if (!user || user.role !== 'provider') redirect('/login');

  const provider = await serverFetch<Provider>('/providers/me');

  let supportWhatsapp: string | null = null;
  if (user.unitId) {
    const unit = await serverFetch<Unit>(`/units/${user.unitId}`);
    supportWhatsapp = unit?.supportWhatsapp ?? null;
  }

  if (!provider) {
    return (
      <div className="max-w-lg mx-auto bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-700 font-bold">Não foi possível carregar seus dados.</p>
        <p className="text-red-600 text-sm mt-1">
          Tente sair e entrar novamente. Se persistir, contate a administração.
        </p>
      </div>
    );
  }

  return (
    <ConfiguracoesClient
      initialProvider={provider}
      supportWhatsapp={supportWhatsapp}
      apiBase="/internal/api"
    />
  );
}
