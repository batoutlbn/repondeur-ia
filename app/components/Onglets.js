"use client";

import { useState } from "react";

const VERT = "#1f4a3a";

// Onglets instantanés : les trois listes sont déjà chargées, on change juste
// celle qui est affichée (aucun aller-retour avec le serveur).
export default function Onglets({ initial, onglets, panneaux }) {
  const [actif, setActif] = useState(initial);

  const choisir = (cle) => {
    setActif(cle);
    // Garde l'onglet dans l'adresse (retour arrière, rechargement)
    window.history.replaceState(null, "", cle === "a_confirmer" ? "/" : `/?onglet=${cle}`);
  };

  return (
    <>
      <nav className="flex gap-1 bg-[#ebe7de] p-1 rounded-full mb-2">
        {onglets.map(({ cle, label }) => (
          <button
            key={cle}
            type="button"
            onClick={() => choisir(cle)}
            className={`flex-1 text-center rounded-full py-2.5 text-sm font-medium transition ${
              cle === actif ? "text-white shadow-sm" : "text-stone-600"
            }`}
            style={cle === actif ? { backgroundColor: VERT } : undefined}
          >
            {label}
          </button>
        ))}
      </nav>

      {panneaux[actif]}
    </>
  );
}
