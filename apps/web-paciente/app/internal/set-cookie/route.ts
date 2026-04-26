import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { token, role } = await req.json();

  const response = NextResponse.json({ ok: true });
  const isProd = process.env.NODE_ENV === 'production';

  response.cookies.set('aciav_token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });

  response.cookies.set('aciav_role', role, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });

  return response;
}
