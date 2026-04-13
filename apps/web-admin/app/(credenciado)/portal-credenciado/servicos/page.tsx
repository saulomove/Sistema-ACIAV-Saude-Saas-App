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

export default async function ServicosPage() {
  const user = await getSessionUser();
  if (!user || user.role !== 'provider') redirect('/login');

  const providerId = user.providerId ?? '';
  const services = await serverFetch<Service[]>(`/providers/${providerId}/services`) ?? [];

  return <ServicosClient providerId={providerId} initialServices={services} />;
}
