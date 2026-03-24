import { getSessionUser, serverFetch } from '../../../lib/server-api';
import CredenciadosClient from './CredenciadosClient';

export default async function CredenciadosPage() {
  const user = await getSessionUser();
  const unitId = user?.unitId ?? '';

  const res = await serverFetch<{ data: unknown[] }>(`/providers?unitId=${unitId}`);
  const providers = res?.data ?? [];

  return <CredenciadosClient providers={providers} unitId={unitId} />;
}
