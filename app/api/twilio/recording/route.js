export async function POST(request) {
  const form = await request.formData();
  const data = Object.fromEntries(form);

  console.log("Appel reçu :", {
    callSid: data.CallSid,
    from: data.From,
    to: data.To,
    recordingUrl: data.RecordingUrl,
    duree: data.RecordingDuration,
  });

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="fr-FR" voice="Polly.Lea">Merci, votre message a bien été enregistré. À bientôt.</Say>
  <Hangup/>
</Response>`;

  return new Response(twiml, {
    headers: { "Content-Type": "text/xml" },
  });
}