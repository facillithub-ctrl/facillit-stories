import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Ignora arquivos estáticos e imagens
  if (request.nextUrl.pathname.startsWith('/_next') || 
      request.nextUrl.pathname.includes('.')) {
    return NextResponse.next();
  }

  // Se já estiver na página de login, permite
  if (request.nextUrl.pathname === '/master-login') {
    return NextResponse.next();
  }

  // Verifica cookie de "Sessão Mestre"
  const masterSession = request.cookies.get('facillit_master_session');

  if (masterSession?.value !== process.env.MASTER_PASSWORD) {
    return NextResponse.redirect(new URL('/master-login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};