// src/pages/public/MesCandidatureDetail.jsx
// Détail complet d'une candidature du candidat connecté (#2).
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, FileText, Download } from "lucide-react";
import api from "@/utils/api";
import { STATUTS, statutLabel } from "@/utils/statutCandidature";

// uploads/cv/xxx.pdf -> /backend/uploads/cv/xxx.pdf (même origine)
function urlPiece(p) {
  if (!p) return null;
  let v = String(p).trim().replace(/^\/+/, "").replace(/^api\//i, "").replace(/^backend\//i, "");
  return `${window.location.origin}/backend/${v}`;
}

const PIECES = [
  { champ: "cv_path", label: "Curriculum Vitae" },
  { champ: "lettre_path", label: "Lettre de motivation" },
  { champ: "diplome_path", label: "Diplôme" },
];

export default function MesCandidatureDetail() {
  const { id } = useParams();
  const [c, setC] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    api
      .get(`/candidatures/mes-candidatures/${id}`)
      .then((res) => setC(res.data?.candidature || null))
      .catch((e) =>
        setErr(e?.response?.status === 404 ? "Candidature introuvable." : "Impossible de charger cette candidature.")
      )
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-graphite/70">Chargement…</p>;
  if (err) return (
    <div>
      <p className="text-rougeprofond">{err}</p>
      <Link to="/mes-candidatures" className="mt-4 inline-flex items-center gap-1.5 text-sm text-rouge font-semibold hover:text-rougeprofond hover:underline underline-offset-4">
        <ArrowLeft className="w-4 h-4" /> Retour à mes candidatures
      </Link>
    </div>
  );
  if (!c) return null;

  return (
    <div className="space-y-6">
      <Link to="/mes-candidatures" className="inline-flex items-center gap-1.5 text-sm text-rouge font-semibold hover:text-rougeprofond hover:underline underline-offset-4">
        <ArrowLeft className="w-4 h-4" /> Retour à mes candidatures
      </Link>

      <div className="bg-white rounded-2xl border border-sable shadow-sm p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl text-encre">{c.titre_offre || "Offre supprimée"}</h2>
            <p className="mt-1 text-sm text-graphite/70">
              {[c.employeur, c.lieu].filter(Boolean).join(" · ")}
            </p>
            <p className="mt-1 text-sm text-graphite/70">
              Candidature du {new Date(c.date_candidature).toLocaleDateString("fr-FR")}
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              STATUTS[c.statut]?.className || "bg-sable text-encre"
            }`}
          >
            {statutLabel(c.statut)}
          </span>
        </div>

        {c.code_suivi && (
          <div className="mt-4 text-sm">
            <span className="text-graphite/70">Code de suivi : </span>
            <span className="font-mono font-semibold text-encre">{c.code_suivi}</span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-sable shadow-sm p-6">
        <h3 className="font-display text-xl text-encre mb-4">Informations fournies</h3>
        <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <div><dt className="text-graphite/70">Nom</dt><dd className="font-medium text-encre">{c.nom || "—"}</dd></div>
          <div><dt className="text-graphite/70">E-mail</dt><dd className="font-medium text-encre break-all">{c.email || "—"}</dd></div>
          <div><dt className="text-graphite/70">Téléphone</dt><dd className="font-medium text-encre">{c.telephone || "—"}</dd></div>
          <div><dt className="text-graphite/70">Lien</dt><dd className="font-medium text-encre break-all">{c.lien || "—"}</dd></div>
          <div className="sm:col-span-2"><dt className="text-graphite/70">Commentaire</dt><dd className="font-medium text-encre whitespace-pre-line">{c.commentaire || "—"}</dd></div>
        </dl>
      </div>

      <div className="bg-white rounded-2xl border border-sable shadow-sm p-6">
        <h3 className="font-display text-xl text-encre mb-4">Pièces jointes</h3>
        <ul className="space-y-2">
          {PIECES.map(({ champ, label }) => {
            const href = urlPiece(c[champ]);
            return (
              <li key={champ} className="flex items-center justify-between gap-3 border border-sable rounded-lg px-4 py-2.5">
                <span className="flex items-center gap-2 text-sm text-graphite">
                  <FileText className="w-4 h-4 text-graphite/50" /> {label}
                </span>
                {href ? (
                  <a href={href} target="_blank" rel="noopener noreferrer"
                     className="inline-flex items-center gap-1.5 text-sm text-rouge font-semibold hover:text-rougeprofond hover:underline underline-offset-4">
                    <Download className="w-4 h-4" /> Télécharger
                  </a>
                ) : (
                  <span className="text-xs text-graphite/50">Non fournie</span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
