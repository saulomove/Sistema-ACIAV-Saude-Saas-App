import { getSessionUser, serverFetch } from '../../../lib/server-api';
import BeneficiariosClient from './BeneficiariosClient';

export default async function BeneficiariosPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const user = await getSessionUser();
  const unitId = user?.unitId ?? '';
  const params = await searchParams;
  const search = (params?.search ?? '').trim();

  const usersQuery = new URLSearchParams();
  usersQuery.set('unitId', unitId);
  usersQuery.set('limit', search ? '500' : '200');
  if (search) usersQuery.set('search', search);

  const [usersRes, companies] = await Promise.all([
    serverFetch<{ data: unknown[]; total?: number }>(`/users?${usersQuery.toString()}`),
    serverFetch<unknown[]>(`/companies?unitId=${unitId}`),
  ]);

  return (
    <BeneficiariosClient
      users={usersRes?.data ?? []}
      total={usersRes?.total ?? 0}
      companies={companies ?? []}
      unitId={unitId}
      initialSearch={search}
    />
  );
}
