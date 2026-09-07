// frontend/pages/PostulerEtape.jsx
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function PostulerEtape() {
  const { id } = useParams(); // ID de l’offre depuis l’URL
  const navigate = useNavigate();

  const [offre, setOffre] = useState(null);
  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    telephone: "",
    lien: "",
    commentaire: "",
  });

  const [files, setFiles] = useState({
    cv: null,
    lettre: null,
    diplome: null,
  });

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id || isNaN(parseInt(id))) {
      toast.error("ID d’offre invalide !");
      navigate("/offres"); // Redirection sécurité
      return;
    }

    fetch(`/api/offres/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Offre introuvable");
        return res.json();
      })
      .then(setOffre)
      .catch((err) => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const data = new FormData();
    Object.entries(formData).forEach(([k, v]) => data.append(k, v));
    Object.entries(files).forEach(([k, v]) => data.append(k, v));
    data.append("offre_id", id);

    try {
      const res = await fetch("/api/candidatures", {
        method: "POST",
        body: data,
      });

      if (!res.ok) throw new Error("Erreur de soumission");

      toast.success("Candidature envoyée avec succès !");
      navigate("/candidature/success");
    } catch (err) {
      toast.error("Erreur lors de l'envoi de la candidature.");
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
            <input type="text" name="nom" placeholder="Nom complet" required onChange={handleInput} className="w-full border p-2 rounded" />
            <input type="email" name="email" placeholder="Email" required onChange={handleInput} className="w-full border p-2 rounded" />
            <input type="tel" name="telephone" placeholder="Téléphone" required onChange={handleInput} className="w-full border p-2 rounded" />
            <input type="url" name="lien" placeholder="Lien (LinkedIn, Portfolio...)" onChange={handleInput} className="w-full border p-2 rounded" />
            <textarea name="commentaire" rows="3" placeholder="Commentaire (facultatif)" onChange={handleInput} className="w-full border p-2 rounded" />
            <button type="button" onClick={() => setStep(2)} className="bg-red-600 text-white px-4 py-2 rounded">Suivant</button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <input type="file" name="cv" accept=".pdf" required onChange={handleFile} className="w-full" />
            <input type="file" name="lettre" accept=".pdf" required onChange={handleFile} className="w-full" />
            <input type="file" name="diplome" accept=".pdf" required onChange={handleFile} className="w-full" />
            <div className="flex justify-between mt-4">
              <button type="button" onClick={() => setStep(1)} className="text-blue-600">Retour</button>
              <button type="button" onClick={() => setStep(3)} className="bg-red-600 text-white px-4 py-2 rounded">Suivant</button>
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
            <p><strong>CV :</strong> {files.cv?.name}</p>
            <p><strong>Lettre :</strong> {files.lettre?.name}</p>
            <p><strong>Diplôme :</strong> {files.diplome?.name}</p>

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
