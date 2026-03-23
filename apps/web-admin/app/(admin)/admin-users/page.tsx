import { getSessionUser, serverFetch } from '../../../lib/server-api';
import { redirect } from 'next/navigation';
import AdminUsersClient from './AdminUsersClient';

export default async function AdminUsersPage() {
  const user = await getSessionUser();

  // Somente super_admin pode acessar esta página
  if (user?.role !== 'super_admin') redirect('/');

  const [adminUsers, units] = await Promise.all([
    serverFetch<unknown[]>('/auth/admin-users'),
    serverFetch<unknown[]>('/units'),
  ]);

  return <AdminUsersClient adminUsers={adminUsers ?? []} units={units ?? []} />;
}
