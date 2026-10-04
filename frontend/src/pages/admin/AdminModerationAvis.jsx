// src/pages/admin/AdminModerationAvis.jsx
// File de modération des avis de recrutement soumis par les partenaires.
import { useEffect, useState } from "react";
import api from "@/utils/api";
import toast from "react-hot-toast";
import { STATUTS_MODERATION, statutModerationLabel } from "@/utils/statutModeration";

const ONGLETS = ["en_attente", "validee", "refusee"];

export default function AdminModerationAvis() {
  const [statut, setStatut] = useState("en_attente");
  const [avis, setAvis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ouvert, setOuvert] = useState(null); // id de l'avis dont on détaille la description

  const charger = (s = statut) => {
    setLoading(true);
    api
      .get("/offres/moderation", { params: { statut: s } })
      .then(({ data }) => setAvis(data.avis || []))
      .catch(() => toast.error("Impossible de charger les avis"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    charger(statut);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statut]);

  const decider = async (a, decision) => {
    let motif = null;
    if (decision === "refusee") {
      motif = window.prompt(`Motif du refus pour « ${a.titre} » (visible par le partenaire) :`);
      if (!motif || motif.trim().length < 5) {
        if (motif !== null) toast.error("Le motif doit contenir au moins 5 caractères.");
        return;
      }
    }
    try {
      await api.patch(`/offres/${a.id}/moderation`, { decision, motif });
      toast.success(decision === "validee" ? "Avis publié" : "Avis refusé");
      charger();
    } catch (err) {
      toast.error(err.response?.data?.message || "Décision impossible");
    }
  };

  const formater = (date) => (date ? new Date(date).toLocaleDateString("fr-FR") : "-");

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-indigo-700">Modération des avis</h2>
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
            <li key={a.id} className="border rounded p-4 bg-white dark:bg-gray-800 space-y-2">
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

              <button type="button" onClick={() => setOuvert(ouvert === a.id ? null : a.id)} className="text-sm text-blue-600 hover:underline">
                {ouvert === a.id ? "Masquer le détail" : "Voir le détail"}
              </button>
              {ouvert === a.id && (
                <div className="text-sm space-y-2 border-t pt-2">
                  <p><strong>Résumé :</strong> {a.resume}</p>
                  <p className="whitespace-pre-line"><strong>Description :</strong> {a.description}</p>
                  {a.attributions && <p className="whitespace-pre-line"><strong>Attributions :</strong> {a.attributions}</p>}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                {statut !== "validee" && (
                  <button type="button" onClick={() => decider(a, "validee")} className="bg-green-600 text-white px-3 py-1 rounded text-sm">
                    Valider et publier
                  </button>
                )}
                {statut !== "refusee" && (
                  <button type="button" onClick={() => decider(a, "refusee")} className="bg-red-600 text-white px-3 py-1 rounded text-sm">
                    Refuser
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
