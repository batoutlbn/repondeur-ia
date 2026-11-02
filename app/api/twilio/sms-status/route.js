import { supabase } from "../../../lib/supabase";
import { signatureValide } from "../../../lib/twilioSignature";

const STATUTS = {
  sent: "envoye",
  delivered: "delivre",
  undelivered: "echec",
  failed: "echec",
};

export async function POST(request) {
  const data = Object.fromEntries(await request.formData());
    if (!signatureValide(request, data)) {
    console.warn("Requête refusée : signature Twilio invalide");
    return new Response("Signature invalide", { status: 403 });
  }
  const sms_statut = STATUTS[data.MessageStatus];

  if (sms_statut && data.MessageSid) {
    const maj = { sms_statut };
    if (sms_statut === "echec") {
      maj.sms_erreur = `SMS non délivré (code ${data.ErrorCode ?? "inconnu"})`;
    }
    await supabase
      .from("demandes")
      .update(maj)
      .eq("sms_sid", data.MessageSid)
      .neq("sms_statut", "delivre"); // ne jamais revenir en arrière après "délivré"
  }

  return new Response("ok");
}