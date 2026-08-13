import { redirect } from 'next/navigation';
import { getSessionUser, serverFetch } from '../../../lib/server-api';
import CagedClient from './CagedClient';

interface UnitOption {
  id: string;
  name: string;
  cityName?: string | null;
  state?: string | null;
}

export default async function CagedPage() {
  const user = await getSessionUser();
  if (!user || !['super_admin', 'admin_unit'].includes(user.role)) {
    redirect('/dashboard');
  }

  // super_admin escolhe a unidade num seletor; admin_unit é travado na própria (backend).
  const units = user.role === 'super_admin' ? (await serverFetch<UnitOption[]>('/units')) ?? [] : [];

  return <CagedClient role={user.role} units={units} />;
}
