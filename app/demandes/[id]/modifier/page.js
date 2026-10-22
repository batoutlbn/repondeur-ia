import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import BoutonEnvoi from "../../../components/BoutonEnvoi";

export const dynamic = "force-dynamic";

const PREF_STATUTS = ["non_traitee", "acceptee", "impossible"];

async function sauvegarder(formData) {
  "use server";

  const id = String(formData.get("id"));
  const texte = (k) => {
    const v = String(formData.get(k) ?? "").trim();
    return v || null;
  };
  const entier = (k) => {
    const v = parseInt(formData.get(k), 10);
    return Number.isFinite(v) && v >= 0 ? v : null;
  };

  const nom = texte("nom");
  const date_reservation = texte("date_reservation");
  const heure = texte("heure");
  const nb_personnes = entier("nb_personnes");
  const nb_enfants = entier("nb_enfants");
  const telephone_dicte = texte("telephone_dicte")?.replace(/[\s.-]/g, "") ?? null;
  const preferences = (texte("preferences") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const pref = texte("table_pref_statut");
  const table_pref_statut = PREF_STATUTS.includes(pref) ? pref : "non_traitee";

  // Recalcule ce qui manque après correction
  const infos_manquantes = [];
  if (!nom) infos_manquantes.push("nom");
  if (!date_reservation) infos_manquantes.push("date");
  if (!heure) infos_manquantes.push("heure");
  if (nb_personnes == null) infos_manquantes.push("nombre de personnes");

  const { error } = await supabase
    .from("demandes")
    .update({
      nom,
      date_reservation,
      heure,
      nb_personnes,
      nb_enfants,
      telephone_dicte,
      preferences,
      table_pref_statut,
      infos_manquantes,
      ambiguites: [], // vérifiées par le restaurateur
    })
    .eq("id", id)
    .eq("statut", "a_confirmer"); // on ne modifie pas une demande déjà traitée

  if (error) throw new Error(error.message);
  redirect(`/demandes/${id}`);
}

function Champ({ label, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-stone-600 mb-1">{label}</span>
      {children}
    </label>
  );
}

const input =
  "w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-lg focus:outline-none focus:border-[#1f4a3a]";

export default async function ModifierDemande({ params }) {
  const { id } = await params;
  const { data: d, error } = await supabase.from("demandes").select("*").eq("id", id).single();
  if (error || !d) notFound();
  if (d.statut !== "a_confirmer") redirect(`/demandes/${id}`);

  return (
    <div className="min-h-screen pb-32">
      <header className="sticky top-0 z-10 bg-[#faf9f6]/90 backdrop-blur">
        <div className="mx-auto max-w-xl px-4 h-14 flex items-center">
          <Link href={`/demandes/${id}`} className="p-2 -ml-2 text-stone-700" aria-label="Retour">
            <ChevronLeft size={26} />
          </Link>
                    <h1 className="flex-1 text-center font-medium text-stone-800 -ml-8 pointer-events-none">Modifier la demande</h1>
        </div>
      </header>

      <form action={sauvegarder} className="mx-auto max-w-xl px-4 space-y-4">
        <input type="hidden" name="id" value={d.id} />

        <section className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
          <Champ label="Nom">
            <input name="nom" defaultValue={d.nom ?? ""} className={input} />
          </Champ>
          <div className="grid grid-cols-2 gap-3">
            <Champ label="Date">
              <input type="date" name="date_reservation" defaultValue={d.date_reservation ?? ""} className={input} />
            </Champ>
            <Champ label="Heure">
              <input type="time" name="heure" defaultValue={d.heure ?? ""} className={input} />
            </Champ>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Champ label="Personnes (total)">
              <input type="number" min="1" name="nb_personnes" defaultValue={d.nb_personnes ?? ""} className={input} />
            </Champ>
            <Champ label="Dont enfants">
              <input type="number" min="0" name="nb_enfants" defaultValue={d.nb_enfants ?? ""} className={input} />
            </Champ>
          </div>
          <Champ label="Téléphone du client">
            <input
              type="tel"
              name="telephone_dicte"
              defaultValue={d.telephone_dicte ?? ""}
              placeholder={d.telephone_appelant ?? ""}
              className={input}
            />
          </Champ>
        </section>

        <section className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
          <Champ label="Préférences (séparées par des virgules)">
            <input name="preferences" defaultValue={d.preferences.join(", ")} className={input} />
          </Champ>
          <Champ label="La préférence peut-elle être satisfaite ?">
            <select name="table_pref_statut" defaultValue={d.table_pref_statut} className={input}>
              <option value="non_traitee">Pas encore décidé</option>
              <option value="acceptee">Oui, confirmée</option>
              <option value="impossible">Non, impossible</option>
            </select>
          </Champ>
          <p className="text-sm text-stone-500">
            La terrasse ou la table ne seront mentionnées dans le SMS que si tu choisis « Oui, confirmée ».
          </p>
        </section>

        <div className="fixed bottom-0 inset-x-0 bg-[#faf9f6] border-t border-stone-200">
          <div className="mx-auto max-w-xl px-4 py-3 grid grid-cols-[1fr_2fr] gap-3">
            <Link
              href={`/demandes/${id}`}
              className="rounded-xl border border-stone-300 bg-white py-3.5 font-medium text-stone-800 text-center"
            >
              Annuler
            </Link>
            <BoutonEnvoi enCours="Sauvegarde…">Sauvegarder</BoutonEnvoi>
          </div>
        </div>
      </form>
    </div>
  );
}