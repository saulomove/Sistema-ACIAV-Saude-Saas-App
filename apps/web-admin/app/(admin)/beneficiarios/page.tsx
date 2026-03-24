import { getSessionUser, serverFetch } from '../../../lib/server-api';
import BeneficiariosClient from './BeneficiariosClient';

export default async function BeneficiariosPage() {
  const user = await getSessionUser();
  const unitId = user?.unitId ?? '';

  const [usersRes, companies] = await Promise.all([
    serverFetch<{ data: unknown[] }>(`/users?unitId=${unitId}`),
    serverFetch<unknown[]>(`/companies?unitId=${unitId}`),
  ]);

  return (
    <BeneficiariosClient
      users={usersRes?.data ?? []}
      companies={companies ?? []}
      unitId={unitId}
    />
  );
}
