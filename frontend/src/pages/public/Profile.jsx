// src/pages/public/Profile.jsx
// Espace candidat : informations personnelles, documents enregistrés, mot de passe.
// Les autres rôles (admin, partenaire) n'ont que le changement de mot de passe.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import ProfilPartenaire from "@/pages/partenaire/ProfilPartenaire";

const TYPES_DOCUMENTS = [
  { value: "cv", label: "CV" },
  { value: "lettre", label: "Lettre de motivation" },
  { value: "diplome", label: "Diplôme" },
];

const CHAMPS_PROFIL = ["prenom", "nom", "telephone", "ville", "pays", "lien_linkedin", "lien_portfolio", "resume"];

const champ = "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600";
const CARTE = "bg-white rounded-2xl border border-slate-200 shadow-sm p-6";

export default function Profile() {
  const { user, refreshMe } = useAuth();
  const estCandidat = user?.role === "candidat";

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-slate-500">Vos informations de connexion et votre profil.</p>
        {estCandidat && (
          <p className="mt-2 text-sm">
            <Link to="/mes-candidatures" className="text-blue-600 hover:underline">
              Voir mes candidatures
            </Link>
          </p>
        )}
        {user?.role === "partenaire" && !user?.doit_changer_mdp && (
          <p className="mt-2 text-sm">
            <Link to="/partenaire" className="text-blue-600 hover:underline">
              Aller à mon espace partenaire (mes avis de recrutement)
            </Link>
          </p>
        )}
      </header>

      {estCandidat && <InformationsPersonnelles onSaved={refreshMe} />}
      {estCandidat && <DocumentsEnregistres />}
      {user?.role === "partenaire" && !user?.doit_changer_mdp && <ProfilPartenaire />}

      <section className={CARTE}>
        <h3 className="text-lg font-semibold mb-4">Changer de mot de passe</h3>
        {user?.doit_changer_mdp && (
          <p className="mb-3 text-sm text-yellow-900 bg-yellow-50 border border-yellow-300 rounded p-2">
            Votre mot de passe est provisoire. Choisissez-en un nouveau pour accéder à votre espace.
          </p>
        )}
        <PasswordForm onChanged={refreshMe} />
      </section>
    </div>
  );
}

function InformationsPersonnelles({ onSaved }) {
  const [form, setForm] = useState(() => Object.fromEntries(CHAMPS_PROFIL.map((c) => [c, ""])));
  const [chargement, setChargement] = useState(true);
  const [enregistrement, setEnregistrement] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    api
      .get("/candidat/profil")
      .then(({ data }) => {
        const p = data.profil || {};
        setForm(Object.fromEntries(CHAMPS_PROFIL.map((c) => [c, p[c] || ""])));
      })
      .catch(() => setMessage({ type: "erreur", texte: "Impossible de charger votre profil." }))
      .finally(() => setChargement(false));
  }, []);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnregistrement(true);
    setMessage(null);
    try {
      await api.put("/candidat/profil", form);
      await onSaved();
      setMessage({ type: "succes", texte: "Profil enregistré." });
    } catch (err) {
      setMessage({ type: "erreur", texte: err.response?.data?.message || "Mise à jour échouée." });
    } finally {
      setEnregistrement(false);
    }
  };

  if (chargement) return <p className="text-gray-500">Chargement de votre profil…</p>;

  return (
    <section className={CARTE}>
      <h3 className="text-lg font-semibold mb-4">Mes informations</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input name="prenom" placeholder="Prénom" value={form.prenom} onChange={handleChange} className={champ} />
          <input name="nom" placeholder="Nom" value={form.nom} onChange={handleChange} className={champ} />
          <input type="tel" name="telephone" placeholder="Téléphone" value={form.telephone} onChange={handleChange} className={champ} />
          <input name="ville" placeholder="Ville" value={form.ville} onChange={handleChange} className={champ} />
          <input name="pays" placeholder="Pays" value={form.pays} onChange={handleChange} className={champ} />
          <input type="url" name="lien_linkedin" placeholder="Lien LinkedIn" value={form.lien_linkedin} onChange={handleChange} className={champ} />
          <input type="url" name="lien_portfolio" placeholder="Lien portfolio" value={form.lien_portfolio} onChange={handleChange} className={champ} />
        </div>
        <textarea
          name="resume"
          rows={4}
          placeholder="Présentation (facultatif)"
          value={form.resume}
          onChange={handleChange}
          className={champ}
        />
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={enregistrement}
            className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {enregistrement ? "Enregistrement…" : "Enregistrer"}
          </button>
          {message && (
            <span className={`text-sm ${message.type === "erreur" ? "text-red-600" : "text-green-700"}`}>
              {message.texte}
            </span>
          )}
        </div>
      </form>
    </section>
  );
}

function DocumentsEnregistres() {
  const [documents, setDocuments] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [type, setType] = useState("cv");
  const [fichier, setFichier] = useState(null);
  const [envoi, setEnvoi] = useState(false);
  const [message, setMessage] = useState(null);

  const charger = () =>
    api
      .get("/candidat/documents")
      .then(({ data }) => setDocuments(data.documents || []))
      .catch(() => setMessage({ type: "erreur", texte: "Impossible de charger vos documents." }))
      .finally(() => setChargement(false));

  useEffect(() => {
    charger();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!fichier) return;
    setEnvoi(true);
    setMessage(null);
    const data = new FormData();
    data.append("type", type);
    data.append("fichier", fichier);
    try {
      await api.post("/candidat/documents", data);
      setFichier(null);
      e.target.reset();
      await charger();
      setMessage({ type: "succes", texte: "Document enregistré. Il remplace l'ancien de même type." });
    } catch (err) {
      setMessage({ type: "erreur", texte: err.response?.data?.message || "Envoi impossible." });
    } finally {
      setEnvoi(false);
    }
  };

  const telecharger = async (doc) => {
    try {
      const { data } = await api.get(`/candidat/documents/${doc.id}/telecharger`, { responseType: "blob" });
      const url = URL.createObjectURL(data);
      const lien = document.createElement("a");
      lien.href = url;
      lien.download = doc.nom_original || "document.pdf";
      lien.click();
      URL.revokeObjectURL(url);
    } catch {
      setMessage({ type: "erreur", texte: "Téléchargement impossible." });
    }
  };

  const supprimer = async (doc) => {
    if (!window.confirm(`Supprimer « ${doc.nom_original} » ?`)) return;
    try {
      await api.delete(`/candidat/documents/${doc.id}`);
      await charger();
    } catch {
      setMessage({ type: "erreur", texte: "Suppression impossible." });
    }
  };

  return (
    <section className={CARTE}>
      <h3 className="text-lg font-semibold mb-1">Mes documents</h3>
      <p className="text-sm text-gray-600 mb-4">
        Enregistrez vos pièces une fois : elles seront proposées automatiquement à chaque candidature.
        PDF uniquement, 5 Mo maximum.
      </p>

      {chargement ? (
        <p className="text-gray-500">Chargement…</p>
      ) : (
        <ul className="divide-y border rounded mb-6">
          {TYPES_DOCUMENTS.map(({ value, label }) => {
            const doc = documents.find((d) => d.type === value);
            return (
              <li key={value} className="flex flex-wrap items-center justify-between gap-2 p-3">
                <div>
                  <div className="font-medium">{label}</div>
                  <div className="text-sm text-gray-600">{doc ? doc.nom_original : "Aucun document enregistré"}</div>
                </div>
                {doc && (
                  <div className="flex gap-3 text-sm">
                    <button type="button" onClick={() => telecharger(doc)} className="text-blue-600 hover:underline">
                      Télécharger
                    </button>
                    <button type="button" onClick={() => supprimer(doc)} className="text-red-600 hover:underline">
                      Supprimer
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <form onSubmit={handleUpload} className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
        <div>
          <label className="block text-sm text-gray-700 mb-1">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className="border p-2 rounded">
            {TYPES_DOCUMENTS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm text-gray-700 mb-1">Fichier PDF</label>
          <input
            type="file"
            accept=".pdf,application/pdf"
            onChange={(e) => setFichier(e.target.files[0] || null)}
            className="w-full"
          />
        </div>
        <button
          type="submit"
          disabled={!fichier || envoi}
          className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {envoi ? "Envoi…" : "Enregistrer le document"}
        </button>
      </form>

      {message && (
        <p className={`text-sm mt-3 ${message.type === "erreur" ? "text-red-600" : "text-green-700"}`}>{message.texte}</p>
      )}
    </section>
  );
}

function PasswordForm({ onChanged }) {
  const [ancien, setAncien] = useState("");
  const [nouveau, setNouveau] = useState("");
  const [msg, setMsg] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      await api.put("/utilisateurs/me/password", { oldPassword: ancien, newPassword: nouveau });
      setMsg({ type: "succes", texte: "Mot de passe changé." });
      setAncien("");
      setNouveau("");
      await onChanged?.();
    } catch (err) {
      setMsg({ type: "erreur", texte: err?.response?.data?.message || "Impossible de changer le mot de passe." });
    }
  };

  return (
    <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
      <input type="password" placeholder="Ancien mot de passe" value={ancien} onChange={(e) => setAncien(e.target.value)} required className={champ} />
      <input type="password" placeholder="Nouveau mot de passe" value={nouveau} onChange={(e) => setNouveau(e.target.value)} required minLength={8} className={champ} />
      <div className="sm:col-span-2 flex items-center gap-4">
        <button type="submit" className="bg-gray-800 text-white px-4 py-2 rounded">
          Changer de mot de passe
        </button>
        {msg && (
          <span className={`text-sm ${msg.type === "erreur" ? "text-red-600" : "text-green-700"}`}>{msg.texte}</span>
        )}
      </div>
    </form>
  );
}
