import { redirect } from 'next/navigation';
import { getSessionUser } from '../../../../lib/server-api';
import ImportarClient from './ImportarClient';

export default async function ImportarPage() {
  const user = await getSessionUser();
  if (!user || user.role !== 'rh') redirect('/login');

  return <ImportarClient companyId={user.companyId ?? ''} unitId={user.unitId ?? ''} />;
}
