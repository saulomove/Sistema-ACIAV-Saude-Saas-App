'use client';

import { useCallback, useEffect, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { Loader2, X, ZoomIn, ZoomOut } from 'lucide-react';
import { getCroppedBlob } from '../lib/image-crop';

interface Props {
  open: boolean;
  src: string | null;
  onClose: () => void;
  onConfirm: (blob: Blob) => Promise<void> | void;
  aspect?: number;
  outputSize?: number;
  format?: 'webp' | 'jpeg';
  quality?: number;
  title?: string;
  helperText?: string;
}

export default function ImageCropperModal({
  open,
  src,
  onClose,
  onConfirm,
  aspect = 1,
  outputSize = 400,
  format = 'webp',
  quality = 0.85,
  title = 'Ajustar foto',
  helperText,
}: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pixels, setPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setPixels(null);
      setBusy(false);
    }
  }, [open]);

  const handleCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setPixels(areaPixels);
  }, []);

  async function handleConfirm() {
    if (!src || !pixels || busy) return;
    setBusy(true);
    try {
      const blob = await getCroppedBlob(src, pixels, outputSize, format, quality);
      await onConfirm(blob);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Erro ao processar imagem.');
    } finally {
      setBusy(false);
    }
  }

  if (!open || !src) return null;

  const defaultHelper = `Arraste a foto e use o zoom para enquadrar. A imagem será salva em ${outputSize}×${outputSize} pixels.`;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-800">{title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{helperText ?? defaultHelper}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="p-2 text-slate-400 hover:text-slate-700 disabled:opacity-50 shrink-0"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative w-full h-80 bg-slate-900">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape="rect"
            showGrid
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
            objectFit="contain"
            zoomSpeed={0.5}
            minZoom={1}
            maxZoom={4}
          />
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex items-center gap-3">
          <ZoomOut size={16} className="text-slate-400 shrink-0" />
          <input
            type="range"
            min={1}
            max={4}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-orange-500"
            aria-label="Zoom"
          />
          <ZoomIn size={16} className="text-slate-400 shrink-0" />
        </div>

        <div className="px-5 py-3 bg-slate-50 border-t border-gray-100 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy || !pixels}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50"
          >
            {busy && <Loader2 size={14} className="animate-spin" />}
            {busy ? 'Enviando…' : 'Salvar foto'}
          </button>
        </div>
      </div>
    </div>
  );
}
