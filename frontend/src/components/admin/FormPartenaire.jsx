// Création d'un partenaire et de son compte (l'admin transmet ensuite le mot de passe provisoire).
import { useState } from "react";
import api from "@/utils/api";
import toast from "react-hot-toast";

const VIDE = { nom: "", email: "", contact_nom: "", telephone: "", secteur: "", ville: "", site_web: "" };
const champ = "w-full p-2 border rounded";

export default function FormPartenaire({ onCreated }) {
  const [form, setForm] = useState(VIDE);
  const [envoi, setEnvoi] = useState(false);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnvoi(true);
    try {
      const { data } = await api.post("/partenaires", form);
      toast.success("Partenaire créé.");
      setForm(VIDE);
      onCreated?.(data.partenaire, data.motdepasse_provisoire);
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur lors de la création du partenaire.");
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6 p-4 border rounded bg-white dark:bg-gray-800">
      <input name="nom" placeholder="Nom de l'organisation *" value={form.nom} onChange={handleChange} className={champ} required />
      <input type="email" name="email" placeholder="Email de connexion *" value={form.email} onChange={handleChange} className={champ} required />
      <input name="contact_nom" placeholder="Personne référente" value={form.contact_nom} onChange={handleChange} className={champ} />
      <input name="telephone" placeholder="Téléphone" value={form.telephone} onChange={handleChange} className={champ} />
      <input name="secteur" placeholder="Secteur d'activité" value={form.secteur} onChange={handleChange} className={champ} />
      <input name="ville" placeholder="Ville" value={form.ville} onChange={handleChange} className={champ} />
      <input name="site_web" placeholder="Site web (https://…)" value={form.site_web} onChange={handleChange} className={champ} />
      <div className="md:col-span-2">
        <button
          type="submit"
          disabled={envoi}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {envoi ? "Création…" : "Créer le compte partenaire"}
        </button>
      </div>
    </form>
  );
}
