"use server";

import { redirect } from "next/navigation";
import { supabase } from "../lib/supabase";
import { numerosSMS } from "../lib/sms";
import { envoyerSMS } from "../lib/twilio";
import { nettoyerSMS, couperSMS } from "../lib/gsm";

const SMS_RENVOYABLES = ["echec", "non_envoye"];

function lireTexte(formData) {
  return couperSMS(nettoyerSMS(String(formData.get("sms_texte") ?? "").trim()));
}

// N'accepte que les numéros de la fiche, jamais un numéro inventé
function choisirNumero(d, numeroChoisi) {
  const autorises = numerosSMS(d).map((n) => n.numero);
  return autorises.includes(numeroChoisi) ? numeroChoisi : autorises[0] ?? null;
}

// Envoie le SMS et enregistre le résultat
async function envoyerEtEnregistrer(id, numero, texte) {
  try {
    const sid = await envoyerSMS(numero, texte);
    await supabase
      .from("demandes")
      .update({ sms_statut: "envoye", sms_sid: sid, sms_erreur: null, sms_texte: texte })
      .eq("id", id);
  } catch (e) {
    console.error("Erreur SMS :", e);
    await supabase
      .from("demandes")
      .update({ sms_statut: "echec", sms_erreur: String(e.message).slice(0, 300), sms_texte: texte })
      .eq("id", id);
  }
}

async function decider(formData, nouveauStatut, exigerComplet) {
  const id = String(formData.get("id"));
  const texte = lireTexte(formData);
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
    const numero = choisirNumero(d, numeroChoisi);

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
      await envoyerEtEnregistrer(id, numero, texte);
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

export async function renvoyerSMS(formData) {
  const id = String(formData.get("id"));
  const texte = lireTexte(formData);
  const numeroChoisi = String(formData.get("numero") ?? "");

  const { data: fiche } = await supabase.from("demandes").select("*").eq("id", id).maybeSingle();
  const numero = fiche ? choisirNumero(fiche, numeroChoisi) : null;

  if (texte && numero) {
    // Verrou : un seul renvoi possible, même en cas de double clic
    const { data: d } = await supabase
      .from("demandes")
      .update({ sms_statut: "en_attente" })
      .eq("id", id)
      .in("statut", ["confirmee", "refusee"])
      .in("sms_statut", SMS_RENVOYABLES)
      .select("id")
      .maybeSingle();

    if (d) await envoyerEtEnregistrer(id, numero, texte);
  }

  redirect(`/demandes/${id}`);
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