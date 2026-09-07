// 📁 src/components/ActualiteCarouselModal.jsx
import { useEffect, useState } from "react";
import Modal from "react-modal";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import { useNavigate } from "react-router-dom";
import "swiper/css";
import "swiper/css/pagination";
import api from "@/utils/api";

Modal.setAppElement("#root");

export default function ActualiteCarouselModal({ isOpen, onRequestClose }) {
  const [actualites, setActualites] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchActualites = async () => {
      try {
        const res = await api.get("/actualites");
        setActualites(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error("Erreur lors du chargement des actualités :", error);
      }
    };
    fetchActualites();
  }, []);

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel="Actualités"
      className="max-w-5xl w-full mx-auto bg-white p-6 rounded shadow-lg relative"
      overlayClassName="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
    >
      <h2 className="text-xl font-bold mb-4 text-center">Actualités récentes</h2>

      <Swiper
        modules={[Autoplay, Pagination]}
        spaceBetween={30}
        slidesPerView={2}
        loop={true}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        pagination={{ clickable: true }}
        className="w-full"
      >
        {actualites.map((actu) => (
          <SwiperSlide key={actu.id}>
            <div className="border rounded shadow p-4 h-full flex flex-col justify-between bg-gray-50">
              <img
                src={`https://cdotchad.com/cdobackend/${actu.image}`}
                alt={actu.titre}
                className="w-full h-40 object-cover rounded mb-3"
              />
              <h3 className="text-md font-semibold mb-2">{actu.titre}</h3>
              <p className="text-sm text-gray-700 mb-3">
                {actu.resume?.slice(0, 120)}...
              </p>
              <span className="text-xs text-gray-400">
                Publié le {new Date(actu.date_publication).toLocaleDateString()}
              </span>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <div className="mt-6 text-center">
        <button
          onClick={() => navigate("/actualites")}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Voir toutes les actualités
        </button>
      </div>

      <button
        onClick={onRequestClose}
        className="absolute top-3 right-3 text-gray-600 hover:text-red-600 text-xl"
        title="Fermer"
      >
        &times;
      </button>
    </Modal>
  );
}
