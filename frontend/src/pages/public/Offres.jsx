// pages/public/Offres.jsx

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import jsPDF from "jspdf";
import "jspdf-autotable";
import api from "@/utils/api";

function useDebounced(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value?.trim?.() ?? value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}

function normalizeDates(minStr, maxStr) {
  const isValid = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || "");
  const toNum = (s) => Number((s || "").replaceAll("-", ""));

  const minOk = isValid(minStr);
  const maxOk = isValid(maxStr);

  if (!minOk && !maxOk) return { from: "", to: "" };
  if (minOk && !maxOk) return { from: minStr, to: "" };
  if (!minOk && maxOk) return { from: "", to: maxStr };

  const a = toNum(minStr);
  const b = toNum(maxStr);

  return a <= b ? { from: minStr, to: maxStr } : { from: maxStr, to: minStr };
}

function toTime(d) {
  if (!d) return 0;
  const t = new Date(d).getTime();
  return Number.isFinite(t) ? t : 0;
}

function formatDate(date) {
  if (!date) return "Non précisée";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "Non précisée";
  return d.toLocaleDateString("fr-FR");
}

function truncateText(text, max = 180) {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function normalizeOffre(o, i) {
  return {
    id: o.id ?? o._id ?? i,
    titre: o.titre ?? o.title ?? "Offre",
    lieu: o.lieu ?? o.location ?? "Non précisé",
    employeur: o.employeur ?? o.company ?? "Non précisé",
    type_contrat: o.type_contrat ?? o.contract_type ?? "Non précisé",
    type_recrutement: o.type_recrutement ?? o.recruitment_type ?? "externe",
    statut: o.statut ?? o.status ?? "",
    etat: o.etat ?? "",
    resume:
      o.resume ?? (o.description ? String(o.description).slice(0, 160) : ""),
    description: o.description ?? "",
    date_publication: o.date_publication ?? o.published_at ?? o.date ?? null,
    date_limite: o.date_limite ?? o.deadline ?? null,
  };
}

function getDisplayStatus(offre) {
  const rawStatut = (offre.statut || "").toLowerCase();
  const rawEtat = (offre.etat || "").toLowerCase();

  if (rawStatut === "brouillon") {
    return {
      label: "Brouillon",
      className: "bg-yellow-100 text-yellow-800 border-yellow-200",
    };
  }

  if (rawStatut === "suspendue") {
    return {
      label: "Suspendue",
      className: "bg-orange-100 text-orange-800 border-orange-200",
    };
  }

  if (
    rawStatut === "cloturee" ||
    rawStatut === "clôturée" ||
    rawEtat === "expiré" ||
    rawEtat === "expire" ||
    rawEtat === "expirée" ||
    rawEtat === "expiree"
  ) {
    return {
      label: "Expirée",
      className: "bg-gray-100 text-gray-700 border-gray-200",
    };
  }

  if (offre.date_limite) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deadline = new Date(offre.date_limite);
    deadline.setHours(0, 0, 0, 0);

    if (!Number.isNaN(deadline.getTime()) && deadline < today) {
      return {
        label: "Expirée",
        className: "bg-gray-100 text-gray-700 border-gray-200",
      };
    }
  }

  if (rawStatut === "publiee" || rawStatut === "publiée") {
    return {
      label: "Publiée",
      className: "bg-green-100 text-green-800 border-green-200",
    };
  }

  return {
    label: "Active",
    className: "bg-green-100 text-green-800 border-green-200",
  };
}

function getRecruitmentLabel(value) {
  const v = (value || "").toLowerCase();
  if (v === "interne") return "Interne";
  return "Externe";
}

export default function Offres() {
  const [offres, setOffres] = useState([]);

  const [searchInput, setSearchInput] = useState("");
  const [lieuInput, setLieuInput] = useState("");
  const [employeurInput, setEmployeurInput] = useState("");
  const [typeContratInput, setTypeContratInput] = useState("");
  const [typeRecrutementInput, setTypeRecrutementInput] = useState("");
  const [statutInput, setStatutInput] = useState("publiee");
  const [dateMinInput, setDateMinInput] = useState("");
  const [dateMaxInput, setDateMaxInput] = useState("");

  const search = useDebounced(searchInput, 300);
  const lieu = useDebounced(lieuInput, 300);
  const employeur = useDebounced(employeurInput, 300);
  const typeContrat = useDebounced(typeContratInput, 300);
  const typeRecrutement = useDebounced(typeRecrutementInput, 300);
  const statut = useDebounced(statutInput, 300);
  const dateMin = useDebounced(dateMinInput, 300);
  const dateMax = useDebounced(dateMaxInput, 300);

  const [sortKey, setSortKey] = useState("date_publication");
  const [sortDir, setSortDir] = useState("desc");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const limit = 6;

  useEffect(() => {
    setPage(1);
  }, [
    search,
    lieu,
    employeur,
    typeContrat,
    typeRecrutement,
    statut,
    dateMin,
    dateMax,
    sortKey,
    sortDir,
  ]);

  const fetchOffres = async () => {
    try {
      setLoading(true);

      const { from, to } = normalizeDates(dateMin, dateMax);
      const serverSort = `${sortKey}:${sortDir}`;
      const statutQuery = (statut || "publiee").toLowerCase();

      const { data } = await api.get("/offres", {
        params: {
          page,
          limit,
          search,
          lieu,
          employeur,
          type_contrat: typeContrat,
          type_recrutement: typeRecrutement,
          statut: statutQuery,
          ...(from && { date_min: from }),
          ...(to && { date_max: to }),
          sort: serverSort,
        },
      });

      let list = [];
      if (Array.isArray(data?.offres)) list = data.offres;
      else if (Array.isArray(data?.data)) list = data.data;
      else if (Array.isArray(data)) list = data;

      const normalized = list
        .map(normalizeOffre)
        .filter((offre) => {
          const s = (offre.statut || "").toLowerCase();
          return s !== "brouillon";
        });

      const sorted = [...normalized].sort((a, b) => {
        const dir = sortDir === "asc" ? 1 : -1;

        if (sortKey === "date_limite") {
          return (toTime(a.date_limite) - toTime(b.date_limite)) * dir;
        }
        if (sortKey === "date_publication") {
          return (toTime(a.date_publication) - toTime(b.date_publication)) * dir;
        }
        if (sortKey === "titre") {
          return a.titre.localeCompare(b.titre) * dir;
        }
        if (sortKey === "employeur") {
          return a.employeur.localeCompare(b.employeur) * dir;
        }
        if (sortKey === "lieu") {
          return a.lieu.localeCompare(b.lieu) * dir;
        }

        return 0;
      });

      setOffres(sorted);

      const safeTotal = sorted.length;
      setTotalCount(safeTotal);
      setTotalPages(Math.max(1, Math.ceil(safeTotal / limit)));
    } catch (err) {
      console.error("Erreur chargement des offres :", err);
      setOffres([]);
      setTotalCount(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffres();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    page,
    search,
    lieu,
    employeur,
    typeContrat,
    typeRecrutement,
    statut,
    dateMin,
    dateMax,
    sortKey,
    sortDir,
  ]);

  const visibleOffres = useMemo(() => offres, [offres]);

  const resetFilters = () => {
    setSearchInput("");
    setLieuInput("");
    setEmployeurInput("");
    setTypeContratInput("");
    setTypeRecrutementInput("");
    setStatutInput("publiee");
    setDateMinInput("");
    setDateMaxInput("");
    setSortKey("date_publication");
    setSortDir("desc");
    setPage(1);
  };

  const exportPDF = () => {
    const doc = new jsPDF();

    doc.text("Offres d'emploi", 14, 10);

    doc.autoTable({
      head: [[
        "Titre",
        "Employeur",
        "Lieu",
        "Contrat",
        "Recrutement",
        "Expiration",
      ]],
      body: visibleOffres.map((o) => [
        o.titre,
        o.employeur,
        o.lieu,
        o.type_contrat,
        getRecruitmentLabel(o.type_recrutement),
        formatDate(o.date_limite),
      ]),
      styles: { fontSize: 9 },
      startY: 16,
    });

    doc.save("offres.pdf");
  };

  const onSubmitSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="max-w-6xl mx-auto px-4 pt-20 pb-28">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-red-700">Offres d'emploi</h1>
          <p className="text-sm text-gray-600 mt-1">
            Découvrez les opportunités actuellement publiées.
          </p>
        </div>

        <p className="text-sm text-gray-600">
          {`${totalCount} offre${totalCount > 1 ? "s" : ""} trouvée${totalCount > 1 ? "s" : ""}`}
        </p>
      </div>

      <form onSubmit={onSubmitSearch} className="mb-4 flex gap-2">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Rechercher un titre, un employeur ou un lieu..."
          className="border px-3 py-2 rounded-xl w-full"
        />
        <button
          type="submit"
          className="shrink-0 bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700"
        >
          Rechercher
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <input
          type="text"
          value={lieuInput}
          onChange={(e) => setLieuInput(e.target.value)}
          placeholder="Filtrer par lieu"
          className="border px-3 py-2 rounded-xl"
        />

        <input
          type="text"
          value={employeurInput}
          onChange={(e) => setEmployeurInput(e.target.value)}
          placeholder="Filtrer par employeur"
          className="border px-3 py-2 rounded-xl"
        />

        <input
          type="text"
          value={typeContratInput}
          onChange={(e) => setTypeContratInput(e.target.value)}
          placeholder="Filtrer par type de contrat"
          className="border px-3 py-2 rounded-xl"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <select
          value={typeRecrutementInput}
          onChange={(e) => setTypeRecrutementInput(e.target.value)}
          className="border px-3 py-2 rounded-xl bg-white"
        >
          <option value="">Type de recrutement</option>
          <option value="externe">Externe</option>
          <option value="interne">Interne</option>
        </select>

        <select
          value={statutInput}
          onChange={(e) => setStatutInput(e.target.value)}
          className="border px-3 py-2 rounded-xl bg-white"
        >
          <option value="publiee">Publiées</option>
          <option value="suspendue">Suspendues</option>
          <option value="cloturee">Clôturées</option>
        </select>

        <input
          type="date"
          value={dateMinInput}
          onChange={(e) => setDateMinInput(e.target.value)}
          className="border px-3 py-2 rounded-xl"
        />

        <input
          type="date"
          value={dateMaxInput}
          onChange={(e) => setDateMaxInput(e.target.value)}
          className="border px-3 py-2 rounded-xl"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value)}
          className="border px-3 py-2 rounded-xl bg-white"
        >
          <option value="date_publication">Tri : date de publication</option>
          <option value="date_limite">Tri : date limite</option>
          <option value="titre">Tri : titre</option>
          <option value="employeur">Tri : employeur</option>
          <option value="lieu">Tri : lieu</option>
        </select>

        <select
          value={sortDir}
          onChange={(e) => setSortDir(e.target.value)}
          className="border px-3 py-2 rounded-xl bg-white"
        >
          <option value="desc">Ordre : décroissant</option>
          <option value="asc">Ordre : croissant</option>
        </select>

        <button
          type="button"
          onClick={resetFilters}
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-200"
        >
          Réinitialiser
        </button>

        <button
          type="button"
          onClick={exportPDF}
          className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700"
        >
          Exporter en PDF
        </button>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-10">Chargement...</div>
      ) : visibleOffres.length === 0 ? (
        <div className="text-center text-gray-500 py-10">Aucune offre trouvée.</div>
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {visibleOffres.map((offre) => {
              const status = getDisplayStatus(offre);

              return (
                <article
                  key={offre.id}
                  className="border rounded-2xl p-5 bg-white shadow-sm hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h2 className="text-lg font-semibold text-gray-800">
                      {offre.titre}
                    </h2>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full border whitespace-nowrap ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </div>

                  <div className="space-y-1 text-sm text-gray-600 mb-3">
                    <p><span className="font-medium">Employeur :</span> {offre.employeur}</p>
                    <p><span className="font-medium">Lieu :</span> {offre.lieu}</p>
                    <p><span className="font-medium">Contrat :</span> {offre.type_contrat}</p>
                    <p>
                      <span className="font-medium">Recrutement :</span>{" "}
                      {getRecruitmentLabel(offre.type_recrutement)}
                    </p>
                    <p>
                      <span className="font-medium">Publié le :</span>{" "}
                      {formatDate(offre.date_publication)}
                    </p>
                    <p>
                      <span className="font-medium">Expire le :</span>{" "}
                      {formatDate(offre.date_limite)}
                    </p>
                  </div>

                  <p className="text-sm text-gray-700 mb-4">
                    {truncateText(offre.resume || offre.description, 180)}
                  </p>

                  <Link
                    to={`/offres/${offre.id}`}
                    className="inline-flex items-center text-red-700 font-medium hover:underline"
                  >
                    Voir les détails
                  </Link>
                </article>
              );
            })}
          </div>

          <div className="flex justify-center items-center gap-3 mt-10 flex-wrap">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-4 py-2 border rounded-xl disabled:opacity-50"
            >
              Précédent
            </button>

            {pages.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={`px-4 py-2 rounded-xl border ${
                  p === page
                    ? "bg-red-600 text-white border-red-600"
                    : "bg-white text-gray-700"
                }`}
              >
                {p}
              </button>
            ))}

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-4 py-2 border rounded-xl disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        </>
      )}
    </div>
  );
}