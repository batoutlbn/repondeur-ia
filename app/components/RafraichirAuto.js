"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RafraichirAuto({ intervalle = 20000 }) {
  const router = useRouter();

  useEffect(() => {
    const rafraichir = () => {
      if (document.visibilityState === "visible") router.refresh();
    };

    const id = setInterval(rafraichir, intervalle);
    document.addEventListener("visibilitychange", rafraichir); // retour sur l'app
    window.addEventListener("focus", rafraichir);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", rafraichir);
      window.removeEventListener("focus", rafraichir);
    };
  }, [router, intervalle]);

  return null;
}