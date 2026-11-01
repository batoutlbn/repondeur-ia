export const COOKIE_SESSION = "session";

// 400 jours : le maximum accepté par les navigateurs
export const OPTIONS_COOKIE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60 * 24 * 400,
};

async function signer(texte) {
  const cle = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(process.env.SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cle, new TextEncoder().encode(texte));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function creerJeton() {
  const id = crypto.randomUUID();
  return `${id}.${await signer(id)}`;
}

export async function jetonValide(jeton) {
  if (!jeton || !process.env.SESSION_SECRET) return false;
  const i = jeton.lastIndexOf(".");
  if (i < 1) return false;
  const id = jeton.slice(0, i);
  const sig = jeton.slice(i + 1);
  return (await signer(id)) === sig;
}