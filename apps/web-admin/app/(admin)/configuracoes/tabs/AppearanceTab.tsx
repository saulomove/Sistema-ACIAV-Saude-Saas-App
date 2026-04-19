'use client';

import { useRef, useState } from 'react';
import { Save, CheckCircle, Upload, Loader2, Trash2 } from 'lucide-react';

interface AppearanceSettings {
  platformName?: string;
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
}

interface Props {
  unitId: string;
  unitName: string;
  subdomain: string;
  settings: AppearanceSettings;
  rawSettings: Record<string, unknown>;
}

export default function AppearanceTab({ unitId, unitName, subdomain, settings, rawSettings }: Props) {
  const [platformName, setPlatformName] = useState(settings.platformName ?? unitName ?? 'ACIAV Saúde');
  const [primaryColor, setPrimaryColor] = useState(settings.primaryColor ?? '#00796B');
  const [secondaryColor, setSecondaryColor] = useState(settings.secondaryColor ?? '#E65100');
  const [logoUrl, setLogoUrl] = useState<string | null>(settings.logoUrl ?? null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const merged = { ...rawSettings, platformName, primaryColor, secondaryColor, ...(logoUrl ? { logoUrl } : { logoUrl: undefined }) };
      const res = await fetch(`/internal/api/units/${unitId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: JSON.stringify(merged) }),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert('Erro ao salvar configurações.');
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoUpload(file: File) {
    setUploadError(null);
    if (file.size > 2 * 1024 * 1024) {
      setUploadError('Arquivo muito grande (máx 2MB).');
      return;
    }
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowed.includes(file.type)) {
      setUploadError('Formato inválido. Use JPG, PNG, WebP ou SVG.');
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`/internal/api/units/${unitId}/logo`, {
        method: 'POST',
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { message?: string }).message || 'Falha no upload.');
      setLogoUrl((data as { logoUrl: string }).logoUrl);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Erro no upload.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleRemoveLogo() {
    if (!confirm('Remover o logotipo atual?')) return;
    const merged = { ...rawSettings, platformName, primaryColor, secondaryColor };
    delete (merged as Record<string, unknown>).logoUrl;
    try {
      const res = await fetch(`/internal/api/units/${unitId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: JSON.stringify(merged) }),
      });
      if (!res.ok) throw new Error();
      setLogoUrl(null);
    } catch {
      alert('Erro ao remover logotipo.');
    }
  }

  const apiOrigin = typeof window !== 'undefined' ? window.location.origin.replace('://app.', '://api.') : '';
  const logoDisplayUrl = logoUrl ? (logoUrl.startsWith('http') ? logoUrl : `${apiOrigin}${logoUrl}`) : null;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-lg text-slate-800">Identidade Visual da Unidade</h3>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2 disabled:opacity-60"
        >
          {saved ? (<><CheckCircle size={16} /> Salvo!</>) : (<><Save size={16} /> {saving ? 'Salvando...' : 'Salvar'}</>)}
        </button>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Nome da Plataforma (Título)</label>
            <input
              type="text"
              value={platformName}
              onChange={(e) => setPlatformName(e.target.value)}
              className="w-full bg-slate-50 border border-gray-200 rounded-lg px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Subdomínio Personalizado</label>
            <div className="flex items-center">
              <span className="bg-slate-100 border border-r-0 border-gray-200 text-slate-500 px-4 py-2.5 rounded-l-lg text-sm">https://</span>
              <input
                type="text"
                defaultValue={subdomain}
                readOnly
                className="w-full bg-slate-50 border border-t-gray-200 border-b-gray-200 border-l-gray-200 border-r-0 px-4 py-2.5 text-slate-400 text-sm font-mono cursor-not-allowed"
              />
              <span className="bg-slate-100 border border-l-0 border-gray-200 text-slate-500 px-4 py-2.5 rounded-r-lg text-sm">.aciavsaude.com.br</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Alteração de subdomínio requer suporte.</p>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6">
          <h4 className="font-bold text-sm text-slate-800 mb-4">Paleta de Cores Principais</h4>
          <div className="flex items-center gap-8">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-2">Cor Primária (Teal/Marca)</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border-none p-0 outline-none"
                />
                <span className="font-mono text-sm uppercase text-slate-700">{primaryColor}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-2">Cor Secundária (Laranja/Ações)</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border-none p-0 outline-none"
                />
                <span className="font-mono text-sm uppercase text-slate-700">{secondaryColor}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6">
          <h4 className="font-bold text-sm text-slate-800 mb-4">Logotipo</h4>
          <div className="flex items-start gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer text-slate-400 overflow-hidden relative disabled:opacity-60"
            >
              {uploading ? (
                <Loader2 className="animate-spin text-slate-400" size={24} />
              ) : logoDisplayUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoDisplayUrl} alt="Logotipo" className="max-w-full max-h-full object-contain" />
              ) : (
                <span className="text-xs font-bold text-center px-4 flex flex-col items-center gap-1">
                  <Upload size={20} />
                  Clique para enviar
                </span>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleLogoUpload(f);
              }}
            />
            <div className="flex-1">
              <p className="text-sm text-slate-600 mb-2">
                Recomendamos PNG/SVG sem fundo, com no mínimo 500×500px. Máx. 2MB.
              </p>
              {uploadError && <p className="text-xs text-rose-600 mb-2 font-medium">{uploadError}</p>}
              <div className="flex items-center gap-4 text-sm">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-primary font-bold hover:underline flex items-center gap-1"
                >
                  <Upload size={14} /> Enviar logotipo
                </button>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="text-rose-600 font-bold hover:underline flex items-center gap-1"
                  >
                    <Trash2 size={14} /> Remover
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
