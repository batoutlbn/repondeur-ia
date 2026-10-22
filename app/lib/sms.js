import { formatDateLongue, formatHeure } from "./format";

// À adapter : nom affiché en fin de SMS, et téléphone du restaurant (optionnel)
export const RESTAURANT = { nom: "Le Test", telephone: "" };

const MOTS_PLACEMENT = [
  "terrasse", "table", "fenêtre", "fenetre", "salle", "intérieur",
  "extérieur", "coin", "banquette", "calme", "entrée",
];

function nomClient(d) {
  return d.nom ? d.nom.replace(/^(monsieur|madame|mme|m\.)\s+/i, "") : null;
}

function signature() {
  let s = ` — Restaurant ${RESTAURANT.nom}`;
  if (RESTAURANT.telephone) s += ` · ${RESTAURANT.telephone}`;
  return s;
}

// Préférences de placement, seulement si le restaurateur les a confirmées
export function preferencesPlacement(d) {
  if (d.table_pref_statut !== "acceptee") return [];
  return d.preferences.filter((p) =>
    MOTS_PLACEMENT.some((m) => p.toLowerCase().includes(m))
  );
}

// Numéro mobile utilisable : d'abord celui dicté, sinon celui de l'appel
export function numeroSMS(d) {
  for (const t of [d.telephone_dicte, d.telephone_appelant]) {
    if (!t) continue;
    let n = t.replace(/[\s.-]/g, "");
    if (n.startsWith("+33")) n = "0" + n.slice(3);
    if (/^0[67]\d{8}$/.test(n)) return "+33" + n.slice(1);
  }
  return null;
}

export function texteSMS(d) {
  const nom = nomClient(d);
  const date = formatDateLongue(d.date_reservation)?.toLowerCase();
  const heure = formatHeure(d.heure);
  const n = d.nb_personnes;
  const placement = preferencesPlacement(d);

  let t = `Bonjour${nom ? " " + nom : ""}, votre réservation pour ${n} personne${n > 1 ? "s" : ""} le ${date} à ${heure} est confirmée`;
  if (placement.length) t += ` (${placement.join(", ").toLowerCase()})`;
  return t + `. Au plaisir de vous accueillir !` + signature();
}

export function texteRefus(d) {
  const nom = nomClient(d);
  const date = formatDateLongue(d.date_reservation)?.toLowerCase();
  const heure = formatHeure(d.heure);
  const quand = date && heure ? ` pour le ${date} à ${heure}` : date ? ` pour le ${date}` : "";

  return (
    `Bonjour${nom ? " " + nom : ""}, nous sommes désolés, nous ne pouvons pas accueillir votre demande de réservation${quand}. ` +
    `N'hésitez pas à nous recontacter pour une autre date.` +
    signature()
  );
}