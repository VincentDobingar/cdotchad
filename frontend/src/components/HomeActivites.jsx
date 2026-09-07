import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Users,
  CalendarDays,
  Mic,
  Handshake,
  GraduationCap,
  BarChart3,
} from "lucide-react";

export default function Activites() {
  const titres = [
    "Ateliers & Séminaires",
    "Foires de l’emploi",
    "Coaching & Mentorat",
    "Partenariats stratégiques",
    "Sessions de formation",
    "Études & Veille RH",
  ];

  const descriptions = [
    "Organisation régulière de sessions pratiques pour les chercheurs d’emploi et les entreprises.",
    "Événements de grande envergure réunissant recruteurs, jeunes diplômés et institutions.",
    "Accompagnement personnalisé pour booster la carrière des jeunes talents.",
    "Collaboration avec les acteurs publics et privés pour une synergie durable.",
    "Programmes intensifs pour améliorer les compétences techniques et comportementales.",
    "Analyse continue du marché du travail pour adapter nos interventions.",
  ];

  const icons = [
    <Mic className="w-8 h-8 text-red-600 mb-3" />,
    <CalendarDays className="w-8 h-8 text-red-600 mb-3" />,
    <Users className="w-8 h-8 text-red-600 mb-3" />,
    <Handshake className="w-8 h-8 text-red-600 mb-3" />,
    <GraduationCap className="w-8 h-8 text-red-600 mb-3" />,
    <BarChart3 className="w-8 h-8 text-red-600 mb-3" />,
  ];

  return (
    <section className="py-24 bg-white" id="activites">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold mb-6">
          <Link to="/activites" className="text-red-600 hover:underline font-semibold">
            Nos Activités
          </Link>
        </h2>
        <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
          Nous menons des actions concrètes pour favoriser l'insertion professionnelle
          et renforcer l'écosystème RH au Tchad.
        </p>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {titres.map((title, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.03 }}
              className="bg-gray-50 p-6 rounded-xl shadow hover:shadow-xl"
            >
              {icons[i]}
              <h3 className="text-xl font-semibold mb-2">{title}</h3>
              <p className="text-gray-600 text-sm">{descriptions[i]}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
