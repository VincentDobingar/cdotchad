// 📁 src/components/HomeObjectifs.jsx
import { Link } from "react-router-dom";
import SectionHeading from "@/components/ui/SectionHeading";
import { OBJECTIFS } from "@/data/contenuCabinet";

export default function HomeObjectifs() {
  return (
    <section className="py-24 bg-white" id="objectifs">
      <div className="max-w-6xl mx-auto px-6 md:px-8">
        <SectionHeading
          label="Nos objectifs"
          title="Ce que nous nous engageons à changer"
          intro="Quatre priorités guident chacune de nos interventions auprès des entreprises, des institutions et des projets."
        />
        <div className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {OBJECTIFS.map(({ Icon, titre, description }) => (
            <div key={titre} className="border-t border-sablefonce pt-6">
              <Icon className="h-7 w-7 text-rouge" />
              <h3 className="mt-4 text-lg font-semibold text-encre">{titre}</h3>
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
