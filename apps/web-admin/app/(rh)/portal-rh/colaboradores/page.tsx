import { redirect } from 'next/navigation';
import { getSessionUser, serverFetch } from '../../../../lib/server-api';
import ColaboradoresRHClient from './ColaboradoresRHClient';

export default async function ColaboradoresPage() {
  const user = await getSessionUser();
  if (!user || user.role !== 'rh') redirect('/login');

  const colaboradores = await serverFetch<unknown[]>(
    `/users?companyId=${user.companyId}&type=titular`,
  );

  return (
    <ColaboradoresRHClient
      colaboradores={colaboradores ?? []}
      companyId={user.companyId ?? ''}
      unitId={user.unitId ?? ''}
    />
  );
}
