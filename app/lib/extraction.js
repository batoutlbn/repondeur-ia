const MODELE = "gpt-4.1-mini";

const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

function dateAppelParis(date) {
  const iso = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  const texte = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
  return { iso, texte };
}

const texteOuNull = { type: ["string", "null"] };

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "nom",
    "date_expression",
    "date_reservation",
    "heure",
    "nb_personnes",
    "nb_enfants",
    "telephone_dicte",
    "preferences",
    "infos_manquantes",
    "ambiguites",
  ],
  properties: {
    nom: texteOuNull,
    date_expression: texteOuNull,
    date_reservation: texteOuNull,
    heure: texteOuNull,
    nb_personnes: { type: ["integer", "null"] },
    nb_enfants: { type: ["integer", "null"] },
    telephone_dicte: texteOuNull,
    preferences: { type: "array", items: { type: "string" } },
    infos_manquantes: { type: "array", items: { type: "string" } },
    ambiguites: { type: "array", items: { type: "string" } },
  },
};

function consignes(dateAppel) {
  const { iso, texte } = dateAppelParis(dateAppel);
  return `Tu analyses la transcription d'un message laissé sur le répondeur d'un restaurant.
Date et heure de l'appel : ${texte} (date ISO : ${iso}), fuseau Europe/Paris.

Règles :
- N'invente jamais rien. Si une information n'est pas dite clairement, mets null.
- nom : le nom donné par l'appelant.
- date_expression : les mots exacts utilisés pour la date (ex. "samedi prochain", "le 24").
- date_reservation : la date calculée au format AAAA-MM-JJ à partir de la date de l'appel. Si plusieurs dates sont possibles (ex. "samedi prochain" dit un vendredi), choisis la plus probable et explique le doute dans ambiguites.
- heure : format HH:MM sur 24 h ("20 h" → "20:00", "8 heures du soir" → "20:00"). Si on ne sait pas si c'est le midi ou le soir, signale-le dans ambiguites.
- nb_personnes : un nombre entier.
- nb_personnes est le total, enfants compris ("2 adultes et 2 enfants" → 4).
- nb_enfants : le nombre d'enfants parmi eux s'il est mentionné, sinon null. Si le client parle d'enfants sans donner leur nombre, mets null et signale-le dans ambiguites.
- telephone_dicte : le numéro dicté dans le message, en 10 chiffres sans espaces, sinon null. Si des chiffres sont incertains, signale-le dans ambiguites.
- preferences : les demandes particulières, formulées courtement (ex. "Terrasse", "Anniversaire", "Poussette", "Loin de l'entrée").
- infos_manquantes : parmi "nom", "date", "heure", "nombre de personnes", celles qui ne sont pas données.
- ambiguites : chaque doute en une phrase courte.`;
}

// Vérifie que le jour cité ("samedi") correspond bien à la date calculée
function verifierJour(infos) {
  if (!infos.date_reservation || !infos.date_expression) return;
  const d = new Date(`${infos.date_reservation}T12:00:00Z`);
  if (isNaN(d)) {
    infos.ambiguites.push(`Date calculée invalide : ${infos.date_reservation}.`);
    infos.date_reservation = null;
    return;
  }
  const jourCalcule = JOURS[d.getUTCDay()];
  const jourCite = JOURS.find((j) => infos.date_expression.toLowerCase().includes(j));
  if (jourCite && jourCite !== jourCalcule) {
    infos.ambiguites.push(
      `Le jour cité (${jourCite}) ne correspond pas à la date calculée (${infos.date_reservation}, un ${jourCalcule}).`
    );
  }
}

export async function extraireInfos(transcription, dateAppel) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODELE,
      temperature: 0,
      messages: [
        { role: "system", content: consignes(dateAppel) },
        { role: "user", content: transcription },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "demande_reservation", strict: true, schema: SCHEMA },
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Extraction échouée : ${res.status} ${await res.text()}`);
  }

  const json = await res.json();
  const infos = JSON.parse(json.choices[0].message.content);
  verifierJour(infos);
  return infos;
}