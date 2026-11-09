import Link from "next/link";
import { Activity, MessageCircle, CalendarDays } from "lucide-react";
import { supabase } from "../lib/supabase";
import BarreBas from "../components/BarreBas";
import { cleJour } from "../lib/format";

export const dynamic = "force-dynamic";

const VERT = "#1f4a3a";

const PERIODES = {
  semaine: "Cette semaine",
  mois: "Ce mois",
  tout: "Tout",
};

// ---------- Outils ----------

// Minuit heure de Paris pour un jour donné, ex. "2026-11-09T00:00:00+01:00"
function minuitParis(jour) {
  const decalage = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Paris", timeZoneName: "longOffset" })
    .formatToParts(new Date(`${jour}T12:00:00Z`))
    .find((p) => p.type === "timeZoneName")
    .value.replace("GMT", "");
  return `${jour}T00:00:00${decalage || "+00:00"}`;
}

// Date de début de la période (format AAAA-MM-JJ), ou null pour "Tout"
function debutPeriode(periode) {
  const aujourdhui = cleJour(new Date());
  if (periode === "mois") return aujourdhui.slice(0, 8) + "01";
  if (periode === "semaine") {
    const d = new Date(`${aujourdhui}T12:00:00Z`);
    const decalage = (d.getUTCDay() + 6) % 7; // lundi = 0
    return new Date(d.getTime() - decalage * 86400000).toISOString().slice(0, 10);
  }
  return null;
}

function septJours() {
  const base = new Date(`${cleJour(new Date())}T12:00:00Z`);
  return Array.from({ length: 7 }, (_, i) =>
    new Date(base.getTime() + i * 86400000).toISOString().slice(0, 10)
  );
}

function libelleJour(iso, i) {
  if (i === 0) return "Aujourd’hui";
  if (i === 1) return "Demain";
  const t = new Date(`${iso}T12:00:00Z`).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function Carte({ icone: Icone, titre, children }) {
  return (
    <section className="bg-white rounded-2xl border border-stone-200 p-5">
      <p className="flex items-center gap-3 font-semibold mb-4">
        <Icone size={20} className="text-stone-500" /> {titre}
      </p>
      {children}
    </section>
  );
}

function Tuile({ label, valeur, couleur = "text-stone-900" }) {
  return (
    <div className="bg-[#f6f5f1] rounded-xl p-3">
      <p className="text-sm text-stone-500">{label}</p>
      <p className={`text-2xl font-semibold mt-0.5 ${couleur}`}>{valeur}</p>
    </div>
  );
}

// ---------- Page ----------

export default async function Statistiques({ searchParams }) {
  const { periode: p = "semaine" } = await searchParams;
  const periode = PERIODES[p] ? p : "semaine";
  const debut = debutPeriode(periode);

  // 1. Demandes de la période (selon la date de l'appel)
  // 2. Couverts confirmés des 7 prochains jours
  // Les deux requêtes partent en même temps
  const jours = septJours();
  let requete = supabase.from("demandes").select("statut, nb_personnes, sms_statut");
  if (debut) requete = requete.gte("created_at", minuitParis(debut));
  const [{ data }, { data: aVenir }] = await Promise.all([
    requete,
    supabase
      .from("demandes")
      .select("date_reservation, nb_personnes")
      .eq("statut", "confirmee")
      .gte("date_reservation", jours[0])
      .lte("date_reservation", jours[6]),
  ]);
  const r = data ?? [];

  const compte = (...statuts) => r.filter((d) => statuts.includes(d.statut)).length;
  const confirmees = r.filter((d) => d.statut === "confirmee");
  const couverts = confirmees.reduce((s, d) => s + (d.nb_personnes ?? 0), 0);
  const moyenne = confirmees.length
    ? (couverts / confirmees.length).toFixed(1).replace(".", ",")
    : "—";
  const smsEnvoyes = r.filter((d) => ["envoye", "delivre"].includes(d.sms_statut)).length;
  const smsEchec = r.filter((d) => d.sms_statut === "echec").length;

  const parJour = jours.map((iso) => ({
    iso,
    couverts: (aVenir ?? [])
      .filter((d) => d.date_reservation === iso)
      .reduce((s, d) => s + (d.nb_personnes ?? 0), 0),
  }));
  const maxCouverts = Math.max(1, ...parJour.map((j) => j.couverts));

  return (
    <div className="min-h-screen pb-28">
      <main className="mx-auto max-w-xl px-5 pt-8 space-y-4">
        <h1 className="font-[family-name:var(--font-titre)] text-4xl font-bold text-[#163728] mb-2">
          Statistiques
        </h1>

        {/* Choix de la période */}
        <nav className="flex gap-1 bg-[#ebe7de] p-1 rounded-full">
          {Object.entries(PERIODES).map(([cle, label]) => (
            <Link
              key={cle}
              href={`/statistiques?periode=${cle}`}
              className={`flex-1 text-center rounded-full py-2.5 text-sm font-medium ${
                cle === periode ? "text-white shadow-sm" : "text-stone-600"
              }`}
              style={cle === periode ? { backgroundColor: VERT } : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Activité */}
        <Carte icone={Activity} titre="Activité">
          <div className="grid grid-cols-2 gap-3">
            <Tuile label="Appels reçus" valeur={r.length} />
            <Tuile label="Couverts" valeur={couverts} />
            <Tuile label="Confirmées" valeur={compte("confirmee")} couleur="text-[#1f4a3a]" />
            <Tuile label="Refusées" valeur={compte("refusee")} couleur="text-red-700" />
            <Tuile label="En attente" valeur={compte("a_traiter", "a_confirmer")} couleur="text-orange-700" />
            <Tuile label="Moy. par table" valeur={moyenne === "—" ? "—" : `${moyenne} pers.`} />
          </div>
        </Carte>

        {/* SMS */}
        <Carte icone={MessageCircle} titre="SMS">
          <div className="grid grid-cols-2 gap-3">
            <Tuile label="Envoyés" valeur={smsEnvoyes} />
            <Tuile label="En échec" valeur={smsEchec} couleur={smsEchec ? "text-red-700" : "text-stone-900"} />
          </div>
        </Carte>

        {/* 7 prochains jours */}
        <Carte icone={CalendarDays} titre="Couverts confirmés à venir">
          <ul className="space-y-3">
            {parJour.map((j, i) => (
              <li key={j.iso}>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="font-medium">{libelleJour(j.iso, i)}</span>
                  <span className="text-stone-700">
                    {j.couverts} couvert{j.couverts > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(j.couverts / maxCouverts) * 100}%`, backgroundColor: VERT }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Carte>

        <p className="text-sm text-stone-500 text-center">
          Les statistiques sont conservées sans limite, sous forme anonyme.
        </p>
      </main>

      <BarreBas actif="statistiques" />
    </div>
  );
}