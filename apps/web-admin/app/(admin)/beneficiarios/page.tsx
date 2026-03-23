import { getSessionUser, serverFetch } from '../../../lib/server-api';
import BeneficiariosClient from './BeneficiariosClient';

export default async function BeneficiariosPage() {
  const user = await getSessionUser();
  const unitId = user?.unitId ?? '';

  const users = await serverFetch<unknown[]>(`/users?unitId=${unitId}`);

  return <BeneficiariosClient users={users ?? []} />;
}
