// 📁 src/components/HomeServices.jsx
import { Link } from "react-router-dom";
import { BriefcaseBusiness, GraduationCap, BookOpenCheck, Users, Target, ShieldCheck } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";

const services = [
  {
    title: "Recrutement",
    description: "Nous aidons les entreprises à trouver les meilleurs profils au Tchad.",
    Icon: BriefcaseBusiness,
  },
  {
    title: "Orientation professionnelle",
    description: "Un conseil personnalisé pour orienter les jeunes vers des carrières prometteuses.",
    Icon: GraduationCap,
  },
  {
    title: "Formation & coaching",
    description: "Des sessions de formation et un accompagnement pour développer les compétences clés.",
    Icon: BookOpenCheck,
  },
  {
    title: "Renforcement RH",
    description: "Un appui stratégique aux entreprises pour améliorer leur gestion des ressources humaines.",
    Icon: Users,
  },
  {
    title: "Évaluation & tests",
    description: "Des outils pour évaluer les compétences techniques et comportementales.",
    Icon: Target,
  },
  {
    title: "Conformité & sécurité",
    description: "Sensibilisation à la conformité légale et au respect des normes sociales.",
    Icon: ShieldCheck,
  },
];

export default function HomeServices() {
  return (
    <section className="py-24 bg-ivoire" id="services">
      <div className="max-w-6xl mx-auto px-6 md:px-8">
        <SectionHeading
          label="Nos services"
          title="Un accompagnement complet, de l'ambition au résultat"
          intro="Des solutions sur mesure pour les entreprises comme pour les chercheurs d'emploi, à chaque étape du parcours."
        />
        <div className="mt-14 grid gap-px bg-sable rounded-2xl overflow-hidden border border-sable">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-sable">
            {services.map(({ title, description, Icon }) => (
              <div key={title} className="group bg-white p-8 transition-colors duration-300 hover:bg-[#fffdf9]">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-rouge/10 text-rouge transition-colors group-hover:bg-rouge group-hover:text-white">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-encre">{title}</h3>
                <p className="mt-2 text-graphite leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-10">
          <Link
            to="/services"
            className="inline-flex items-center gap-2 text-rouge font-semibold hover:text-rougeprofond underline-offset-4 hover:underline"
          >
            Découvrir tous nos services
          </Link>
        </div>
      </div>
    </section>
  );
}
