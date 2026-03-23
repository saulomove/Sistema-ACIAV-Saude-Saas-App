import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { token, role } = await req.json();

  const response = NextResponse.json({ ok: true });

  response.cookies.set('aciav_token', token, {
    httpOnly: true,
    secure: false, // mudar para true após configurar HTTPS
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
    path: '/',
  });

  response.cookies.set('aciav_role', role, {
    httpOnly: true,
    secure: false, // mudar para true após configurar HTTPS
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });

  return response;
}
