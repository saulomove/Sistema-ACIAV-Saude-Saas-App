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
  if (state.firstAccessDone) redirect('/portal-paciente');

  const birthDate = state.prefill.birthDate
    ? new Date(state.prefill.birthDate).toISOString().slice(0, 10)
    : '';

  return (
    <BemVindoClient
      prefill={{
        fullName: state.prefill.fullName,
        email: state.prefill.email,
        whatsapp: state.prefill.whatsapp,
        birthDate,
      }}
    />
  );
}
