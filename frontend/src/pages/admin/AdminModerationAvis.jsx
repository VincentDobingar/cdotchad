// src/pages/admin/AdminModerationAvis.jsx
// File de modération des avis de recrutement soumis par les partenaires.
import { useEffect, useState } from "react";
import api from "@/utils/api";
import toast from "react-hot-toast";
import { STATUTS_MODERATION, statutModerationLabel } from "@/utils/statutModeration";
import { urlPieceJointe } from "@/utils/pieceJointe";

const ONGLETS = ["en_attente", "validee", "refusee"];
const MOTIF_MIN = 5;

export default function AdminModerationAvis() {
  const [statut, setStatut] = useState("en_attente");
  const [avis, setAvis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ouvert, setOuvert] = useState(null); // id de l'avis dont on affiche le détail
  const [refus, setRefus] = useState(null); // { id, motif } : refus en cours de rédaction
  const [envoi, setEnvoi] = useState(false);

  const charger = (s = statut) => {
    setLoading(true);
    api
      .get("/offres/moderation", { params: { statut: s } })
      .then(({ data }) => setAvis(data.avis || []))
      .catch(() => toast.error("Impossible de charger les avis"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setRefus(null);
    charger(statut);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statut]);

  const decider = async (a, decision, motif = null) => {
    setEnvoi(true);
    try {
      await api.patch(`/offres/${a.id}/moderation`, { decision, motif });
      toast.success(decision === "validee" ? "Avis publié" : "Avis refusé");
      setRefus(null);
      charger();
    } catch (err) {
      toast.error(err.response?.data?.message || "Décision impossible");
    } finally {
      setEnvoi(false);
    }
  };

  const formater = (date) => (date ? new Date(date).toLocaleDateString("fr-FR") : "-");

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold tracking-tight text-slate-900">Modération des avis</h2>
      <p className="text-sm text-gray-600">
        Un avis validé est publié sur le site. Un avis refusé retourne au partenaire avec votre motif.
      </p>

      <div className="flex gap-2 border-b">
        {ONGLETS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatut(s)}
            className={`px-4 py-2 -mb-px border-b-2 text-sm ${
              statut === s ? "border-red-600 text-red-600 font-semibold" : "border-transparent text-gray-600"
            }`}
          >
            {statutModerationLabel(s)}
          </button>
        ))}
      </div>

      {loading ? (
        <p>Chargement…</p>
      ) : avis.length === 0 ? (
        <p>Aucun avis dans cette catégorie.</p>
      ) : (
        <ul className="space-y-3">
          {avis.map((a) => (
            <li key={a.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 space-y-3 dark:bg-slate-900">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">{a.titre}</div>
                  <div className="text-sm text-gray-600">
                    {a.partenaire_nom || "Partenaire supprimé"} · {a.lieu || "-"} · Limite : {formater(a.date_limite)}
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    STATUTS_MODERATION[a.statut_moderation]?.className || "bg-gray-100 text-gray-700"
                  }`}
                >
                  {statutModerationLabel(a.statut_moderation)}
                </span>
              </div>

              {a.motif_refus && <p className="text-sm text-red-700">Motif : {a.motif_refus}</p>}

              <div className="flex flex-wrap gap-4 text-sm">
                <button type="button" onClick={() => setOuvert(ouvert === a.id ? null : a.id)} className="text-red-700 font-medium hover:underline">
                  {ouvert === a.id ? "Masquer le détail" : "Voir le détail"}
                </button>
                {a.document_url && (
                  <a href={urlPieceJointe(a.document_url)} target="_blank" rel="noopener noreferrer" className="text-red-700 font-medium hover:underline">
                    Pièce jointe (PDF)
                  </a>
                )}
              </div>
              {ouvert === a.id && (
                <div className="text-sm space-y-2 border-t pt-2">
                  <p><strong>Résumé :</strong> {a.resume}</p>
                  <p className="whitespace-pre-line"><strong>Description :</strong> {a.description}</p>
                  {a.attributions && <p className="whitespace-pre-line"><strong>Attributions :</strong> {a.attributions}</p>}
                </div>
              )}

              {refus?.id === a.id ? (
                <div className="space-y-2 border-t pt-3">
                  <label className="block text-sm font-medium">
                    Motif du refus (visible par le partenaire, {MOTIF_MIN} caractères minimum)
                  </label>
                  <textarea
                    rows={3}
                    value={refus.motif}
                    onChange={(e) => setRefus({ id: a.id, motif: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                    autoFocus
                  />
                  <div className="flex gap-3">
                    <button
                      type="button"
                      disabled={envoi || refus.motif.trim().length < MOTIF_MIN}
                      onClick={() => decider(a, "refusee", refus.motif.trim())}
                      className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                      Confirmer le refus
                    </button>
                    <button type="button" onClick={() => setRefus(null)} className="text-sm text-gray-600 underline">
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3 pt-1">
                  {statut !== "validee" && (
                    <button
                      type="button"
                      disabled={envoi}
                      onClick={() => decider(a, "validee")}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                      Valider et publier
                    </button>
                  )}
                  {statut !== "refusee" && (
                    <button
                      type="button"
                      disabled={envoi}
                      onClick={() => setRefus({ id: a.id, motif: "" })}
                      className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                      Refuser
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
