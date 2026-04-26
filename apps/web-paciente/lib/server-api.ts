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
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}
