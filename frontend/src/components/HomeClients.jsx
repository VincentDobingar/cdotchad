// 📁 components/HomeClients.jsx
import { useState } from "react";
import { clientsData } from "@/data/clientsData";
import { Modal, ModalContent } from "@/components/ui/Modal";
import SectionHeading from "@/components/ui/SectionHeading";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

// ✅ fallback packagé
import fallbackLogo from "@/assets/logo-cdotchad.png";

export default function HomeClients() {
  const [selectedClient, setSelectedClient] = useState(null);

  const handleCloseModal = () => setSelectedClient(null);

  return (
    <section
      className="py-20 md:py-28 bg-white [--swiper-navigation-color:#1b1410] [--swiper-navigation-size:28px]"
      id="clients"
    >
      <div className="max-w-6xl mx-auto px-6">
        <SectionHeading
          label="Ils nous font confiance"
          title="Nos référents"
          intro="Des structures publiques et privées qui s’appuient sur notre expertise au quotidien."
        />

        <div className="mt-12">
          {clientsData.length > 0 ? (
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
              {clientsData.map((client, index) => (
                <SwiperSlide key={index} className="h-auto pb-2">
                  <button
                    type="button"
                    onClick={() => setSelectedClient(client)}
                    className="group w-full text-left cursor-pointer bg-ivoire border border-sable rounded-2xl p-7 min-h-[280px] flex flex-col shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <div className="h-16 flex items-center justify-center mb-5">
                      <img
                        src={client.logo || fallbackLogo}
                        alt={client.nom || "Logo"}
                        className="max-h-16 max-w-[70%] object-contain"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = fallbackLogo;
                        }}
                      />
                    </div>
                    <h3 className="font-display text-lg text-center text-encre">{client.nom}</h3>
                    <p className="text-sm text-graphite text-center mt-3 leading-relaxed line-clamp-3">
                      {client.resume || client.description}
                    </p>
                  </button>
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <p className="text-center text-graphite/60">Aucun client référencé pour le moment.</p>
          )}
        </div>
      </div>

      {/* Modal affichée si un client est sélectionné */}
      {selectedClient && (
        <Modal isOpen={true} onClose={handleCloseModal}>
          <ModalContent>
            <div className="p-6 space-y-4 text-center">
              <img
                src={selectedClient.logo || fallbackLogo}
                alt={selectedClient.nom || "Logo"}
                className="h-20 mx-auto object-contain"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = fallbackLogo;
                }}
              />
              <h3 className="font-display text-xl text-encre">{selectedClient.nom}</h3>
              <p className="text-graphite leading-relaxed">{selectedClient.description}</p>
            </div>
          </ModalContent>
        </Modal>
      )}
    </section>
  );
}
