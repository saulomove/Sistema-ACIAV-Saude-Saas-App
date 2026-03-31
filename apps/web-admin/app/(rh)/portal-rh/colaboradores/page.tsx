import { redirect } from 'next/navigation';
import { getSessionUser, serverFetch } from '../../../../lib/server-api';
import ColaboradoresRHClient from './ColaboradoresRHClient';

export default async function ColaboradoresPage() {
  const user = await getSessionUser();
  if (!user || user.role !== 'rh') redirect('/login');

  const result = user.companyId
    ? await serverFetch<{ data: unknown[] }>(`/users?companyId=${user.companyId}&type=titular`)
    : null;

  return (
    <ColaboradoresRHClient
      colaboradores={result?.data ?? []}
      companyId={user.companyId ?? ''}
      unitId={user.unitId ?? ''}
    />
  );
}
