// 📁 components/HomeClients.jsx
import { useState } from "react";
import { clientsData } from "@/data/clientsData";
import { Modal, ModalContent } from "@/components/ui/Modal";
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
    <section className="py-12 bg-gray-100" id="clients">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center text-red-600">
          Nos Référents
        </h2>

        {clientsData.length > 0 ? (
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
            {clientsData.map((client, index) => (
              <SwiperSlide key={index}>
                <div
                  onClick={() => setSelectedClient(client)}
                  className="cursor-pointer bg-white rounded-xl shadow p-6 min-h-[280px] flex flex-col justify-between hover:shadow-lg transition"
                >
                  <img
                    src={client.logo || fallbackLogo}
                    alt={client.nom || "Logo"}
                    className="h-16 object-contain mb-4 mx-auto"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = fallbackLogo;
                    }}
                  />
                  <h3 className="text-lg font-semibold text-center">
                    {client.nom}
                  </h3>
                  <p className="text-sm text-gray-600 text-center mt-2 line-clamp-3">
                    {client.resume || client.description}
                  </p>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          <p className="text-center text-gray-500">
            Aucun client référencé pour le moment.
          </p>
        )}
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
              <h3 className="text-xl font-bold text-indigo-700">
                {selectedClient.nom}
              </h3>
              <p className="text-gray-700">{selectedClient.description}</p>
            </div>
          </ModalContent>
        </Modal>
      )}
    </section>
  );
}
