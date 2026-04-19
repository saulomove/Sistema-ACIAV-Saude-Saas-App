import { NextRequest, NextResponse } from 'next/server';

const INTERNAL_API = process.env.API_URL ?? 'http://localhost:3000';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') ?? '';
  try {
    const res = await fetch(
      `${INTERNAL_API}/auth/reset-password/validate?token=${encodeURIComponent(token)}`,
    );
    const data = await res.json().catch(() => ({ valid: false }));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}
