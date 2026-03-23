import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete('aciav_token');
  response.cookies.delete('aciav_role');
  return response;
}
