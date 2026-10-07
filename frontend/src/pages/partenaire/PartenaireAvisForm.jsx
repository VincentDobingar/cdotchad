// src/pages/partenaire/PartenaireAvisForm.jsx
// Soumission (ou correction) d'un avis de recrutement. L'avis passe en attente de validation.
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "@/utils/api";
import { urlPieceJointe } from "@/utils/pieceJointe";

const CHAMPS_TEXTE = ["lieu", "diplome", "experience", "langue"];
const CHAMPS_LONGS = [
  { name: "resume", label: "Résumé de l'offre", rows: 2 },
  { name: "description", label: "Description du poste", rows: 6 },
  { name: "attributions", label: "Attributions", rows: 3 },
  { name: "competences", label: "Compétences requises", rows: 2 },
  { name: "formation", label: "Formation", rows: 2 },
  { name: "certifications", label: "Certifications", rows: 2 },
  { name: "logiciels", label: "Logiciels", rows: 2 },
  { name: "affiliations", label: "Affiliations", rows: 2 },
];
const TYPES_CONTRAT = ["CDI", "CDD", "Stage", "Consultance", "Autre"];

const VIDE = {
  titre: "",
  lieu: "",
  date_limite: "",
  type_contrat: "CDI",
  diplome: "",
  experience: "",
  langue: "",
  resume: "",
  description: "",
  attributions: "",
  competences: "",
  formation: "",
  certifications: "",
  logiciels: "",
  affiliations: "",
};

const champ = "w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-600";

function ErreurChamp({ erreurs, nom }) {
  return erreurs[nom] ? <p className="text-sm text-red-600 mt-1">{erreurs[nom]}</p> : null;
}

export default function PartenaireAvisForm() {
  const { id } = useParams();
  const modification = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(VIDE);
  const [erreurs, setErreurs] = useState({});
  const [message, setMessage] = useState(null);
  const [chargement, setChargement] = useState(modification);
  const [envoi, setEnvoi] = useState(false);
  const [piece, setPiece] = useState(null); // nouveau PDF choisi
  const [docActuel, setDocActuel] = useState(null); // nom du PDF déjà joint à l'avis

  useEffect(() => {
    if (!modification) return;
    api
      .get(`/partenaire/avis/${id}`)
      .then(({ data }) => {
        const a = data.avis || {};
        const valeurs = Object.fromEntries(
          Object.keys(VIDE).map((k) => [k, k === "date_limite" ? (a[k] || "").slice(0, 10) : a[k] || VIDE[k]])
        );
        setForm(valeurs);
        setDocActuel(a.document_url || null);
      })
      .catch(() => setMessage({ type: "erreur", texte: "Avis introuvable." }))
      .finally(() => setChargement(false));
  }, [id]);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnvoi(true);
    setErreurs({});
    setMessage(null);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, v ?? ""));
      if (piece) data.append("document", piece);
      if (modification) await api.put(`/partenaire/avis/${id}`, data);
      else await api.post("/partenaire/avis", data);
      navigate("/partenaire", {
        state: { message: "Avis soumis. Il sera publié après validation par l'administration." },
      });
    } catch (err) {
      const data = err.response?.data || {};
      setErreurs(data.errors || {});
      setMessage({ type: "erreur", texte: data.message || "Envoi impossible. Réessayez." });
    } finally {
      setEnvoi(false);
    }
  };

  if (chargement) return <p className="text-slate-500">Chargement…</p>;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
      <header>
        <Link to="/partenaire" className="text-sm text-blue-600 hover:underline">
          ← Retour à mes avis
        </Link>
        <h2 className="text-xl font-bold text-red-600 mt-2">
          {modification ? "Corriger l'avis de recrutement" : "Soumettre un avis de recrutement"}
        </h2>
        <p className="text-sm text-gray-600">
          Les champs marqués d'un astérisque sont obligatoires. L'avis sera publié après validation.
        </p>
      </header>

      {message && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{message.texte}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">Intitulé du poste *</label>
          <input name="titre" value={form.titre} onChange={handleChange} className={champ} required />
          <ErreurChamp erreurs={erreurs} nom="titre" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Lieu *</label>
            <input name="lieu" value={form.lieu} onChange={handleChange} className={champ} required />
            <ErreurChamp erreurs={erreurs} nom="lieu" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date limite de candidature *</label>
            <input type="date" name="date_limite" value={form.date_limite} onChange={handleChange} className={champ} required />
            <ErreurChamp erreurs={erreurs} nom="date_limite" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Type de contrat</label>
            <select name="type_contrat" value={form.type_contrat} onChange={handleChange} className={champ}>
              {TYPES_CONTRAT.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          {CHAMPS_TEXTE.filter((c) => c !== "lieu").map((c) => (
            <div key={c}>
              <label className="block text-sm font-medium mb-1 capitalize">{c === "langue" ? "Langue(s)" : c}</label>
              <input name={c} value={form[c]} onChange={handleChange} className={champ} />
            </div>
          ))}
        </div>

        {CHAMPS_LONGS.map(({ name, label, rows }) => (
          <div key={name}>
            <label className="block text-sm font-medium mb-1">
              {label}
              {(name === "resume" || name === "description") && " *"}
            </label>
            <textarea name={name} rows={rows} value={form[name]} onChange={handleChange} className={champ} required={name === "resume" || name === "description"} />
            <ErreurChamp erreurs={erreurs} nom={name} />
          </div>
        ))}

        <div>
          <label className="block text-sm font-medium mb-1">Document PDF (facultatif)</label>
          <p className="text-sm text-gray-600 mb-2">
            Si vous avez une version mise en forme de l'avis, joignez-la : elle sera proposée en téléchargement avec l'offre.
            PDF uniquement, 10 Mo maximum.
          </p>
          {docActuel && !piece && (
            <p className="text-sm mb-2">
              Pièce actuelle :{" "}
              <a href={urlPieceJointe(docActuel)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                télécharger
              </a>{" "}
              (sera conservée si vous n'en choisissez pas une nouvelle)
            </p>
          )}
          <input
            type="file"
            accept="application/pdf,.pdf"
            onChange={(e) => setPiece(e.target.files[0] || null)}
            className="w-full"
          />
          <ErreurChamp erreurs={erreurs} nom="document" />
        </div>

        <div className="flex items-center gap-4">
          <button type="submit" disabled={envoi} className="bg-red-700 hover:bg-red-800 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm disabled:opacity-60">
            {envoi ? "Envoi…" : modification ? "Enregistrer et soumettre à nouveau" : "Soumettre l'avis"}
          </button>
        </div>
      </form>
    </div>
  );
}
