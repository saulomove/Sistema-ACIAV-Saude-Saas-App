// URLs publicas usadas pela landing.
// No web-admin a landing roda no MESMO dominio do login,
// entao usamos paths relativos para CTAs internos.
export const ADMIN_URL = '';
export const PACIENTE_URL = process.env.NEXT_PUBLIC_PACIENTE_URL ?? 'https://app.aciavsaude.com.br';
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'contato@aciavsaude.com.br';
export const CONTACT_HREF = `mailto:${CONTACT_EMAIL}`;
export const LOGIN_HREF = '/login';
export const GOOGLE_PLAY_URL =
  process.env.NEXT_PUBLIC_GOOGLE_PLAY_URL ??
  'https://play.google.com/store/apps/details?id=br.com.aciavsaude.paciente';
export const APP_STORE_URL =
  process.env.NEXT_PUBLIC_APP_STORE_URL ??
  'https://apps.apple.com/br/app/id6803305900';
