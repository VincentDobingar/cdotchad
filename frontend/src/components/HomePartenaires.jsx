// 📁 components/HomePartenaires.jsx
import { useState } from "react";
import { partenaires } from "@/data/partenairesData";
import { Modal, ModalContent } from "@/components/ui/Modal";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

// ✅ fallback packagé (aucune requête réseau externe)
import fallbackLogo from "@/assets/logo-cdotchad.png";

export default function HomePartenaires() {
  const [selectedPartenaire, setSelectedPartenaire] = useState(null);

  return (
    <section className="py-16 bg-gray-50" id="partenaires">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-red-600 mb-8">
          Nos Partenaires
        </h2>

        <Swiper
          modules={[Navigation, Autoplay]}
          slidesPerView={2}
          spaceBetween={20}
          navigation
          autoplay={{ delay: 4000 }}
          loop
          breakpoints={{
            640: { slidesPerView: 1 },
            768: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          }}
        >
          {partenaires.map((item, index) => (
            <SwiperSlide key={index}>
              <div
                onClick={() => setSelectedPartenaire(item)}
                className="cursor-pointer bg-white rounded-xl shadow p-6 min-h-[280px] flex flex-col justify-between hover:shadow-lg transition"
              >
                <img
                  src={item.image || fallbackLogo}
                  alt={item.name || "Logo"}
                  className="h-20 mx-auto object-contain mb-4"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = fallbackLogo;
                  }}
                />
                <h3 className="text-lg font-semibold text-center text-red-700">
                  {item.name}
                </h3>
                <p className="text-sm text-gray-600 text-center mt-2 line-clamp-3">
                  {item.description}
                </p>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Modal */}
      {selectedPartenaire && (
        <Modal isOpen={true} onClose={() => setSelectedPartenaire(null)}>
          <ModalContent>
            <div className="p-6 space-y-4 text-center">
              <img
                src={selectedPartenaire.image || fallbackLogo}
                alt={selectedPartenaire.name || "Logo"}
                className="h-20 mx-auto object-contain"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = fallbackLogo;
                }}
              />
              <h3 className="text-xl font-bold text-red-600">
                {selectedPartenaire.name}
              </h3>
              <p className="text-gray-700">{selectedPartenaire.description}</p>
            </div>
          </ModalContent>
        </Modal>
      )}
    </section>
  );
}
