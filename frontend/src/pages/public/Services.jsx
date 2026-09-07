// 📁 src/pages/public/Services.jsx
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as Icons from "lucide-react";
import api from "@/utils/api";

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
  BookOpen: Icons.BookOpen,
  HeartHandshake: Icons.HeartHandshake,
  Globe: Icons.Globe,
  Users: Icons.Users,
  Wrench: Icons.Wrench,
  FileSearch: Icons.FileSearch,
  Compass: Icons.Compass,
  Laptop: Icons.Laptop,
  HelpingHand: Icons.HelpingHand,
  AlertTriangle: Icons.AlertTriangle,
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
          const IconComp = iconMap[iconKey] || Icons.AlertTriangle;

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

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4 text-center">
          <p>Chargement des services...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-bold text-center mb-16 text-primary"
        >
          Nos Services
        </motion.h2>

        {services.length === 0 ? (
          <p className="text-center text-gray-500">Aucun service disponible pour le moment</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-10">
              {paginated.map((service, index) => {
                const Icon = service.IconComp || iconMap[service.icone] || Icons.AlertTriangle;
                const isOpen = openServiceId === service.id;
                const subs = asArray(service.sous_services);

                return (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.2 }}
                    className="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition-transform transform hover:-translate-y-1"
                  >
                    <div className="flex items-center justify-center mb-5">
                      <div className="bg-primary/10 p-4 rounded-full">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold mb-3 text-center">{service.titre}</h3>
                    <p className="text-gray-600 text-center mb-5">{service.description}</p>

                    {subs.length > 0 && (
                      <>
                        <div className="text-center">
                          <button
                            onClick={() => toggleSubServices(service.id)}
                            className="text-sm font-medium text-primary underline hover:text-primary-dark transition"
                          >
                            {isOpen ? "Masquer les sous-services" : "Voir les sous-services"}
                          </button>
                        </div>

                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.ul
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.4 }}
                              className="mt-4 text-sm text-gray-700 space-y-2"
                            >
                              {subs.map((sub, idx) => (
                                <li key={idx} className="flex items-center gap-2">
                                  <Icons.ChevronRight className="w-4 h-4 text-primary" />
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
              <div className="flex justify-center mt-10 space-x-2">
                <button
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                  className="px-3 py-1 rounded border text-sm bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  ◀ Précédent
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setPage(i + 1)}
                    className={`px-3 py-1 rounded border text-sm ${
                      page === i + 1
                        ? "bg-red-600 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={page === totalPages}
                  className="px-3 py-1 rounded border text-sm bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  Suivant ▶
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
