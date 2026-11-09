import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LogOut, User, ShieldCheck } from "lucide-react";
import BarreBas from "../components/BarreBas";
import { COOKIE_SESSION } from "../lib/session";
import { JOURS_CONSERVATION } from "../lib/purge";

async function deconnecter() {
  "use server";
  (await cookies()).delete(COOKIE_SESSION);
  redirect("/connexion");
}

export default function Parametres() {
  return (
    <div className="min-h-screen pb-28">
      <main className="mx-auto max-w-xl px-5 pt-8 space-y-4">
        <h1 className="font-[family-name:var(--font-titre)] text-4xl font-bold text-[#163728] mb-2">
          Paramètres
        </h1>

        {/* Compte */}
        <section className="bg-white rounded-2xl border border-stone-200 p-5">
          <p className="flex items-center gap-3 font-semibold mb-4">
            <User size={20} className="text-stone-500" /> Compte
          </p>
          <form action={deconnecter}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white py-3.5 font-medium text-stone-800"
            >
              <LogOut size={18} /> Se déconnecter
            </button>
          </form>
          <p className="text-sm text-stone-500 mt-3">La déconnexion ne concerne que cet appareil.</p>
        </section>

        {/* Conservation des données */}
        <section className="bg-white rounded-2xl border border-stone-200 p-5">
          <p className="flex items-center gap-3 font-semibold mb-2">
            <ShieldCheck size={20} className="text-stone-500" /> Conservation des données
          </p>
          <p className="text-stone-600 leading-relaxed">
            <strong>{JOURS_CONSERVATION} jours après la date de réservation</strong> (ou après l’appel
            si aucune date n’a été comprise), l’enregistrement audio, la transcription, le nom et le
            numéro du client sont effacés automatiquement. Seuls des chiffres anonymes sont conservés
            pour les statistiques.
          </p>
          <p className="text-sm text-stone-500 mt-3">
            Une demande peut aussi être supprimée à tout moment depuis sa fiche.
          </p>
        </section>
      </main>

      <BarreBas actif="parametres" />
    </div>
  );
}