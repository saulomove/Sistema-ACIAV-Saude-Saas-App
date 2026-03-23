import { getSessionUser, serverFetch } from '../../../lib/server-api';
import BeneficiariosClient from './BeneficiariosClient';

export default async function BeneficiariosPage() {
  const user = await getSessionUser();
  const unitId = user?.unitId ?? '';

  const [users, companies] = await Promise.all([
    serverFetch<unknown[]>(`/users?unitId=${unitId}`),
    serverFetch<unknown[]>(`/companies?unitId=${unitId}`),
  ]);

  return (
    <BeneficiariosClient
      users={users ?? []}
      companies={companies ?? []}
      unitId={unitId}
    />
  );
}
