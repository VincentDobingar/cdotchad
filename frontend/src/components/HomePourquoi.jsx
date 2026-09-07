import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import equipeImage from "/images/equipe-cdotchad.jpg"; // Assurez-vous que l’image existe
import { Link } from "react-router-dom";

export default function HomePourquoi() {
  const points = [
    "Approche centrée sur l'humain",
    "Expertise locale et internationale",
    "Réseau solide de partenaires",
    "Accompagnement personnalisé",
  ];

  return (
    <section className="py-24 bg-white" id="pourquoi">
            <div className="container mx-auto px-4 text-center">
      <div className="container mx-auto px-4 flex flex-col-reverse lg:flex-row items-center gap-12">
        {/* Texte à gauche */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="lg:w-1/2"
        >
          <h2 className="text-4xl font-bold text-red-600 mb-6">
            <Link to="/presentation" className="text-red-600 hover:underline font-semibold">
                Pourquoi nous choisir ?
            </Link>
            </h2>
          <p className="text-lg text-gray-700 mb-6">
            « Le succès d’une organisation repose sur les talents qu’elle sait identifier, former et retenir. »
          </p>

          <ul className="space-y-4">
            {points.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-gray-700">
                <CheckCircle2 className="text-red-600 mt-1" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Image à droite */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="lg:w-1/2"
        >
          <img
            src={equipeImage}
            alt="Équipe CDO Tchad"
            className="rounded-2xl shadow-lg object-cover w-full max-h-[450px]"
          />
        </motion.div>
        </div>
          <div className="mt-10">
            <a
              href="/contact"
              className="inline-block bg-red-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-red-700 transition"
            >
              Contactez-nous
            </a>
          </div>
      </div>
    </section>
  );
}
