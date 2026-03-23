import { getSessionUser, serverFetch } from '../../../lib/server-api';
import CredenciadosClient from './CredenciadosClient';

export default async function CredenciadosPage() {
  const user = await getSessionUser();
  const unitId = user?.unitId ?? '';

  const providers = await serverFetch<unknown[]>(`/providers?unitId=${unitId}`);

  return <CredenciadosClient providers={providers ?? []} unitId={unitId} />;
}
