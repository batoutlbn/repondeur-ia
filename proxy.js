import { NextResponse } from "next/server";
import { COOKIE_SESSION, OPTIONS_COOKIE, jetonValide } from "./app/lib/session";

export async function proxy(request) {
  const { pathname, search } = request.nextUrl;
  const jeton = request.cookies.get(COOKIE_SESSION)?.value;
  const connecte = await jetonValide(jeton);

  // Page de connexion : accessible sans session
  if (pathname === "/connexion") {
    if (connecte) return NextResponse.redirect(new URL("/", request.url));
    return NextResponse.next();
  }

  // Pas connecté : direction la page de connexion
  if (!connecte) {
    const url = new URL("/connexion", request.url);
    url.searchParams.set("suite", pathname + search);
    return NextResponse.redirect(url);
  }

  // Connecté : on prolonge la session à chaque visite
  const res = NextResponse.next();
  res.cookies.set(COOKIE_SESSION, jeton, OPTIONS_COOKIE);
  return res;
}

// Tout est protégé, sauf les routes appelées par Twilio
export const config = {
  matcher: ["/((?!api/twilio|_next/static|_next/image|favicon.ico|manifest.webmanifest).*)"],
};