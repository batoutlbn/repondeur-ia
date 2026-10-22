import { after } from "next/server";
import { supabase } from "../../../lib/supabase";
import { extraireInfos } from "../../../lib/extraction";

// Laisse jusqu'à 60 s au téléchargement + transcription + extraction
export const maxDuration = 60;

async function telechargerAudio(recordingUrl) {
  const auth = Buffer.from(
    `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
  ).toString("base64");

  // L'audio peut mettre quelques secondes à être disponible chez Twilio
  for (let essai = 1; essai <= 5; essai++) {
    const res = await fetch(`${recordingUrl}.mp3`, {
      headers: { Authorization: `Basic ${auth}` },
    });
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    console.log(`Audio pas encore prêt (essai ${essai})`);
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error("Audio indisponible après 5 essais");
}

async function transcrire(audio) {
  const form = new FormData();
  form.append("file", new Blob([audio], { type: "audio/mpeg" }), "message.mp3");
  form.append("model", "gpt-4o-mini-transcribe");
  form.append("language", "fr");
  form.append(
    "prompt",
    "Message laissé sur le répondeur d'un restaurant pour une demande de réservation."
  );

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: form,
  });
  if (!res.ok) {
    throw new Error(`Transcription échouée : ${res.status} ${await res.text()}`);
  }
  const json = await res.json();
  return json.text;
}

export async function POST(request) {
  const form = await request.formData();
  const data = Object.fromEntries(form);
  const callSid = data.CallSid;
  const dateAppel = new Date();

  console.log("Appel reçu :", {
    callSid,
    from: data.From,
    recordingUrl: data.RecordingUrl,
    duree: data.RecordingDuration,
  });

  // 1. Créer la demande (une seule fois par appel grâce à call_sid)
  const { error } = await supabase.from("demandes").upsert(
    {
      call_sid: callSid,
      telephone_appelant: data.From || null,
      duree_secondes: Number(data.RecordingDuration) || null,
    },
    { onConflict: "call_sid" }
  );
  if (error) console.error("Erreur base :", error);

  // 2. Après avoir répondu à Twilio : audio, transcription, extraction
  if (data.RecordingUrl) {
    after(async () => {
      try {
        // Audio
        const audio = await telechargerAudio(data.RecordingUrl);
        const chemin = `${callSid}.mp3`;

        const { error: errUpload } = await supabase.storage
          .from("enregistrements")
          .upload(chemin, audio, { contentType: "audio/mpeg", upsert: true });
        if (errUpload) throw errUpload;

        await supabase
          .from("demandes")
          .update({ audio_path: chemin })
          .eq("call_sid", callSid);
        console.log("Audio sauvegardé :", chemin);

        // Transcription
        const texte = await transcrire(audio);
        await supabase
          .from("demandes")
          .update({ transcription: texte })
          .eq("call_sid", callSid);
        console.log("Transcription :", texte);

        // Extraction
        const infos = await extraireInfos(texte, dateAppel);
        const { error: errInfos } = await supabase
          .from("demandes")
          .update({
            nom: infos.nom,
            date_expression: infos.date_expression,
            date_reservation: infos.date_reservation,
            heure: infos.heure,
            nb_personnes: infos.nb_personnes,
            nb_enfants: infos.nb_enfants,
            telephone_dicte: infos.telephone_dicte,
            preferences: infos.preferences,
            infos_manquantes: infos.infos_manquantes,
            ambiguites: infos.ambiguites,
            statut: "a_confirmer",
          })
          .eq("call_sid", callSid);
        if (errInfos) throw errInfos;
        console.log("Infos extraites :", infos);
      } catch (e) {
        console.error("Erreur traitement :", e);
        await supabase
          .from("demandes")
          .update({ statut: "erreur" })
          .eq("call_sid", callSid);
      }
    });
  }

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="fr-FR" voice="Polly.Lea">Merci, votre message a bien été enregistré. À bientôt.</Say>
  <Hangup/>
</Response>`;

  return new Response(twiml, { headers: { "Content-Type": "text/xml" } });
}