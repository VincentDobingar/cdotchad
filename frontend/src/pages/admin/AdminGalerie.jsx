// 📁 src/pages/admin/AdminGalerie.jsx
import { useEffect, useMemo, useState } from "react";
import api from "@/utils/api";
import { resolveMediaUrl } from "@/utils/media";

const FALLBACK = "/backend/uploads/galerie/placeholder.jpg"; // ⚠️ assure-toi que ce fichier existe

export default function AdminGalerie() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filtre, setFiltre] = useState("toutes");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // Formulaire ajout
  const [title, setTitle] = useState("");
  const [cat, setCat] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");

  // Édition inline
  const [editId, setEditId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCat, setEditCat] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [g, c] = await Promise.all([
        api.get("/galerie"),
        api.get("/galerie/categories").catch(() => ({ data: [] })),
      ]);

      const rows = Array.isArray(g.data) ? g.data : [];
      const norm = rows.map((r) => ({
        id: r.id,
        titre: r.titre || r.nom || "Sans titre",
        categorie: r.categorie || r.category || "Autres",
        url: resolveMediaUrl(r.url || r.image || r.path || ""),
        rawPath: r.url || r.image || r.path || "",
        date_upload: r.date_upload || r.created_at || null,
      }));

      setItems(norm);
      setCategories(Array.isArray(c.data) ? c.data : []);
      // debug léger (facultatif)
      // console.table(norm.slice(0,5).map(x => ({id:x.id, url:x.url, raw:x.rawPath})));
    } catch (e) {
      console.error("❌ Chargement galerie (admin) :", e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    const base = filtre === "toutes" ? items : items.filter((i) => i.categorie === filtre);
    const q = search.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      (i) =>
        i.titre.toLowerCase().includes(q) ||
        String(i.categorie || "").toLowerCase().includes(q)
    );
  }, [items, filtre, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const slice = filtered.slice((pageSafe - 1) * pageSize, pageSafe * pageSize);

  const onSelectFile = (e) => {
    const f = e.target.files?.[0];
    setFile(f || null);
    setPreview(f ? URL.createObjectURL(f) : "");
  };

  const resetForm = () => {
    setTitle("");
    setCat("");
    setFile(null);
    setPreview("");
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!file) return alert("Choisis une image à téléverser.");
    try {
      const fd = new FormData();
      fd.append("titre", title || "");
      fd.append("categorie", cat || "");
      fd.append("image", file);
      await api.post("/galerie", fd, { headers: { "Content-Type": "multipart/form-data" } });
      resetForm();
      await loadData();
    } catch (err) {
      console.error("❌ Upload image :", err);
      alert("Échec de l’upload.");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Supprimer cette image ?")) return;
    try {
      await api.delete(`/galerie/${id}`);
      await loadData();
    } catch (err) {
      console.error("❌ Suppression image :", err);
      alert("Échec de la suppression.");
    }
  };

  const startEdit = (it) => {
    setEditId(it.id);
    setEditTitle(it.titre);
    setEditCat(it.categorie);
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditTitle("");
    setEditCat("");
  };

  const saveEdit = async () => {
    try {
      await api.put(`/galerie/${editId}`, { titre: editTitle, categorie: editCat });
      cancelEdit();
      await loadData();
    } catch (err) {
      console.error("❌ Édition image :", err);
      alert("Échec de la mise à jour.");
    }
  };

  const changeImage = async (id) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const f = e.target.files?.[0];
      if (!f) return;
      try {
        const fd = new FormData();
        fd.append("image", f);
        await api.put(`/galerie/${id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
        await loadData();
      } catch (err) {
        console.error("❌ Remplacement image :", err);
        alert("Échec du remplacement.");
      }
    };
    input.click();
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Gestion de la Galerie</h1>

      {/* Formulaire d’ajout */}
      <form onSubmit={handleCreate} className="mb-8 grid gap-4 md:grid-cols-[2fr_1fr_1fr_auto] items-start">
        <div>
          <label className="block text-sm font-medium mb-1">Titre</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded border p-2"
            placeholder="Ex: Formation Raffinerie"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Catégorie</label>
          <input
            type="text"
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            className="w-full rounded border p-2"
            placeholder="Ex: Formation"
            list="galerie-categories"
          />
          <datalist id="galerie-categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Image</label>
          <input type="file" accept="image/*" onChange={onSelectFile} className="w-full" />
          {preview && (
            <img src={preview} alt="Prévisualisation" className="mt-2 h-24 w-full object-cover rounded border" />
          )}
        </div>

        <div className="flex items-end">
          <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
            Ajouter
          </button>
        </div>
      </form>

      {/* Filtres & recherche */}
      <div className="mb-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="flex gap-2">
          <select
            value={filtre}
            onChange={(e) => { setFiltre(e.target.value); setPage(1); }}
            className="p-2 rounded border bg-white shadow-sm"
          >
            <option value="toutes">Toutes les catégories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <button
            onClick={() => { setFiltre("toutes"); setSearch(""); setPage(1); }}
            className="px-3 py-2 rounded border hover:bg-gray-50"
          >
            Réinitialiser
          </button>
        </div>

        <input
          placeholder="Rechercher par titre ou catégorie…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="p-2 rounded border w-full md:w-80"
        />
      </div>

      {/* Liste */}
      {loading ? (
        <div className="py-10 text-center text-gray-500">Chargement…</div>
      ) : slice.length ? (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {slice.map((it) => (
            <div key={it.id} className="group relative rounded-lg border overflow-hidden">
              <div className="relative w-full aspect-[16/10] bg-gray-100">
                <img
                  src={it.url || FALLBACK}
                  alt={`Galerie – ${it.titre}`}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = FALLBACK;
                  }}
                />
              </div>

              <div className="p-3 space-y-2">
                {editId === it.id ? (
                  <>
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full rounded border p-2"
                    />
                    <input
                      value={editCat}
                      onChange={(e) => setEditCat(e.target.value)}
                      className="w-full rounded border p-2"
                      list="galerie-categories"
                    />
                    <div className="flex gap-2">
                      <button onClick={saveEdit} className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700">
                        Enregistrer
                      </button>
                      <button onClick={cancelEdit} className="px-3 py-1 rounded border hover:bg-gray-50">
                        Annuler
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="font-semibold">{it.titre}</div>
                    <div className="text-sm text-gray-600">{it.categorie}</div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <button onClick={() => startEdit(it)} className="px-3 py-1 rounded border hover:bg-gray-50">
                        Éditer
                      </button>
                      <button onClick={() => changeImage(it.id)} className="px-3 py-1 rounded border hover:bg-gray-50">
                        Remplacer l’image
                      </button>
                      <button onClick={() => handleDelete(it.id)} className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700">
                        Supprimer
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-10 text-center text-gray-500">Aucune image.</div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8 gap-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`px-3 py-2 rounded border ${pageSafe === i + 1 ? "bg-red-600 text-white border-red-600" : "hover:bg-gray-50"}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
