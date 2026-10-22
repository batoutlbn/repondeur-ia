import { NextResponse } from "next/server";

export function proxy(request) {
  const auth = request.headers.get("authorization");

  if (auth?.startsWith("Basic ")) {
    const [user, pass] = atob(auth.slice(6)).split(":");
    if (user === process.env.APP_USER && pass === process.env.APP_PASSWORD) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Accès réservé", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Repondeur IA"' },
  });
}

// Tout est protégé, sauf la route appelée par Twilio
export const config = {
  matcher: ["/((?!api/twilio|_next/static|_next/image|favicon.ico).*)"],
};