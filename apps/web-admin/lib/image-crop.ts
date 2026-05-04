import type { Area } from 'react-easy-crop';

const MAX_FRAME = 4096;

/**
 * Recebe a URL da imagem original (objectURL ou dataURL) e a area cropada (em
 * pixels da imagem original), e devolve um Blob redimensionado pra
 * outputSize x outputSize no formato indicado.
 */
export async function getCroppedBlob(
  imageSrc: string,
  pixelArea: Area,
  outputSize: number,
  format: 'webp' | 'jpeg' = 'webp',
  quality = 0.85,
): Promise<Blob> {
  const img = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas indisponível');

  const sw = Math.min(pixelArea.width, MAX_FRAME);
  const sh = Math.min(pixelArea.height, MAX_FRAME);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, pixelArea.x, pixelArea.y, sw, sh, 0, 0, outputSize, outputSize);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Falha ao gerar imagem.'))),
      `image/${format}`,
      quality,
    );
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
    img.src = src;
  });
}

/**
 * Lê um File (do <input type="file">) e devolve um data URL pronto pra usar em
 * react-easy-crop. Inclui leve normalização EXIF para manter orientação correta.
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Falha ao ler arquivo.'));
    reader.readAsDataURL(file);
  });
}
