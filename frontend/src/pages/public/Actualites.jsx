// 📁 src/pages/public/Actualites.jsx
import { useEffect, useMemo, useState } from "react";
import PageHero from "@/components/ui/PageHero";
import { Link, useSearchParams } from "react-router-dom";
import api from "@/utils/api";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const FALLBACK = "/images/default-news.jpg";
const stripHtml = (s = "") => s.replace(/<[^>]+>/g, "");

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
  const [year, setYear] = useState(searchParams.get("year") || "");
  const [categorie, setCategorie] = useState(searchParams.get("categorie") || "");
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(null);
  const [anneesDispo, setAnneesDispo] = useState([]);
  const [categoriesDispo, setCategoriesDispo] = useState([]);
  const [loading, setLoading] = useState(true);

  const limit = 6;

  // Le filtrage, le tri (par date, du plus récent au plus ancien) et la pagination
  // sont désormais faits côté serveur : on affiche directement ce qu'il renvoie.
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { data: raw } = await api.get("/actualites", {
          params: {
            page,
            limit,
            ...(search && { search }),
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

        setActualites(normalized);

        const total =
          Number(raw?.total) ||
          Number(raw?.count) ||
          (Number(raw?.totalPages) && Number(raw?.limit || limit)
            ? Number(raw.totalPages) * Number(raw.limit || limit)
            : normalized.length);

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
  }, [page, search, year, categorie]);

  // Années et catégories réellement présentes en base (plus de liste figée).
  useEffect(() => {
    api
      .get("/actualites/annees")
      .then((res) => {
        const arr = Array.isArray(res.data) ? res.data : [];
        setAnneesDispo(arr);
      })
      .catch(() => setAnneesDispo([]));

    api
      .get("/actualites/categories")
      .then((res) => {
        const arr = Array.isArray(res.data) ? res.data : [];
        setCategoriesDispo(arr);
      })
      .catch(() => setCategoriesDispo([]));
  }, []);

  const syncURL = (nextPage = page, nextSearch = search, nextYear = year, nextCat = categorie) => {
    const params = { page: nextPage, search: nextSearch, year: nextYear, categorie: nextCat };
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

  // Style commun des champs de filtre
  const champ =
    "border border-sable bg-white px-3.5 py-2.5 rounded-xl text-sm text-encre placeholder:text-graphite/50 focus:outline-none focus:ring-2 focus:ring-rouge/30 focus:border-rouge transition";

  return (
    <main className="bg-ivoire min-h-screen">
      <PageHero
        label="Actualités"
        title="Ce qui se passe au cabinet"
        intro="Offres, sessions de formation, événements et temps forts de CDO Consulting."
      />

      <div className="max-w-6xl mx-auto px-6 py-14 relative">
        {loading ? (
          <div className="py-10 text-center text-graphite/70">Chargement des actualités…</div>
        ) : (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
              <p className="text-sm text-graphite">
                {totalCount == null ? "" : `${totalCount} actualité${totalCount > 1 ? "s" : ""}`}
              </p>
              <button
                onClick={handleExportPDF}
                className="px-4 py-2 rounded-full text-sm font-medium border border-sable text-encre bg-white hover:bg-sable transition"
              >
                Exporter la liste en PDF
              </button>
            </div>

            {/* Recherche + catégorie + année (filtres appliqués côté serveur) */}
            <form onSubmit={handleSearch} className="mb-8 flex flex-col md:flex-row flex-wrap gap-3 md:items-center">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un titre…"
                className={`${champ} w-full md:w-1/3`}
              />

              <select
                value={categorie}
                onChange={(e) => {
                  setCategorie(e.target.value);
                  setPage(1);
                  syncURL(1, search, year, e.target.value);
                }}
                className={`${champ} md:w-56`}
              >
                <option value="">Toutes les catégories</option>
                {categoriesDispo.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <select
                value={year}
                onChange={(e) => {
                  setYear(e.target.value);
                  setPage(1);
                  syncURL(1, search, e.target.value, categorie);
                }}
                className={`${champ} md:w-32`}
              >
                <option value="">Année</option>
                {anneesDispo.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </form>

            {/* Liste */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 grid-actualites">
              {actualites.length === 0 && (
                <p className="text-center text-graphite/60 col-span-full py-6">Aucune actualité trouvée.</p>
              )}

              {actualites.map((actu) => (
                <article
                  key={actu.id}
                  className="group bg-white border border-sable rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden flex flex-col"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <SmartImg
                      raw={actu.image || actu.cover || actu.illustration || actu.url}
                      cacheKey={actu.updated_at || actu.date_publication || actu.id}
                      alt={actu.titre}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <span className="text-xs font-semibold tracking-wide text-rouge mb-1.5">
                      {actu.categorie || "Non classée"}
                    </span>
                    <h3 className="font-display text-lg leading-snug mb-1 text-encre">{actu.titre}</h3>
                    <p className="text-xs text-graphite/70 mb-2">
                      {actu.date_publication
                        ? new Date(actu.date_publication).toLocaleDateString("fr-FR", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "Date inconnue"}
                    </p>
                    <div className="text-sm text-graphite flex-1 mb-4 line-clamp-3">
                      {actu.resume ? (
                        <span dangerouslySetInnerHTML={{ __html: actu.resume }} />
                      ) : (
                        <span>{stripHtml(actu.contenu).slice(0, 150)}…</span>
                      )}
                    </div>
                    <Link
                      to={`/actualites/${actu.id}`}
                      className="text-rouge text-sm font-semibold hover:text-rougeprofond underline-offset-4 hover:underline mt-auto"
                    >
                      Lire l’article
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center items-center mt-12 gap-3">
              <button
                onClick={() => {
                  const newPage = Math.max(page - 1, 1);
                  setPage(newPage);
                  syncURL(newPage);
                }}
                disabled={page <= 1}
                className="h-9 px-4 rounded-full border border-sable text-sm text-encre bg-white hover:bg-sable disabled:opacity-40 transition"
              >
                Précédent
              </button>
              <span className="text-sm text-graphite">
                Page {page} / {totalPages}
              </span>
              <button
                onClick={() => {
                  const newPage = Math.min(page + 1, totalPages);
                  setPage(newPage);
                  syncURL(newPage);
                }}
                disabled={page >= totalPages}
                className="h-9 px-4 rounded-full border border-sable text-sm text-encre bg-white hover:bg-sable disabled:opacity-40 transition"
              >
                Suivant
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
