import { createClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = createClient(req);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Protéger les routes qui nécessitent une authentification
  const protectedRoutes = ["/dashboard", "/depenses", "/analyses", "/budget"];
  const isProtectedRoute = protectedRoutes.some((route) => 
    req.nextUrl.pathname.startsWith(route)
  );

  // Rediriger vers login si non authentifié et route protégée
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL("/auth/login", req.url);
    redirectUrl.searchParams.set("redirectTo", req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Rediriger vers dashboard si authentifié et sur page d'auth
  const authRoutes = ["/auth/login", "/auth/register"];
  const isAuthRoute = authRoutes.some((route) => 
    req.nextUrl.pathname.startsWith(route)
  );

  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes)
     */
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
};
