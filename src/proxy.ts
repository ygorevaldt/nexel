import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth;

  // /dashboard is protected by its server-side layout (same as /ranking)
  // Middleware only handles API routes that need fast edge protection
  if (pathname.startsWith("/api/analyze")) {
    if (!isAuthenticated) {
      return Response.json({ error: "Não autenticado" }, { status: 401 });
    }
    const role = req.auth?.user?.role as string;
    if (!["PRO", "SCOUT", "ADMIN"].includes(role)) {
      return Response.json(
        { error: "Recurso exclusivo para assinantes PRO", upgrade: true },
        { status: 403 }
      );
    }
  }
});

export const config = {
  matcher: ["/api/analyze/:path*"],
};
