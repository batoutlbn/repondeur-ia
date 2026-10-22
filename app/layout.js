import "./globals.css";
import { Fraunces, Inter } from "next/font/google";

const titre = Fraunces({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-titre" });
const texte = Inter({ subsets: ["latin"], variable: "--font-texte" });

export const metadata = {
  title: "Réservations",
  description: "Répondeur IA du restaurant",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${titre.variable} ${texte.variable}`}>
      <body className="bg-[#faf9f6] text-stone-900 antialiased font-[family-name:var(--font-texte)]">
        {children}
      </body>
    </html>
  );
}