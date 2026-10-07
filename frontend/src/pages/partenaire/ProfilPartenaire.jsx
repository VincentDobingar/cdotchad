// src/pages/partenaire/ProfilPartenaire.jsx
// Fiche du partenaire : coordonnées et logo. Affichée sur la page profil,
// uniquement une fois le mot de passe provisoire changé (le backend le refuse sinon).
import { useEffect, useRef, useState } from "react";
import api from "@/utils/api";

const CHAMPS = [
  { cle: "nom", label: "Nom de l'organisation", requis: true },
  { cle: "contact_nom", label: "Personne à contacter" },
  { cle: "telephone", label: "Téléphone" },
  { cle: "secteur", label: "Secteur" },
  { cle: "ville", label: "Ville" },
  { cle: "site_web", label: "Site web (https://…)" },
];

const champ = "w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600";

export default function ProfilPartenaire() {
  const [form, setForm] = useState(() => Object.fromEntries(CHAMPS.map((c) => [c.cle, ""])));
  const [logo, setLogo] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [enregistrement, setEnregistrement] = useState(false);
  const [envoiLogo, setEnvoiLogo] = useState(false);
  const [message, setMessage] = useState(null);
  const [erreurs, setErreurs] = useState({});
  const fichierRef = useRef(null);

  useEffect(() => {
    api
      .get("/partenaire/profil")
      .then(({ data }) => {
        const p = data.partenaire || {};
        setForm(Object.fromEntries(CHAMPS.map((c) => [c.cle, p[c.cle] || ""])));
        setLogo(p.logo_url || null);
      })
      .catch(() => setMessage({ type: "erreur", texte: "Impossible de charger votre fiche." }))
      .finally(() => setChargement(false));
  }, []);

  const urlLogo = logo ? `/backend/uploads/logos_partenaires/${logo}` : null;

  const enregistrer = async (e) => {
    e.preventDefault();
    setMessage(null);
    setErreurs({});
    setEnregistrement(true);
    try {
      const { data } = await api.put("/partenaire/profil", form);
      setForm(Object.fromEntries(CHAMPS.map((c) => [c.cle, data.partenaire[c.cle] || ""])));
      setMessage({ type: "succes", texte: "Fiche enregistrée." });
    } catch (err) {
      setErreurs(err?.response?.data?.errors || {});
      setMessage({ type: "erreur", texte: err?.response?.data?.message || "Enregistrement impossible." });
    } finally {
      setEnregistrement(false);
    }
  };

  const envoyerLogo = async (e) => {
    const fichier = e.target.files?.[0];
    if (!fichier) return;
    setMessage(null);
    setEnvoiLogo(true);
    const data = new FormData();
    data.append("logo", fichier);
    try {
      const { data: rep } = await api.post("/partenaire/logo", data);
      setLogo(rep.logo_url);
      setMessage({ type: "succes", texte: "Logo mis à jour." });
    } catch (err) {
      setMessage({ type: "erreur", texte: err?.response?.data?.message || "Envoi du logo impossible." });
    } finally {
      setEnvoiLogo(false);
      if (fichierRef.current) fichierRef.current.value = "";
    }
  };

  if (chargement) return <p className="text-gray-500">Chargement…</p>;

  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      <h3 className="text-lg font-semibold">Ma fiche partenaire</h3>

      <div className="flex items-center gap-4">
        <div className="w-24 h-24 border rounded bg-gray-50 flex items-center justify-center overflow-hidden">
          {urlLogo ? (
            <img src={urlLogo} alt="Logo du partenaire" className="max-w-full max-h-full object-contain" />
          ) : (
            <span className="text-xs text-gray-400 text-center px-2">Aucun logo</span>
          )}
        </div>
        <div className="space-y-2">
          <p className="text-sm text-gray-600">PNG, JPEG ou WebP, 2 Mo maximum.</p>
          <input
            ref={fichierRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={envoyerLogo}
            disabled={envoiLogo}
            className="text-sm"
          />
          {envoiLogo && <p className="text-sm text-gray-500">Envoi du logo…</p>}
        </div>
      </div>

      <form onSubmit={enregistrer} className="grid gap-3 md:grid-cols-2">
        {CHAMPS.map((c) => (
          <label key={c.cle} className="text-sm space-y-1">
            <span className="block text-gray-700">
              {c.label}
              {c.requis && " *"}
            </span>
            <input
              value={form[c.cle]}
              onChange={(e) => setForm((f) => ({ ...f, [c.cle]: e.target.value }))}
              required={c.requis}
              className={champ}
            />
            {erreurs[c.cle] && <span className="block text-xs text-red-600">{erreurs[c.cle]}</span>}
          </label>
        ))}

        <div className="md:col-span-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={enregistrement}
            className="bg-red-600 text-white px-4 py-2 rounded text-sm disabled:opacity-60"
          >
            {enregistrement ? "Enregistrement…" : "Enregistrer la fiche"}
          </button>
          {message && (
            <span className={`text-sm ${message.type === "succes" ? "text-green-700" : "text-red-600"}`}>
              {message.texte}
            </span>
          )}
        </div>
      </form>
    </section>
  );
}
