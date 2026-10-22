"use client";

import { useFormStatus } from "react-dom";

export default function BoutonEnvoi({ children, enCours = "Sauvegarde…" }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl py-3.5 font-medium text-white bg-[#1f4a3a] disabled:opacity-60 disabled:cursor-wait"
    >
      {pending ? enCours : children}
    </button>
  );
}