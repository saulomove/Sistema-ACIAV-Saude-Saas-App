import { redirect } from 'next/navigation';
import { getSessionUser, serverFetch } from '../../../../lib/server-api';
import ServicosClient from './ServicosClient';

interface Service {
  id: string;
  description: string;
  originalPrice: number;
  insurancePrice: number;
  discountedPrice: number;
  discountType: string;
  discountValue: number;
}

interface Unit {
  id: string;
  supportWhatsapp?: string | null;
}

export default async function ServicosPage() {
  const user = await getSessionUser();
  if (!user || user.role !== 'provider') redirect('/login');

  const providerId = user.providerId ?? '';
  const services = await serverFetch<Service[]>(`/providers/${providerId}/services`) ?? [];

  let supportWhatsapp: string | null = null;
  if (user.unitId) {
    const unit = await serverFetch<Unit>(`/units/${user.unitId}`);
    supportWhatsapp = unit?.supportWhatsapp ?? null;
  }

  return (
    <ServicosClient
      providerId={providerId}
      initialServices={services}
      supportWhatsapp={supportWhatsapp}
    />
  );
}
