import { NextRequest, NextResponse } from "next/server";

// Rotas que precisam de sessão ativa
const PROTECTED = ["/onboarding", "/profile", "/era", "/badges"];
// Rotas só para quem NÃO está logado
const AUTH_ONLY = ["/login", "/verify"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const sessionToken =
    req.cookies.get("better-auth.session_token")?.value ??
    req.cookies.get("__Secure-better-auth.session_token")?.value;

  const isLoggedIn = Boolean(sessionToken);

  if (!isLoggedIn && PROTECTED.some((p) => pathname.startsWith(p))) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (isLoggedIn && AUTH_ONLY.some((p) => pathname.startsWith(p))) {
    const url = req.nextUrl.clone();
    url.pathname = "/ranking";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|api).*)",
  ],
};
