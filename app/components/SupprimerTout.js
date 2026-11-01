"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import BoutonEnvoi from "./BoutonEnvoi";
import { supprimerTout } from "../demandes/actions";

export default function SupprimerTout() {
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
        className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white py-3.5 font-medium text-red-700"
      >
        <Trash2 size={18} /> Supprimer toutes les demandes
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
              Tout supprimer ?
            </h2>
            <p className="text-center text-stone-600 mb-5">
              Toutes les demandes, transcriptions et enregistrements audio seront supprimés
              définitivement. Cette action est irréversible.
            </p>

            <label className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 mb-5 cursor-pointer">
              <input
                type="checkbox"
                checked={coche}
                onChange={(e) => setCoche(e.target.checked)}
                className="w-5 h-5 mt-0.5 accent-red-700 shrink-0"
              />
              <span className="text-red-900">
                Je comprends que toutes les données seront perdues définitivement.
              </span>
            </label>

            <div className="grid grid-cols-[1fr_2fr] gap-3">
              <button
                type="button"
                onClick={fermer}
                className="rounded-xl border border-stone-300 bg-white py-3.5 font-medium text-stone-800"
              >
                Annuler
              </button>
              <form action={supprimerTout} className="w-full">
                <input type="hidden" name="confirmation" value={coche ? "oui" : ""} />
                <BoutonEnvoi couleur="rouge" enCours="Suppression…" disabled={!coche}>
                  Tout supprimer
                </BoutonEnvoi>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}