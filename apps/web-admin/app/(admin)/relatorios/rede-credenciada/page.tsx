import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { getSessionUser, serverFetch } from '../../../../lib/server-api';
import RedeCredenciadaClient from './RedeCredenciadaClient';

interface Provider {
  id: string;
  name: string;
  professionalName?: string | null;
  clinicName?: string | null;
  category: string;
  specialty?: string | null;
  city?: string | null;
  address?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  registration?: string | null;
  status?: boolean;
}

interface ProvidersResponse {
  data: Provider[];
  total: number;
}

export default async function RedeCredenciadaPage() {
  const user = await getSessionUser();
  if (!user || !['super_admin', 'admin_unit'].includes(user.role)) redirect('/login');

  const unitId = user.unitId ?? '';

  const [providersRes, cities, categories] = await Promise.all([
    serverFetch<ProvidersResponse>(`/providers?unitId=${unitId}&limit=500`),
    serverFetch<string[]>(`/providers/cities?unitId=${unitId}`),
    serverFetch<string[]>(`/providers/categories?unitId=${unitId}`),
  ]);

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <Link
        href="/relatorios"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 no-print"
      >
        <ChevronLeft size={15} /> Relatórios
      </Link>
      <RedeCredenciadaClient
        providers={providersRes?.data ?? []}
        cities={Array.isArray(cities) ? cities : []}
        categories={Array.isArray(categories) ? categories : []}
        unitId={unitId}
      />
    </div>
  );
}
