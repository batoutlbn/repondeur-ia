"use client";

import { useState } from "react";
import { Check, X, Users, CalendarDays, Umbrella, MessageCircle, Info, TriangleAlert, RotateCcw } from "lucide-react";
import BoutonEnvoi from "./BoutonEnvoi";
import { confirmerReservation, refuserReservation } from "../demandes/actions";

const MODES = {
  confirmer: {
    bouton: "Valider la réservation",
    boutonClasse: "bg-[#1f4a3a] text-white",
    titre: "Confirmer la réservation ?",
    Icone: Check,
    rond: "bg-[#e3ebe5] text-[#1f4a3a]",
    action: confirmerReservation,
    avecSms: "Confirmer et envoyer",
    sansSms: "Confirmer",
    enCours: "Confirmation…",
    couleur: "vert",
  },
  refuser: {
    bouton: "Refuser",
    boutonClasse: "bg-white border border-red-200 text-red-700",
    titre: "Refuser la demande ?",
    Icone: X,
    rond: "bg-red-50 text-red-700",
    action: refuserReservation,
    avecSms: "Refuser et envoyer",
    sansSms: "Refuser",
    enCours: "Envoi…",
    couleur: "rouge",
  },
};

export default function DecisionReservation({ mode, id, recap, smsDefaut, numero, bloque }) {
  const m = MODES[mode];
  const [ouvert, setOuvert] = useState(false);
  const [texte, setTexte] = useState(smsDefaut);
  const [envoyerSms, setEnvoyerSms] = useState(true);

  const smsActif = !!numero && envoyerSms && texte.trim().length > 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className={`w-full rounded-xl py-3.5 font-medium ${m.boutonClasse}`}
      >
        {m.bouton}
      </button>

      {ouvert && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setOuvert(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${m.rond}`}>
              <m.Icone size={32} strokeWidth={3} />
            </div>
            <h2 className="font-[family-name:var(--font-titre)] text-2xl font-bold text-center text-[#163728] mb-5">
              {m.titre}
            </h2>

            {bloque ? (
              <p className="flex gap-2 bg-orange-50 border border-orange-200 text-orange-900 rounded-2xl p-4 mb-5">
                <TriangleAlert size={18} className="shrink-0 mt-0.5" /> {bloque}
              </p>
            ) : (
              <>
                {/* Récapitulatif */}
                <div className="border border-stone-200 rounded-2xl p-4 space-y-3 mb-4">
                  <p className="flex items-center gap-3">
                    <Users size={18} className="text-stone-500" /> {recap.personnes}
                  </p>
                  <p className="flex items-center gap-3">
                    <CalendarDays size={18} className="text-stone-500" /> {recap.quand}
                  </p>
                  {mode === "confirmer" && recap.placement && (
                    <p className="flex items-center gap-3">
                      <Umbrella size={18} className="text-stone-500" /> {recap.placement}
                    </p>
                  )}
                </div>

                {/* SMS modifiable */}
                <div className="border border-stone-200 rounded-2xl p-4 mb-3">
                  <div className="flex items-center justify-between mb-3">
                    <p className="flex items-center gap-2 font-semibold">
                      <MessageCircle size={18} /> SMS au client
                    </p>
                    {numero && (
                      <label className="flex items-center gap-2 text-sm text-stone-600">
                        <input
                          type="checkbox"
                          checked={envoyerSms}
                          onChange={(e) => setEnvoyerSms(e.target.checked)}
                          className="w-4 h-4 accent-[#1f4a3a]"
                        />
                        Envoyer
                      </label>
                    )}
                  </div>

                  {!numero ? (
                    <p className="text-orange-800">
                      Aucun numéro mobile utilisable : il faudra contacter le client autrement.
                    </p>
                  ) : envoyerSms ? (
                    <>
                      <textarea
                        value={texte}
                        onChange={(e) => setTexte(e.target.value)}
                        rows={5}
                        maxLength={600}
                        className="w-full bg-[#f1f0ec] rounded-xl p-3 text-stone-800 leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-[#1f4a3a]"
                      />
                      <div className="flex justify-between items-center mt-2 text-sm text-stone-500">
                        <span>{texte.length} caractères</span>
                        {texte !== smsDefaut && (
                          <button
                            type="button"
                            onClick={() => setTexte(smsDefaut)}
                            className="flex items-center gap-1 underline"
                          >
                            <RotateCcw size={14} /> Texte proposé
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-stone-500">Aucun SMS ne sera envoyé.</p>
                  )}
                </div>

                {smsActif && (
                  <p className="flex items-center gap-2 text-sm text-stone-500 mb-5">
                    <Info size={16} /> Envoyé au {numero} après validation.
                  </p>
                )}
              </>
            )}

            <div className="grid grid-cols-[1fr_2fr] gap-3 mt-2">
              <button
                type="button"
                onClick={() => setOuvert(false)}
                className="rounded-xl border border-stone-300 bg-white py-3.5 font-medium text-stone-800"
              >
                Annuler
              </button>
              <form action={m.action}>
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="sms_texte" value={smsActif ? texte : ""} />
                <BoutonEnvoi enCours={m.enCours} disabled={!!bloque} couleur={m.couleur}>
                  {smsActif ? m.avecSms : m.sansSms}
                </BoutonEnvoi>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}