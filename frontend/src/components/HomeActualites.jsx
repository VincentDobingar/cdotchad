import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation, Keyboard } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import api from "@/utils/api";
import SectionHeading from "@/components/ui/SectionHeading";

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
          // texte brut : on retire les balises HTML de l'éditeur
          resume: (a.resume || a.contenu || a.content || "")
            .toString()
            .replace(/<[^>]*>/g, " ")
            .replace(/&nbsp;/gi, " ")
            .replace(/\s+/g, " ")
            .trim(),
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

  return (
    <section
      className="bg-ivoire py-20 md:py-28 [--swiper-pagination-color:#c8102e] [--swiper-pagination-bullet-inactive-color:#1b1410]"
      id="actualites"
    >
      <div className="max-w-6xl mx-auto px-6">
        <SectionHeading
          label="Actualités"
          title="Ce qui se passe au cabinet"
          intro="Offres d’emploi, sessions de formation, événements et temps forts de CDO Consulting."
          to="/actualites"
        />

        <div className="mt-12 relative">
          {loading ? (
            <div className="py-10 text-center text-graphite/70">Chargement des actualités…</div>
          ) : actualites.length ? (
            <>
              <Swiper
                modules={[Autoplay, Pagination, Navigation, Keyboard]}
                spaceBetween={24}
                slidesPerView={1}
                breakpoints={{ 768: { slidesPerView: 2 } }}
                autoplay={{ delay: 6000, disableOnInteraction: false, pauseOnMouseEnter: true }}
                pagination={{ clickable: true }}
                navigation={{ nextEl: ".actualite-swiper-next", prevEl: ".actualite-swiper-prev" }}
                keyboard={{ enabled: true, onlyInViewport: true }}
                className="relative !pb-12"
              >
                {actualites.map((actu) => (
                  <SwiperSlide key={actu.id} className="h-auto">
                    <article className="group flex flex-col bg-white border border-sable rounded-2xl overflow-hidden h-full shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
                      <div className="relative w-full aspect-[16/10] overflow-hidden">
                        <SmartImg
                          raw={actu.image}
                          cacheKey={actu.updated_at || actu.date_publication || actu.id}
                          alt={`Actualité – ${actu.titre}`}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="p-6 flex flex-col flex-1">
                        {actu.date_publication && (
                          <p className="text-xs font-medium tracking-wide text-rouge mb-2">
                            {new Date(actu.date_publication).toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            })}
                          </p>
                        )}
                        <h3 className="font-display text-xl text-encre leading-snug mb-3">{actu.titre}</h3>
                        <p className="text-sm text-graphite leading-relaxed line-clamp-3 mb-5">
                          {actu.resume?.length > 180 ? `${actu.resume.slice(0, 180)}…` : actu.resume || ""}
                        </p>
                        <button
                          onClick={() => navigate(`/actualites/${actu.id}`)}
                          className="mt-auto self-start text-sm font-semibold text-rouge hover:text-rougeprofond underline-offset-4 hover:underline"
                          aria-label={`Consulter l’actualité : ${actu.titre}`}
                        >
                          Lire l’article
                        </button>
                      </div>
                    </article>
                  </SwiperSlide>
                ))}
              </Swiper>

              {/* Boutons navigation */}
              <button
                className="actualite-swiper-prev absolute top-[38%] -left-3 md:-left-5 z-10 grid place-items-center h-10 w-10 rounded-full bg-white border border-sable text-encre shadow-sm hover:bg-encre hover:text-white transition"
                aria-label="Actualité précédente"
              >
                ‹
              </button>
              <button
                className="actualite-swiper-next absolute top-[38%] -right-3 md:-right-5 z-10 grid place-items-center h-10 w-10 rounded-full bg-white border border-sable text-encre shadow-sm hover:bg-encre hover:text-white transition"
                aria-label="Actualité suivante"
              >
                ›
              </button>
            </>
          ) : (
            <div className="py-10 text-center text-graphite/60">Aucune actualité à afficher pour le moment.</div>
          )}
        </div>
      </div>
    </section>
  );
}
