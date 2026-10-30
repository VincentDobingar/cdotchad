// 📁 src/components/HomeObjectifs.jsx
import { Link } from "react-router-dom";
import { Target, HandHeart, Lightbulb, ShieldCheck, Users, ChartColumn } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";

const objectifs = [
  { Icon: Target, title: "Insertion professionnelle", description: "Faciliter l'accès à l'emploi des jeunes et des femmes au Tchad." },
  { Icon: HandHeart, title: "Accompagnement humain", description: "Placer l'humain au centre des stratégies RH et des politiques publiques." },
  { Icon: Lightbulb, title: "Innovation sociale", description: "Favoriser l'émergence de nouvelles approches pour un développement durable." },
  { Icon: ShieldCheck, title: "Engagement éthique", description: "Promouvoir la transparence, l'équité et la responsabilité dans nos actions." },
  { Icon: Users, title: "Renforcement de capacités", description: "Outiller les acteurs locaux pour une gestion des talents plus efficace." },
  { Icon: ChartColumn, title: "Analyse et veille RH", description: "Observer les tendances du marché pour orienter nos interventions." },
];

export default function HomeObjectifs() {
  return (
    <section className="py-24 bg-white" id="objectifs">
      <div className="max-w-6xl mx-auto px-6 md:px-8">
        <SectionHeading
          label="Nos objectifs"
          title="Un avenir professionnel inclusif et durable"
          intro="Six engagements qui guident chacune de nos interventions au service du Tchad."
        />
        <div className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {objectifs.map(({ Icon, title, description }) => (
            <div key={title} className="border-t border-sablefonce pt-6">
              <Icon className="h-7 w-7 text-rouge" />
              <h3 className="mt-4 text-lg font-semibold text-encre">{title}</h3>
              <p className="mt-2 text-graphite leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
        <div className="mt-12">
          <Link
            to="/objectifs"
            className="inline-flex items-center gap-2 text-rouge font-semibold hover:text-rougeprofond underline-offset-4 hover:underline"
          >
            En savoir plus sur nos objectifs
          </Link>
        </div>
      </div>
    </section>
  );
}
