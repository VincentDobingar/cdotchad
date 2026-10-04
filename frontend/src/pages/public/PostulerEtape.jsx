// frontend/pages/PostulerEtape.jsx
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "@/utils/api";
import { useAuth } from "@/context/AuthContext";

// Pièces demandées : clé = nom du champ envoyé au backend
const PIECES = [
  { cle: "cv", label: "CV" },
  { cle: "lettre", label: "Lettre de motivation" },
  { cle: "diplome", label: "Diplôme" },
];

export default function PostulerEtape() {
  const { id } = useParams(); // ID de l’offre depuis l’URL
  const navigate = useNavigate();
  const { user } = useAuth();
  const estCandidat = user?.role === "candidat";

  const [offre, setOffre] = useState(null);
  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    telephone: "",
    lien: "",
    commentaire: "",
  });
  // Documents déjà enregistrés dans le profil du candidat, par type (cv, lettre, diplome)
  const [documentsEnregistres, setDocumentsEnregistres] = useState({});

  const [files, setFiles] = useState({
    cv: null,
    lettre: null,
    diplome: null,
  });

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Pré-remplissage depuis le profil candidat (si connecté)
  useEffect(() => {
    if (!estCandidat) return;

    api
      .get("/candidat/profil")
      .then(({ data }) => {
        const p = data.profil || {};
        setFormData((prev) => ({
          ...prev,
          nom: prev.nom || `${p.prenom || ""} ${p.nom || ""}`.trim(),
          email: prev.email || p.email || "",
          telephone: prev.telephone || p.telephone || "",
        }));
      })
      .catch(() => {});

    api
      .get("/candidat/documents")
      .then(({ data }) => {
        const parType = {};
        (data.documents || []).forEach((d) => {
          if (!parType[d.type]) parType[d.type] = d; // le plus récent (tri côté serveur)
        });
        setDocumentsEnregistres(parType);
      })
      .catch(() => {});
  }, [estCandidat]);

  useEffect(() => {
    if (user && !estCandidat) {
      setFormData((prev) => ({
        ...prev,
        nom: prev.nom || `${user.prenom || ""} ${user.nom || ""}`.trim(),
        email: prev.email || user.email || "",
      }));
    }
  }, [user, estCandidat]);

  useEffect(() => {
    if (!id || isNaN(parseInt(id))) {
      toast.error("ID d’offre invalide !");
      navigate("/offres"); // Redirection sécurité
      return;
    }

    api
      .get(`/offres/${id}`)
      .then((res) => setOffre(res?.data?.data ?? res?.data))
      .catch(() => {
        toast.error("Offre introuvable.");
        navigate("/offres");
      });
  }, [id]);

  const handleInput = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFile = (e) => {
    setFiles((prev) => ({ ...prev, [e.target.name]: e.target.files[0] }));
  };

  // Une pièce est fournie si un fichier est joint ou si un document enregistré existe
  const pieceFournie = (cle) => Boolean(files[cle] || documentsEnregistres[cle]);
  const toutesLesPiecesFournies = PIECES.every((p) => pieceFournie(p.cle));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const data = new FormData();
    Object.entries(formData).forEach(([k, v]) => data.append(k, v));
    // Un fichier vide n'est pas envoyé : le backend utilisera le document enregistré
    Object.entries(files).forEach(([k, v]) => v && data.append(k, v));
    data.append("offre_id", id);

    try {
      await api.post("/candidatures", data);

      toast.success("Candidature envoyée avec succès !");
      navigate("/candidature/success");
    } catch (err) {
      toast.error(err.response?.data?.error || "Erreur lors de l'envoi de la candidature.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!offre) return <div className="text-center mt-10 text-gray-500">Chargement de l'offre...</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pt-20">
      <h2 className="text-xl font-bold text-red-600 mb-4">
        Postuler à : {offre.titre}
      </h2>

      {/* Barre d’étapes */}
      <div className="flex justify-between items-center mb-6 text-sm">
        <div className={`w-1/3 text-center ${step === 1 ? "font-bold text-red-600" : ""}`}>Informations</div>
        <div className={`w-1/3 text-center ${step === 2 ? "font-bold text-red-600" : ""}`}>Documents</div>
        <div className={`w-1/3 text-center ${step === 3 ? "font-bold text-red-600" : ""}`}>Confirmation</div>
      </div>

      <form onSubmit={handleSubmit} encType="multipart/form-data">
        {step === 1 && (
          <div className="space-y-4">
            <input type="text" name="nom" placeholder="Nom complet" required value={formData.nom} onChange={handleInput} className="w-full border p-2 rounded" />
            <input type="email" name="email" placeholder="Email" required value={formData.email} onChange={handleInput} className="w-full border p-2 rounded" />
            <input type="tel" name="telephone" placeholder="Téléphone" required value={formData.telephone} onChange={handleInput} className="w-full border p-2 rounded" />
            <input type="url" name="lien" placeholder="Lien (LinkedIn, Portfolio...)" value={formData.lien} onChange={handleInput} className="w-full border p-2 rounded" />
            <textarea name="commentaire" rows="3" placeholder="Commentaire (facultatif)" value={formData.commentaire} onChange={handleInput} className="w-full border p-2 rounded" />
            <button type="button" onClick={() => setStep(2)} className="bg-red-600 text-white px-4 py-2 rounded">Suivant</button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            {PIECES.map(({ cle, label }) => {
              const enregistre = documentsEnregistres[cle];
              return (
                <div key={cle} className="space-y-1">
                  <label className="block text-sm font-medium">{label}</label>
                  {enregistre && (
                    <p className="text-sm text-green-700">
                      Document enregistré : {enregistre.nom_original}. Laissez vide pour l'utiliser, ou joignez un
                      autre PDF pour cette candidature seulement.
                    </p>
                  )}
                  <input
                    type="file"
                    name={cle}
                    accept=".pdf"
                    required={!enregistre}
                    onChange={handleFile}
                    className="w-full"
                  />
                </div>
              );
            })}
            <div className="flex justify-between mt-4">
              <button type="button" onClick={() => setStep(1)} className="text-blue-600">Retour</button>
              <button
                type="button"
                disabled={!toutesLesPiecesFournies}
                onClick={() => setStep(3)}
                className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p><strong>Nom :</strong> {formData.nom}</p>
            <p><strong>Email :</strong> {formData.email}</p>
            <p><strong>Téléphone :</strong> {formData.telephone}</p>
            <p><strong>Lien :</strong> {formData.lien || "-"}</p>
            <p><strong>Commentaire :</strong> {formData.commentaire || "-"}</p>
            {PIECES.map(({ cle, label }) => (
              <p key={cle}>
                <strong>{label} :</strong>{" "}
                {files[cle]?.name || documentsEnregistres[cle]?.nom_original || "-"}
                {!files[cle] && documentsEnregistres[cle] && <span className="text-gray-500"> (enregistré)</span>}
              </p>
            ))}

            <div className="flex justify-between mt-4">
              <button type="button" onClick={() => setStep(2)} className="text-blue-600">Retour</button>
              <button type="submit" disabled={submitting} className="bg-green-600 text-white px-4 py-2 rounded">
                {submitting ? "Envoi..." : "Envoyer la candidature"}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
