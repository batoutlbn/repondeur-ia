import { purgerAnciennes } from "../../../lib/purge";

export async function GET(request) {
  // Seul Vercel (qui connaît CRON_SECRET) peut lancer la purge
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Non autorisé", { status: 401 });
  }

  const supprimees = await purgerAnciennes();
  console.log("Purge automatique :", supprimees, "demande(s) supprimée(s)");
  return Response.json({ supprimees });
}