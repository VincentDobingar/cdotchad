// 📁 src/components/HomeServices.jsx
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import { METIERS } from "@/data/contenuCabinet";

export default function HomeServices() {
  return (
    <section className="py-24 bg-ivoire" id="services">
      <div className="max-w-6xl mx-auto px-6 md:px-8">
        <SectionHeading
          label="Nos services"
          title="Un accompagnement complet, du diagnostic au résultat"
          intro="Des solutions sur mesure pour les entreprises, les institutions et les projets de développement, à chaque étape de leur croissance."
        />
        <div className="mt-14 grid gap-px bg-sable rounded-2xl overflow-hidden border border-sable md:grid-cols-3">
          {METIERS.map(({ id, titre, Icon, prestations }) => (
            <div key={id} className="group bg-white p-8 transition-colors duration-300 hover:bg-[#fffdf9]">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-rouge/10 text-rouge transition-colors group-hover:bg-rouge group-hover:text-white">
                <Icon className="h-6 w-6" />
              </span>
              <h3 className="mt-5 font-display text-2xl text-encre">{titre}</h3>
              <ul className="mt-4 space-y-2 text-graphite">
                {prestations.map((p) => (
                  <li key={p} className="flex gap-2">
                    <ChevronRight className="w-4 h-4 mt-1 text-rouge shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
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
