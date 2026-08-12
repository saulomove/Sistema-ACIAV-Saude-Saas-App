import { redirect } from 'next/navigation';
import { getSessionUser } from '../../../lib/server-api';
import OuvidoriaAdminClient from './OuvidoriaAdminClient';

export default async function OuvidoriaAdminPage() {
  const user = await getSessionUser();
  if (!user || !['super_admin', 'admin_unit'].includes(user.role)) {
    redirect('/dashboard');
  }
  return <OuvidoriaAdminClient role={user.role} />;
}
