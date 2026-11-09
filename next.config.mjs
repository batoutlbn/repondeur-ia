/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Garde les pages 30 s en mémoire sur le téléphone : retour arrière et
    // changement d'onglet instantanés. Les actions (confirmer, refuser…) vident ce cache.
    staleTimes: { dynamic: 30 },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
