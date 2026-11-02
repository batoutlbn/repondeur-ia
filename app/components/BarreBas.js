import Link from "next/link";
import { CalendarCheck, ChartColumn, Settings } from "lucide-react";

const VERT = "#1f4a3a";

const LIENS = [
  { nom: "reservations", href: "/", label: "Réservations", Icone: CalendarCheck },
  { nom: "statistiques", href: "/statistiques", label: "Statistiques", Icone: ChartColumn },
  { nom: "parametres", href: "/parametres", label: "Paramètres", Icone: Settings },
];

export default function BarreBas({ actif }) {
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-stone-200">
      <div className="mx-auto max-w-xl grid grid-cols-3 py-2">
        {LIENS.map(({ nom, href, label, Icone }) => (
          <Link
            key={nom}
            href={href}
            className={`flex flex-col items-center gap-1 text-xs ${actif === nom ? "font-medium" : "text-stone-400"}`}
            style={actif === nom ? { color: VERT } : undefined}
          >
            <Icone size={22} />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}