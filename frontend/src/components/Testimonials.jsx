import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const testimonials = [
  {
    name: "Fatimé Oumar",
    role: "Jeune diplômée en gestion",
    quote: "Grâce à CDOTCHAD, j’ai pu trouver mon premier emploi dans une entreprise locale.",
    image: "/images/fatime.jpg",
  },
  {
    name: "Mahamat Ali",
    role: "Responsable RH",
    quote: "Leur accompagnement en recrutement nous a permis d’optimiser nos processus.",
    image: "/images/mahamat.jpg",
  },
  {
    name: "Delphine Moundou",
    role: "Bénéficiaire formation",
    quote: "Les formations m’ont aidée à améliorer mes compétences et à oser entreprendre.",
    image: "/images/delphine.jpg",
  },
];

export default function Testimonials() {
  const [index, setIndex] = useState(0);

  // Slider automatique toutes les 6s
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const { name, role, quote, image } = testimonials[index];

  return (
    <section className="py-24 bg-gray-50" id="temoignages">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold mb-10 text-red-600">Témoignages</h2>

        <div className="relative max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.6 }}
              className="bg-white p-8 rounded-xl shadow-md"
            >
              <img
                src={image}
                alt={name}
                className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
              />
              <p className="text-gray-700 italic mb-4">“{quote}”</p>
              <h4 className="text-lg font-semibold text-red-700">{name}</h4>
              <span className="text-sm text-gray-500">{role}</span>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Indicateurs ronds */}
        <div className="flex justify-center mt-6 space-x-2">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`w-3 h-3 rounded-full ${
                i === index ? "bg-red-600" : "bg-gray-300"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
