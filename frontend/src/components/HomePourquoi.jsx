// 📁 src/components/HomePourquoi.jsx
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

const atouts = [
  { t: "Approche centrée sur l'humain", d: "Les talents d'abord : nous plaçons les personnes au cœur de chaque mission." },
  { t: "Expertise locale et internationale", d: "Une connaissance fine du marché tchadien, ouverte sur les meilleures pratiques." },
  { t: "Réseau solide de partenaires", d: "Entreprises, institutions et acteurs publics, pour des synergies durables." },
  { t: "Accompagnement personnalisé", d: "Un suivi sur mesure, de l'évaluation des besoins jusqu'aux résultats." },
];

export default function HomePourquoi() {
  return (
    <section className="py-24 bg-white" id="pourquoi">
      <div className="max-w-6xl mx-auto px-6 md:px-8 grid lg:grid-cols-2 gap-14 items-center">
        <div>
          <span className="inline-flex items-center gap-2 text-sm font-medium text-rouge">
            <span className="h-px w-6 bg-rouge/60" aria-hidden="true" /> Pourquoi nous choisir
          </span>
          <h2 className="mt-3 font-display text-3xl md:text-4xl leading-[1.12] text-encre">
            Le succès d'une organisation repose sur les talents qu'elle sait révéler
          </h2>
          <p className="mt-4 text-lg text-graphite leading-relaxed">
            Identifier, former et retenir : c'est là que se joue la performance durable. Nous en faisons notre métier.
          </p>
          <ul className="mt-8 space-y-6">
            {atouts.map(({ t, d }) => (
              <li key={t} className="flex gap-4">
                <span className="mt-0.5 inline-flex h-7 w-7 flex-none items-center justify-center rounded-full bg-rouge text-white">
                  <Check className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-semibold text-encre">{t}</p>
                  <p className="text-graphite leading-relaxed">{d}</p>
                </div>
              </li>
            ))}
          </ul>
          <Link
            to="/contact"
            className="mt-9 inline-flex items-center bg-encre hover:bg-black text-white px-7 py-3.5 rounded-full font-semibold transition"
          >
            Parlons de votre projet
          </Link>
        </div>
        <div className="relative">
          <div className="absolute -bottom-5 -left-5 h-2/3 w-2/3 rounded-3xl bg-rouge/10" aria-hidden="true" />
          <div className="absolute -top-5 -right-5 h-24 w-24 rounded-2xl bg-rouge" aria-hidden="true" />
          <img
            src="/images/equipe-cdotchad.jpg"
            alt="L'équipe de CDO Consulting au Tchad"
            className="relative rounded-3xl shadow-xl object-cover w-full h-[420px] md:h-[480px]"
            onError={(e) => {
              e.currentTarget.style.opacity = 0;
            }}
          />
        </div>
      </div>
    </section>
  );
}
