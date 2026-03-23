import { getSessionUser, serverFetch } from '../../lib/server-api';
import DashboardClient from './DashboardClient';

export default async function Dashboard() {
  const user = await getSessionUser();
  const unitId = user?.unitId ?? '';

  const [stats, ranking] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    serverFetch<any>(`/stats/dashboard?unitId=${unitId}`),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    serverFetch<any[]>(`/providers/ranking?unitId=${unitId}&limit=5`),
  ]);

  return <DashboardClient stats={stats} ranking={ranking} />;
}
