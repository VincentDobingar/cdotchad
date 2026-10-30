// components/ObjectifsSection.jsx
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import PageHero from "@/components/ui/PageHero";
import {
  ShieldCheck,
  HandHeart,
  Lightbulb,
  Target,
} from "lucide-react";

const objectifsData = [
  {
    id: "employabilite",
    title: "Favoriser l’employabilité",
    description: "Développer les compétences des jeunes pour un marché du travail compétitif.",
    icon: ShieldCheck,
    link: "/services",
  },
  {
    id: "chomage",
    title: "Réduire le chômage",
    description: "Créer des ponts entre les chercheurs d’emploi et les recruteurs.",
    icon: HandHeart,
    link: "/offres",
  },
  {
    id: "innovation",
    title: "Encourager l’innovation",
    description: "Soutenir des initiatives innovantes et technologiques dans le domaine RH.",
    icon: Lightbulb,
    link: "/activites",
  },
  {
    id: "impact-social",
    title: "Atteindre l’impact social",
    description: "Contribuer à une société équitable et économiquement active.",
    icon: Target,
    link: "/presentation",
  },
];

export default function ObjectifsSection() {
  return (
    <>
      <PageHero
        label="Nos objectifs"
        title="Ce que nous nous engageons à changer"
        intro="Quatre priorités qui guident chacune de nos interventions auprès des talents et des entreprises."
      />
      <section className="py-20 md:py-24 bg-ivoire">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {objectifsData.map((objectif, index) => {
              const Icon = objectif.icon;
              return (
                <motion.div
                  key={objectif.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  className="group flex gap-5 bg-white border border-sable rounded-2xl p-7 shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  <div className="shrink-0 grid place-items-center h-12 w-12 rounded-xl bg-rouge/10 text-rouge group-hover:bg-rouge group-hover:text-white transition-colors">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl text-encre mb-1.5">{objectif.title}</h3>
                    <p className="text-graphite leading-relaxed">{objectif.description}</p>
                    <Link
                      to={objectif.link}
                      className="mt-3 inline-block text-sm font-semibold text-rouge hover:text-rougeprofond underline-offset-4 hover:underline"
                    >
                      Voir le détail
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
