// components/ObjectifsSection.jsx
import { motion } from "framer-motion";
import {
  ShieldCheck,
  HandHeart,
  Lightbulb,
  Target,
  ArrowRight,
} from "lucide-react";

const objectifsData = [
  {
    id: "employabilite",
    title: "Favoriser l’employabilité",
    description: "Développer les compétences des jeunes pour un marché du travail compétitif.",
    icon: ShieldCheck,
    link: "#employabilite",
  },
  {
    id: "chomage",
    title: "Réduire le chômage",
    description: "Créer des ponts entre les chercheurs d’emploi et les recruteurs.",
    icon: HandHeart,
    link: "#chomage",
  },
  {
    id: "innovation",
    title: "Encourager l’innovation",
    description: "Soutenir des initiatives innovantes et technologiques dans le domaine RH.",
    icon: Lightbulb,
    link: "#innovation",
  },
  {
    id: "impact-social",
    title: "Atteindre l’impact social",
    description: "Contribuer à une société équitable et économiquement active.",
    icon: Target,
    link: "#impact-social",
  },
];

export default function ObjectifsSection() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl sm:text-4xl font-bold text-center mb-12 text-primary"
        >
          Nos Objectifs
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {objectifsData.map((objectif, index) => {
            const Icon = objectif.icon;

            return (
              <motion.div
                key={objectif.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="bg-gray-50 p-6 sm:p-8 rounded-2xl shadow-md hover:shadow-xl transition-transform transform hover:-translate-y-1"
              >
                <div className="flex items-center justify-center mb-4 group">
                  <motion.div
                    whileHover={{ rotate: 10 }}
                    className="bg-primary/10 p-4 rounded-full transition duration-300"
                  >
                    <Icon className="w-6 h-6 text-primary" />
                  </motion.div>
                </div>

                <h3 className="text-lg sm:text-xl font-semibold text-center mb-2">{objectif.title}</h3>
                <p className="text-sm sm:text-base text-gray-700 text-center mb-4">{objectif.description}</p>

                <div className="text-center">
                  <a
                    href={objectif.link}
                    className="inline-flex items-center gap-1 text-primary text-sm font-medium hover:underline transition"
                  >
                    En savoir plus
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
