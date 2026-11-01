import Link from "next/link";
import { CalendarCheck, ChartColumn, Settings } from "lucide-react";

const VERT = "#1f4a3a";

export default function BarreBas({ actif }) {
  const style = (nom) =>
    actif === nom ? { color: VERT } : undefined;
  const classe = (nom) =>
    `flex flex-col items-center gap-1 text-xs ${actif === nom ? "font-medium" : "text-stone-400"}`;

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-stone-200">
      <div className="mx-auto max-w-xl grid grid-cols-3 py-2">
        <Link href="/" className={classe("reservations")} style={style("reservations")}>
          <CalendarCheck size={22} />
          Réservations
        </Link>
        <span className="flex flex-col items-center gap-1 text-xs text-stone-300">
          <ChartColumn size={22} />
          Statistiques
        </span>
        <Link href="/parametres" className={classe("parametres")} style={style("parametres")}>
          <Settings size={22} />
          Paramètres
        </Link>
      </div>
    </nav>
  );
}