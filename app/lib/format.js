import { Umbrella, Cake, Baby, Star } from "lucide-react";

const PARIS = "Europe/Paris";

// Date → "2026-11-09" (jour à Paris)
export const cleJour = (date) => new Intl.DateTimeFormat("en-CA", { timeZone: PARIS }).format(date);

function majuscule(txt) {
  return txt.charAt(0).toUpperCase() + txt.slice(1);
}

// "2026-11-09" → "Lundi 9 novembre"
export function formatDateLongue(date) {
  if (!date) return null;
  return majuscule(
    new Date(`${date}T12:00:00Z`).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "UTC",
    })
  );
}

// "2026-11-09" → "Lun. 9 novembre"
export function formatDateCourte(date) {
  if (!date) return null;
  return majuscule(
    new Date(`${date}T12:00:00Z`).toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "long",
      timeZone: "UTC",
    })
  );
}

// "20:00" ou "20:00:00" → "20 h", "20:30" → "20 h 30"
export function formatHeure(heure) {
  if (!heure) return null;
  const [h, m] = heure.split(":");
  return m === "00" ? `${Number(h)} h` : `${Number(h)} h ${m}`;
}

// Horodatage → "14:32" (heure de Paris)
export function heureParis(ts) {
  return new Date(ts).toLocaleTimeString("fr-FR", { timeZone: PARIS, hour: "2-digit", minute: "2-digit" });
}

// Horodatage → "Aujourd’hui", "Hier" ou "lundi 9 novembre"
export function libelleJourRecu(ts) {
  const d = new Date(ts);
  const cle = cleJour(d);
  if (cle === cleJour(new Date())) return "Aujourd’hui";
  if (cle === cleJour(new Date(Date.now() - 86400000))) return "Hier";
  return d.toLocaleDateString("fr-FR", { timeZone: PARIS, weekday: "long", day: "numeric", month: "long" });
}

// +33612345678 ou 0612345678 → 06 12 34 56 78
export function formatTel(tel) {
  if (!tel) return null;
  let n = tel.replace(/\s/g, "");
  if (n.startsWith("+33")) n = "0" + n.slice(3);
  if (/^0\d{9}$/.test(n)) return n.replace(/(\d{2})(?=\d)/g, "$1 ");
  return tel;
}

export function iconePreference(p) {
  const t = p.toLowerCase();
  if (t.includes("terrasse")) return Umbrella;
  if (t.includes("anniversaire")) return Cake;
  if (t.includes("poussette") || t.includes("enfant") || t.includes("bébé")) return Baby;
  return Star;
}
