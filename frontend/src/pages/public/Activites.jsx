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
import PageHero from "@/components/ui/PageHero";

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
  const [openActivity, setOpenActivity] = useState(null);
  const toggle = useCallback((id) => setOpenActivity((cur) => (cur === id ? null : id)), []);

  return (
    <main className="bg-ivoire">
      <PageHero
        label="Nos activités"
        title="Des actions concrètes, sur le terrain"
        intro="Forums, formations, mentorat et partenariats : nous rapprochons les talents et les opportunités au Tchad."
      />
      <section className="py-20 md:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activites.map((activity, index) => {
              const Icon = activity.icon;
              const isOpen = openActivity === activity.id;
              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  className="group bg-white border border-sable rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  <div className="grid place-items-center h-12 w-12 rounded-xl bg-rouge/10 text-rouge group-hover:bg-rouge group-hover:text-white transition-colors mb-5">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-display text-xl text-encre mb-2">{activity.title}</h3>
                  <p className="text-graphite leading-relaxed">{activity.description}</p>

                  {activity.subActivities && (
                    <>
                      <button
                        onClick={() => toggle(activity.id)}
                        className="mt-4 text-sm font-semibold text-rouge hover:text-rougeprofond underline-offset-4 hover:underline"
                      >
                        {isOpen ? "Masquer les sous-activités" : "Voir les sous-activités"}
                      </button>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.ul
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.35 }}
                            className="mt-4 text-sm text-graphite space-y-2 overflow-hidden"
                          >
                            {activity.subActivities.map((sub) => (
                              <li key={sub.id} className="flex items-center gap-2">
                                <ChevronRight className="w-4 h-4 text-rouge shrink-0" />
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
    </main>
  );
}
