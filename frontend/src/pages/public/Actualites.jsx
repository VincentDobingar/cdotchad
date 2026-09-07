// 📁 src/pages/public/Actualites.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "@/utils/api";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { toPublicImageUrl } from "@/utils/imgUrl";

const FALLBACK = "/images/default-news.jpg";
const stripHtml = (s = "") => s.replace(/<[^>]+>/g, "");
const toTime = (d) => (d ? Number(new Date(d).getTime()) || 0 : 0);

/** Construit une liste d’URL candidates pour une image donnée */
function buildCandidates(raw, cacheKey) {
  if (!raw) return [FALLBACK];

  let v = String(raw).trim();
  const origin = window.location.origin;

  // 1) absolue → force même origin (CSP: img-src 'self')
  if (/^https?:\/\//i.test(v)) {
    try {
      const u = new URL(v);
      const p = u.pathname.replace(/^\/+/, "");
      // tente backend/uploads puis chemin absolu tel quel
      const up = p.replace(/^api\//i, "").replace(/^backend\//i, "");
      const ups = up.startsWith("uploads/") ? up : `uploads/${up}`;
      const list = [
        `${origin}/backend/${ups}`,
        `${origin}/${p}`,
        `${origin}/uploads/${up}`,
        `${origin}/images/${up.replace(/^uploads\//, "")}`,
      ];
      return list.map((url) =>
        cacheKey ? `${url}${url.includes("?") ? "&" : "?"}v=${encodeURIComponent(cacheKey)}` : url
      ).concat(FALLBACK);
    } catch {
      // tombera sur la branche relative
    }
  }

  // 2) relative → nettoie et génère plusieurs chemins
  v = v.replace(/^\/+/, "").replace(/^api\//i, "").replace(/^backend\//i, "");
  const isUploads = /^uploads\//i.test(v);
  const isImages = /^images\//i.test(v);

  const cands = [];
  if (isUploads) {
    cands.push(`${origin}/backend/${v}`, `${origin}/${v}`, `${origin}/${v.replace(/^uploads\//i, "images/")}`);
  } else if (isImages) {
    cands.push(`${origin}/${v}`);
    const asUpload = `uploads/${v.replace(/^images\//i, "")}`;
    cands.push(`${origin}/backend/${asUpload}`, `${origin}/${asUpload}`);
  } else {
    // inconnu → tente uploads puis images
    const asUpload = `uploads/${v}`;
    cands.push(`${origin}/backend/${asUpload}`, `${origin}/${asUpload}`, `${origin}/images/${v}`);
  }

  const withKey = cands.map((url) =>
    cacheKey ? `${url}${url.includes("?") ? "&" : "?"}v=${encodeURIComponent(cacheKey)}` : url
  );

  return withKey.concat(FALLBACK);
}

/** <img> qui essaye les candidats l’un après l’autre en cas d’erreur */
function SmartImg({ raw, cacheKey, alt = "", className = "" }) {
  const candidates = useMemo(() => buildCandidates(raw, cacheKey), [raw, cacheKey]);
  const [idx, setIdx] = useState(0);
  const src = candidates[idx] || FALLBACK;

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      onError={() => setIdx((i) => (i + 1 < candidates.length ? i + 1 : i))}
    />
  );
}

export default function Actualites() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [actualites, setActualites] = useState([]);
  const [page, setPage] = useState(parseInt(searchParams.get("page")) || 1);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [sortOrder, setSortOrder] = useState(searchParams.get("sort") || "desc");
  const [sortKey, setSortKey] = useState(searchParams.get("sort_by") || "date_publication");
  const [month, setMonth] = useState(searchParams.get("month") || "");
  const [year, setYear] = useState(searchParams.get("year") || "");
  const [categorie, setCategorie] = useState(searchParams.get("categorie") || "");
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(null);
  const [anneesDispo, setAnneesDispo] = useState([]);
  const [loading, setLoading] = useState(true);

  const limit = 6;

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { data: raw } = await api.get("/actualites", {
          params: {
            page,
            limit,
            search,
            sort: sortOrder,
            sort_by: sortKey,
            ...(month && { month }),
            ...(year && { year }),
            ...(categorie && { categorie }),
          },
        });

        const list = Array.isArray(raw?.data)
          ? raw.data
          : Array.isArray(raw?.items)
          ? raw.items
          : Array.isArray(raw)
          ? raw
          : [];

        const normalized = list.map((n, i) => ({
          id: n.id ?? n._id ?? i,
          titre: n.titre ?? n.title ?? "Sans titre",
          image: n.image ?? n.cover ?? n.image_url ?? n.photo ?? "",
          categorie: n.categorie ?? n.category ?? "",
          date_publication: n.date_publication ?? n.published_at ?? n.date ?? null,
          resume: n.resume ?? n.summary ?? "",
          contenu: n.contenu ?? n.content ?? "",
          updated_at: n.updated_at ?? n.modified_at ?? null,
        }));

        const dir = sortOrder === "asc" ? 1 : -1;
        const sorted = [...normalized].sort((a, b) => {
          if (sortKey === "titre") {
            return a.titre.localeCompare(b.titre, "fr", { sensitivity: "base" }) * dir;
          }
          return (toTime(a.date_publication) - toTime(b.date_publication)) * dir;
        });

        setActualites(sorted);

        const total =
          Number(raw?.total) ||
          Number(raw?.count) ||
          (Number(raw?.totalPages) && Number(raw?.limit || limit)
            ? Number(raw.totalPages) * Number(raw.limit || limit)
            : sorted.length);

        setTotalCount(total);
        const tp =
          Number(raw?.totalPages) || Math.max(1, Math.ceil(total / Number(raw?.limit || limit)));
        setTotalPages(tp);
      } catch (err) {
        console.error("Erreur de chargement des actualités :", err);
        setActualites([]);
        setTotalCount(0);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, sortOrder, sortKey, month, year, categorie]);

  useEffect(() => {
    api
      .get("/actualites/annees")
      .then((res) => {
        const arr = Array.isArray(res.data) ? res.data : [];
        setAnneesDispo(arr.length ? arr : [2025, 2024, 2023]);
      })
      .catch(() => setAnneesDispo([2025, 2024, 2023]));
  }, []);

  const syncURL = (nextPage = page, nextSearch = search, nextSort = sortOrder, nextSortKey = sortKey, nextMonth = month, nextYear = year, nextCat = categorie) => {
    const params = { page: nextPage, search: nextSearch, sort: nextSort, sort_by: nextSortKey, month: nextMonth, year: nextYear, categorie: nextCat };
    Object.keys(params).forEach((k) => (params[k] === "" || params[k] == null) && delete params[k]);
    setSearchParams(params);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    syncURL(1);
  };

  const handleExportPDF = async () => {
    const input = document.querySelector(".grid-actualites");
    if (!input) return;
    const canvas = await html2canvas(input, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const ratio = pageWidth / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 10, pageWidth, canvas.height * ratio);
    pdf.save("actualites.pdf");
  };

  return (
    <div className="max-w-6xl mx-auto px-4 pt-20 pb-28 relative">
      {loading ? (
        <div className="p-6">Chargement des actualités…</div>
      ) : (
        <>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-4">
            <h1 className="text-3xl font-bold text-red-600">Actualités</h1>
            <p className="text-sm text-gray-600">
              {totalCount == null ? "" : `${totalCount} actualit\u00e9${totalCount > 1 ? "s" : ""}`}
            </p>
          </div>

          <div className="flex justify-end mb-4">
            <button onClick={handleExportPDF} className="bg-gray-200 text-sm px-4 py-2 rounded hover:bg-gray-300">
              Exporter la liste en PDF
            </button>
          </div>

          {/* Recherche + Filtres + Tri */}
          <form onSubmit={handleSearch} className="mb-6 flex flex-col md:flex-row flex-wrap gap-4 md:items-center">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un titre..."
              className="border p-2 rounded w-full md:w-1/3"
            />

            <div className="flex gap-2">
              <select
                value={sortKey}
                onChange={(e) => {
                  setSortKey(e.target.value);
                  setPage(1);
                  syncURL(1, search, sortOrder, e.target.value);
                }}
                className="border p-2 rounded text-sm md:w-48"
              >
                <option value="date_publication">Tri : date de publication</option>
                <option value="titre">Tri : titre</option>
              </select>
              <select
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value);
                  setPage(1);
                  syncURL(1, search, e.target.value, sortKey);
                }}
                className="border p-2 rounded text-sm md:w-40"
              >
                <option value="desc">Ordre : décroissant</option>
                <option value="asc">Ordre : croissant</option>
              </select>
            </div>

            <select
              value={month}
              onChange={(e) => {
                setMonth(e.target.value);
                setPage(1);
                syncURL(1, search, sortOrder, sortKey, e.target.value, year, categorie);
              }}
              className="border p-2 rounded text-sm md:w-28"
            >
              <option value="">Mois</option>
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}</option>
              ))}
            </select>

            <select
              value={year}
              onChange={(e) => {
                setYear(e.target.value);
                setPage(1);
                syncURL(1, search, sortOrder, sortKey, month, e.target.value, categorie);
              }}
              className="border p-2 rounded text-sm md:w-28"
            >
              <option value="">Année</option>
              {anneesDispo.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            <select
              value={categorie}
              onChange={(e) => {
                setCategorie(e.target.value);
                setPage(1);
                syncURL(1, search, sortOrder, sortKey, month, year, e.target.value);
              }}
              className="border p-2 rounded text-sm md:w-48"
            >
              <option value="">Toutes les catégories</option>
              <option value="Annonce">Annonce</option>
              <option value="Événement">Événement</option>
              <option value="Projet">Projet</option>
            </select>

            <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
              Rechercher
            </button>
          </form>

          {/* Liste */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 grid-actualites">
            {actualites.length === 0 && (
              <p className="text-center text-gray-500 col-span-full">Aucune actualité trouvée.</p>
            )}

            {actualites.map((actu) => (
              <div key={actu.id} className="bg-white rounded-xl shadow hover:shadow-md transition-all duration-300 p-4 flex flex-col">
                <SmartImg
                  raw={actu.image || actu.cover || actu.illustration || actu.url}
                  cacheKey={actu.updated_at || actu.date_publication || actu.id}
                  alt={actu.titre}
                  className="h-40 w-full object-cover rounded mb-3"
                />
                <span className="text-xs text-red-500 font-semibold uppercase mb-1">
                  {actu.categorie || "Non classée"}
                </span>
                <h3 className="font-bold text-base mb-1 text-gray-800">{actu.titre}</h3>
                <p className="text-xs text-gray-500 mb-2">
                  {actu.date_publication
                    ? new Date(actu.date_publication).toLocaleDateString("fr-FR", {
                        weekday: "short",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "Date inconnue"}
                </p>
                <div className="text-sm text-gray-700 flex-1 mb-3 line-clamp-4">
                  {actu.resume ? (
                    <span dangerouslySetInnerHTML={{ __html: actu.resume }} />
                  ) : (
                    <span>{stripHtml(actu.contenu).slice(0, 150)}…</span>
                  )}
                </div>
                <Link to={`/actualites/${actu.id}`} className="text-red-600 text-sm font-medium hover:underline mt-auto">
                  Lire la suite →
                </Link>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-center mt-8 gap-4">
            <button
              onClick={() => {
                const newPage = Math.max(page - 1, 1);
                setPage(newPage);
                syncURL(newPage);
              }}
              disabled={page <= 1}
              className="px-4 py-1 rounded border text-sm disabled:opacity-50"
            >
              ← Précédent
            </button>
            <span className="text-sm text-gray-700">Page {page} / {totalPages}</span>
            <button
              onClick={() => {
                const newPage = Math.min(page + 1, totalPages);
                setPage(newPage);
                syncURL(newPage);
              }}
              disabled={page >= totalPages}
              className="px-4 py-1 rounded border text-sm disabled:opacity-50"
            >
              Suivant →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
