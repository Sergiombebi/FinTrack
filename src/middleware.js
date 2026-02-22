import { createClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function middleware(req) {
  // TEMPORAIREMENT DÉSACTIVÉ POUR DÉBOGAGE
  console.log(`Middleware: DÉSACTIVÉ - Accès autorisé pour ${req.nextUrl.pathname}`);
  return NextResponse.next();
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
