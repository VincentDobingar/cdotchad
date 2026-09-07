// 📁 src/pages/public/ActualiteDetail.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "@/utils/api";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const FALLBACK = "/images/default-news.jpg";

function buildCandidates(raw, cacheKey) {
  if (!raw) return [FALLBACK];
  let v = String(raw).trim();
  const origin = window.location.origin;

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
    } catch {}
  }

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

export default function ActualiteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [actu, setActu] = useState(null);
  const [copied, setCopied] = useState(false);
  const [similar, setSimilar] = useState([]);
  const [showTopBtn, setShowTopBtn] = useState(false);

  useEffect(() => {
    const fetchActu = async () => {
      try {
        const res = await api.get(`/actualites/${id}`);
        setActu(res.data);
      } catch (err) {
        console.error("Erreur fetch actu:", err.message);
        navigate("/actualites");
      }
    };

    const fetchSimilar = async () => {
      try {
        const res = await api.get("/actualites", { params: { limit: 3, sort: "desc" } });
        const autres = Array.isArray(res.data?.data) ? res.data.data.filter((a) => a.id != id) : [];
        setSimilar(autres.slice(0, 3));
      } catch (err) {
        console.error("Erreur fetch similaires:", err.message);
      }
    };

    fetchActu();
    fetchSimilar();
  }, [id, navigate]);

  useEffect(() => {
    const handleScroll = () => setShowTopBtn(window.scrollY > 300);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadPDF = async () => {
    const content = document.querySelector(".actu-print-zone");
    if (!content) return;
    const canvas = await html2canvas(content, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const ratio = pageWidth / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 10, pageWidth, canvas.height * ratio);
    pdf.save(`${(actu?.titre || "actualite").slice(0, 50)}.pdf`);
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const SideActions = () => (
    <div className="hidden lg:flex flex-col gap-3 sticky top-28 ml-6 print:hidden">
      <button onClick={handleCopyLink} className="text-sm text-gray-600 hover:text-red-600">
        {copied ? "Lien copié ✅" : "Partager"}
      </button>
      <button onClick={() => window.print()} className="text-sm text-gray-600 hover:text-red-600">
        Imprimer
      </button>
      <button onClick={handleDownloadPDF} className="text-sm text-gray-600 hover:text-red-600">
        Télécharger PDF
      </button>
      <button onClick={scrollToTop} className="text-sm text-gray-600 hover:text-red-600">
        Haut de page ↑
      </button>
    </div>
  );

  if (!actu) return <p className="text-center mt-10">Chargement...</p>;

  const mainImgRaw = actu.image || actu.cover || actu.image_url || actu.photo || "";
  const mainKey = actu.updated_at || actu.date_publication || actu.id;

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto px-4 pt-24 pb-28 relative">
      {/* Colonne principale */}
      <div className="w-full lg:w-3/4">
        <div className="flex justify-between items-center mb-4 print:hidden">
          <button onClick={() => navigate(-1)} className="text-sm text-red-600 hover:underline">
            ← Retour
          </button>
          <div className="flex gap-4">
            <button onClick={handleCopyLink} className="text-sm text-gray-600 hover:text-red-600">
              {copied ? "Lien copié ✅" : "Partager"}
            </button>
            <button onClick={() => window.print()} className="text-sm text-gray-600 hover:text-red-600">
              Imprimer
            </button>
            <button onClick={handleDownloadPDF} className="text-sm text-gray-600 hover:text-red-600">
              Télécharger PDF
            </button>
          </div>
        </div>

        <div className="actu-print-zone">
          <SmartImg
            raw={mainImgRaw}
            cacheKey={mainKey}
            alt={actu.titre}
            className="w-full h-64 md:h-80 object-cover rounded-lg shadow mb-6"
          />

          <div className="mb-4">
            <span className="text-xs font-medium text-red-500 uppercase">
              {actu.categorie || "Non classée"}
            </span>
            <p className="text-sm text-gray-500 mt-1">
              Publié le{" "}
              {new Date(actu.date_publication).toLocaleDateString("fr-FR", {
                weekday: "short",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-6">{actu.titre}</h1>

          <div
            className="prose prose-sm md:prose-base lg:prose-lg max-w-none text-gray-800 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: actu.contenu }}
          />
        </div>

        {similar.length > 0 && (
          <div className="mt-16 print:hidden">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">À lire aussi</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {similar.map((item) => {
                const raw = item.image || item.cover || item.image_url || item.photo || "";
                const key = item.updated_at || item.date_publication || item.id;
                return (
                  <Link key={item.id} to={`/actualites/${item.id}`} className="border rounded-lg overflow-hidden hover:shadow transition-all">
                    <SmartImg
                      raw={raw}
                      cacheKey={key}
                      alt={item.titre}
                      className="h-40 w-full object-cover"
                    />
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-800 text-base mb-1 line-clamp-2">{item.titre}</h3>
                      <p className="text-xs text-gray-500">{new Date(item.date_publication).toLocaleDateString("fr-FR")}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar sticky */}
      <div className="hidden lg:block print:hidden">
        <SideActions />
      </div>

      {/* 🔼 Bouton retour haut de page */}
      {showTopBtn && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 bg-red-600 text-white p-2 rounded-full shadow-lg hover:bg-red-700 z-50 print:hidden"
          title="Remonter en haut"
        >
          ↑
        </button>
      )}
    </div>
  );
}
