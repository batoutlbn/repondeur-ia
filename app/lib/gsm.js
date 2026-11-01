// Alphabet SMS standard (GSM-7) : 160 caractères par SMS
const BASE =
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡" +
  "ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";
// Caractères autorisés mais qui comptent double
const EXT = "^{}\\[~]|€";

const REMPLACEMENTS = {
  "—": "-", "–": "-", "·": "-",
  "’": "'", "‘": "'",
  "“": '"', "”": '"', "«": '"', "»": '"',
  "…": "...",
  "\u00A0": " ", "\u202F": " ",
  "â": "a", "ê": "e", "î": "i", "ô": "o", "û": "u",
  "ë": "e", "ï": "i", "ç": "c", "œ": "oe", "Œ": "OE",
  "À": "A", "Â": "A", "È": "E", "Ê": "E", "Ë": "E",
  "Î": "I", "Ï": "I", "Ô": "O", "Ù": "U", "Û": "U",
};

export const LIMITE_SMS = 160;

// Remplace les caractères spéciaux et retire ceux qui ne passent pas
export function nettoyerSMS(texte) {
  let t = "";
  for (const c of texte) {
    const r = REMPLACEMENTS[c] ?? c;
    for (const c2 of r) {
      if (BASE.includes(c2) || EXT.includes(c2)) t += c2;
    }
  }
  return t;
}

export function longueurSMS(texte) {
  let n = 0;
  for (const c of texte) n += EXT.includes(c) ? 2 : 1;
  return n;
}

// Coupe le texte pour qu'il tienne dans un seul SMS
export function couperSMS(texte) {
  let t = "";
  let n = 0;
  for (const c of texte) {
    const l = EXT.includes(c) ? 2 : 1;
    if (n + l > LIMITE_SMS) break;
    t += c;
    n += l;
  }
  return t;
}