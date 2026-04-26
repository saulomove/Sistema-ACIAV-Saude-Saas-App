// Gera ícones e splash screens da PWA a partir dos SVGs em public/svg/
// Uso: node scripts/generate-pwa-assets.mjs
//
// - icon-{72,96,144,192,512,1024}.png — ícone com fundo branco e padding 8% (any purpose)
// - icon-maskable-{192,512}.png       — ícone com fundo branco e safe-area 20% (Android adaptive)
// - apple-icon-{152,180}.png          — Apple touch icon (sem padding extra além do natural do logo)
// - apple-splash-*.png                — splash screens iOS com logo vertical centralizado
//
// Logo source:
//  - public/svg/icon.svg            (apenas ícone)
//  - public/svg/logo-vertical.svg   (ícone + nome empilhado, usado nos splashes)
//  - public/svg/logo-horizontal.svg (não usado aqui, mas guardado pra branding)

import sharp from 'sharp';
import { readFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SVG_DIR = join(ROOT, 'public', 'svg');
const ICONS_DIR = join(ROOT, 'public', 'icons');
const SPLASH_DIR = join(ROOT, 'public', 'splash');

const TEAL = { r: 0, g: 113, b: 120, alpha: 1 };  // #007178 (cor da marca)
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };

await mkdir(ICONS_DIR, { recursive: true });
await mkdir(SPLASH_DIR, { recursive: true });

const iconSvg = await readFile(join(SVG_DIR, 'icon.svg'));
const verticalSvg = await readFile(join(SVG_DIR, 'logo-vertical.svg'));

// ICONES PWA REGULARES (com 8% de padding e fundo branco)
async function generateRegularIcon(size, fileName) {
  const padding = Math.round(size * 0.08);
  const innerSize = size - padding * 2;
  const iconBuffer = await sharp(iconSvg, { density: 1024 })
    .resize({ width: innerSize, height: innerSize, fit: 'contain', background: WHITE })
    .png()
    .toBuffer();

  await sharp({
    create: { width: size, height: size, channels: 4, background: WHITE },
  })
    .composite([{ input: iconBuffer, top: padding, left: padding }])
    .png()
    .toFile(join(ICONS_DIR, fileName));
  console.log(`  ✓ ${fileName} (${size}x${size})`);
}

// ICONES MASKABLE (20% safe area, fundo branco - aparece dentro de máscara Android)
async function generateMaskableIcon(size, fileName) {
  const padding = Math.round(size * 0.2);  // safe area 20% para máscaras
  const innerSize = size - padding * 2;
  const iconBuffer = await sharp(iconSvg, { density: 1024 })
    .resize({ width: innerSize, height: innerSize, fit: 'contain', background: WHITE })
    .png()
    .toBuffer();

  await sharp({
    create: { width: size, height: size, channels: 4, background: WHITE },
  })
    .composite([{ input: iconBuffer, top: padding, left: padding }])
    .png()
    .toFile(join(ICONS_DIR, fileName));
  console.log(`  ✓ ${fileName} (${size}x${size}, maskable)`);
}

// APPLE TOUCH ICONS (sem fundo escuro porque iOS adiciona o seu próprio)
async function generateAppleIcon(size, fileName) {
  const padding = Math.round(size * 0.08);
  const innerSize = size - padding * 2;
  const iconBuffer = await sharp(iconSvg, { density: 1024 })
    .resize({ width: innerSize, height: innerSize, fit: 'contain', background: WHITE })
    .png()
    .toBuffer();

  await sharp({
    create: { width: size, height: size, channels: 4, background: WHITE },
  })
    .composite([{ input: iconBuffer, top: padding, left: padding }])
    .png()
    .toFile(join(ICONS_DIR, fileName));
  console.log(`  ✓ ${fileName} (${size}x${size}, apple)`);
}

// SPLASH SCREENS APPLE — logo vertical centralizado, fundo branco
async function generateSplash(width, height, fileName) {
  const isLandscape = width > height;
  const shortest = Math.min(width, height);
  // logo-vertical aspecto 472:332.52 → ocupa ~50% da menor dimensão
  const logoWidth = Math.round(shortest * 0.55);
  const logoHeight = Math.round(logoWidth * (332.52 / 472));

  const logoBuffer = await sharp(verticalSvg, { density: 1024 })
    .resize({ width: logoWidth, height: logoHeight, fit: 'contain', background: WHITE })
    .png()
    .toBuffer();

  const top = Math.round((height - logoHeight) / 2);
  const left = Math.round((width - logoWidth) / 2);

  await sharp({
    create: { width, height, channels: 4, background: WHITE },
  })
    .composite([{ input: logoBuffer, top, left }])
    .png()
    .toFile(join(SPLASH_DIR, fileName));
  console.log(`  ✓ ${fileName} (${width}x${height}${isLandscape ? ', landscape' : ''})`);
}

// FAVICON 512px (PNG, será apontado do layout)
async function generateFavicon(size, fileName) {
  await generateRegularIcon(size, fileName);
}

console.log('Gerando ícones PWA...');
await generateRegularIcon(72, 'icon-72x72.png');
await generateRegularIcon(96, 'icon-96x96.png');
await generateRegularIcon(128, 'icon-128x128.png');
await generateRegularIcon(144, 'icon-144x144.png');
await generateRegularIcon(192, 'icon-192x192.png');
await generateRegularIcon(256, 'icon-256x256.png');
await generateRegularIcon(384, 'icon-384x384.png');
await generateRegularIcon(512, 'icon-512x512.png');
await generateRegularIcon(1024, 'icon-1024x1024.png');

console.log('\nGerando ícones maskable (Android adaptive)...');
await generateMaskableIcon(192, 'icon-maskable-192.png');
await generateMaskableIcon(512, 'icon-maskable-512.png');

console.log('\nGerando Apple touch icons...');
await generateAppleIcon(120, 'apple-icon-120x120.png');
await generateAppleIcon(152, 'apple-icon-152x152.png');
await generateAppleIcon(167, 'apple-icon-167x167.png');
await generateAppleIcon(180, 'apple-icon-180x180.png');

console.log('\nGerando splash screens iOS...');
// Portrait — iPhones e iPads em retrato
await generateSplash(750, 1334, 'apple-splash-750x1334.png');     // iPhone SE/8/7/6
await generateSplash(828, 1792, 'apple-splash-828x1792.png');     // iPhone XR/11
await generateSplash(1170, 2532, 'apple-splash-1170x2532.png');   // iPhone 12-15
await generateSplash(1284, 2778, 'apple-splash-1284x2778.png');   // iPhone Pro Max
await generateSplash(1668, 2388, 'apple-splash-1668x2388.png');   // iPad Pro 11"
await generateSplash(2048, 2732, 'apple-splash-2048x2732.png');   // iPad Pro 12.9"

console.log('\nGerando favicons...');
async function generateFaviconPng(size, fileName) {
  await sharp(iconSvg, { density: 1024 })
    .resize({ width: size, height: size, fit: 'contain', background: WHITE })
    .png()
    .toFile(join(ROOT, 'public', fileName));
  console.log(`  ✓ ${fileName} (${size}x${size})`);
}
await generateFaviconPng(16, 'favicon-16x16.png');
await generateFaviconPng(32, 'favicon-32x32.png');
await generateFaviconPng(48, 'favicon-48x48.png');

console.log('\nGerando logo horizontal (header/login)...');
const horizontalSvg = await readFile(join(SVG_DIR, 'logo-horizontal.svg'));
async function generateHorizontalLogo(width, fileName) {
  // logo horizontal aspecto 1080:332.52
  const height = Math.round(width * (332.52 / 1080));
  await sharp(horizontalSvg, { density: 1024 })
    .resize({ width, height, fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile(join(ROOT, 'public', fileName));
  console.log(`  ✓ ${fileName} (${width}x${height})`);
}
await generateHorizontalLogo(480, 'logo-aciav-saude.png');

console.log('\n✅ Todos os assets gerados com sucesso!');
