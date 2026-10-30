// 📁 components/HomePartenaires.jsx
import { useState } from "react";
import { partenaires } from "@/data/partenairesData";
import { Modal, ModalContent } from "@/components/ui/Modal";
import SectionHeading from "@/components/ui/SectionHeading";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

// ✅ fallback packagé (aucune requête réseau externe)
import fallbackLogo from "@/assets/logo-cdotchad.png";

export default function HomePartenaires() {
  const [selectedPartenaire, setSelectedPartenaire] = useState(null);

  return (
    <section
      className="py-20 md:py-28 bg-ivoire [--swiper-navigation-color:#1b1410] [--swiper-navigation-size:28px]"
      id="partenaires"
    >
      <div className="max-w-6xl mx-auto px-6">
        <SectionHeading
          label="Écosystème"
          title="Nos partenaires"
          intro="Institutions, entreprises et organisations qui nous accompagnent au Tchad et au-delà."
        />

        <div className="mt-12">
          <Swiper
            modules={[Navigation, Autoplay]}
            slidesPerView={2}
            spaceBetween={24}
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
              <SwiperSlide key={index} className="h-auto pb-2">
                <button
                  type="button"
                  onClick={() => setSelectedPartenaire(item)}
                  className="group w-full text-left cursor-pointer bg-white border border-sable rounded-2xl p-7 min-h-[280px] flex flex-col shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="h-20 flex items-center justify-center mb-5">
                    <img
                      src={item.image || fallbackLogo}
                      alt={item.name || "Logo"}
                      className="max-h-20 max-w-[70%] object-contain"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = fallbackLogo;
                      }}
                    />
                  </div>
                  <h3 className="font-display text-lg text-center text-encre">{item.name}</h3>
                  <p className="text-sm text-graphite text-center mt-3 leading-relaxed line-clamp-3">{item.description}</p>
                </button>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
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
              <h3 className="font-display text-xl text-encre">{selectedPartenaire.name}</h3>
              <p className="text-graphite leading-relaxed">{selectedPartenaire.description}</p>
            </div>
          </ModalContent>
        </Modal>
      )}
    </section>
  );
}
