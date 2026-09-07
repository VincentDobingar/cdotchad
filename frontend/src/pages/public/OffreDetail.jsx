// pages/public/OffreDetail.jsx

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/utils/api";

function formatDate(dateStr) {
  if (!dateStr) return "Non précisée";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "Non précisée";
  return d.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function normalizeOffre(offre) {
  return {
    id: offre?.id,
    titre: offre?.titre ?? "Offre sans titre",
    statut: offre?.statut ?? offre?.etat ?? "",
    etat: offre?.etat ?? "",
    date_publication: offre?.date_publication ?? "",
    date_limite: offre?.date_limite ?? "",
    lieu: offre?.lieu ?? "Non précisé",
    employeur: offre?.employeur ?? "Non précisé",
    type_contrat: offre?.type_contrat ?? "Non précisé",
    type_recrutement: offre?.type_recrutement ?? "externe",
    resume: offre?.resume ?? "",
    description: offre?.description ?? "",
    attributions: offre?.attributions ?? "",
    diplome: offre?.diplome ?? "",
    formation: offre?.formation ?? "",
    experience: offre?.experience ?? "",
    certifications: offre?.certifications ?? "",
    logiciels: offre?.logiciels ?? "",
    affiliations: offre?.affiliations ?? "",
    competences: offre?.competences ?? "",
    langue: offre?.langue ?? "",
    document_url: offre?.document_url ?? null,
  };
}

function getDisplayStatus(offre) {
  const rawStatut = (offre?.statut || "").toLowerCase();
  const rawEtat = (offre?.etat || "").toLowerCase();

  if (rawStatut === "brouillon") {
    return { label: "Brouillon", className: "bg-yellow-100 text-yellow-800" };
  }

  if (rawStatut === "suspendue") {
    return { label: "Suspendue", className: "bg-orange-100 text-orange-800" };
  }

  if (
    rawStatut === "cloturee" ||
    rawStatut === "clôturée" ||
    rawEtat === "expiré" ||
    rawEtat === "expire" ||
    rawEtat === "expirée" ||
    rawEtat === "expiree"
  ) {
    return { label: "Expirée", className: "bg-gray-200 text-gray-700" };
  }

  if (offre?.date_limite) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deadline = new Date(offre.date_limite);
    deadline.setHours(0, 0, 0, 0);

    if (!Number.isNaN(deadline.getTime()) && deadline < today) {
      return { label: "Expirée", className: "bg-gray-200 text-gray-700" };
    }
  }

  if (rawStatut === "publiee" || rawStatut === "publiée") {
    return { label: "Publiée", className: "bg-green-100 text-green-800" };
  }

  return { label: "Active", className: "bg-green-100 text-green-800" };
}

function getRecruitmentLabel(value) {
  return String(value || "").toLowerCase() === "interne" ? "Interne" : "Externe";
}

function buildDocumentUrl(documentUrl) {
  if (!documentUrl) return null;
  if (documentUrl.startsWith("http")) return documentUrl;
  return `${window.location.origin}/backend/uploads/documents/${documentUrl}`;
}

export default function OffreDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [offre, setOffre] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOffre = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await api.get(`/offres/${id}`);
        const raw = res?.data?.data ?? res?.data ?? null;

        if (!raw) {
          throw new Error("Offre introuvable");
        }

        setOffre(normalizeOffre(raw));
      } catch (err) {
        console.error(err);
        setError("Offre introuvable.");
      } finally {
        setLoading(false);
      }
    };

    fetchOffre();
  }, [id]);

  const displayStatus = useMemo(() => {
    return offre ? getDisplayStatus(offre) : null;
  }, [offre]);

  const documentLink = useMemo(() => {
    return offre ? buildDocumentUrl(offre.document_url) : null;
  }, [offre]);

  const isExpired = displayStatus?.label === "Expirée";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert("Lien de l’offre copié.");
    } catch {
      alert("Impossible de copier le lien.");
    }
  };

  if (loading) {
    return <p className="text-center py-10">Chargement...</p>;
  }

  if (error || !offre) {
    return <p className="text-center text-red-500 py-10">{error}</p>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="bg-white border rounded-2xl shadow-sm p-6 md:p-8">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <h1 className="text-3xl font-bold text-red-700">{offre.titre}</h1>

                {displayStatus && (
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${displayStatus.className}`}>
                    {displayStatus.label}
                  </span>
                )}

                <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-800">
                  Recrutement {getRecruitmentLabel(offre.type_recrutement)}
                </span>
              </div>

              <p className="text-gray-600">
                Consultez les détails complets de cette opportunité.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => navigate("/offres")}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700"
              >
                Retour aux offres
              </button>

              <button
                onClick={() => window.print()}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-200"
              >
                Imprimer
              </button>

              <button
                onClick={handleCopy}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-200"
              >
                Copier le lien
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <InfoCard label="Date de publication" value={formatDate(offre.date_publication)} />
            <InfoCard label="Date d’expiration" value={formatDate(offre.date_limite)} />
            <InfoCard label="Lieu" value={offre.lieu} />
            <InfoCard label="Employeur" value={offre.employeur} />
            <InfoCard label="Type de contrat" value={offre.type_contrat} />
            <InfoCard label="Type de recrutement" value={getRecruitmentLabel(offre.type_recrutement)} />
          </div>

          {offre.resume && (
            <SectionCard title="Résumé du poste">
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">{offre.resume}</p>
            </SectionCard>
          )}

          {offre.description && (
            <SectionCard title="Description du poste">
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">{offre.description}</p>
            </SectionCard>
          )}

          {offre.attributions && (
            <SectionCard title="Attributions principales">
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">{offre.attributions}</p>
            </SectionCard>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {offre.diplome && (
              <SectionCard title="Diplôme requis">
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">{offre.diplome}</p>
              </SectionCard>
            )}

            {offre.formation && (
              <SectionCard title="Formation exigée">
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">{offre.formation}</p>
              </SectionCard>
            )}

            {offre.experience && (
              <SectionCard title="Expérience">
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">{offre.experience}</p>
              </SectionCard>
            )}

            {offre.competences && (
              <SectionCard title="Compétences">
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">{offre.competences}</p>
              </SectionCard>
            )}

            {offre.certifications && (
              <SectionCard title="Certifications">
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">{offre.certifications}</p>
              </SectionCard>
            )}

            {offre.logiciels && (
              <SectionCard title="Compétences logicielles">
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">{offre.logiciels}</p>
              </SectionCard>
            )}

            {offre.affiliations && (
              <SectionCard title="Affiliations / accréditations">
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">{offre.affiliations}</p>
              </SectionCard>
            )}

            {offre.langue && (
              <SectionCard title="Langues">
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">{offre.langue}</p>
              </SectionCard>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <button
              onClick={() => navigate(`/postuler/${id}`)}
              disabled={isExpired}
              className={`font-bold py-3 px-6 rounded-xl ${
                isExpired
                  ? "bg-gray-400 text-white cursor-not-allowed"
                  : "bg-red-700 hover:bg-red-800 text-white"
              }`}
            >
              {isExpired ? "Offre expirée" : "Postuler maintenant"}
            </button>

            {documentLink && (
              <a
                href={documentLink}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-xl"
              >
                Télécharger l’offre originale
              </a>
            )}
          </div>

          {isExpired && (
            <p className="text-sm text-red-600">
              La période de candidature est terminée.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
      <p className="text-sm font-medium text-gray-500 mb-2">{label}</p>
      <p className="text-gray-900 font-semibold">{value || "Non précisé"}</p>
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <div className="border rounded-2xl p-5 bg-white shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">{title}</h2>
      {children}
    </div>
  );
}