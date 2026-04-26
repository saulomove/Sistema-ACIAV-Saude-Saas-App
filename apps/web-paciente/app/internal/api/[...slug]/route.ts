import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const INTERNAL_API = process.env.API_URL ?? 'http://localhost:3000';

async function handler(req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('aciav_token')?.value;

  if (!token) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  const { slug } = await params;
  const path = '/' + slug.join('/');
  const queryString = req.nextUrl.search;

  const contentType = req.headers.get('content-type') ?? '';
  const isMultipart = contentType.includes('multipart/form-data');

  let body: BodyInit | undefined;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  if (['GET', 'HEAD', 'DELETE'].includes(req.method)) {
    body = undefined;
  } else if (isMultipart) {
    body = await req.arrayBuffer();
    headers['Content-Type'] = contentType;
  } else {
    body = await req.text();
    headers['Content-Type'] = 'application/json';
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);

    const res = await fetch(`${INTERNAL_API}${path}${queryString}`, {
      method: req.method,
      headers,
      body,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: 'Erro interno do proxy' }, { status: 500 });
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
