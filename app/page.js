import Link from "next/link";
import {
  Phone,
  ChevronRight,
  CalendarDays,
  Users,
  Settings,
  TriangleAlert,
  Copy,
} from "lucide-react";
import { supabase } from "./lib/supabase";
import BarreBas from "./components/BarreBas";
import { clesDoublon, STATUTS_DOUBLON } from "./lib/doublons";
import RafraichirAuto from "./components/RafraichirAuto";
import Onglets from "./components/Onglets";
import { formatDateCourte, formatHeure, heureParis, libelleJourRecu, iconePreference } from "./lib/format";

export const dynamic = "force-dynamic";

const VERT = "#1f4a3a";

// Seules les colonnes affichées (pas la transcription, inutile ici)
const COLONNES_LISTE =
  "id, nom, statut, created_at, date_reservation, heure, nb_personnes, nb_enfants, preferences, infos_manquantes, ambiguites, telephone_appelant, telephone_dicte";
const MAX_LISTE = 100;

const ONGLETS = {
  a_confirmer: { label: "À confirmer", statuts: ["a_traiter", "a_confirmer", "erreur"] },
  confirmee: { label: "Confirmées", statuts: ["confirmee"] },
  refusee: { label: "Refusées", statuts: ["refusee"] },
};

// ---------- Liste ----------

function CarteDemande({ d, enAvant, doublon }) {
  const analysee = d.statut !== "a_traiter" && d.statut !== "erreur";
  const alerte = d.infos_manquantes?.length > 0 || d.ambiguites?.length > 0;

  return (
    <li>
      <Link
        href={`/demandes/${d.id}`}
        className={`flex gap-3 rounded-2xl p-4 transition ${
          enAvant
            ? "bg-[#eef3ef] border-2"
            : "bg-white border border-stone-200 hover:border-stone-300"
        }`}
        style={enAvant ? { borderColor: VERT } : undefined}
      >
        {/* Icône téléphone */}
        <div className="w-11 h-11 rounded-full bg-[#e3ebe5] flex items-center justify-center shrink-0">
          <Phone size={18} style={{ color: VERT }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center gap-2">
            <p className="font-semibold text-lg truncate">
              {d.nom || "Nom non indiqué"}
            </p>
            <span className="flex items-center text-sm text-stone-500 shrink-0">
              {heureParis(d.created_at)}
              <ChevronRight size={16} className="ml-1" />
            </span>
          </div>

          {d.statut === "a_traiter" && (
            <p className="text-sm text-stone-500 mt-1">Analyse en cours…</p>
          )}
          {d.statut === "erreur" && (
            <p className="text-sm text-red-600 mt-1">Erreur de traitement</p>
          )}

          {analysee && (
            <div className="mt-1 space-y-1 text-stone-700">
              <p className="flex items-center gap-2">
                <CalendarDays size={16} className="text-stone-500" />
                {formatDateCourte(d.date_reservation) || "Date ?"} ·{" "}
                {formatHeure(d.heure) || "Heure ?"}
              </p>
              <p className="flex items-center gap-2">
                <Users size={16} className="text-stone-500" />
                {d.nb_personnes ?? "?"} personne{d.nb_personnes > 1 ? "s" : ""}
                {d.nb_enfants
                  ? ` dont ${d.nb_enfants} enfant${d.nb_enfants > 1 ? "s" : ""}`
                  : ""}
              </p>
            </div>
          )}

          {d.preferences?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {d.preferences.slice(0, 2).map((p) => {
                const Icone = iconePreference(p);
                return (
                  <span
                    key={p}
                    className="flex items-center gap-1.5 text-sm bg-[#fbefd2] text-[#5a4413] rounded-full px-3 py-1"
                  >
                    <Icone size={14} />
                    {p}
                  </span>
                );
              })}
              {d.preferences.length > 2 && (
                <span className="text-sm text-stone-500 py-1">
                  +{d.preferences.length - 2}
                </span>
              )}
            </div>
          )}

          {alerte && (
            <p className="flex items-center gap-1.5 text-sm text-orange-700 mt-3">
              <TriangleAlert size={14} />
              Infos à vérifier
            </p>
          )}
          {doublon && (
            <p className="flex items-center gap-1.5 text-sm text-amber-800 mt-2">
              <Copy size={14} />
              Doublon possible
            </p>
          )}
        </div>
      </Link>
    </li>
  );
}

function Liste({ demandes, onglet, estDoublon }) {
  if (!demandes.length) {
    return <p className="text-stone-500 text-center py-16">Aucune demande.</p>;
  }

  // Regroupement par jour de réception
  const groupes = [];
  for (const d of demandes) {
    const jour = libelleJourRecu(d.created_at);
    const dernier = groupes[groupes.length - 1];
    if (dernier && dernier.jour === jour) dernier.items.push(d);
    else groupes.push({ jour, items: [d] });
  }

  return (
    <>
      {groupes.map((g, gi) => (
        <section key={g.jour}>
          <h2 className="text-stone-500 font-medium mt-6 mb-3">{g.jour}</h2>
          <ul className="space-y-3">
            {g.items.map((d, i) => (
              <CarteDemande
                key={d.id}
                d={d}
                enAvant={onglet === "a_confirmer" && gi === 0 && i === 0}
                doublon={estDoublon(d)}
              />
            ))}
          </ul>
        </section>
      ))}

      {demandes.length === MAX_LISTE && (
        <p className="text-sm text-stone-500 text-center mt-6">
          Seules les {MAX_LISTE} demandes les plus récentes sont affichées.
        </p>
      )}
    </>
  );
}

// ---------- Page ----------

const listeOnglet = (statuts) =>
  supabase
    .from("demandes")
    .select(COLONNES_LISTE)
    .in("statut", statuts)
    .eq("anonymise", false)
    .order("created_at", { ascending: false })
    .limit(MAX_LISTE);

export default async function Page({ searchParams }) {
  const { onglet = "a_confirmer" } = await searchParams;
  const actif = ONGLETS[onglet] ? onglet : "a_confirmer";

  // Les trois onglets + les doublons, chargés en même temps
  const cles = Object.keys(ONGLETS);
  const [actives, ...resultats] = await Promise.all([
    // Détection des doublons : même numéro + même date
    supabase
      .from("demandes")
      .select("id, telephone_appelant, telephone_dicte, date_reservation")
      .in("statut", STATUTS_DOUBLON)
      .not("date_reservation", "is", null)
      .eq("anonymise", false),
    ...cles.map((cle) => listeOnglet(ONGLETS[cle].statuts)),
  ]);

  const parCle = new Map();
  for (const a of actives.data ?? []) {
    for (const k of clesDoublon(a)) parCle.set(k, (parCle.get(k) ?? 0) + 1);
  }
  const estDoublon = (d) =>
    STATUTS_DOUBLON.includes(d.statut) && clesDoublon(d).some((k) => (parCle.get(k) ?? 0) > 1);

  const erreur = resultats.find((r) => r.error)?.error ?? actives.error;
  const listes = Object.fromEntries(cles.map((cle, i) => [cle, resultats[i].data ?? []]));
  const nbAConfirmer = listes.a_confirmer.length;

  const onglets = cles.map((cle) => ({
    cle,
    label:
      cle === "a_confirmer" && nbAConfirmer
        ? `${ONGLETS[cle].label} · ${nbAConfirmer === MAX_LISTE ? `${MAX_LISTE}+` : nbAConfirmer}`
        : ONGLETS[cle].label,
  }));
  const panneaux = Object.fromEntries(
    cles.map((cle) => [cle, <Liste key={cle} demandes={listes[cle]} onglet={cle} estDoublon={estDoublon} />])
  );

  return (
    <div className="min-h-screen pb-28">
      <main className="mx-auto max-w-xl px-5 pt-8">
        <RafraichirAuto />
        {/* En-tête */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="font-[family-name:var(--font-titre)] text-4xl font-bold text-[#163728]">
            Réservations
          </h1>
          <Link href="/parametres" aria-label="Paramètres" className="p-2 -mr-2 text-stone-500">
            <Settings size={24} />
          </Link>
        </div>

        {erreur && <p className="text-red-600 mt-4">Erreur de chargement : {erreur.message}</p>}

        <Onglets initial={actif} onglets={onglets} panneaux={panneaux} />
      </main>

      <BarreBas actif="reservations" />
    </div>
  );
}
