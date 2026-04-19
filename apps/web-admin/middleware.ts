import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_ROUTES = ['/', '/login', '/esqueci-senha', '/redefinir-senha'];

const ROLE_HOME: Record<string, string> = {
  super_admin: '/dashboard',
  admin_unit: '/dashboard',
  rh: '/portal-rh',
  provider: '/portal-credenciado',
  patient: '/portal-paciente',
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

  // Autenticado tentando acessar /login ou / → redireciona para home do perfil
  if (token && role && (pathname === '/login' || pathname === '/')) {
    const home = ROLE_HOME[role] || '/dashboard';
    return NextResponse.redirect(new URL(home, req.url));
  }

  // Autenticado tentando acessar rota de outro perfil
  if (token && role) {
    const home = ROLE_HOME[role] || '/dashboard';

    // Paciente não pode acessar admin
    if (role === 'patient' && !pathname.startsWith('/portal-paciente')) {
      return NextResponse.redirect(new URL(home, req.url));
    }

    // RH não pode acessar admin ou credenciado ou paciente
    if (role === 'rh' && !pathname.startsWith('/portal-rh')) {
      return NextResponse.redirect(new URL(home, req.url));
    }

    // Credenciado não pode acessar admin ou rh ou paciente
    if (role === 'provider' && !pathname.startsWith('/portal-credenciado')) {
      return NextResponse.redirect(new URL(home, req.url));
    }
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$|.*\\.ico$|.*\\.webp$|.*\\.woff2?$).*)'],
};
