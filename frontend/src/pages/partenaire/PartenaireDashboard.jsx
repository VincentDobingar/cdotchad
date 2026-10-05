// src/pages/partenaire/PartenaireDashboard.jsx
// Espace partenaire : suivi des avis de recrutement soumis et de leur validation.
import { useEffect, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import api from "@/utils/api";
import NotificationsCloche from "@/components/NotificationsCloche";
import { useAuth } from "@/context/AuthContext";
import { STATUTS_MODERATION, statutModerationLabel } from "@/utils/statutModeration";
import { urlPieceJointe } from "@/utils/pieceJointe";

export default function PartenaireDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const [avis, setAvis] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    api
      .get("/partenaire/avis")
      .then(({ data }) => setAvis(data.avis || []))
      .catch(() => setErreur("Impossible de charger vos avis."))
      .finally(() => setChargement(false));
  }, []);

  const formater = (date) => (date ? new Date(date).toLocaleDateString("fr-FR") : "-");

  // Tant que le mot de passe provisoire n'est pas changé, l'espace partenaire reste fermé.
  if (user?.doit_changer_mdp) return <Navigate to="/profile" replace />;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pt-20 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-red-600">Espace partenaire</h2>
          <p className="text-sm text-gray-600">{user?.email}</p>
        </div>
        <div className="flex gap-3 items-center">
          <NotificationsCloche />
          <Link to="/profile" className="text-sm text-blue-600 hover:underline self-center">
            Mot de passe
          </Link>
          <Link to="/partenaire/avis/nouveau" className="bg-red-600 text-white px-4 py-2 rounded text-sm">
            Soumettre un avis
          </Link>
        </div>
      </header>

      {location.state?.message && (
        <div className="text-sm text-green-800 bg-green-50 border border-green-200 rounded p-2">
          {location.state.message}
        </div>
      )}

      <p className="text-sm text-gray-600">
        Chaque avis est relu par l'équipe CDO avant publication. Un avis refusé peut être corrigé puis soumis de
        nouveau.
      </p>

      {chargement && <p className="text-gray-500">Chargement…</p>}
      {erreur && <p className="text-red-600">{erreur}</p>}

      {!chargement && !erreur && avis.length === 0 && (
        <p>Vous n'avez encore soumis aucun avis de recrutement.</p>
      )}

      {!chargement && avis.length > 0 && (
        <ul className="divide-y border rounded">
          {avis.map((a) => (
            <li key={a.id} className="p-4 flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="font-medium">{a.titre}</div>
                <div className="text-sm text-gray-600">
                  {a.lieu || "-"} · Limite : {formater(a.date_limite)} · Soumis le {formater(a.created_at)}
                </div>
                {a.statut_moderation === "refusee" && a.motif_refus && (
                  <div className="text-sm text-red-700">Motif : {a.motif_refus}</div>
                )}
                {a.document_url && (
                  <a
                    href={urlPieceJointe(a.document_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Pièce jointe (PDF)
                  </a>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    STATUTS_MODERATION[a.statut_moderation]?.className || "bg-gray-100 text-gray-700"
                  }`}
                >
                  {statutModerationLabel(a.statut_moderation)}
                </span>
                {a.statut_moderation !== "validee" && (
                  <Link to={`/partenaire/avis/${a.id}/modifier`} className="text-sm text-blue-600 hover:underline">
                    Modifier
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
