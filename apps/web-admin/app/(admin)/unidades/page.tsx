import { getSessionUser, serverFetch } from '../../../lib/server-api';
import UnidadesClient from './UnidadesClient';

export default async function UnidadesPage() {
  const user = await getSessionUser();

  const units = await serverFetch<unknown[]>('/units');

  return <UnidadesClient units={units ?? []} role={user?.role ?? ''} />;
}
