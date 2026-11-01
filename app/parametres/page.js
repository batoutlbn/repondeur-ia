import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LogOut, User, Database } from "lucide-react";
import BarreBas from "../components/BarreBas";
import SupprimerTout from "../components/SupprimerTout";
import { COOKIE_SESSION } from "../lib/session";

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

        {/* Données */}
        <section className="bg-white rounded-2xl border border-stone-200 p-5">
          <p className="flex items-center gap-3 font-semibold mb-1">
            <Database size={20} className="text-stone-500" /> Données
          </p>
          <p className="text-stone-600 mb-4">
            Supprime toutes les demandes, leurs transcriptions et les enregistrements audio.
          </p>
          <SupprimerTout />
        </section>
      </main>

      <BarreBas actif="parametres" />
    </div>
  );
}