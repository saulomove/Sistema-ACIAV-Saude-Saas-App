import { getSessionUser, serverFetch } from '../../../lib/server-api';
import DashboardClient from '../DashboardClient';
import SuperAdminDashboard from '../SuperAdminDashboard';

export default async function Dashboard() {
  const user = await getSessionUser();
  const role = user?.role ?? '';
  const unitId = user?.unitId ?? '';

  if (role === 'super_admin') {
    const globalStats = await serverFetch<any>('/stats/global');
    return <SuperAdminDashboard stats={globalStats} />;
  }

  const [stats, ranking, caged] = await Promise.all([
    serverFetch<any>(`/stats/dashboard?unitId=${unitId}`),
    serverFetch<any[]>(`/providers/ranking?unitId=${unitId}&limit=5`),
    role === 'admin_unit' ? serverFetch<any>(`/caged?unitId=${unitId}`) : Promise.resolve(null),
  ]);

  return <DashboardClient stats={stats} ranking={ranking} caged={caged} />;
}
