//pages/admin/AdminCandidatures.jsx

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import api from "@/utils/api";
import CandidatureTable from "./CandidatureTable";

const backendUrl = import.meta.env.VITE_API_URL;

export default function AdminCandidatures() {
  const [candidatures, setCandidatures] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [offreFilter, setOffreFilter] = useState("");
  const [dateMin, setDateMin] = useState("");
  const [dateMax, setDateMax] = useState("");
  const [selectedCandidature, setSelectedCandidature] = useState(null);
  const [sortField, setSortField] = useState("date_candidature");
  const [sortDirection, setSortDirection] = useState("desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);

  const fetchData = async () => {
    try {
      const res = await api.get("/candidatures", {
        params: {
          ...(offreFilter && { offre: offreFilter }),
          ...(dateMin && { date_min: dateMin }),
          ...(dateMax && { date_max: dateMax }),
          ...(search && { search }),
          page,
          limit,
        },
      });

      if (Array.isArray(res.data.candidatures)) {
        setCandidatures(res.data.candidatures);
        setTotalPages(res.data.totalPages || 1);
      } else {
        setCandidatures([]);
      }
    } catch (err) {
      toast.error("Erreur de chargement des candidatures.");
      setCandidatures([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [offreFilter, dateMin, dateMax, search, page, limit]);

  const exporterCSV = async () => {
    try {
      const res = await api.get("/candidatures/export-csv", {
        params: {
          ...(offreFilter && { offre: offreFilter }),
          ...(dateMin && { date_min: dateMin }),
          ...(dateMax && { date_max: dateMax }),
          ...(search && { search }),
        },
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "candidatures.csv";
      a.click();
    } catch (err) {
      toast.error("Erreur lors de l'export CSV");
    }
  };

  const supprimerCandidature = async (id) => {
    if (!confirm("Voulez-vous vraiment supprimer cette candidature ?")) return;

    try {
      await api.delete(`/candidatures/${id}`);
      toast.success("Candidature supprimée");
      setCandidatures((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const candidaturesFiltrees = Array.isArray(candidatures)
    ? candidatures.sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        if (!valA || !valB) return 0;
        return sortDirection === "asc" ? valA > valB ? 1 : -1 : valA < valB ? 1 : -1;
      })
    : [];

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Liste des candidatures</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <input
          type="text"
          placeholder="Filtrer par offre"
          value={offreFilter}
          onChange={(e) => setOffreFilter(e.target.value)}
          className="px-3 py-2 border rounded w-full"
        />
        <input
          type="date"
          value={dateMin}
          onChange={(e) => setDateMin(e.target.value)}
          className="px-3 py-2 border rounded w-full"
        />
        <input
          type="date"
          value={dateMax}
          onChange={(e) => setDateMax(e.target.value)}
          className="px-3 py-2 border rounded w-full"
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <input
          type="text"
          placeholder="Recherche nom, email..."
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          className="px-3 py-2 border rounded w-64"
        />

        <button
          onClick={fetchData}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Appliquer les filtres
        </button>

        <button
          onClick={exporterCSV}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          📥 Export CSV
        </button>

        <select
          value={limit}
          onChange={(e) => {
            setLimit(Number(e.target.value));
            setPage(1);
          }}
          className="ml-auto px-2 py-1 border rounded"
        >
          <option value={5}>5 / page</option>
          <option value={10}>10 / page</option>
          <option value={20}>20 / page</option>
          <option value={50}>50 / page</option>
        </select>
      </div>

      {loading ? (
        <p>Chargement...</p>
      ) : candidaturesFiltrees.length === 0 ? (
        <p>Aucune candidature trouvée.</p>
      ) : (
        <>
          <CandidatureTable
            candidatures={candidaturesFiltrees}
            onDelete={supprimerCandidature}
            onSelect={setSelectedCandidature}
            onSort={handleSort}
            sortField={sortField}
            sortDirection={sortDirection}
          />

          <div className="flex justify-center mt-4 gap-4">
            <button
              disabled={page === 1}
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            >
              ⬅ Précédent
            </button>
            <span className="px-3 py-1">{page} / {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => prev + 1)}
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            >
              Suivant ➡
            </button>
          </div>
        </>
      )}

      {selectedCandidature && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white max-w-lg w-full rounded-lg shadow-lg p-6 relative">
            <button
              onClick={() => setSelectedCandidature(null)}
              className="absolute top-2 right-2 text-red-600 text-xl"
            >
              ✖
            </button>
            <h2 className="text-xl font-semibold mb-4">Détails de la candidature</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Nom :</strong> {selectedCandidature.nom}</p>
              <p><strong>Email :</strong> {selectedCandidature.email}</p>
              <p><strong>Téléphone :</strong> {selectedCandidature.telephone}</p>
              <p><strong>Offre :</strong> {selectedCandidature.titre_offre}</p>
              <p><strong>Date :</strong> {new Date(selectedCandidature.date_candidature).toLocaleString()}</p>
              <p><strong>Lien :</strong> <a href={selectedCandidature.lien} target="_blank" rel="noreferrer" className="text-blue-600 underline">Profil</a></p>
              <p><strong>Commentaire :</strong> {selectedCandidature.commentaire}</p>
              <div className="flex gap-3 mt-3">
                {selectedCandidature.cv_path && (
                  <a
                    href={`${backendUrl}/${selectedCandidature.cv_path}`}
                    target="_blank"
                    className="text-green-600 underline"
                    rel="noreferrer"
                  >
                    📄 CV
                  </a>
                )}
                {selectedCandidature.lettre_path && (
                  <a
                    href={`${backendUrl}/${selectedCandidature.lettre_path}`}
                    target="_blank"
                    className="text-purple-600 underline"
                    rel="noreferrer"
                  >
                    📄 Lettre
                  </a>
                )}
                {selectedCandidature.diplome_path && (
                  <a
                    href={`${backendUrl}/${selectedCandidature.diplome_path}`}
                    target="_blank"
                    className="text-blue-600 underline"
                    rel="noreferrer"
                  >
                    📄 Diplôme
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
