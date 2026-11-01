import { formatDateLongue, formatHeure } from "./format";
import { nettoyerSMS, longueurSMS, couperSMS, LIMITE_SMS } from "./gsm";

// À adapter : nom affiché en fin de SMS, et téléphone du restaurant (optionnel)
export const RESTAURANT = { nom: "Le Bonnet Blanc", telephone: "0670165625" };

const MOTS_PLACEMENT = [
  "terrasse", "table", "fenêtre", "fenetre", "salle", "intérieur",
  "extérieur", "coin", "banquette", "calme", "entrée",
];

function nomClient(d) {
  return d.nom ? d.nom.replace(/^(monsieur|madame|mme|m\.)\s+/i, "") : null;
}

function versMobile(t) {
  if (!t) return null;
  let n = t.replace(/[\s.-]/g, "");
  if (n.startsWith("+33")) n = "0" + n.slice(3);
  return /^0[67]\d{8}$/.test(n) ? "+33" + n.slice(1) : null;
}

// Prend la première version qui tient dans un seul SMS
function plusLongQuiTient(versions) {
  for (const v of versions) {
    const t = nettoyerSMS(v);
    if (longueurSMS(t) <= LIMITE_SMS) return t;
  }
  return couperSMS(nettoyerSMS(versions[versions.length - 1]));
}

// Préférences de placement, seulement si le restaurateur les a confirmées
export function preferencesPlacement(d) {
  if (d.table_pref_statut !== "acceptee") return [];
  return d.preferences.filter((p) =>
    MOTS_PLACEMENT.some((m) => p.toLowerCase().includes(m))
  );
}

// Tous les mobiles utilisables, numéro de l'appel en premier
export function numerosSMS(d) {
  const liste = [];
  const appel = versMobile(d.telephone_appelant);
  const dicte = versMobile(d.telephone_dicte);
  if (appel) liste.push({ numero: appel, source: "numéro de l'appel" });
  if (dicte && dicte !== appel) liste.push({ numero: dicte, source: "numéro dicté" });
  return liste;
}

export function texteSMS(d) {
  const nom = nomClient(d);
  const bonjour = `Bonjour${nom ? " " + nom : ""},`;
  const date = formatDateLongue(d.date_reservation)?.toLowerCase();
  const heure = formatHeure(d.heure);
  const n = d.nb_personnes;
  const placement = preferencesPlacement(d);
  const place = placement.length ? ` (${placement.join(", ").toLowerCase()})` : "";
  const resto = RESTAURANT.nom;
  const tel = RESTAURANT.telephone ? ` ${RESTAURANT.telephone}` : "";

  return plusLongQuiTient([
    `${bonjour} votre réservation pour ${n} pers. le ${date} à ${heure}${place} est confirmée. Au plaisir ! - ${resto}${tel}`,
    `${bonjour} réservation confirmée : ${n} pers. le ${date} à ${heure}${place}. - ${resto}${tel}`,
    `${bonjour} réservation confirmée : ${n} pers. le ${date} à ${heure}${place}. - ${resto}`,
    `Réservation confirmée : ${n} pers. le ${date} à ${heure}. - ${resto}`,
  ]);
}

export function texteRefus(d) {
  const nom = nomClient(d);
  const bonjour = `Bonjour${nom ? " " + nom : ""},`;
  const date = formatDateLongue(d.date_reservation)?.toLowerCase();
  const heure = formatHeure(d.heure);
  const quand = date && heure ? ` le ${date} à ${heure}` : date ? ` le ${date}` : "";
  const resto = RESTAURANT.nom;
  const tel = RESTAURANT.telephone ? ` ${RESTAURANT.telephone}` : "";

  return plusLongQuiTient([
    `${bonjour} désolés, nous ne pouvons pas vous accueillir${quand}. Rappelez-nous pour une autre date. - ${resto}${tel}`,
    `${bonjour} désolés, nous ne pouvons pas vous accueillir${quand}. - ${resto}${tel}`,
    `${bonjour} désolés, nous ne pouvons pas vous accueillir${quand}. - ${resto}`,
    `Désolés, nous ne pouvons pas vous accueillir${quand}. - ${resto}`,
  ]);
}