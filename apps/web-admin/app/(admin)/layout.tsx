import { getSessionUser, serverFetch } from '../../lib/server-api';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

interface Unit { id: string; name: string; }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  const role = user?.role ?? '';
  const email = user?.email ?? '';
  const unitId = user?.unitId ?? '';

  let unitName = 'Painel Global';
  if (unitId) {
    const unit = await serverFetch<Unit>(`/units/${unitId}`);
    unitName = unit?.name ?? 'Unidade';
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role={role} email={email} unitName={unitName} />
      <div className="flex flex-col flex-1 overflow-hidden w-full bg-slate-50">
        <Header role={role} unitName={unitName} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
