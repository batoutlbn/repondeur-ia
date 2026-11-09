import { supabase } from "../../../lib/supabase";

// Adresse fixe pour l'audio d'une demande : crée le lien temporaire seulement
// quand on appuie sur lecture. Protégé par la session (voir proxy.js).
export async function GET(request, { params }) {
  const { id } = await params;

  const { data: d } = await supabase
    .from("demandes")
    .select("audio_path, anonymise")
    .eq("id", id)
    .maybeSingle();
  if (!d?.audio_path || d.anonymise) return new Response("Audio indisponible", { status: 404 });

  const { data } = await supabase.storage.from("enregistrements").createSignedUrl(d.audio_path, 600);
  if (!data?.signedUrl) return new Response("Audio indisponible", { status: 404 });

  return Response.redirect(data.signedUrl, 302);
}
