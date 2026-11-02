import { supabase } from "./supabase";

export const JOURS_CONSERVATION = 30;

const parPaquets = (liste, taille = 100) =>
  Array.from({ length: Math.ceil(liste.length / taille) }, (_, i) =>
    liste.slice(i * taille, (i + 1) * taille)
  );

export async function purgerAnciennes() {
  const limite = new Date(Date.now() - JOURS_CONSERVATION * 86400000);
  const limiteDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(limite);

  // 1. Date de réservation dépassée depuis plus de 30 jours
  const { data: datees, error: e1 } = await supabase
    .from("demandes")
    .select("id, audio_path")
    .lt("date_reservation", limiteDate);
  if (e1) throw e1;

  // 2. Pas de date comprise : 30 jours après l'appel
  const { data: sansDate, error: e2 } = await supabase
    .from("demandes")
    .select("id, audio_path")
    .is("date_reservation", null)
    .lt("created_at", limite.toISOString());
  if (e2) throw e2;

  const aSupprimer = [...(datees ?? []), ...(sansDate ?? [])];
  if (!aSupprimer.length) return 0;

  // Audios d'abord, puis les fiches
  const chemins = aSupprimer.map((d) => d.audio_path).filter(Boolean);
  for (const paquet of parPaquets(chemins)) {
    const { error } = await supabase.storage.from("enregistrements").remove(paquet);
    if (error) throw error;
  }
  for (const paquet of parPaquets(aSupprimer.map((d) => d.id))) {
    const { error } = await supabase.from("demandes").delete().in("id", paquet);
    if (error) throw error;
  }

  return aSupprimer.length;
}