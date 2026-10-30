// frontend/pages/PostulerEtape.jsx
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Check } from "lucide-react";
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
      const reponse = await api.post("/candidatures", data);

      toast.success("Candidature envoyée avec succès !");
      navigate("/candidature/success", { state: { code: reponse?.data?.code_suivi } });
    } catch (err) {
      toast.error(err.response?.data?.error || "Erreur lors de l'envoi de la candidature.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!offre) return <div className="pt-28 text-center text-graphite/70">Chargement de l'offre…</div>;

  const champ =
    "w-full border border-sable rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-rouge focus:border-rouge";
  const ETAPES = ["Informations", "Documents", "Confirmation"];

  return (
    <div className="min-h-screen bg-ivoire pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <p className="inline-flex items-center gap-2 text-sm font-medium text-rouge">
          <span className="h-px w-6 bg-rouge/60" aria-hidden="true" />
          Candidature
        </p>
        <h1 className="mt-2 font-display text-3xl text-encre tracking-tight">{offre.titre}</h1>

        {/* Indicateur d'étapes */}
        <ol className="mt-6 flex items-center gap-2">
          {ETAPES.map((label, i) => {
            const numero = i + 1;
            const fait = step > numero;
            const actif = step === numero;
            return (
              <li key={label} className="flex-1 flex items-center gap-2">
                <span
                  className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                    fait ? "bg-emerald-600 text-white" : actif ? "bg-rouge text-white" : "bg-sable text-graphite"
                  }`}
                >
                  {fait ? <Check className="w-4 h-4" /> : numero}
                </span>
                <span className={`text-sm truncate ${actif ? "font-semibold text-encre" : "text-graphite/70"}`}>
                  {label}
                </span>
                {i < ETAPES.length - 1 && <span className="flex-1 h-px bg-sable hidden sm:block" />}
              </li>
            );
          })}
        </ol>

        <form
          onSubmit={handleSubmit}
          encType="multipart/form-data"
          className="mt-6 bg-white rounded-2xl border border-sable shadow-sm p-6 md:p-8"
        >
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold">Vos informations</h2>
              <label className="block">
                <span className="block mb-1 text-sm font-medium text-encre">Nom complet *</span>
                <input type="text" name="nom" required value={formData.nom} onChange={handleInput} className={champ} />
              </label>
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="block mb-1 text-sm font-medium text-encre">Adresse e-mail *</span>
                  <input type="email" name="email" required value={formData.email} onChange={handleInput} className={champ} />
                </label>
                <label className="block">
                  <span className="block mb-1 text-sm font-medium text-encre">Téléphone *</span>
                  <input type="tel" name="telephone" required value={formData.telephone} onChange={handleInput} className={champ} />
                </label>
              </div>
              <label className="block">
                <span className="block mb-1 text-sm font-medium text-encre">Lien (LinkedIn, portfolio…)</span>
                <input type="url" name="lien" value={formData.lien} onChange={handleInput} className={champ} />
              </label>
              <label className="block">
                <span className="block mb-1 text-sm font-medium text-encre">Commentaire (facultatif)</span>
                <textarea name="commentaire" rows="3" value={formData.commentaire} onChange={handleInput} className={champ} />
              </label>
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="bg-rouge hover:bg-rougeprofond text-white px-5 py-2.5 rounded-full font-semibold shadow-sm"
                >
                  Continuer
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Vos documents</h2>
              {PIECES.map(({ cle, label }) => {
                const enregistre = documentsEnregistres[cle];
                return (
                  <div key={cle} className="rounded-xl border border-sable p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-encre">{label} *</span>
                      {enregistre && (
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          Enregistré
                        </span>
                      )}
                    </div>
                    {enregistre && (
                      <p className="text-sm text-graphite/70">
                        {enregistre.nom_original}. Laissez vide pour l'utiliser, ou joignez un autre PDF pour cette
                        candidature seulement.
                      </p>
                    )}
                    <input
                      type="file"
                      name={cle}
                      accept=".pdf"
                      required={!enregistre}
                      onChange={handleFile}
                      className="block w-full text-sm text-graphite file:mr-4 file:rounded-lg file:border-0 file:bg-sable file:px-4 file:py-2 file:text-sm file:font-medium hover:file:bg-sable"
                    />
                  </div>
                );
              })}
              <div className="flex justify-between pt-2">
                <button type="button" onClick={() => setStep(1)} className="text-sm font-medium text-graphite hover:text-encre px-3 py-2">
                  Retour
                </button>
                <button
                  type="button"
                  disabled={!toutesLesPiecesFournies}
                  onClick={() => setStep(3)}
                  className="bg-rouge hover:bg-rougeprofond text-white px-5 py-2.5 rounded-full font-semibold shadow-sm disabled:opacity-50"
                >
                  Continuer
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Vérifiez votre candidature</h2>
              <dl className="divide-y divide-sable rounded-xl border border-sable text-sm">
                {[
                  ["Nom", formData.nom],
                  ["E-mail", formData.email],
                  ["Téléphone", formData.telephone],
                  ["Lien", formData.lien || "-"],
                  ["Commentaire", formData.commentaire || "-"],
                ].map(([libelle, valeur]) => (
                  <div key={libelle} className="grid grid-cols-3 gap-4 p-3">
                    <dt className="text-graphite/70">{libelle}</dt>
                    <dd className="col-span-2 break-words">{valeur}</dd>
                  </div>
                ))}
                {PIECES.map(({ cle, label }) => (
                  <div key={cle} className="grid grid-cols-3 gap-4 p-3">
                    <dt className="text-graphite/70">{label}</dt>
                    <dd className="col-span-2 break-words">
                      {files[cle]?.name || documentsEnregistres[cle]?.nom_original || "-"}
                      {!files[cle] && documentsEnregistres[cle] && (
                        <span className="text-graphite/70"> (enregistré)</span>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="flex justify-between pt-2">
                <button type="button" onClick={() => setStep(2)} className="text-sm font-medium text-graphite hover:text-encre px-3 py-2">
                  Retour
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-full font-semibold shadow-sm disabled:opacity-60"
                >
                  {submitting ? "Envoi…" : "Envoyer la candidature"}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
