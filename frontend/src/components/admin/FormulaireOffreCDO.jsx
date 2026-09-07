// frontend/components/admin/FormulaireOffreCDO.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import jsPDF from "jspdf";
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/utils/api";
import { ajouterOffre, modifierOffre } from "@/utils/adminApi";

const DRAFT_KEY = "formulaire_offre_draft";

const getToday = () => new Date().toISOString().split("T")[0];

const defaultFormData = {
  titre: "",
  statut: "publiee",
  resume: "",
  lieu: "",
  employeur: "CDO Consulting Tchad",
  type_contrat: "CDI",
  type_recrutement: "externe",
  langue: "Français",
  diplome: "",
  description: "",
  attributions: "",
  competences: "",
  formation: "",
  experience: "",
  certifications: "",
  logiciels: "",
  affiliations: "",
  date_publication: getToday(),
  date_limite: "",
};

const fieldLabels = {
  titre: "Titre de l'offre",
  statut: "Statut",
  resume: "Résumé du poste",
  lieu: "Lieu de travail",
  employeur: "Nom de l’employeur",
  type_contrat: "Type de contrat",
  type_recrutement: "Type de recrutement",
  langue: "Langue requise",
  diplome: "Diplôme requis",
  description: "Description du poste",
  attributions: "Attributions principales",
  competences: "Compétences attendues",
  formation: "Formation exigée",
  experience: "Expérience minimale",
  certifications: "Certifications utiles",
  logiciels: "Compétences logicielles",
  affiliations: "Affiliations / accréditations",
  date_publication: "Date de publication",
  date_limite: "Date d’expiration",
};

const fieldMaxLengths = {
  titre: 255,
  lieu: 150,
  type_contrat: 50,
  statut: 30,
  type_recrutement: 20,
};

const groupedFields = [
  {
    title: "Publication",
    keys: ["statut", "date_publication", "date_limite"],
  },
  {
    title: "Informations générales",
    keys: [
      "titre",
      "resume",
      "lieu",
      "employeur",
      "type_contrat",
      "type_recrutement",
      "langue",
      "diplome",
    ],
  },
  {
    title: "Contenu du poste",
    keys: ["description", "attributions", "competences"],
  },
  {
    title: "Exigences",
    keys: ["formation", "experience", "certifications", "logiciels", "affiliations"],
  },
];

function isTextareaField(key) {
  return [
    "resume",
    "description",
    "attributions",
    "competences",
    "formation",
    "experience",
    "certifications",
    "logiciels",
    "affiliations",
    "diplome",
  ].includes(key);
}

function isDateField(key) {
  return ["date_publication", "date_limite"].includes(key);
}

function isSelectField(key) {
  return ["statut", "type_contrat", "type_recrutement"].includes(key);
}

function normalizeIncomingOffre(offre) {
  return {
    ...defaultFormData,
    ...offre,
    statut: offre?.statut ?? "publiee",
    type_contrat: offre?.type_contrat ?? "CDI",
    type_recrutement: offre?.type_recrutement ?? "externe",
    langue: offre?.langue ?? "Français",
    date_publication: offre?.date_publication
      ? String(offre.date_publication).slice(0, 10)
      : getToday(),
    date_limite: offre?.date_limite ? String(offre.date_limite).slice(0, 10) : "",
  };
}

function extractApiError(err) {
  const data = err?.response?.data;

  if (!data) {
    return err?.message || "Erreur lors de l’enregistrement.";
  }

  if (data?.errors && typeof data.errors === "object") {
    const firstError = Object.values(data.errors)[0];
    if (firstError) return String(firstError);
  }

  const parts = [
    data.message,
    data.code ? `Code: ${data.code}` : null,
    data.detail ? `Détail: ${data.detail}` : null,
  ].filter(Boolean);

  return parts.join(" | ") || "Erreur lors de l’enregistrement.";
}

export default function FormulaireOffreCDO() {
  const navigate = useNavigate();
  const { id } = useParams();
  const offreId = id;

  const [formData, setFormData] = useState(() => {
    if (offreId) return defaultFormData;

    const saved = localStorage.getItem(DRAFT_KEY);
    if (!saved) return defaultFormData;

    try {
      return { ...defaultFormData, ...JSON.parse(saved) };
    } catch {
      return defaultFormData;
    }
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingOffre, setLoadingOffre] = useState(false);
  const [documentFile, setDocumentFile] = useState(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (offreId) return;
    localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
  }, [formData, offreId]);

  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
    };
  }, [pdfPreviewUrl]);

  useEffect(() => {
    if (!offreId) return;

    const fetchOffre = async () => {
      try {
        setLoadingOffre(true);
        const response = await api.get(`/offres/${offreId}`);
        const raw = response?.data?.data ?? response?.data ?? {};
        setFormData(normalizeIncomingOffre(raw));
      } catch (err) {
        console.error("Erreur chargement offre :", err);
        toast.error("Impossible de charger l’offre.");
      } finally {
        setLoadingOffre(false);
      }
    };

    fetchOffre();
  }, [offreId]);

  const progressPercent = useMemo(() => {
    return Math.round(((currentStep + 1) / groupedFields.length) * 100);
  }, [currentStep]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const max = fieldMaxLengths[name];

    let nextValue = value;

    if (name === "titre") {
      nextValue = String(nextValue).replace(/\s+/g, " ").trimStart();
    }

    if (typeof max === "number") {
      nextValue = String(nextValue).slice(0, max);
    }

    setFormData((prev) => ({ ...prev, [name]: nextValue }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setDocumentFile(file);
  };

  const resetForm = () => {
    setFormData({
      ...defaultFormData,
      date_publication: getToday(),
    });
    setErrors({});
    setDocumentFile(null);
    setCurrentStep(0);

    if (!offreId) {
      localStorage.removeItem(DRAFT_KEY);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (pdfPreviewUrl) {
      URL.revokeObjectURL(pdfPreviewUrl);
      setPdfPreviewUrl(null);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.titre?.trim() || formData.titre.trim().length < 3) {
      newErrors.titre = "Le titre est requis (3 caractères minimum).";
    } else if (formData.titre.trim().length > 255) {
      newErrors.titre = "Le titre ne doit pas dépasser 255 caractères.";
    }

    if (!formData.resume?.trim() || formData.resume.trim().length < 10) {
      newErrors.resume = "Le résumé doit contenir au moins 10 caractères.";
    }

    if (!formData.description?.trim() || formData.description.trim().length < 20) {
      newErrors.description = "La description doit contenir au moins 20 caractères.";
    }

    if (!formData.lieu?.trim()) {
      newErrors.lieu = "Le lieu est requis.";
    } else if (formData.lieu.trim().length > 150) {
      newErrors.lieu = "Le lieu ne doit pas dépasser 150 caractères.";
    }

    if (formData.type_contrat && formData.type_contrat.length > 50) {
      newErrors.type_contrat = "Le type de contrat ne doit pas dépasser 50 caractères.";
    }

    if (formData.statut && formData.statut.length > 30) {
      newErrors.statut = "Le statut ne doit pas dépasser 30 caractères.";
    }

    if (formData.type_recrutement && formData.type_recrutement.length > 20) {
      newErrors.type_recrutement =
        "Le type de recrutement ne doit pas dépasser 20 caractères.";
    }

    if (!formData.date_publication) {
      newErrors.date_publication = "La date de publication est requise.";
    }

    if (!formData.date_limite) {
      newErrors.date_limite = "La date d’expiration est requise.";
    } else if (
      formData.date_publication &&
      formData.date_limite < formData.date_publication
    ) {
      newErrors.date_limite =
        "La date d’expiration doit être postérieure ou égale à la date de publication.";
    }

    if (!formData.statut) {
      newErrors.statut = "Le statut est requis.";
    }

    if (!formData.type_recrutement) {
      newErrors.type_recrutement = "Le type de recrutement est requis.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generatePDFBlob = async () => {
    const doc = new jsPDF();
    let y = 18;
    const margin = 12;
    const pageHeight = doc.internal.pageSize.height;
    const lineHeight = 7.5;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Fiche de l'offre", margin, y);
    y += 10;

    const addTextBlock = (label, value) => {
      if (y > pageHeight - 25) {
        doc.addPage();
        y = margin;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(`${label}:`, margin, y);
      y += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      const lines = doc.splitTextToSize(String(value || "-"), 180);

      lines.forEach((line) => {
        if (y > pageHeight - 20) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += lineHeight;
      });

      y += 3;
    };

    Object.entries(formData).forEach(([key, value]) => {
      addTextBlock(fieldLabels[key] || key, value);
    });

    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i += 1) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.text(
        `Page ${i} / ${totalPages}`,
        doc.internal.pageSize.width - 35,
        doc.internal.pageSize.height - 10
      );
    }

    return doc.output("blob");
  };

  const handleGeneratePdfPreview = async () => {
    try {
      const blob = await generatePDFBlob();
      const url = URL.createObjectURL(blob);

      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl);
      }

      setPdfPreviewUrl(url);

      const link = document.createElement("a");
      link.href = url;
      link.download = "offre-cdo.pdf";
      link.click();

      toast.success("PDF généré avec succès.");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la génération du PDF.");
    }
  };

  const saveOffre = async ({ redirectAfterSave = false } = {}) => {
    if (!validateForm()) {
      toast.error("Veuillez corriger les erreurs du formulaire.");
      return;
    }

    setLoading(true);

    try {
      const payload = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        payload.append(key, value ?? "");
      });

      // Pendant le debug, le document reste optionnel.
      if (documentFile) {
        payload.append("document", documentFile);
      }

      console.log("Payload envoyé:");
      for (const [key, value] of payload.entries()) {
        console.log(key, value);
      }

      if (offreId) {
        await modifierOffre(offreId, payload);
      } else {
        await ajouterOffre(payload);
      }

      localStorage.removeItem(DRAFT_KEY);

      toast.success(
        offreId ? "Offre modifiée avec succès." : "Offre enregistrée avec succès."
      );

      if (redirectAfterSave) {
        navigate("/admin/offres");
        return;
      }

      if (!offreId) {
        resetForm();
      } else {
        setCurrentStep(0);
      }
    } catch (err) {
      console.error("Erreur enregistrement offre :", err);
      console.error("Status API :", err?.response?.status);
      console.error("Payload API :", err?.response?.data);
      console.error("Message API :", err?.response?.data?.message);
      console.error("Code API :", err?.response?.data?.code);
      console.error("Detail API :", err?.response?.data?.detail);

      toast.error(extractApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await saveOffre({ redirectAfterSave: false });
  };

  if (loadingOffre) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow">
        <p className="text-center text-gray-600">Chargement de l’offre...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-2xl shadow">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-5">
        <div>
          <h2 className="text-2xl font-bold text-red-700">
            {offreId ? "Modifier une offre" : "Ajouter une offre"}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Formulaire principal de création et de modification des offres.
          </p>
        </div>

        <button
          type="button"
          onClick={resetForm}
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-200"
        >
          Réinitialiser
        </button>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
        <div
          className="bg-red-600 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <p className="text-sm text-gray-600 mb-5 text-right">
        Étape {currentStep + 1} sur {groupedFields.length}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
        {groupedFields.map((section, index) => (
          <button
            type="button"
            key={section.title}
            onClick={() => setCurrentStep(index)}
            className={`text-center py-2 px-2 rounded-xl border font-medium text-sm transition ${
              currentStep === index
                ? "border-red-600 bg-red-50 text-red-700"
                : "border-gray-200 text-gray-500 hover:bg-gray-50"
            }`}
          >
            {section.title}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <fieldset className="border p-4 rounded-2xl">
          <legend className="font-semibold text-lg text-gray-700 px-2">
            {groupedFields[currentStep].title}
          </legend>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            {groupedFields[currentStep].keys.map((key) => (
              <div
                key={key}
                className={isTextareaField(key) ? "md:col-span-2" : ""}
              >
                <label className="block font-medium text-gray-700 mb-1.5">
                  {fieldLabels[key] || key}
                </label>

                {isSelectField(key) ? (
                  <select
                    name={key}
                    value={formData[key]}
                    onChange={handleChange}
                    className="w-full border p-2.5 rounded-xl bg-white"
                  >
                    {key === "statut" && (
                      <>
                        <option value="brouillon">Brouillon</option>
                        <option value="publiee">Publiée</option>
                        <option value="suspendue">Suspendue</option>
                        <option value="cloturee">Clôturée</option>
                      </>
                    )}

                    {key === "type_contrat" && (
                      <>
                        <option value="">Sélectionner</option>
                        <option value="CDI">CDI</option>
                        <option value="CDD">CDD</option>
                        <option value="Stage">Stage</option>
                        <option value="Consultance">Consultance</option>
                        <option value="Freelance">Freelance</option>
                        <option value="Temps plein">Temps plein</option>
                        <option value="Temps partiel">Temps partiel</option>
                      </>
                    )}

                    {key === "type_recrutement" && (
                      <>
                        <option value="externe">Externe</option>
                        <option value="interne">Interne</option>
                      </>
                    )}
                  </select>
                ) : isTextareaField(key) ? (
                  <textarea
                    name={key}
                    value={formData[key]}
                    onChange={handleChange}
                    rows={key === "description" ? 6 : 4}
                    className="w-full border p-3 rounded-xl"
                  />
                ) : (
                  <input
                    type={isDateField(key) ? "date" : "text"}
                    name={key}
                    value={formData[key]}
                    onChange={handleChange}
                    maxLength={fieldMaxLengths[key] || undefined}
                    className="w-full border p-2.5 rounded-xl"
                  />
                )}

                {errors[key] && (
                  <p className="text-red-600 text-sm mt-1">{errors[key]}</p>
                )}

                {fieldMaxLengths[key] && (
                  <p className="text-xs text-gray-500 mt-1 text-right">
                    {String(formData[key] || "").length}/{fieldMaxLengths[key]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </fieldset>

        <div className="border p-4 rounded-2xl">
          <label className="block font-medium text-gray-700 mb-1.5">
            Document de l’offre
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
            onChange={handleFileChange}
            className="w-full border p-2.5 rounded-xl"
          />

          <p className="text-sm text-gray-500 mt-2">
            Le document est optionnel. Tu peux aussi générer un PDF localement
            avec le bouton ci-dessous.
          </p>

          {documentFile && (
            <p className="text-sm text-green-700 mt-2">
              Fichier sélectionné : {documentFile.name}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <button
            type="button"
            disabled={currentStep === 0}
            onClick={() => setCurrentStep((prev) => prev - 1)}
            className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
          >
            Précédent
          </button>

          <div className="flex flex-wrap gap-3 justify-end">
            <button
              type="button"
              onClick={handleGeneratePdfPreview}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700"
            >
              Télécharger PDF
            </button>

            {currentStep < groupedFields.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev + 1)}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
              >
                Suivant
              </button>
            ) : (
              <>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 flex items-center disabled:opacity-50"
                >
                  {loading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                  {loading ? "Enregistrement..." : "Enregistrer"}
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => saveOffre({ redirectAfterSave: true })}
                  className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 flex items-center disabled:opacity-50"
                >
                  {loading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                  {loading
                    ? "Enregistrement..."
                    : "Enregistrer et revenir à la liste"}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="mt-4 border p-4 rounded-2xl">
          <h4 className="font-semibold text-sm mb-2">Aperçu du PDF</h4>

          {pdfPreviewUrl ? (
            <iframe
              src={pdfPreviewUrl}
              className="w-full h-80 border rounded-xl"
              title="Aperçu PDF"
            />
          ) : (
            <p className="text-gray-500 text-sm italic">
              Aucun PDF généré pour l'instant.
            </p>
          )}
        </div>
      </form>
    </div>
  );
}