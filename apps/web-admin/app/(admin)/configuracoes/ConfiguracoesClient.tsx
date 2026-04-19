'use client';

import { useEffect, useState } from 'react';
import { Settings, Lock, UserCog, Database, PaintBucket } from 'lucide-react';
import AppearanceTab from './tabs/AppearanceTab';
import AccessTab from './tabs/AccessTab';
import SecurityTab, { SecuritySettings } from './tabs/SecurityTab';
import BackupTab, { EmailIntegration } from './tabs/BackupTab';

type TabKey = 'appearance' | 'access' | 'security' | 'backup';

interface ConfiguracoesClientProps {
  unitId: string;
  unitName: string;
  subdomain: string;
  currentAuthUserId: string;
  rawSettings: Record<string, unknown>;
}

const TABS: Array<{ key: TabKey; label: string; icon: typeof Settings }> = [
  { key: 'appearance', label: 'Aparência (White Label)', icon: PaintBucket },
  { key: 'access', label: 'Permissões de Acesso', icon: UserCog },
  { key: 'security', label: 'Segurança / Autenticação', icon: Lock },
  { key: 'backup', label: 'Backup & Integrações', icon: Database },
];

export default function ConfiguracoesClient({ unitId, unitName, subdomain, currentAuthUserId, rawSettings }: ConfiguracoesClientProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('appearance');

  useEffect(() => {
    const url = new URL(window.location.href);
    const t = url.searchParams.get('tab') as TabKey | null;
    if (t && TABS.some((x) => x.key === t)) setActiveTab(t);
  }, []);

  function handleTabChange(key: TabKey) {
    setActiveTab(key);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', key);
    window.history.replaceState(null, '', url.toString());
  }

  const appearance = {
    platformName: rawSettings.platformName as string | undefined,
    primaryColor: rawSettings.primaryColor as string | undefined,
    secondaryColor: rawSettings.secondaryColor as string | undefined,
    logoUrl: rawSettings.logoUrl as string | undefined,
  };
  const security = (rawSettings.security as SecuritySettings | undefined) ?? {};
  const integrations = (rawSettings.integrations as Record<string, unknown> | undefined) ?? {};
  const email = (integrations.email as EmailIntegration | undefined) ?? {};

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Settings className="text-primary" />
          Configurações do Sistema
        </h1>
        <p className="text-slate-500 text-sm mt-1">Ajuste os parâmetros visuais, de acesso e de integrações do sistema ACIAV Saúde.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-2">
          {TABS.map(({ key, label, icon: Icon }) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => handleTabChange(key)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${
                  active
                    ? 'bg-white text-primary border border-primary/20 font-bold shadow-sm'
                    : 'text-slate-600 hover:bg-white hover:text-primary font-medium'
                }`}
              >
                <Icon size={18} /> {label}
              </button>
            );
          })}
        </div>

        <div className="md:col-span-3">
          {activeTab === 'appearance' && (
            <AppearanceTab
              unitId={unitId}
              unitName={unitName}
              subdomain={subdomain}
              settings={appearance}
              rawSettings={rawSettings}
            />
          )}
          {activeTab === 'access' && (
            <AccessTab unitId={unitId} currentAuthUserId={currentAuthUserId} />
          )}
          {activeTab === 'security' && (
            <SecurityTab unitId={unitId} initial={security} rawSettings={rawSettings} />
          )}
          {activeTab === 'backup' && (
            <BackupTab unitId={unitId} emailInitial={email} rawSettings={rawSettings} />
          )}
        </div>
      </div>
    </div>
  );
}
