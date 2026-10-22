import Link from "next/link";
import {
  Phone,
  ChevronRight,
  CalendarDays,
  Users,
  Settings,
  CalendarCheck,
  ChartColumn,
  Umbrella,
  Cake,
  Baby,
  Star,
  TriangleAlert,
} from "lucide-react";
import { supabase } from "./lib/supabase";

export const dynamic = "force-dynamic";

const VERT = "#1f4a3a";

const ONGLETS = {
  a_confirmer: { label: "À confirmer", statuts: ["a_traiter", "a_confirmer", "erreur"] },
  confirmee: { label: "Confirmées", statuts: ["confirmee"] },
  refusee: { label: "Refusées", statuts: ["refusee"] },
};

// ---------- Formatage ----------

const cleJour = (date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(date);

function libelleJour(ts) {
  const d = new Date(ts);
  const aujourdhui = cleJour(new Date());
  const hier = cleJour(new Date(Date.now() - 86400000));
  const cle = cleJour(d);
  if (cle === aujourdhui) return "Aujourd’hui";
  if (cle === hier) return "Hier";
  return d.toLocaleDateString("fr-FR", {
    timeZone: "Europe/Paris",
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function heureRecue(ts) {
  return new Date(ts).toLocaleTimeString("fr-FR", {
    timeZone: "Europe/Paris",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(date) {
  if (!date) return null;
  const txt = new Date(`${date}T12:00:00Z`).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
  return txt.charAt(0).toUpperCase() + txt.slice(1);
}

function formatHeure(heure) {
  if (!heure) return null;
  const [h, m] = heure.split(":");
  return m === "00" ? `${Number(h)} h` : `${Number(h)} h ${m}`;
}

function iconePreference(p) {
  const t = p.toLowerCase();
  if (t.includes("terrasse")) return Umbrella;
  if (t.includes("anniversaire")) return Cake;
  if (t.includes("poussette") || t.includes("enfant") || t.includes("bébé")) return Baby;
  return Star;
}

// ---------- Page ----------

export default async function Page({ searchParams }) {
  const { onglet = "a_confirmer" } = await searchParams;
  const actif = ONGLETS[onglet] ? onglet : "a_confirmer";

  const { data: demandes, error } = await supabase
    .from("demandes")
    .select("*")
    .in("statut", ONGLETS[actif].statuts)
    .order("created_at", { ascending: false });

  const { count } = await supabase
    .from("demandes")
    .select("id", { count: "exact", head: true })
    .in("statut", ONGLETS.a_confirmer.statuts);

  // Regroupement par jour de réception
  const groupes = [];
  for (const d of demandes ?? []) {
    const jour = libelleJour(d.created_at);
    const dernier = groupes[groupes.length - 1];
    if (dernier && dernier.jour === jour) dernier.items.push(d);
    else groupes.push({ jour, items: [d] });
  }

  return (
    <div className="min-h-screen pb-28">
      <main className="mx-auto max-w-xl px-5 pt-8">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="font-[family-name:var(--font-titre)] text-4xl font-bold text-[#163728]">
            Réservations
          </h1>
          <Settings className="text-stone-500" size={24} />
        </div>

        {/* Onglets */}
        <nav className="flex gap-1 bg-[#ebe7de] p-1 rounded-full mb-2">
          {Object.entries(ONGLETS).map(([cle, o]) => (
            <Link
              key={cle}
              href={`/?onglet=${cle}`}
              className={`flex-1 text-center rounded-full py-2.5 text-sm font-medium transition ${
                cle === actif ? "text-white shadow-sm" : "text-stone-600"
              }`}
              style={cle === actif ? { backgroundColor: VERT } : undefined}
            >
              {o.label}
              {cle === "a_confirmer" && count ? ` · ${count}` : ""}
            </Link>
          ))}
        </nav>

        {error && <p className="text-red-600 mt-4">Erreur de chargement : {error.message}</p>}

        {demandes?.length === 0 && (
          <p className="text-stone-500 text-center py-16">Aucune demande.</p>
        )}

        {/* Groupes par jour */}
        {groupes.map((g, gi) => (
          <section key={g.jour}>
            <h2 className="text-stone-500 font-medium mt-6 mb-3">{g.jour}</h2>
            <ul className="space-y-3">
              {g.items.map((d, i) => {
                const enAvant = actif === "a_confirmer" && gi === 0 && i === 0;
                const analysee = d.statut !== "a_traiter" && d.statut !== "erreur";
                const alerte = d.infos_manquantes.length > 0 || d.ambiguites.length > 0;

                return (
                  <li key={d.id}>
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
                            {heureRecue(d.created_at)}
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
                              {formatDate(d.date_reservation) || "Date ?"} ·{" "}
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

                        {d.preferences.length > 0 && (
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
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </main>

      {/* Barre du bas */}
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-stone-200">
        <div className="mx-auto max-w-xl grid grid-cols-3 py-2">
          <Link href="/" className="flex flex-col items-center gap-1 text-xs font-medium" style={{ color: VERT }}>
            <CalendarCheck size={22} />
            Réservations
          </Link>
          <span className="flex flex-col items-center gap-1 text-xs text-stone-400">
            <ChartColumn size={22} />
            Statistiques
          </span>
          <span className="flex flex-col items-center gap-1 text-xs text-stone-400">
            <Settings size={22} />
            Paramètres
          </span>
        </div>
      </nav>
    </div>
  );
}