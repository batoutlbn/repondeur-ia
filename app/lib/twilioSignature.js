import crypto from "node:crypto";

// Vérifie l'en-tête X-Twilio-Signature d'une requête POST de Twilio
export function signatureValide(request, params) {
  const signature = request.headers.get("x-twilio-signature");
  const token = process.env.TWILIO_AUTH_TOKEN;
  const base = process.env.APP_URL;
  if (!signature || !token || !base) return false;

  // Adresse publique exacte appelée par Twilio
  const u = new URL(request.url);
  const url = `${base}${u.pathname}${u.search}`;

  // URL + paramètres triés par nom (nom + valeur, sans séparateur)
  const donnees = Object.keys(params)
    .sort()
    .reduce((acc, k) => acc + k + params[k], url);

  const attendue = crypto.createHmac("sha1", token).update(donnees, "utf8").digest("base64");

  const a = Buffer.from(attendue);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}