// 📁 src/components/HomeGalerie.jsx
import { useState } from "react";
import Modal from "react-modal";
import { motion } from "framer-motion";
import { toPublicImageUrl } from "@/utils/imgUrl";
import SectionHeading from "@/components/ui/SectionHeading";

const FALLBACK = "/images/default-gallery.jpg"; // si ce fichier n'existe pas, mets /images/default-news.jpg

// Nécessaire pour l'accessibilité
Modal.setAppElement("#root");

// Tu peux ici mixer des chemins locaux (/images/...) et des chemins venant du backend (uploads/...).
const images = [
  "/images/ceo-cdotchad.jpg",
  "/images/formation.png",
  "/images/cdo_pende.png",
  "/images/infor.png",
  "/images/gpec.png",
  "/images/ifc.png",
];

/** Normalise une source :
 * - si c'est une image locale (/images/...) → on la garde telle quelle
 * - sinon → on passe par toPublicImageUrl pour forcer /backend/uploads/... et l'origin courant
 * - fallback systématique si rien de valide
 */
function normalizeSrc(raw, cacheKey) {
  if (!raw) return FALLBACK;
  const v = String(raw).trim();
  if (/^\/?images\//i.test(v)) {
    return v.startsWith("/") ? v : `/${v}`;
  }
  return toPublicImageUrl(v, cacheKey) || FALLBACK;
}

export default function HomeGalerie() {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const openModal = (src) => {
    setSelectedImage(src);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setSelectedImage(null);
  };

  return (
    <section className="py-20 md:py-28 bg-white" id="galerie">
      <div className="max-w-6xl mx-auto px-6">
        <SectionHeading
          label="En images"
          title="Nos moments forts"
          intro="Formations, missions de terrain et temps d’échange qui rythment la vie du cabinet."
          to="/galerie"
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((raw, i) => {
            const src = normalizeSrc(raw, i); // i = petite clé stable en guise de cache-buster local
            // La première image occupe une place plus grande
            const span = i === 0 ? "sm:col-span-2 lg:row-span-2 lg:col-span-1" : "";
            return (
              <button
                key={i}
                type="button"
                onClick={() => openModal(src)}
                title="Cliquer pour agrandir"
                className={`group relative overflow-hidden rounded-2xl bg-sable ${span}`}
              >
                <motion.img
                  src={src}
                  alt={`CDO – moment ${i + 1}`}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = FALLBACK;
                  }}
                  whileHover={{ scale: 1.06 }}
                  transition={{ duration: 0.5 }}
                  className="h-64 w-full object-cover"
                />
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-encre/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
            );
          })}
        </div>

        {/* Lightbox */}
        <Modal
          isOpen={modalIsOpen}
          onRequestClose={closeModal}
          contentLabel="Image agrandie"
          className="max-w-3xl mx-auto mt-24 outline-none"
          overlayClassName="fixed inset-0 bg-encre/85 flex items-center justify-center px-4 z-[1000]"
        >
          <div className="relative">
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 bg-white p-1.5 rounded-full shadow hover:bg-sable transition"
              aria-label="Fermer la prévisualisation"
            >
              ✕
            </button>
            <img
              src={selectedImage || FALLBACK}
              alt="Aperçu"
              className="rounded-2xl max-h-[80vh] w-auto mx-auto shadow-2xl"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = FALLBACK;
              }}
            />
          </div>
        </Modal>
      </div>
    </section>
  );
}
