import { redirect } from 'next/navigation';
import { getSessionUser, serverFetch } from '../../../../lib/server-api';
import GuiaClient, { type EntityType } from './GuiaClient';

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
  entityType?: EntityType;
  services?: Array<{ id: string; description: string; originalPrice: number; insurancePrice?: number | null; discountedPrice: number; discountType?: string | null; discountValue?: number | null; discountMinPercent?: number | null; discountMaxPercent?: number | null }>;
  _count: { transactions: number; services: number };
}

interface ProvidersResponse {
  data: Provider[];
  total: number;
}

export default async function GuiaMedicoPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    city?: string;
    category?: string;
    sortBy?: string;
    type?: string;
    discountMin?: string;
  }>;
}) {
  const user = await getSessionUser();
  if (!user || user.role !== 'patient') redirect('/login');

  const unitId = user.unitId ?? '';
  const params = await searchParams;
  const sortBy = params.sortBy || 'default';

  const qs = new URLSearchParams();
  qs.set('unitId', unitId);
  qs.set('limit', '200');
  qs.set('sortBy', sortBy);
  if (params.search) qs.set('search', params.search);
  if (params.city) qs.set('city', params.city);
  if (params.category) qs.set('category', params.category);
  if (params.type) qs.set('type', params.type);
  if (params.discountMin) qs.set('discountMin', params.discountMin);

  const [providersRes, cities, categories] = await Promise.all([
    serverFetch<ProvidersResponse>(`/providers?${qs.toString()}`),
    serverFetch<string[]>(`/providers/cities?unitId=${unitId}`),
    serverFetch<string[]>(`/providers/categories?unitId=${unitId}`),
  ]);

  const initialTypes = (params.type ?? '').split(',').filter(Boolean) as EntityType[];

  return (
    <GuiaClient
      providers={providersRes?.data ?? []}
      cities={Array.isArray(cities) ? cities : []}
      categories={Array.isArray(categories) ? categories : []}
      initialSearch={params.search ?? ''}
      initialCity={params.city ?? ''}
      initialCategory={params.category ?? ''}
      initialSortBy={sortBy}
      initialTypes={initialTypes}
      initialDiscountMin={params.discountMin ? Number(params.discountMin) : 0}
    />
  );
}
