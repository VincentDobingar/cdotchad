// src/components/formation/FormulaireSession.jsx
// Formulaire d'une session (cohorte) : dates, places, tarif, règles du certificat.
import { useState } from "react";
import { Bouton, Champ, champCls } from "./AdminUi";

const VIDE = {
  intitule: "",
  date_debut: "",
  date_fin: "",
  places_max: "",
  tarif_fcfa: 0,
  mode_inscription: "automatique",
  statut: "ouverte",
  seuil_presence: 80,
  seuil_note: 70,
  regle_absence: "presence_ou_replay",
  replay_telechargeable: false,
  conservation_replays_jours: "",
};

export default function FormulaireSession({ initial, onEnregistrer, onAnnuler }) {
  const [v, setV] = useState({ ...VIDE, ...Object.fromEntries(Object.entries(initial || {}).map(([k, x]) => [k, x ?? ""])) });
  const [envoi, setEnvoi] = useState(false);
  const maj = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const soumettre = async (e) => {
    e.preventDefault();
    setEnvoi(true);
    try {
      await onEnregistrer({
        intitule: v.intitule,
        date_debut: v.date_debut || null,
        date_fin: v.date_fin || null,
        places_max: v.places_max === "" ? null : Number(v.places_max),
        tarif_fcfa: Number(v.tarif_fcfa) || 0,
        mode_inscription: v.mode_inscription,
        statut: v.statut,
        seuil_presence: Number(v.seuil_presence),
        seuil_note: Number(v.seuil_note),
        regle_absence: v.regle_absence,
        replay_telechargeable: v.replay_telechargeable,
        conservation_replays_jours: v.conservation_replays_jours === "" ? null : Number(v.conservation_replays_jours),
      });
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <form onSubmit={soumettre} className="grid gap-4 sm:grid-cols-2">
      <Champ label="Intitulé *" className="sm:col-span-2">
        <input required value={v.intitule} onChange={maj("intitule")} className={champCls} placeholder="Session de janvier 2027" />
      </Champ>
      <Champ label="Date de début"><input type="date" value={String(v.date_debut).slice(0, 10)} onChange={maj("date_debut")} className={champCls} /></Champ>
      <Champ label="Date de fin"><input type="date" value={String(v.date_fin).slice(0, 10)} onChange={maj("date_fin")} className={champCls} /></Champ>
      <Champ label="Places" aide="Vide = illimité"><input type="number" min="1" value={v.places_max} onChange={maj("places_max")} className={champCls} /></Champ>
      <Champ label="Tarif (FCFA)" aide="0 = gratuite. Payante : inscription validée à réception du paiement.">
        <input type="number" min="0" step="500" value={v.tarif_fcfa} onChange={maj("tarif_fcfa")} className={champCls} />
      </Champ>
      <Champ label="Validation des inscriptions (gratuites)">
        <select value={v.mode_inscription} onChange={maj("mode_inscription")} className={champCls}>
          <option value="automatique">Automatique</option>
          <option value="manuelle">Par l'administration</option>
        </select>
      </Champ>
      <Champ label="Statut">
        <select value={v.statut} onChange={maj("statut")} className={champCls}>
          <option value="ouverte">Inscriptions ouvertes</option>
          <option value="fermee">Inscriptions fermées</option>
          <option value="terminee">Terminée</option>
          <option value="annulee">Annulée</option>
        </select>
      </Champ>
      <Champ label="Présence minimale (%)"><input type="number" min="0" max="100" value={v.seuil_presence} onChange={maj("seuil_presence")} className={champCls} /></Champ>
      <Champ label="Note de réussite (%)"><input type="number" min="0" max="100" value={v.seuil_note} onChange={maj("seuil_note")} className={champCls} /></Champ>
      <Champ label="Absence à un direct" className="sm:col-span-2">
        <select value={v.regle_absence} onChange={maj("regle_absence")} className={champCls}>
          <option value="presence_ou_replay">Rattrapable : la séance compte si son replay est vu en entier</option>
          <option value="presence">Non rattrapable : seule la présence en direct compte</option>
        </select>
      </Champ>
      <Champ label="Conservation des replays (jours)" aide="Vide = sans limite">
        <input type="number" min="1" value={v.conservation_replays_jours} onChange={maj("conservation_replays_jours")} className={champCls} />
      </Champ>
      <label className="flex items-center gap-2 text-sm text-gray-700 self-end pb-2">
        <input type="checkbox" checked={Boolean(v.replay_telechargeable)} onChange={maj("replay_telechargeable")} className="rounded text-red-600 focus:ring-red-600" />
        Autoriser le téléchargement des replays
      </label>
      <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
        {onAnnuler && <Bouton variante="secondaire" onClick={onAnnuler}>Annuler</Bouton>}
        <Bouton type="submit" disabled={envoi}>{envoi ? "Enregistrement…" : "Enregistrer"}</Bouton>
      </div>
    </form>
  );
}
