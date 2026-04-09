import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const PROTECTED_ROUTES = ['/dashboard'];
const PRO_ROUTES = ['/api/analyze'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // NextAuth v5 changed the cookie name from "next-auth.session-token" to "authjs.session-token"
  const secure = request.nextUrl.protocol === 'https:';
  const cookieName = secure
    ? '__Secure-authjs.session-token'
    : 'authjs.session-token';

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName,
  });

  const isAuthenticated = !!token;

  if (PRO_ROUTES.some((route) => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    const role = token?.role as string;
    const isPro = ['PRO', 'SCOUT', 'ADMIN'].includes(role);
    if (!isPro) {
      return NextResponse.json(
        { error: 'Recurso exclusivo para assinantes PRO', upgrade: true },
        { status: 403 }
      );
    }
  }

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
  matcher: ['/dashboard/:path*', '/api/analyze/:path*'],
};
