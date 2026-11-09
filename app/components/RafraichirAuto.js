"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Recharge les données de la page à intervalle régulier et au retour sur l'app.
// arretApres : arrête l'intervalle au bout de X ms (null = jamais).
export default function RafraichirAuto({ intervalle = 20000, arretApres = null }) {
  const router = useRouter();

  useEffect(() => {
    let dernier = Date.now();

    const rafraichir = () => {
      if (document.visibilityState !== "visible") return;
      // "focus" et "visibilitychange" arrivent souvent ensemble : un seul rechargement
      if (Date.now() - dernier < 3000) return;
      dernier = Date.now();
      router.refresh();
    };

    const id = setInterval(rafraichir, intervalle);
    const arret = arretApres ? setTimeout(() => clearInterval(id), arretApres) : null;
    document.addEventListener("visibilitychange", rafraichir); // retour sur l'app
    window.addEventListener("focus", rafraichir);

    return () => {
      clearInterval(id);
      clearTimeout(arret);
      document.removeEventListener("visibilitychange", rafraichir);
      window.removeEventListener("focus", rafraichir);
    };
  }, [router, intervalle, arretApres]);

  return null;
}
