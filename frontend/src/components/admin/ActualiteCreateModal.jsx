import { useMemo, useState } from "react";
import api from "@/utils/api";
import { X, ImagePlus, Save } from "lucide-react";

export default function ActualiteCreateModal({ open, onClose, onSaved }) {
  const [titre, setTitre] = useState("");
  const [contenu, setContenu] = useState("");
  const [categorie, setCategorie] = useState("");
  const [datePublication, setDatePublication] = useState("");
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);
  if (!open) return null;

  const reset = () => {
    setTitre(""); setContenu(""); setCategorie(""); setDatePublication(""); setFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const fd = new FormData();
      fd.append("titre", titre);
      fd.append("contenu", contenu);
      if (categorie) fd.append("categorie", categorie);
      if (datePublication) fd.append("date_publication", datePublication);
      if (file) fd.append("image", file);

      const { data } = await api.post("/actualites", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onSaved?.(data); // remonte l’élément créé
      reset();
      onClose?.();
    } catch (err) {
      console.error("Erreur création actualité :", err);
      alert(err?.response?.data?.message || "Échec de la création.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white dark:bg-gray-900 rounded-xl shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="font-semibold">Nouvelle actualité</h3>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
            <X />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4 p-4">
          <div className="space-y-3">
            <label className="block text-sm">Titre</label>
            <input className="w-full border rounded px-3 py-2" value={titre} onChange={(e)=>setTitre(e.target.value)} required />

            <label className="block text-sm">Catégorie</label>
            <input className="w-full border rounded px-3 py-2" value={categorie} onChange={(e)=>setCategorie(e.target.value)} placeholder="Formation, Annonce, …" />

            <label className="block text-sm">Date de publication</label>
            <input type="date" className="w-full border rounded px-3 py-2" value={datePublication} onChange={(e)=>setDatePublication(e.target.value)} />
          </div>

          <div className="space-y-3">
            <label className="block text-sm">Contenu</label>
            <textarea className="w-full border rounded px-3 py-2 min-h-[160px]" value={contenu} onChange={(e)=>setContenu(e.target.value)} />

            <label className="block text-sm">Image (optionnel)</label>
            <div className="flex gap-3 items-center">
              <label className="inline-flex items-center gap-2 cursor-pointer bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded">
                <ImagePlus size={18} />
                <span>Choisir une image</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e)=>setFile(e.target.files?.[0] || null)} />
              </label>
              {file && <span className="text-xs text-gray-500">{file.name}</span>}
            </div>
            {previewUrl ? <img src={previewUrl} alt="aperçu" className="mt-2 w-full h-40 object-cover rounded border" /> : null}
          </div>

          <div className="md:col-span-2 flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded border hover:bg-gray-50 dark:hover:bg-gray-800">Annuler</button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 inline-flex items-center gap-2">
              <Save size={18} /> {saving ? "Enregistrement..." : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
