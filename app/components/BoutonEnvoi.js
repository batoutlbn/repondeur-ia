"use client";

import { useFormStatus } from "react-dom";

const COULEURS = {
  vert: "bg-[#1f4a3a] text-white",
  rouge: "bg-red-700 text-white",
};

export default function BoutonEnvoi({ children, enCours = "Sauvegarde…", disabled = false, couleur = "vert" }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={`w-full rounded-xl px-3 py-3.5 font-medium ${COULEURS[couleur]} disabled:opacity-60 disabled:cursor-not-allowed`}
    >
      {pending ? enCours : children}
    </button>
  );
}