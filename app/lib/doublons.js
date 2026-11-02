// Statuts pris en compte pour détecter un doublon
export const STATUTS_DOUBLON = ["a_traiter", "a_confirmer", "confirmee"];

// +33612345678, 06 12 34 56 78, 0612345678 → 0612345678
export function normaliserTel(t) {
  if (!t) return null;
  let n = t.replace(/\D/g, "");
  if (n.startsWith("33") && n.length === 11) n = "0" + n.slice(2);
  return n.length >= 9 ? n : null;
}

// Une clé par numéro connu + date de réservation
export function clesDoublon(d) {
  if (!d.date_reservation) return [];
  const tels = [d.telephone_appelant, d.telephone_dicte].map(normaliserTel).filter(Boolean);
  return [...new Set(tels)].map((t) => `${t}|${d.date_reservation}`);
}