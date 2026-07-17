import { redirect } from 'next/navigation';
import { getSessionUser, serverFetch } from '../../../../lib/server-api';
import BemVindoClient from './BemVindoClient';

interface FirstAccessState {
  firstAccessDone: boolean;
  passwordChangeRequired: boolean;
  prefill: {
    fullName: string;
    email: string;
    whatsapp: string;
    birthDate: string | null;
  };
}

export default async function BemVindoPage() {
  const user = await getSessionUser();
  if (!user || user.role !== 'patient') redirect('/login');

  const state = await serverFetch<FirstAccessState>(`/portal-paciente/first-access`);
  if (!state) redirect('/login');
  if (state.firstAccessDone) redirect('/portal');

  // prefill pode vir ausente (service retorna sem ele quando userId é null) e
  // birthDate pode ser uma data inválida — ambos quebrariam o render sem guard.
  const prefill = state.prefill ?? { fullName: '', email: '', whatsapp: '', birthDate: null };
  let birthDate = '';
  if (prefill.birthDate) {
    const d = new Date(prefill.birthDate);
    if (!Number.isNaN(d.getTime())) birthDate = d.toISOString().slice(0, 10);
  }

  return (
    <BemVindoClient
      prefill={{
        fullName: prefill.fullName ?? '',
        email: prefill.email ?? '',
        whatsapp: prefill.whatsapp ?? '',
        birthDate,
      }}
    />
  );
}
