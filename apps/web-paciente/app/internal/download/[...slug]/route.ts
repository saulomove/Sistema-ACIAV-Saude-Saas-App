import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const INTERNAL_API = process.env.API_URL ?? 'http://localhost:3000';

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('aciav_token')?.value;

  if (!token) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  const { slug } = await params;
  const path = '/' + slug.join('/');
  const queryString = req.nextUrl.search;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);

    const res = await fetch(`${INTERNAL_API}${path}${queryString}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const body = await res.arrayBuffer();
    const headers = new Headers();
    const contentType = res.headers.get('content-type');
    const contentDisposition = res.headers.get('content-disposition');
    if (contentType) headers.set('Content-Type', contentType);
    if (contentDisposition) headers.set('Content-Disposition', contentDisposition);

    return new NextResponse(body, { status: res.status, headers });
  } catch {
    return NextResponse.json({ message: 'Erro ao baixar arquivo' }, { status: 500 });
  }
}
