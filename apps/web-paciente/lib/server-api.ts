import { cache } from 'react';
import { cookies } from 'next/headers';

const INTERNAL_API = process.env.API_URL ?? 'http://localhost:3000';

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<{
  sub: string;
  email: string;
  role: string;
  unitId: string | null;
  companyId: string | null;
  providerId: string | null;
  userId: string | null;
} | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('aciav_token')?.value;
  if (!token) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return decodeJwtPayload(token) as any;
}

export async function serverFetch<T>(path: string): Promise<T | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('aciav_token')?.value;
  if (!token) return null;

  try {
    const res = await fetch(`${INTERNAL_API}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) {
      // Não colapsar erro em null silenciosamente: um 429 (rate limit) ou 5xx
      // vira "sem dados" e pode disparar redirect/tela branca. Logar p/ o PM2.
      console.error(`[serverFetch] ${path} → HTTP ${res.status}`);
      return null;
    }
    return res.json() as Promise<T>;
  } catch (err) {
    console.error(`[serverFetch] ${path} → falha de rede`, err);
    return null;
  }
}

// Memoização por request (React cache): deduplica GETs repetidos no mesmo render.
// Ex: /users/me/card é buscado no layout (auth) E na página do portal — com isto
// vira 1 request HTTP só, aliviando o rate limit compartilhado da API.
const cachedFetch = cache((path: string): Promise<unknown> => serverFetch<unknown>(path));

export function serverFetchCached<T>(path: string): Promise<T | null> {
  return cachedFetch(path) as Promise<T | null>;
}
