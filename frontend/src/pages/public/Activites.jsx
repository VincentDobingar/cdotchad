// pages/Activites.jsx
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  GraduationCap,
  Users,
  Briefcase,
  Landmark,
  ChevronRight,
} from "lucide-react";

const activites = [
  {
    id: "forums",
    title: "Forums & Salons",
    description: "Organisation de forums de l’emploi et salons professionnels pour favoriser la rencontre entre recruteurs et candidats.",
    icon: CalendarDays,
    subActivities: [
      { id: "forum-emploi", title: "Forum de l'emploi annuel" },
      { id: "salons", title: "Salons sectoriels (santé, tech, etc.)" },
    ],
  },
  {
    id: "formations",
    title: "Formations & Ateliers",
    description: "Des ateliers pratiques pour renforcer les compétences des jeunes et professionnels.",
    icon: GraduationCap,
    subActivities: [
      { id: "atelier-cv", title: "Ateliers CV & lettre de motivation" },
      { id: "soft-skills", title: "Développement personnel & soft skills" },
    ],
  },
  {
    id: "mentorat",
    title: "Mentorat",
    description: "Programmes de mentorat pour guider les jeunes diplômés dans leur insertion professionnelle.",
    icon: Users,
    subActivities: [
      { id: "programme-jeunes", title: "Mentorat jeunes diplômés" },
      { id: "rencontres", title: "Rencontres intergénérationnelles" },
    ],
  },
  {
    id: "recrutement",
    title: "Recrutement",
    description: "Nous accompagnons les entreprises dans leurs processus de recrutement.",
    icon: Briefcase,
    subActivities: [
      { id: "tri", title: "Tri & sélection des candidatures" },
      { id: "entretiens", title: "Préparation & organisation des entretiens" },
    ],
  },
  {
    id: "partenariats",
    title: "Partenariats académiques",
    description: "Collaborations avec les universités et centres de formation pour aligner l'offre éducative au marché.",
    icon: Landmark,
    subActivities: [
      { id: "conventions", title: "Conventions universités" },
      { id: "interventions", title: "Interventions en milieu académique" },
    ],
  },
];

export default function Activites() {
  const [openId, setOpenId] = useState(null);

  const toggle = useCallback(
    (id) => setOpenId((current) => (current === id ? null : id)),
    []
  );

  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-bold text-center mb-16 text-primary"
        >
          Nos Activités
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-10">
          {activites.map((activite, index) => {
            const Icon = activite.icon;
            const isOpen = openId === activite.id;

            return (
              <motion.div
                key={activite.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition-transform transform hover:-translate-y-1"
              >
                <div className="flex items-center justify-center mb-5">
                  <div className="bg-primary/10 p-4 rounded-full">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-center">{activite.title}</h3>
                <p className="text-gray-600 text-center mb-5">{activite.description}</p>

                {activite.subActivities && (
                  <>
                    <div className="text-center">
                      <button
                        onClick={() => toggle(activite.id)}
                        className="text-sm font-medium text-primary underline hover:text-primary-dark transition"
                      >
                        {isOpen ? "Masquer les sous-activités" : "Voir les sous-activités"}
                      </button>
                    </div>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.ul
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.4 }}
                          className="mt-4 text-sm text-gray-700 space-y-2"
                        >
                          {activite.subActivities.map((sub) => (
                            <li key={sub.id} className="flex items-center gap-2">
                              <ChevronRight className="w-4 h-4 text-primary" />
                              {sub.title}
                            </li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

