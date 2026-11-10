import Image from "next/image";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import BoutonEnvoi from "../components/BoutonEnvoi";
import { COOKIE_SESSION, OPTIONS_COOKIE, creerJeton } from "../lib/session";

async function connecter(formData) {
  "use server";

  const motdepasse = String(formData.get("motdepasse") ?? "");
  let suite = String(formData.get("suite") ?? "/");
  if (!suite.startsWith("/") || suite.startsWith("//")) suite = "/";

  if (motdepasse !== process.env.APP_PASSWORD) {
    await new Promise((r) => setTimeout(r, 1000)); // ralentit les essais au hasard
    redirect(`/connexion?erreur=1&suite=${encodeURIComponent(suite)}`);
  }

  (await cookies()).set(COOKIE_SESSION, await creerJeton(), OPTIONS_COOKIE);
  redirect(suite);
}

const input =
  "w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-lg focus:outline-none focus:border-[#1f4a3a]";

export default async function Connexion({ searchParams }) {
  const { erreur, suite = "/" } = await searchParams;

  return (
    <main className="min-h-screen flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <Image
          src="/logo.png"
          alt="Le Bonnet Blanc"
          width={446}
          height={448}
          priority
          className="w-40 h-auto mx-auto mb-6 mix-blend-multiply"
        />
        <h1 className="font-[family-name:var(--font-titre)] text-4xl font-bold text-[#163728] text-center mb-2">
          Réservations
        </h1>
        <p className="text-center text-stone-500 mb-8">Entre ton mot de passe pour accéder aux demandes</p>

        <form action={connecter} className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
          <input type="hidden" name="suite" value={suite} />

          <label className="block">
            <span className="block text-sm font-medium text-stone-600 mb-1">Mot de passe</span>
            <input
              type="password"
              name="motdepasse"
              autoComplete="current-password"
              autoFocus
              required
              className={input}
            />
          </label>

          {erreur && <p className="text-red-700 text-sm">Mot de passe incorrect.</p>}

          <BoutonEnvoi enCours="Connexion…">Se connecter</BoutonEnvoi>
        </form>
      </div>
    </main>
  );
}