"use server";

import { redirect } from "next/navigation";
import { supabase } from "../lib/supabase";
import { numerosSMS } from "../lib/sms";
import { envoyerSMS } from "../lib/twilio";
import { nettoyerSMS, couperSMS } from "../lib/gsm";

async function decider(formData, nouveauStatut, exigerComplet) {
  const id = String(formData.get("id"));
    const texte = couperSMS(nettoyerSMS(String(formData.get("sms_texte") ?? "").trim()));
  const numeroChoisi = String(formData.get("numero") ?? "");

  // Ne change le statut que si la demande est encore "à confirmer".
  // Un double clic ou un second onglet ne peuvent donc rien faire deux fois.
  let requete = supabase
    .from("demandes")
    .update({ statut: nouveauStatut, confirmed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("statut", "a_confirmer");

  if (exigerComplet) {
    requete = requete
      .not("date_reservation", "is", null)
      .not("heure", "is", null)
      .not("nb_personnes", "is", null);
  }

  const { data: d, error } = await requete.select().maybeSingle();
  if (error) throw new Error(error.message);

  // d n'existe que pour la toute première décision : le SMS ne peut partir qu'une fois
  if (d) {
    // On n'accepte que les numéros de la fiche, jamais un numéro inventé
    const autorises = numerosSMS(d).map((n) => n.numero);
    const numero = autorises.includes(numeroChoisi) ? numeroChoisi : autorises[0] ?? null;

    if (!texte) {
      await supabase.from("demandes").update({ sms_statut: "non_envoye" }).eq("id", id);
    } else if (!numero) {
      await supabase
        .from("demandes")
        .update({ sms_statut: "pas_de_numero", sms_texte: texte })
        .eq("id", id);
    } else {
      await supabase
        .from("demandes")
        .update({ sms_statut: "en_attente", sms_texte: texte })
        .eq("id", id);

      try {
        const sid = await envoyerSMS(numero, texte);
        await supabase
          .from("demandes")
          .update({ sms_statut: "envoye", sms_sid: sid, sms_erreur: null })
          .eq("id", id);
      } catch (e) {
        console.error("Erreur SMS :", e);
        await supabase
          .from("demandes")
          .update({ sms_statut: "echec", sms_erreur: String(e.message).slice(0, 300) })
          .eq("id", id);
      }
    }
  }

  redirect(`/demandes/${id}`);
}

export async function confirmerReservation(formData) {
  return decider(formData, "confirmee", true);
}

export async function refuserReservation(formData) {
  return decider(formData, "refusee", false);
}

export async function supprimerDemande(formData) {
  const id = String(formData.get("id"));

  // Double sécurité : la case doit avoir été cochée
  if (formData.get("confirmation") !== "oui") return;

  const { data: d } = await supabase
    .from("demandes")
    .select("audio_path")
    .eq("id", id)
    .maybeSingle();

  // L'audio d'abord, puis la fiche
  if (d?.audio_path) {
    await supabase.storage.from("enregistrements").remove([d.audio_path]);
  }

  const { error } = await supabase.from("demandes").delete().eq("id", id);
  if (error) throw new Error(error.message);

  redirect("/");
}

export async function supprimerTout(formData) {
  // Double sécurité : la case doit avoir été cochée
  if (formData.get("confirmation") !== "oui") return;

  // 1. Audios : on vide le stockage par paquets de 100
  for (let tour = 0; tour < 50; tour++) {
    const { data: fichiers, error } = await supabase.storage
      .from("enregistrements")
      .list("", { limit: 100 });
    if (error) throw new Error(error.message);
    if (!fichiers?.length) break;

    const { error: errSuppr } = await supabase.storage
      .from("enregistrements")
      .remove(fichiers.map((f) => f.name));
    if (errSuppr) throw new Error(errSuppr.message);
  }

  // 2. Toutes les fiches
  const { error } = await supabase.from("demandes").delete().not("id", "is", null);
  if (error) throw new Error(error.message);

  redirect("/");
}