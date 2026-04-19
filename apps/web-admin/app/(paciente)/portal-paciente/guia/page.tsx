import { redirect } from 'next/navigation';
import { getSessionUser, serverFetch } from '../../../../lib/server-api';
import GuiaClient from './GuiaClient';

interface Provider {
  id: string;
  name: string;
  professionalName?: string | null;
  clinicName?: string | null;
  category: string;
  specialty?: string | null;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  bio?: string | null;
  photoUrl?: string | null;
  rankingScore: number;
  services?: Array<{ id: string; description: string; originalPrice: number; discountedPrice: number; discountMaxPercent?: number | null }>;
  _count: { transactions: number; services: number };
}

interface ProvidersResponse {
  data: Provider[];
  total: number;
}

export default async function GuiaMedicoPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; category?: string; sortBy?: string }>;
}) {
  const user = await getSessionUser();
  if (!user || user.role !== 'patient') redirect('/login');

  const unitId = user.unitId ?? '';
  const params = await searchParams;
  const sortBy = params.sortBy || 'discount';

  const qs = new URLSearchParams();
  qs.set('unitId', unitId);
  qs.set('limit', '100');
  qs.set('sortBy', sortBy);
  if (params.city) qs.set('city', params.city);
  if (params.category) qs.set('category', params.category);

  const [providersRes, cities, categories] = await Promise.all([
    serverFetch<ProvidersResponse>(`/providers?${qs.toString()}`),
    serverFetch<string[]>(`/providers/cities?unitId=${unitId}`),
    serverFetch<string[]>(`/providers/categories?unitId=${unitId}`),
  ]);

  return (
    <GuiaClient
      providers={providersRes?.data ?? []}
      cities={Array.isArray(cities) ? cities : []}
      categories={Array.isArray(categories) ? categories : []}
      initialCity={params.city ?? ''}
      initialCategory={params.category ?? ''}
      initialSortBy={sortBy}
    />
  );
}
