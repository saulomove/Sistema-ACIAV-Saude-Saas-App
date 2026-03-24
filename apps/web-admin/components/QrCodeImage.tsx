'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QrCodeImageProps {
  value: string;
  size?: number;
}

export default function QrCodeImage({ value, size = 64 }: QrCodeImageProps) {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    QRCode.toDataURL(value, {
      width: size * 2,
      margin: 1,
      color: { dark: '#007178', light: '#ffffff' },
    }).then(setDataUrl);
  }, [value, size]);

  if (!dataUrl) return <div style={{ width: size, height: size }} className="bg-gray-100 rounded animate-pulse" />;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={dataUrl} alt="QR Code" width={size} height={size} />
  );
}
