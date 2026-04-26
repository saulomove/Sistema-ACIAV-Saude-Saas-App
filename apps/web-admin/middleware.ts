import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_ROUTES = ['/', '/login', '/esqueci-senha', '/redefinir-senha'];

const PACIENTE_URL = process.env.NEXT_PUBLIC_PACIENTE_URL ?? 'https://app.aciavsaude.com.br';

const ROLE_HOME: Record<string, string> = {
  super_admin: '/dashboard',
  admin_unit: '/dashboard',
  rh: '/portal-rh',
  provider: '/portal-credenciado',
};

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Ignorar rotas internas do Next.js e assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/internal/')
  ) {
    return NextResponse.next();
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-pathname', pathname);

  const token = req.cookies.get('aciav_token')?.value;
  const role = req.cookies.get('aciav_role')?.value;

  const isPublic = PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'));

  // Não autenticado tentando acessar rota protegida
  if (!token && !isPublic) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Paciente: redirecionar para o app dedicado em qualquer rota
  if (role === 'patient') {
    return NextResponse.redirect(`${PACIENTE_URL}/login`);
  }

  // Autenticado tentando acessar /login ou / → redireciona para home do perfil
  if (token && role && (pathname === '/login' || pathname === '/')) {
    const home = ROLE_HOME[role] || '/dashboard';
    return NextResponse.redirect(new URL(home, req.url));
  }

  // Autenticado tentando acessar rota de outro perfil
  if (token && role) {
    const home = ROLE_HOME[role] || '/dashboard';

    // RH não pode acessar admin ou credenciado
    if (role === 'rh' && !pathname.startsWith('/portal-rh')) {
      return NextResponse.redirect(new URL(home, req.url));
    }

    // Credenciado não pode acessar admin ou rh
    if (role === 'provider' && !pathname.startsWith('/portal-credenciado')) {
      return NextResponse.redirect(new URL(home, req.url));
    }
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$|.*\\.ico$|.*\\.webp$|.*\\.woff2?$).*)'],
};
