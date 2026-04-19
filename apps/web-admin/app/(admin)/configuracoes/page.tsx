import { getSessionUser, serverFetch } from '../../../lib/server-api';
import { redirect } from 'next/navigation';
import ConfiguracoesClient from './ConfiguracoesClient';

interface Unit {
  id: string;
  name: string;
  subdomain: string;
  settings?: string | null;
}

export default async function ConfiguracoesPage() {
  const user = await getSessionUser();
  if (!user || !['super_admin', 'admin_unit'].includes(user.role)) redirect('/login');

  const unit = await serverFetch<Unit>(`/units/${user.unitId}`);

  let parsedSettings: Record<string, unknown> = {};
  try {
    if (unit?.settings) parsedSettings = JSON.parse(unit.settings);
  } catch {
    parsedSettings = {};
  }

  return (
    <ConfiguracoesClient
      unitId={unit?.id ?? user.unitId ?? ''}
      unitName={unit?.name ?? ''}
      subdomain={unit?.subdomain ?? ''}
      currentAuthUserId={user.sub}
      rawSettings={parsedSettings}
    />
  );
}
