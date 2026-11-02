const sid = process.env.TWILIO_ACCOUNT_SID;
const token = process.env.TWILIO_AUTH_TOKEN;
const NUMERO = "+33188732558"; // ton numéro Twilio

const message =
  process.argv.slice(2).join(" ") ||
  "Bonjour, c'est Julien Martin, je voudrais réserver pour 4 personnes samedi 5 décembre 12 heures, en terrasse si possible, avec un bébé avec un siège enfant . Mon numéro est le 06 12 34 56 78. Merci, au revoir.";

const echapper = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Attend la fin de l'annonce et le bip, puis "parle"
const twiml = `<Response>
  <Pause length="25"/>
  <Say language="fr-FR" voice="Polly.Remi-Neural">${echapper(message)}</Say>
  <Pause length="2"/>
  <Hangup/>
</Response>`;

const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls.json`, {
  method: "POST",
  headers: {
    Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
    "Content-Type": "application/x-www-form-urlencoded",
  },
  body: new URLSearchParams({ To: NUMERO, From: NUMERO, Twiml: twiml }),
});

const json = await res.json();
console.log(res.ok ? `Appel lancé : ${json.sid}` : `Erreur ${json.code} : ${json.message}`);