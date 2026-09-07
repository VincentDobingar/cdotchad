// 📁 src/components/HomeGalerie.jsx
import { useState } from "react";
import Modal from "react-modal";
import { motion } from "framer-motion";
import { toPublicImageUrl } from "@/utils/imgUrl";
import { Link } from "react-router-dom";

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
    <section className="py-24 bg-white" id="galerie">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold text-red-600 mb-10">Galerie</h2>

        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {images.map((raw, i) => {
            const src = normalizeSrc(raw, i); // i = petite clé stable en guise de cache-buster local
            return (
              <motion.img
                key={i}
                src={src}
                alt={`CDO Image ${i + 1}`}
                title="Cliquer pour agrandir"
                loading="lazy"
                decoding="async"
                onClick={() => openModal(src)}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = FALLBACK;
                }}
                whileHover={{ scale: 1.05 }}
                className="cursor-pointer rounded-lg shadow-lg object-cover w-full h-64 transition duration-300"
              />
            );
          })}
        </div>

        {/* Lightbox */}
        <Modal
          isOpen={modalIsOpen}
          onRequestClose={closeModal}
          contentLabel="Image agrandie"
          className="max-w-3xl mx-auto mt-24 outline-none"
          overlayClassName="fixed inset-0 bg-black/80 flex items-center justify-center px-4"
        >
          <div className="relative">
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 bg-white p-1 rounded-full shadow hover:bg-gray-200"
              aria-label="Fermer la prévisualisation"
            >
              ✕
            </button>
            <img
              src={selectedImage || FALLBACK}
              alt="Aperçu"
              className="rounded-xl max-h-[80vh] w-auto mx-auto"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = FALLBACK;
              }}
            />
          </div>
        </Modal>

        <div className="mt-10">
          <Link
            to="/galerie"
            className="inline-block bg-red-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-red-700 transition"
          >
            Voir toute la galerie
          </Link>
        </div>
      </div>
    </section>
  );
}
