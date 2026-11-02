import { supabase } from "./supabase";

export const JOURS_CONSERVATION = 30;

const parPaquets = (liste, taille = 100) =>
  Array.from({ length: Math.ceil(liste.length / taille) }, (_, i) =>
    liste.slice(i * taille, (i + 1) * taille)
  );

// Efface les données personnelles, garde les chiffres anonymes pour les stats
export async function purgerAnciennes() {
  const limite = new Date(Date.now() - JOURS_CONSERVATION * 86400000);
  const limiteDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(limite);

  // 1. Date de réservation dépassée depuis plus de 30 jours
  const { data: datees, error: e1 } = await supabase
    .from("demandes")
    .select("id, audio_path")
    .eq("anonymise", false)
    .lt("date_reservation", limiteDate);
  if (e1) throw e1;

  // 2. Pas de date comprise : 30 jours après l'appel
  const { data: sansDate, error: e2 } = await supabase
    .from("demandes")
    .select("id, audio_path")
    .eq("anonymise", false)
    .is("date_reservation", null)
    .lt("created_at", limite.toISOString());
  if (e2) throw e2;

  const cibles = [...(datees ?? []), ...(sansDate ?? [])];
  if (!cibles.length) return 0;

  // Audios supprimés définitivement
  const chemins = cibles.map((d) => d.audio_path).filter(Boolean);
  for (const paquet of parPaquets(chemins)) {
    const { error } = await supabase.storage.from("enregistrements").remove(paquet);
    if (error) throw error;
  }

  // Données personnelles effacées, chiffres conservés
  for (const paquet of parPaquets(cibles.map((d) => d.id))) {
    const { error } = await supabase
      .from("demandes")
      .update({
        anonymise: true,
        nom: null,
        telephone_appelant: null,
        telephone_dicte: null,
        transcription: null,
        audio_path: null,
        date_expression: null,
        preferences: [],
        infos_manquantes: [],
        ambiguites: [],
        sms_texte: null,
        sms_erreur: null,
      })
      .in("id", paquet);
    if (error) throw error;
  }

  return cibles.length;
}