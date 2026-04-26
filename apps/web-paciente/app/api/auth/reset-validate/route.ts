import { NextRequest, NextResponse } from 'next/server';

const INTERNAL_API = process.env.API_URL ?? 'http://localhost:3000';

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token') ?? '';
    const res = await fetch(`${INTERNAL_API}/auth/reset-password/validate?token=${encodeURIComponent(token)}`);
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: 'Erro ao conectar com o servidor.' }, { status: 500 });
  }
}
