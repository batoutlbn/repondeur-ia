"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import BoutonEnvoi from "./BoutonEnvoi";
import { supprimerDemande } from "../demandes/actions";

export default function BoutonSupprimer({ id }) {
  const [ouvert, setOuvert] = useState(false);
  const [coche, setCoche] = useState(false);

  const fermer = () => {
    setOuvert(false);
    setCoche(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className="p-2 -mr-2 text-stone-500 hover:text-red-700"
        aria-label="Supprimer"
      >
        <Trash2 size={22} />
      </button>

      {ouvert && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4"
          onClick={fermer}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 mx-auto rounded-full bg-red-50 text-red-700 flex items-center justify-center mb-4">
              <Trash2 size={30} />
            </div>
            <h2 className="font-[family-name:var(--font-titre)] text-2xl font-bold text-center text-[#163728] mb-3">
              Supprimer la demande ?
            </h2>
            <p className="text-center text-stone-600 mb-5">
              La demande, sa transcription et son enregistrement audio seront supprimés définitivement.
            </p>

            <label className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 mb-5 cursor-pointer">
              <input
                type="checkbox"
                checked={coche}
                onChange={(e) => setCoche(e.target.checked)}
                className="w-5 h-5 mt-0.5 accent-red-700 shrink-0"
              />
              <span className="text-red-900">Je confirme vouloir supprimer cette demande.</span>
            </label>

            <div className="grid grid-cols-[1fr_2fr] gap-3">
              <button
                type="button"
                onClick={fermer}
                className="rounded-xl border border-stone-300 bg-white py-3.5 font-medium text-stone-800"
              >
                Annuler
              </button>
              <form action={supprimerDemande} className="w-full">
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="confirmation" value={coche ? "oui" : ""} />
                <BoutonEnvoi couleur="rouge" enCours="Suppression…" disabled={!coche}>
                  Supprimer
                </BoutonEnvoi>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}