export async function envoyerSMS(to, body) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const auth = Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64");

  const params = new URLSearchParams({
    To: to,
    From: process.env.TWILIO_SMS_SENDER,
    Body: body,
  });
  if (process.env.APP_URL) {
    params.append("StatusCallback", `${process.env.APP_URL}/api/twilio/sms-status`);
  }

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Twilio ${json.code ?? res.status} : ${json.message ?? "erreur inconnue"}`);
  }
  return json.sid;
}