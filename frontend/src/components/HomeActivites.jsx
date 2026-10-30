// 📁 src/components/HomeActivites.jsx
import { Link } from "react-router-dom";
import { Mic, CalendarDays, Users, Handshake, GraduationCap, ChartColumn } from "lucide-react";

const activites = [
  { Icon: Mic, title: "Ateliers & séminaires", description: "Des sessions pratiques régulières pour les chercheurs d'emploi et les entreprises." },
  { Icon: CalendarDays, title: "Foires de l'emploi", description: "Des événements d'envergure réunissant recruteurs, diplômés et institutions." },
  { Icon: Users, title: "Coaching & mentorat", description: "Un accompagnement personnalisé pour booster la carrière des jeunes talents." },
  { Icon: Handshake, title: "Partenariats stratégiques", description: "Une collaboration public-privé pour des synergies durables." },
  { Icon: GraduationCap, title: "Sessions de formation", description: "Des programmes intensifs pour renforcer les compétences techniques et humaines." },
  { Icon: ChartColumn, title: "Études & veille RH", description: "Une analyse continue du marché du travail pour adapter nos interventions." },
];

export default function Activites() {
  return (
    <section className="py-24 bg-encre text-white" id="activites">
      <div className="max-w-6xl mx-auto px-6 md:px-8">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-rouge">
          <span className="h-px w-6 bg-rouge" aria-hidden="true" /> Nos activités
        </span>
        <h2 className="mt-3 font-display text-3xl md:text-4xl leading-[1.12] max-w-2xl">Des actions concrètes, sur le terrain</h2>
        <p className="mt-4 max-w-2xl text-lg text-white/70 leading-relaxed">
          Nous renforçons l'écosystème RH tchadien par des initiatives qui rapprochent les talents et les opportunités.
        </p>
        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {activites.map(({ Icon, title, description }) => (
            <div
              key={title}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-7 transition-colors hover:bg-white/[0.06]"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-rouge/15 text-rouge">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-white/70 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
        <div className="mt-12">
          <Link
            to="/activites"
            className="inline-flex items-center gap-2 font-semibold text-white hover:text-rouge underline-offset-4 hover:underline"
          >
            Voir toutes nos activités
          </Link>
        </div>
      </div>
    </section>
  );
}
