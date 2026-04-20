import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getSessionUser, serverFetch } from '../../../../../lib/server-api';
import ProviderDetailClient from './ProviderDetailClient';

interface Service {
  id: string;
  description: string;
  originalPrice: number;
  insurancePrice?: number | null;
  discountedPrice: number;
  discountType?: string | null;
  discountValue?: number | null;
  discountMinPercent?: number | null;
  discountMaxPercent?: number | null;
}

interface ProviderDetail {
  id: string;
  unitId: string;
  name: string;
  professionalName?: string | null;
  clinicName?: string | null;
  category: string;
  specialty?: string | null;
  registration?: string | null;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  bio?: string | null;
  photoUrl?: string | null;
  rankingScore: number;
  status: boolean;
  services?: Service[];
  _count?: { transactions: number; services: number };
}

export default async function ProviderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user || user.role !== 'patient') redirect('/login');

  const { id } = await params;
  const provider = await serverFetch<ProviderDetail>(`/providers/${id}`);
  if (!provider) notFound();
  if (user.unitId && provider.unitId && provider.unitId !== user.unitId) notFound();

  const services = await serverFetch<Service[]>(`/providers/${id}/services`).catch(() => [] as Service[]);
  const safeServices: Service[] = Array.isArray(services) ? services : [];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <Link
          href="/portal-paciente/guia"
          className="text-sm text-slate-500 hover:text-[#007178] font-medium"
        >
          ← Voltar ao Guia
        </Link>
      </div>
      <ProviderDetailClient provider={{ ...provider, services: safeServices }} />
    </div>
  );
}
