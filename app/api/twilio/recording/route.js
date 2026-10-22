import { after } from "next/server";
import { supabase } from "../../../lib/supabase";

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

export async function POST(request) {
  const form = await request.formData();
  const data = Object.fromEntries(form);
  const callSid = data.CallSid;

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

  // 2. Après avoir répondu à Twilio : récupérer et stocker l'audio
  if (data.RecordingUrl) {
    after(async () => {
      try {
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
      } catch (e) {
        console.error("Erreur audio :", e);
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