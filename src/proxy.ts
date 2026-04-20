import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth;

  if (pathname.startsWith("/api/analyze")) {
    if (!isAuthenticated) {
      return Response.json({ error: "Não autenticado" }, { status: 401 });
    }
  }
});

export const config = {
  matcher: ["/api/analyze/:path*"],
};
