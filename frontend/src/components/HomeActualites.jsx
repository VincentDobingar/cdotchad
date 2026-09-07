import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation, Keyboard } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import api from "@/utils/api";

const FALLBACK = "/images/default-actualite.jpg";

/* ---- Résolution ultra-robuste des images ---- */
function buildCandidates(raw, cacheKey) {
  if (!raw) return [FALLBACK];

  let v = String(raw).trim();
  const origin = window.location.origin;

  // Absolue → on remappe vers le même origin (CSP img-src 'self')
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
      return list
        .map((url) => (cacheKey ? `${url}${url.includes("?") ? "&" : "?"}v=${encodeURIComponent(cacheKey)}` : url))
        .concat(FALLBACK);
    } catch { /* on retombera sur la branche relative */ }
  }

  // Relative → variantes /backend/uploads, /uploads, /images
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
/* -------------------------------------------- */

export default function HomeActualites() {
  const [actualites, setActualites] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchActualites = async () => {
      try {
        const res = await api.get("/actualites", { params: { limit: 6, sort: "desc" } });

        // l’API peut renvoyer tableau direct ou { data: [...] }
        const raw = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.data) ? res.data.data : [];

        const normalized = raw.map((a, i) => ({
          id: a.id ?? a._id ?? i,
          titre: a.titre ?? a.title ?? "Sans titre",
          // on garde la valeur *brute*, SmartImg s’occupe des chemins
          image: a.image ?? a.image_url ?? a.cover ?? a.photo ?? "",
          date_publication: a.date_publication ?? a.created_at ?? a.date ?? null,
          resume: (a.resume || a.contenu || a.content || "").toString(),
          updated_at: a.updated_at ?? a.modified_at ?? null,
        }));

        setActualites(normalized);
      } catch (err) {
        console.error("Erreur chargement actualités:", err);
        setActualites([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActualites();
  }, []);

  if (loading) return <div className="text-center py-10 text-gray-500">Chargement des actualités...</div>;
  if (!actualites.length) return <div className="text-center py-10 text-gray-400">Aucune actualité à afficher.</div>;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Actualités À La Une</h2>
        <button onClick={() => navigate("/actualites")} className="text-sm text-blue-600 font-semibold hover:underline">
          Tous Découvrir
        </button>
      </div>

      <Swiper
        modules={[Autoplay, Pagination, Navigation, Keyboard]}
        spaceBetween={24}
        slidesPerView={1}
        breakpoints={{ 768: { slidesPerView: 2 } }}
        autoplay={{ delay: 6000, disableOnInteraction: false, pauseOnMouseEnter: true }}
        pagination={{ clickable: true }}
        navigation={{ nextEl: ".actualite-swiper-next", prevEl: ".actualite-swiper-prev" }}
        keyboard={{ enabled: true, onlyInViewport: true }}
        className="relative"
      >
        {actualites.map((actu) => (
          <SwiperSlide key={actu.id}>
            <article className="flex flex-col md:flex-row bg-white border rounded-lg shadow-lg overflow-hidden h-full min-h-[380px]">
              {/* Media avec ratio stable */}
              <div className="md:w-1/2">
                <div className="relative w-full h-full md:h-auto aspect-video">
                  <SmartImg
                    raw={actu.image}
                    cacheKey={actu.updated_at || actu.date_publication || actu.id}
                    alt={`Actualité – ${actu.titre}`}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Contenu */}
              <div className="p-5 md:w-1/2 flex flex-col justify-between">
                <div>
                  <p className="text-xs text-gray-400 mb-1">
                    {actu.date_publication
                      ? new Date(actu.date_publication).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : ""}
                  </p>
                  <h3 className="text-lg font-bold mb-2 text-gray-800">{actu.titre}</h3>
                  <p className="text-sm text-gray-700 mb-4 line-clamp-4">
                    {actu.resume?.length > 180 ? `${actu.resume.slice(0, 180)}…` : (actu.resume || "")}
                  </p>
                </div>
                <button
                  onClick={() => navigate(`/actualites/${actu.id}`)}
                  className="text-red-600 font-semibold hover:underline self-start"
                  aria-label={`Consulter l’actualité : ${actu.titre}`}
                >
                  Consulter Maintenant
                </button>
              </div>
            </article>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Boutons navigation */}
      <div
        className="actualite-swiper-prev absolute top-1/2 -left-4 transform -translate-y-1/2 z-10 cursor-pointer text-red-600 text-3xl select-none"
        role="button"
        aria-label="Précédent"
      >
        ‹
      </div>
      <div
        className="actualite-swiper-next absolute top-1/2 -right-4 transform -translate-y-1/2 z-10 cursor-pointer text-red-600 text-3xl select-none"
        role="button"
        aria-label="Suivant"
      >
        ›
      </div>
    </div>
  );
}
