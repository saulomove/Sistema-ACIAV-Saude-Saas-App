// URLs publicas usadas pela landing.
// No web-admin a landing roda no MESMO dominio do login,
// entao usamos paths relativos para CTAs internos.
export const ADMIN_URL = '';
export const PACIENTE_URL = process.env.NEXT_PUBLIC_PACIENTE_URL ?? 'https://app.aciavsaude.com.br';
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'contato@aciavsaude.com.br';
export const CONTACT_HREF = `mailto:${CONTACT_EMAIL}`;
export const LOGIN_HREF = '/login';
