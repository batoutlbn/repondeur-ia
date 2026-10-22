export function formatDateLongue(date) {
  if (!date) return null;
  const txt = new Date(`${date}T12:00:00Z`).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
  return txt.charAt(0).toUpperCase() + txt.slice(1);
}

export function formatHeure(heure) {
  if (!heure) return null;
  const [h, m] = heure.split(":");
  return m === "00" ? `${Number(h)} h` : `${Number(h)} h ${m}`;
}

// +33612345678 ou 0612345678 → 06 12 34 56 78
export function formatTel(tel) {
  if (!tel) return null;
  let n = tel.replace(/\s/g, "");
  if (n.startsWith("+33")) n = "0" + n.slice(3);
  if (/^0\d{9}$/.test(n)) return n.replace(/(\d{2})(?=\d)/g, "$1 ");
  return tel;
}