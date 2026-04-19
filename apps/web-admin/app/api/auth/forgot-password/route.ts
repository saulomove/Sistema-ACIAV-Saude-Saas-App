import { NextRequest, NextResponse } from 'next/server';

const INTERNAL_API = process.env.API_URL ?? 'http://localhost:3000';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const res = await fetch(`${INTERNAL_API}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: req.headers.get('origin') ?? '',
      },
      body,
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: 'Erro ao conectar com o servidor.' }, { status: 500 });
  }
}
