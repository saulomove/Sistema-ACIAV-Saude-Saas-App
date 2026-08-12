import { redirect } from 'next/navigation';
import { getSessionUser, serverFetch, serverFetchCached } from '../../../../lib/server-api';
import OuvidoriaClient from './OuvidoriaClient';

interface UnitInfo {
  supportWhatsapp?: string | null;
}

interface PatientCard {
  fullName?: string;
  cpf?: string;
}

export default async function OuvidoriaPage() {
  const user = await getSessionUser();
  if (!user || user.role !== 'patient') redirect('/login');

  const [unit, card] = await Promise.all([
    user.unitId ? serverFetch<UnitInfo>(`/units/${user.unitId}/support`) : Promise.resolve(null),
    serverFetchCached<PatientCard>(`/users/me/card`),
  ]);

  return (
    <OuvidoriaClient
      supportWhatsapp={unit?.supportWhatsapp ?? null}
      nome={card?.fullName ?? ''}
      cpf={card?.cpf ?? ''}
    />
  );
}
