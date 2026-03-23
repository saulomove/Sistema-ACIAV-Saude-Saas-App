import { getSessionUser, serverFetch } from '../../../lib/server-api';
import EmpresasClient from './EmpresasClient';

interface CompanyStats {
  total: number;
  active: number;
  totalUsers: number;
}

export default async function EmpresasPage() {
  const user = await getSessionUser();
  const unitId = user?.unitId ?? '';

  const [companies, stats] = await Promise.all([
    serverFetch<unknown[]>(`/companies?unitId=${unitId}`),
    serverFetch<CompanyStats>(`/companies/stats?unitId=${unitId}`),
  ]);

  return <EmpresasClient companies={companies ?? []} stats={stats ?? { total: 0, active: 0, totalUsers: 0 }} />;
}
