import { redirect } from 'next/navigation';
import { getSessionUser, serverFetch } from '../../../../lib/server-api';
import CredenciadosRHClient from './CredenciadosRHClient';

interface Provider {
  id: string;
  name: string;
  clinicName?: string | null;
  category: string;
  specialty?: string | null;
  city?: string | null;
  address?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  photoUrl?: string | null;
}

export default async function CredenciadosRHPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; category?: string }>;
}) {
  const user = await getSessionUser();
  if (!user || user.role !== 'rh') redirect('/login');

  const params = await searchParams;
  const qs = new URLSearchParams();
  if (params.city) qs.set('city', params.city);
  if (params.category) qs.set('category', params.category);

  const [providers, cities] = await Promise.all([
    serverFetch<Provider[]>(`/portal-rh/credenciados${qs.toString() ? '?' + qs.toString() : ''}`).catch(() => [] as Provider[]),
    serverFetch<string[]>(`/portal-rh/credenciados/cidades`).catch(() => [] as string[]),
  ]);

  const categorySet = new Set<string>();
  (providers || []).forEach((p) => { if (p.category) categorySet.add(p.category); });
  const categories = Array.from(categorySet).sort();

  return (
    <CredenciadosRHClient
      providers={Array.isArray(providers) ? providers : []}
      cities={Array.isArray(cities) ? cities : []}
      categories={categories}
      initialCity={params.city ?? ''}
      initialCategory={params.category ?? ''}
    />
  );
}
