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
    "remarques",
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
    remarques: texteOuNull,
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
- nom : le nom (et le prénom s'il est donné) de la personne qui réserve, sans civilité ("Monsieur", "Madame"). Si le client épelle son nom lettre par lettre, l'orthographe épelée est prioritaire sur le nom entendu. Majuscule au début de chaque mot.
- date_expression : les mots exacts utilisés pour la date (ex. "samedi prochain", "le 24").
- date_reservation : la date calculée au format AAAA-MM-JJ à partir de la date de l'appel. Si plusieurs dates sont possibles (ex. "samedi prochain" dit un vendredi), choisis la plus probable et explique le doute dans ambiguites.
- heure : format HH:MM sur 24 h ("20 h" → "20:00", "8 heures du soir" → "20:00"). Si on ne sait pas si c'est le midi ou le soir, signale-le dans ambiguites.
- nb_personnes : le total, enfants compris ("2 adultes et 2 enfants" → 4).
- nb_enfants : le nombre d'enfants parmi eux s'il est mentionné, sinon null. Si le client parle d'enfants sans donner leur nombre, mets null et signale-le dans ambiguites.
- telephone_dicte : le numéro dicté dans le message, uniquement en chiffres. Les numéros français sont souvent dictés par paires ("zéro six, douze, trente-quatre, cinquante-six, soixante-dix-huit" → "0612345678") ou avec l'indicatif ("plus trente-trois six…" → "06…"). Assemble tous les chiffres dans l'ordre, sans en ajouter ni en retirer. Si le client se corrige, garde la version corrigée. Si aucun numéro n'est dicté, mets null.
- preferences : uniquement ce qui concerne la réservation : placement (terrasse, fenêtre, table précise…), occasion (anniversaire…), besoins (poussette, chaise haute, accès fauteuil, allergie…). Formulation courte.
- remarques : toute autre information utile au restaurateur qui n'entre dans aucun champ (ex. "Annule s'il pleut", "Arrivera peut-être en retard", "Souhaite être rappelé"). Une phrase courte, sinon null.
- infos_manquantes : parmi "nom", "date", "heure", "nombre de personnes", celles qui ne sont pas données.
- ambiguites : uniquement les doutes sur la réservation elle-même (nom, date, heure, nombre de personnes, enfants, téléphone, placement), chacun en une phrase courte. N'y mets ni les phrases hors sujet, ni l'humour, ni les mots mal compris sans rapport avec la réservation. Ne répète pas ce qui est déjà dans infos_manquantes.`;
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

// Vérifie que le numéro dicté fait bien 10 chiffres
function verifierTelephone(infos) {
  if (!infos.telephone_dicte) return;
  const brut = infos.telephone_dicte;
  let n = brut.replace(/\D/g, "");
  if (n.startsWith("0033")) n = "0" + n.slice(4);
  else if (n.startsWith("33") && n.length === 11) n = "0" + n.slice(2);

  if (/^0\d{9}$/.test(n)) {
    infos.telephone_dicte = n;
  } else {
    infos.ambiguites.push(
      `Numéro dicté incomplet ou incorrect : « ${brut} » (${n.length} chiffres au lieu de 10).`
    );
    infos.telephone_dicte = null;
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
  verifierTelephone(infos);
  return infos;
}