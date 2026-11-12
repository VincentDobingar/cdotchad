// 📁 src/pages/public/Services.jsx
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  HeartHandshake,
  Globe,
  Users,
  Wrench,
  FileSearch,
  Compass,
  Laptop,
  HandHelping,
  TriangleAlert,
  ChevronRight,
} from "lucide-react";
import api from "@/utils/api";
import PageHero from "@/components/ui/PageHero";
import { METIERS } from "@/data/contenuCabinet";

// --- Helpers sûrs ---
const asArray = (v) => {
  if (Array.isArray(v)) return v;
  if (v == null) return [];
  // si string JSON: "[...]" ou "{...}"
  if (typeof v === "string" && /^[\[\{].*[\]\}]$/.test(v.trim())) {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
    } catch {}
  }
  return [v];
};

const pick = (...vals) => vals.find((x) => x != null && x !== "") ?? "";

const iconMap = {
  BookOpen,
  HeartHandshake,
  Globe,
  Users,
  Wrench,
  FileSearch,
  Compass,
  Laptop,
  HelpingHand: HandHelping,
  AlertTriangle: TriangleAlert,
};

export default function PublicServices() {
  const [services, setServices] = useState([]);
  const [openServiceId, setOpenServiceId] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const perPage = 4;

  const toggleSubServices = (id) => {
    setOpenServiceId((current) => (current === id ? null : id));
  };

  useEffect(() => {
    const loadServices = async () => {
      setLoading(true);
      try {
        const raw = await api.get("/services").then((r) => r.data);

        // 🌟 Normalisation de la forme
        const arr = Array.isArray(raw?.data)
          ? raw.data
          : Array.isArray(raw?.services)
          ? raw.services
          : Array.isArray(raw)
          ? raw
          : [];

        // 🌟 Normalisation du contenu
        const normalized = arr.map((s, i) => {
          const subs = asArray(s?.sous_services).map((sub) =>
            typeof sub === "string" ? { nom: sub } : sub || {}
          );

          const iconKey = pick(s?.icone, s?.icon, "AlertTriangle");
          const IconComp = iconMap[iconKey] || TriangleAlert;

          return {
            id: s?.id ?? i,
            titre: pick(s?.titre, s?.title, s?.nom, "Service"),
            description: pick(s?.description, s?.resume, s?.content, ""),
            icone: iconKey,
            IconComp,
            sous_services: subs,
          };
        });

        setServices(normalized);
      } catch (err) {
        console.error("Erreur lors du chargement des services :", err);
        setServices([]);
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, []);

  const totalPages = Math.max(1, Math.ceil(services.length / perPage));
  const paginated = services.slice((page - 1) * perPage, page * perPage);

  return (
    <main className="bg-ivoire">
      <PageHero
        label="Nos services"
        title="Un accompagnement complet, du diagnostic au résultat"
        intro="Des solutions sur mesure pour les entreprises, les institutions et les projets de développement, à chaque étape de leur croissance."
      />

      {/* Les trois métiers du cabinet */}
      <section className="pt-20 md:pt-24">
        <div className="max-w-6xl mx-auto px-6 grid gap-6 md:grid-cols-3">
          {METIERS.map(({ id, titre, Icon, accroche, prestations }, index) => (
            <motion.article
              key={id}
              id={id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="group bg-white border border-sable rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300"
            >
              <div className="grid place-items-center h-12 w-12 rounded-xl bg-rouge/10 text-rouge group-hover:bg-rouge group-hover:text-white transition-colors mb-5">
                <Icon className="w-6 h-6" />
              </div>
              <h2 className="font-display text-2xl text-encre">{titre}</h2>
              <p className="mt-1 text-sm text-graphite/80">{accroche}</p>
              <ul className="mt-5 space-y-2.5 text-graphite">
                {prestations.map((p) => (
                  <li key={p} className="flex gap-2">
                    <ChevronRight className="w-4 h-4 mt-1 text-rouge shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="py-20 md:py-24">
        <div className="max-w-6xl mx-auto px-6">
          {loading ? null : services.length === 0 ? null : (
            <>
              <h2 className="font-display text-3xl text-encre mb-8">Le détail de nos prestations</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {paginated.map((service, index) => {
                  const Icon = service.IconComp || iconMap[service.icone] || TriangleAlert;
                  const isOpen = openServiceId === service.id;
                  const subs = asArray(service.sous_services);

                  return (
                    <motion.div
                      key={service.id}
                      initial={{ opacity: 0, y: 24 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.08 }}
                      className="group bg-white border border-sable rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300"
                    >
                      <div className="grid place-items-center h-12 w-12 rounded-xl bg-rouge/10 text-rouge group-hover:bg-rouge group-hover:text-white transition-colors mb-5">
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="font-display text-xl text-encre mb-2">{service.titre}</h3>
                      <p className="text-graphite leading-relaxed">{service.description}</p>

                      {subs.length > 0 && (
                        <>
                          <button
                            onClick={() => toggleSubServices(service.id)}
                            className="mt-4 text-sm font-semibold text-rouge hover:text-rougeprofond underline-offset-4 hover:underline"
                          >
                            {isOpen ? "Masquer les sous-services" : "Voir les sous-services"}
                          </button>

                          <AnimatePresence initial={false}>
                            {isOpen && (
                              <motion.ul
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.35 }}
                                className="mt-4 text-sm text-graphite space-y-2 overflow-hidden"
                              >
                                {subs.map((sub, idx) => (
                                  <li key={idx} className="flex items-center gap-2">
                                    <ChevronRight className="w-4 h-4 text-rouge shrink-0" />
                                    {sub?.nom || sub?.title || String(sub)}
                                  </li>
                                ))}
                              </motion.ul>
                            )}
                          </AnimatePresence>
                        </>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center items-center mt-12 gap-2">
                  <button
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                    className="h-9 px-4 rounded-full border border-sable text-sm text-encre bg-white hover:bg-sable disabled:opacity-40 transition"
                  >
                    Précédent
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setPage(i + 1)}
                      className={`h-9 w-9 rounded-full border text-sm transition ${
                        page === i + 1 ? "bg-rouge border-rouge text-white" : "bg-white border-sable text-encre hover:bg-sable"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={page === totalPages}
                    className="h-9 px-4 rounded-full border border-sable text-sm text-encre bg-white hover:bg-sable disabled:opacity-40 transition"
                  >
                    Suivant
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
