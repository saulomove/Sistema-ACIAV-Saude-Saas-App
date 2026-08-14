export const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL ?? 'https://aciavsaude.com.br';
export const PACIENTE_URL = process.env.NEXT_PUBLIC_PACIENTE_URL ?? 'https://app.aciavsaude.com.br';
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'contato@aciavsaude.com.br';
export const CONTACT_HREF = `mailto:${CONTACT_EMAIL}`;
export const GOOGLE_PLAY_URL =
  process.env.NEXT_PUBLIC_GOOGLE_PLAY_URL ??
  'https://play.google.com/store/apps/details?id=br.com.aciavsaude.paciente';
