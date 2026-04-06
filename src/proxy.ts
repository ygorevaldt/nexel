import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Routes that require authentication
const PROTECTED_ROUTES = ['/dashboard', '/wallet', '/challenges'];

// Routes that require PRO role (advanced AI features)
const PRO_ROUTES = ['/api/analyze'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || 'default_secret_for_dev',
  });

  const isAuthenticated = !!token;
  const isPro = token?.role === 'PRO' || token?.role === 'ADMIN';

  // PRO-only API routes
  if (PRO_ROUTES.some((route) => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    if (!isPro) {
      return NextResponse.json(
        { error: 'Recurso exclusivo para assinantes PRO', upgrade: true },
        { status: 403 }
      );
    }
  }

  // Protected pages
  if (PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/wallet/:path*',
    '/challenges/:path*',
    '/api/analyze/:path*',
  ],
};
