import { useEffect, useState, useMemo } from "react";
import api from "@/utils/api";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Papa from "papaparse";
import { toPublicImageUrl } from "@/utils/imgUrl";

import ActualitesList from "@/components/admin/ActualitesList";
import ActualiteCreateModal from "@/components/admin/ActualiteCreateModal";
import ActualiteEditModal from "@/components/admin/ActualiteEditModal";

export default function AdminActualites() {
  const [actualites, setActualites] = useState([]);
  const [mois, setMois] = useState("");
  const [annee, setAnnee] = useState("");
  const [categorie, setCategorie] = useState("");
  const [openCreate, setOpenCreate] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  // pagination + recherche
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");

  const paramsMemo = useMemo(() => ({ page, limit, search, mois, annee, categorie }), [page, limit, search, mois, annee, categorie]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = { page, limit, ...(search && { search }) };
      if (mois) params.mois = mois;
      if (annee) params.annee = annee;
      if (categorie) params.categorie = categorie;

      const { data } = await api.get("/actualites", { params });

      const listRaw = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : [];
      const total = Number(data?.total ?? listRaw.length);
      const per   = Number(data?.limit ?? limit);

      // ✅ Normalisation image → URL chargée depuis le même origin
      const list = listRaw.map((a, i) => {
        const imgRaw =
          a.image ?? a.image_url ?? a.cover ?? a.photo ?? a.url ?? "";
        const stamp = a.updated_at ?? a.date_publication ?? a.created_at ?? a.id ?? i;
        return {
          ...a,
          image: imgRaw ? toPublicImageUrl(imgRaw, stamp) : "", // <- clé de cache incluse
        };
      });

      setActualites(list);
      setTotalPages(Math.max(1, Math.ceil((total || list.length) / (per || limit))));
    } catch (e) {
      console.error("Erreur chargement actualités :", e);
      setActualites([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsMemo]);

  const onSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  const exportPDF = async () => {
    const element = document.getElementById("actualites-section");
    if (!element) return;
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF();
    pdf.addImage(imgData, "PNG", 10, 10, 190, 0);
    pdf.save("actualites.pdf");
  };

  const exportCSV = () => {
    const rows = actualites.map((actu) => ({
      Titre: actu.titre,
      Date: String(actu.date_publication || "").substring(0, 10),
      Catégorie: actu.categorie || "",
      Résumé: (actu.resume || actu.contenu || "").replace(/<[^>]+>/g, "").slice(0, 200),
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "actualites.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCreated = (created) => setActualites((prev) => [created, ...prev]);
  const handleUpdated = (updated) => setActualites((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));

  const handleDelete = async (item) => {
    if (!confirm(`Supprimer "${item.titre}" ?`)) return;
    try {
      await api.delete(`/actualites/${item.id}`);
      setActualites((prev) => prev.filter((a) => a.id !== item.id));
    } catch (e) {
      console.error("Suppression impossible :", e);
      alert(e?.response?.data?.message || "Suppression impossible.");
    }
  };

  return (
    <div className="p-6">
      {loading ? (
        <div className="p-6">Chargement des actualités…</div>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-red-600 mb-4">Gestion des Actualités</h1>

          {/* Recherche + page size */}
          <form onSubmit={onSearchSubmit} className="flex flex-wrap gap-3 mb-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un titre…"
              className="border p-2 rounded w-64"
            />
            <button type="submit" className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900">
              Rechercher
            </button>

            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="border p-2 rounded"
              title="Éléments par page"
            >
              {[5, 10, 20, 50].map((n) => (
                <option key={n} value={n}>{n} / page</option>
              ))}
            </select>
          </form>

          {/* Filtres */}
          <div className="flex flex-wrap gap-4 mb-4">
            <select onChange={(e) => { setMois(e.target.value); setPage(1); }} value={mois} className="border p-2 rounded">
              <option value="">Tous les mois</option>
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>Mois {i + 1}</option>
              ))}
            </select>

            <select onChange={(e) => { setAnnee(e.target.value); setPage(1); }} value={annee} className="border p-2 rounded">
              <option value="">Toutes les années</option>
              {[2023, 2024, 2025, 2026].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            <select onChange={(e) => { setCategorie(e.target.value); setPage(1); }} value={categorie} className="border p-2 rounded">
              <option value="">Toutes les catégories</option>
              <option value="Formation">Formation</option>
              <option value="Annonce">Annonce</option>
              <option value="Événement">Événement</option>
              <option value="Projet">Projet</option>
              <option value="Autre">Autre</option>
            </select>
          </div>

          {/* Export */}
          <div className="flex gap-4 mb-4">
            <button onClick={exportPDF} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Export PDF</button>
            <button onClick={exportCSV} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Export CSV</button>
          </div>

          {/* Liste */}
          <div id="actualites-section">
            <ActualitesList
              items={actualites}
              onCreate={() => setOpenCreate(true)}
              onEdit={(a) => setEditing(a)}
              onDelete={handleDelete}
            />
          </div>

          {/* Pagination */}
          <div className="flex items-center gap-3 justify-center mt-6">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1 border rounded disabled:opacity-50">
              ← Précédent
            </button>
            <span className="text-sm">Page {page} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1 border rounded disabled:opacity-50">
              Suivant →
            </button>
          </div>

          {/* Modals */}
          <ActualiteCreateModal open={openCreate} onClose={() => setOpenCreate(false)} onSaved={handleCreated} />
          <ActualiteEditModal  open={!!editing}  actualite={editing} onClose={() => setEditing(null)} onSaved={handleUpdated} />
        </>
      )}
    </div>
  );
}
