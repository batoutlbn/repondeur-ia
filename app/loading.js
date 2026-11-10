// Écran d'accueil : s'affiche à l'ouverture de l'app pendant le chargement des réservations
export default function Chargement() {
  return (
    <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
      {/* eslint-disable-next-line @next/next/no-img-element -- SVG animé (le cercle se dessine) */}
      <img src="/logo-anime.svg" alt="Le Bonnet Blanc" width={240} height={240} className="w-60 h-60" />
    </div>
  );
}
