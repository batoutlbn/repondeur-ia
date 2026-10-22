import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronLeft,
  CalendarDays,
  Clock,
  Users,
  Phone,
  ListFilter,
  FileText,
  Mic,
  TriangleAlert,
  Umbrella,
  Cake,
  Baby,
  Star,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { formatDateLongue, formatHeure, formatTel } from "../../lib/format";

export const dynamic = "force-dynamic";

const VERT = "#1f4a3a";

const BADGES = {
  a_traiter: { label: "Analyse en cours", classe: "bg-stone-100 text-stone-600" },
  a_confirmer: { label: "À confirmer", classe: "bg-[#fbefd2] text-[#5a4413]" },
  confirmee: { label: "Confirmée", classe: "bg-[#e3ebe5] text-[#1f4a3a]" },
  refusee: { label: "Refusée", classe: "bg-red-50 text-red-700" },
  erreur: { label: "Erreur", classe: "bg-red-50 text-red-700" },
};

function iconePreference(p) {
  const t = p.toLowerCase();
  if (t.includes("terrasse")) return Umbrella;
  if (t.includes("anniversaire")) return Cake;
  if (t.includes("poussette") || t.includes("enfant") || t.includes("bébé")) return Baby;
  return Star;
}

function Carte({ children }) {
  return <section className="bg-white rounded-2xl border border-stone-200 p-5">{children}</section>;
}

function Ligne({ icone: Icone, children, manquant }) {
  return (
    <p className={`flex items-center gap-3 text-lg ${manquant ? "text-orange-700" : "text-stone-800"}`}>
      <Icone size={20} className={manquant ? "text-orange-600" : "text-stone-500"} />
      {children}
    </p>
  );
}

export default async function FicheDemande({ params }) {
  const { id } = await params;

  const { data: d, error } = await supabase.from("demandes").select("*").eq("id", id).single();
  if (error || !d) notFound();

  // Lien temporaire (10 min) vers l'audio privé
  let audioUrl = null;
  if (d.audio_path) {
    const { data } = await supabase.storage
      .from("enregistrements")
      .createSignedUrl(d.audio_path, 600);
    audioUrl = data?.signedUrl ?? null;
  }

  const badge = BADGES[d.statut] ?? BADGES.a_confirmer;
  const telAppelant = formatTel(d.telephone_appelant);
  const telDicte = formatTel(d.telephone_dicte);
  const aVerifier = [...d.infos_manquantes.map((i) => `Manquant : ${i}`), ...d.ambiguites];

  return (
    <div className="min-h-screen pb-32">
      {/* Barre du haut */}
      <header className="sticky top-0 z-10 bg-[#faf9f6]/90 backdrop-blur">
        <div className="mx-auto max-w-xl px-4 h-14 flex items-center">
          <Link href="/" className="p-2 -ml-2 text-stone-700" aria-label="Retour">
            <ChevronLeft size={26} />
          </Link>
        <h1 className="flex-1 text-center font-medium text-stone-800 -ml-8 pointer-events-none">
            Demande de réservation
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 space-y-4">
        {/* Infos principales */}
        <Carte>
          <div className="flex items-start justify-between gap-3 mb-4">
            <h2 className="font-[family-name:var(--font-titre)] text-3xl font-bold text-[#163728]">
              {d.nom || "Nom non indiqué"}
            </h2>
            <span className={`shrink-0 text-sm rounded-full px-3 py-1 ${badge.classe}`}>
              {badge.label}
            </span>
          </div>
          <div className="space-y-3">
            <Ligne icone={CalendarDays} manquant={!d.date_reservation}>
              {formatDateLongue(d.date_reservation) || "Date non indiquée"}
              {d.date_expression && (
                <span className="text-sm text-stone-500">« {d.date_expression} »</span>
              )}
            </Ligne>
            <Ligne icone={Clock} manquant={!d.heure}>
              {formatHeure(d.heure) || "Heure non indiquée"}
            </Ligne>
            <Ligne icone={Users} manquant={d.nb_personnes == null}>
              {d.nb_personnes != null
                ? `${d.nb_personnes} personne${d.nb_personnes > 1 ? "s" : ""}`
                : "Nombre de personnes non indiqué"}
              {d.nb_enfants ? ` dont ${d.nb_enfants} enfant${d.nb_enfants > 1 ? "s" : ""}` : ""}
            </Ligne>
            <Ligne icone={Phone} manquant={!telAppelant && !telDicte}>
              <span>
                {telDicte || telAppelant || "Aucun numéro"}
                {telDicte && telAppelant && telDicte !== telAppelant && (
                  <span className="block text-sm text-stone-500">Appel reçu du {telAppelant}</span>
                )}
              </span>
            </Ligne>
          </div>
        </Carte>

        {/* Infos à vérifier */}
        {aVerifier.length > 0 && (
          <section className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
            <p className="flex items-center gap-2 font-semibold text-orange-800 mb-2">
              <TriangleAlert size={18} /> À vérifier
            </p>
            <ul className="space-y-1 text-orange-900">
              {aVerifier.map((t, i) => (
                <li key={i}>• {t}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Préférences */}
        {d.preferences.length > 0 && (
          <Carte>
            <p className="flex items-center gap-3 font-semibold mb-3">
              <ListFilter size={20} className="text-stone-500" /> Préférences
            </p>
            <div className="flex flex-wrap gap-2">
              {d.preferences.map((p) => {
                const Icone = iconePreference(p);
                return (
                  <span
                    key={p}
                    className="flex items-center gap-2 bg-[#f1f0ec] text-stone-800 rounded-full px-4 py-2"
                  >
                    <Icone size={16} /> {p}
                  </span>
                );
              })}
            </div>
          </Carte>
        )}

        {/* Message vocal */}
        <Carte>
          <p className="flex items-center gap-3 font-semibold mb-3">
            <Mic size={20} className="text-stone-500" /> Message vocal
            {d.duree_secondes != null && (
              <span className="font-normal text-stone-500">· {d.duree_secondes} s</span>
            )}
          </p>
          {audioUrl ? (
            <audio controls preload="none" src={audioUrl} className="w-full" />
          ) : (
            <p className="text-stone-500">Audio indisponible.</p>
          )}
        </Carte>

        {/* Transcription */}
        <Carte>
          <p className="flex items-center gap-3 font-semibold mb-3">
            <FileText size={20} className="text-stone-500" /> Transcription complète
          </p>
          <p className="text-stone-700 leading-relaxed">
            {d.transcription ? `« ${d.transcription} »` : "Transcription indisponible."}
          </p>
        </Carte>
      </main>

      {/* Boutons du bas */}
      {d.statut === "a_confirmer" && (
        <div className="fixed bottom-0 inset-x-0 bg-[#faf9f6] border-t border-stone-200">
          <div className="mx-auto max-w-xl px-4 py-3 grid grid-cols-[1fr_2fr] gap-3">
                        <Link
              href={`/demandes/${d.id}/modifier`}
              className="rounded-xl border border-stone-300 bg-white py-3.5 font-medium text-stone-800 text-center"
            >
              Modifier
            </Link>
            <button
              className="rounded-xl py-3.5 font-medium text-white"
              style={{ backgroundColor: VERT }}
            >
              Valider la réservation
            </button>
          </div>
        </div>
      )}
    </div>
  );
}