/** @type {import('next').NextConfig} */
const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  // IMPORTANTE: NÃO cachear navegações server-rendered.
  // Páginas com query params dinâmicos (?type=, ?city=, etc) DEVEM ir
  // direto pro server. Cache do SW só cobre assets estáticos.
  cacheOnFrontEndNav: false,
  aggressiveFrontEndNavCaching: false,
  reloadOnOnline: false,
  workboxOptions: {
    disableDevLogs: true,
    clientsClaim: false,
    // Não cacheia navegações HTML — Next + server devem responder fresh
    navigationPreload: false,
    runtimeCaching: [
      // Imagens enviadas (logos, fotos de credenciados): cache longo
      {
        urlPattern: /\/uploads\/.*\.(png|jpg|jpeg|webp|gif|svg)(\?.*)?$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'aciav-uploads',
          expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 },
        },
      },
      // Ícones e splash do PWA
      {
        urlPattern: /\/(icons|splash)\/.*\.(png|webp|svg)$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'aciav-pwa-icons',
          expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 365 },
        },
      },
      // Outras imagens estáticas (logo da marca, favicons)
      {
        urlPattern: /\.(png|jpg|jpeg|webp|svg|ico)$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'aciav-images',
          expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
        },
      },
      // Fontes
      {
        urlPattern: /\.(woff|woff2|ttf)$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'aciav-fonts',
          expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
        },
      },
      // Bundles JS e CSS (compilados pelo Next com hash)
      {
        urlPattern: /\/_next\/static\/.*$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'aciav-next-static',
          expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
        },
      },
      // /internal/api/** SEMPRE direto na rede — nunca cachear chamadas autenticadas
      {
        urlPattern: ({ url }) => url.pathname.startsWith('/internal/'),
        handler: 'NetworkOnly',
      },
      // /portal/** (HTML server-rendered) também sempre rede
      {
        urlPattern: ({ url, request }) => request.mode === 'navigate' || url.pathname.startsWith('/portal/'),
        handler: 'NetworkOnly',
      },
    ],
  },
});

const nextConfig = {
  reactCompiler: true,
  productionBrowserSourceMaps: false,
  images: { unoptimized: true },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(self)' },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Service-Worker-Allowed', value: '/' },
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        ],
      },
    ];
  },
};

module.exports = withPWA(nextConfig);
