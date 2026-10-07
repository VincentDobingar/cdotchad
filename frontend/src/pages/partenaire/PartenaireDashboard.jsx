// src/pages/partenaire/PartenaireDashboard.jsx
// Espace partenaire : suivi des avis de recrutement soumis et de leur validation.
import { useEffect, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { FileText, PlusCircle } from "lucide-react";
import api from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import { STATUTS_MODERATION, statutModerationLabel } from "@/utils/statutModeration";
import { urlPieceJointe } from "@/utils/pieceJointe";

const formater = (date) => (date ? new Date(date).toLocaleDateString("fr-FR") : "-");

function Indicateur({ libelle, valeur, ton }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <p className="text-sm text-slate-500">{libelle}</p>
      <p className={`mt-1 text-3xl font-bold ${ton}`}>{valeur}</p>
    </div>
  );
}

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

  // Tant que le mot de passe provisoire n'est pas changé, l'espace partenaire reste fermé.
  if (user?.doit_changer_mdp) return <Navigate to="/profile" replace />;

  const compte = (statut) => avis.filter((a) => a.statut_moderation === statut).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-slate-600 max-w-xl text-sm">
          Chaque avis est relu par l'équipe CDO avant publication. Un avis refusé peut être corrigé puis soumis de
          nouveau.
        </p>
        <Link
          to="/partenaire/avis/nouveau"
          className="inline-flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          Soumettre un avis
        </Link>
      </div>

      {location.state?.message && (
        <div className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-xl p-3">
          {location.state.message}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Indicateur libelle="Avis soumis" valeur={avis.length} ton="text-slate-900" />
        <Indicateur libelle="En attente" valeur={compte("en_attente")} ton="text-amber-600" />
        <Indicateur libelle="Publiés" valeur={compte("validee")} ton="text-emerald-600" />
        <Indicateur libelle="Refusés" valeur={compte("refusee")} ton="text-red-600" />
      </div>

      {chargement && <p className="text-slate-500">Chargement…</p>}
      {erreur && <p className="text-red-600">{erreur}</p>}

      {!chargement && !erreur && avis.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-sm">
          <FileText className="w-10 h-10 mx-auto text-slate-300" />
          <p className="mt-3 font-medium">Vous n'avez encore soumis aucun avis de recrutement.</p>
        </div>
      )}

      {!chargement && avis.length > 0 && (
        <ul className="grid gap-4">
          {avis.map((a) => (
            <li key={a.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{a.titre}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {a.lieu || "Lieu non précisé"} · Limite : {formater(a.date_limite)} · Soumis le{" "}
                    {formater(a.created_at)}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                    STATUTS_MODERATION[a.statut_moderation]?.className || "bg-slate-100 text-slate-700"
                  }`}
                >
                  {statutModerationLabel(a.statut_moderation)}
                </span>
              </div>

              {a.statut_moderation === "refusee" && a.motif_refus && (
                <p className="mt-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg p-3">
                  Motif du refus : {a.motif_refus}
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                {a.document_url && (
                  <a
                    href={urlPieceJointe(a.document_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-600 hover:text-slate-900 underline-offset-2 hover:underline"
                  >
                    Pièce jointe (PDF)
                  </a>
                )}
                {a.statut_moderation !== "validee" && (
                  <Link
                    to={`/partenaire/avis/${a.id}/modifier`}
                    className="font-medium text-red-700 hover:underline"
                  >
                    Modifier l'avis
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
