import { redirect } from 'next/navigation';
import { getSessionUser } from '../../../lib/server-api';
import AuditoriaClient from './AuditoriaClient';

export default async function AuditoriaPage() {
  const user = await getSessionUser();
  if (!user || !['super_admin', 'admin_unit'].includes(user.role)) {
    redirect('/dashboard');
  }
  return <AuditoriaClient role={user.role} />;
}
