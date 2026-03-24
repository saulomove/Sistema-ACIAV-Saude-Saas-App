import { getSessionUser, serverFetch } from '../../../lib/server-api';
import { redirect } from 'next/navigation';
import PremiosClient from './PremiosClient';

interface Reward {
  id: string;
  name: string;
  pointsRequired: number;
  stock: number;
  provider: { id: string; name: string };
}

interface Provider {
  id: string;
  name: string;
}

export default async function PremiosPage() {
  const user = await getSessionUser();
  if (!user || !['super_admin', 'admin_unit'].includes(user.role)) redirect('/login');

  const [rewards, providersRes] = await Promise.all([
    serverFetch<Reward[]>('/rewards'),
    serverFetch<{ data: Provider[] }>('/providers'),
  ]);

  return (
    <PremiosClient
      initialRewards={rewards ?? []}
      providers={(providersRes?.data ?? []).map((p) => ({ id: p.id, name: p.name }))}
    />
  );
}
