"use client";

import { Trash2 } from "lucide-react";
import { supprimerDemande } from "../demandes/actions";

export default function BoutonSupprimer({ id }) {
  return (
    <form
      action={supprimerDemande}
      onSubmit={(e) => {
        if (!confirm("Supprimer définitivement cette demande et son enregistrement audio ?")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="p-2 -mr-2 text-stone-500 hover:text-red-700" aria-label="Supprimer">
        <Trash2 size={22} />
      </button>
    </form>
  );
}