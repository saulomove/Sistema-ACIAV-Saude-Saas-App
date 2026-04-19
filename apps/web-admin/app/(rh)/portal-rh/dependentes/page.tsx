import { redirect } from 'next/navigation';
import { getSessionUser, serverFetch } from '../../../../lib/server-api';
import DependentesRHClient from './DependentesRHClient';

interface Dependente {
  id: string;
  fullName: string;
  cpf: string;
  status: boolean;
  birthDate?: string | null;
  gender?: string | null;
  phone?: string | null;
  kinship?: string | null;
  inactivationReason?: string | null;
  inactivatedAt?: string | null;
  createdAt: string;
  parent?: { id: string; fullName: string; cpf: string } | null;
}

interface Titular {
  id: string;
  fullName: string;
  cpf: string;
}

export default async function DependentesPage() {
  const user = await getSessionUser();
  if (!user || user.role !== 'rh') redirect('/login');

  const [dependentes, titulares] = await Promise.all([
    serverFetch<Dependente[]>(`/portal-rh/dependentes`).catch(() => [] as Dependente[]),
    serverFetch<Titular[]>(`/portal-rh/titulares`).catch(() => [] as Titular[]),
  ]);

  return (
    <DependentesRHClient
      dependentes={Array.isArray(dependentes) ? dependentes : []}
      titulares={Array.isArray(titulares) ? titulares : []}
    />
  );
}
