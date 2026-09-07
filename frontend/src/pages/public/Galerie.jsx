// 📁 src/pages/public/Galerie.jsx
import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/autoplay";
import api from "@/utils/api";

const FALLBACK = "/images/default-gallery.jpg";

function normalizeUrl(raw) {
  if (!raw) return "";
  const val = String(raw).trim();
  // Absolu → corrige /api/uploads → /backend/uploads
  if (/^https?:\/\//i.test(val)) {
    return val.replace(/\/api\/uploads/i, "/backend/uploads");
  }
  // Relatif → force /backend/uploads
  let v = val.replace(/^\/?api\//i, "")
             .replace(/^\/?backend\//i, "")
             .replace(/^\/+/, "");
  if (!/^uploads\//i.test(v)) v = `uploads/${v}`;
  const API_BASE = import.meta.env.PROD ? "https://cdotchad.com/backend" : "/backend";
  return `${API_BASE}/${v}`;
}

function withBuster(url, key) {
  // clé stable = date_upload (timestamp) ou id, évite Date.now() (trop agressif)
  const k = key ? String(key) : "";
  return url ? `${url}${url.includes("?") ? "&" : "?"}v=${encodeURIComponent(k)}` : url;
}

// ✅ Toujours utiliser le même origin que la page (www.cdotchad.com OU cdotchad.com)
const ORIGIN =
  typeof window !== "undefined"
    ? window.location.origin
    : (import.meta.env.PROD ? "https://cdotchad.com" : "http://localhost:5173");

const API_BASE = `${ORIGIN}/backend`;

/** Normalise toute valeur vers une URL image valide:
 * - /api/uploads/...   →  {ORIGIN}/backend/uploads/...
 * - /backend/uploads/... (ou variantes) → {ORIGIN}/backend/uploads/...
 * - valeur absolue https://.../api/uploads/... → convertie vers /backend/uploads/...
 * - valeur absolue https://.../backend/uploads/... → conservée mais réécrite sur ORIGIN
 */
function toImageUrl(raw) {
  if (!raw) return "";

  let v = String(raw).trim();

  // Si absolue: on remappe le chemin, puis on force l'origin courant
  if (/^https?:\/\//i.test(v)) {
    // remap /api/uploads → /backend/uploads
    v = v.replace(/\/api\/uploads/gi, "/backend/uploads");
    // remplace l'origin par l'origin courant
    try {
      const u = new URL(v);
      u.protocol = new URL(ORIGIN).protocol;
      u.host = new URL(ORIGIN).host;
      return u.toString();
    } catch {
      // si URL() échoue, on retombe plus bas
    }
  }

  // Si relative: nettoyer les préfixes éventuels
  v = v
    .replace(/^\/?api\//i, "")
    .replace(/^\/?backend\//i, "")
    .replace(/^\/+/, ""); // supprime / en tête

  if (!/^uploads\//i.test(v)) v = `uploads/${v}`;

  return `${API_BASE}/${v}`;
}

export default function Galerie() {
  const [galerie, setGalerie] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filtre, setFiltre] = useState("toutes");
  const [currentPage, setCurrentPage] = useState(1);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const imagesPerPage = 9;

  const fetchGalerie = async () => {
    try {
      setIsLoading(true);
      const controller = new AbortController();
      const res = await api.get("/galerie", {
        timeout: 45000,
        signal: controller.signal,
        params: { limit: 60 }
      });
      const rows = Array.isArray(res.data) ? res.data : [];
      const norm = rows.map((r) => {
        const url0 = r.url || r.image || r.path || "";
        const url1 = normalizeUrl(url0);
        const stamp = r.date_upload || r.created_at || r.id;  // pour le cache-buster
        return {
          id: r.id,
          titre: r.titre || r.nom || "Sans titre",
          categorie: r.categorie || r.category || "Autres",
          url: withBuster(url1, stamp),
          date_upload: r.date_upload || r.created_at || null,
        };
      });
      setGalerie(norm);
    } catch (err) {
      console.error("❌ Erreur chargement galerie :", err);
      setGalerie([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const controller = new AbortController();
      const res = await api.get("/galerie/categories", {
        timeout: 25000,
        signal: controller.signal
      })
      setCategories(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("❌ Erreur chargement catégories :", err);
      // secours : dériver à partir des images déjà reçues
      setCategories((prev) => prev.length ? prev :
        Array.from(new Set(galerie.map(g => g.categorie).filter(Boolean))));
    }
  };

  useEffect(() => {
    let mounted = true;
      (async () => {
        await fetchGalerie();
        if (mounted) await fetchCategories();
      })();
    return () => { mounted = false; };
  }, []);

  const filtered = filtre === "toutes" ? galerie : galerie.filter((img) => img.categorie === filtre);

  const indexLast = currentPage * imagesPerPage;
  const indexFirst = indexLast - imagesPerPage;
  const currentImages = filtered.slice(indexFirst, indexLast);
  const totalPages = Math.ceil(filtered.length / imagesPerPage) || 1;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold text-center text-red-600 mb-8">Notre Galerie</h2>

      {galerie.length > 0 ? (
        <>
          {/* Swiper en vedette */}
          <div className="mb-10">
            <h3 className="text-xl font-semibold text-center mb-4 text-gray-700">En vedette</h3>
            <Swiper
              modules={[Autoplay, Navigation]}
              spaceBetween={20}
              slidesPerView={1}
              loop
              autoplay={{ delay: 3000, disableOnInteraction: false, pauseOnMouseEnter: true }}
              navigation={{ nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" }}
              className="rounded-xl h-[250px] md:h-[400px] relative"
            >
              {galerie.slice(0, 5).map((img) => (
                <SwiperSlide key={img.id}>
                  <div className="relative w-full h-full">
                    <img
                      src={img.url || FALLBACK}
                      alt={img.titre}
                      className="w-full h-full object-cover rounded-xl"
                      onClick={() => setLightboxImage(img.url)}
                      loading="lazy"
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK; }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-sm p-2 rounded-b-xl">
                      {img.titre}
                    </div>
                  </div>
                </SwiperSlide>
              ))}
              <div className="swiper-button-next" />
              <div className="swiper-button-prev" />
            </Swiper>
          </div>

          {/* Filtres */}
          <div className="mb-6 text-center">
            <select
              value={filtre}
              onChange={(e) => { setFiltre(e.target.value); setCurrentPage(1); }}
              className="p-2 rounded border bg-white shadow-sm focus:ring-2 focus:ring-red-500"
            >
              <option value="toutes">Toutes les catégories</option>
              {categories.map((cat, i) => (
                <option key={i} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Grille */}
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {currentImages.map((img) => (
              <div key={img.id} className="cursor-pointer group relative overflow-hidden">
                <img
                  src={img.url || FALLBACK}
                  alt={img.titre}
                  className="w-full h-56 object-cover rounded shadow-lg transition-transform duration-300 group-hover:scale-105"
                  onClick={() => setLightboxImage(img.url)}
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = FALLBACK;
                  }}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 text-sm rounded-b">
                  {img.titre}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8 space-x-2">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-4 py-2 rounded-full border transition-colors ${
                    currentPage === i + 1
                      ? "bg-red-600 text-white border-red-600"
                      : "text-gray-700 border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-10">
          <p className="text-gray-600">Aucune image disponible pour le moment.</p>
        </div>
      )}

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl w-full">
            <img
              src={lightboxImage || FALLBACK}
              alt="Aperçu"
              className="max-w-full max-h-[90vh] rounded shadow-lg mx-auto"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = FALLBACK;
              }}
            />
            <button
              className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-200 transition"
              onClick={(e) => { e.stopPropagation(); setLightboxImage(null); }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
