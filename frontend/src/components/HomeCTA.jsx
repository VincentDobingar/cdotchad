// 📁 src/components/HomeCTA.jsx
import { Link } from "react-router-dom";

export default function HomeCTA() {
  return (
    <section className="relative overflow-hidden bg-encre text-white">
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-rouge/20 blur-3xl" />
      <div className="pointer-events-none absolute -top-20 right-10 h-64 w-64 rounded-full bg-rougeprofond/30 blur-3xl" />
      <div className="relative max-w-5xl mx-auto px-6 md:px-8 py-20 md:py-24 text-center">
        <h2 className="font-display text-3xl md:text-[2.75rem] leading-[1.1]">
          Prêt à révéler le potentiel de votre organisation ?
        </h2>
        <p className="mt-5 max-w-2xl mx-auto text-lg text-white/80">
          Que vous recrutiez, formiez ou cherchiez votre prochaine opportunité, notre équipe vous accompagne à chaque étape.
        </p>
        <div className="mt-9 flex flex-col sm:flex-row justify-center gap-4">
          <Link
            to="/offres"
            className="inline-flex justify-center items-center bg-rouge hover:bg-white hover:text-encre text-white px-8 py-3.5 rounded-full font-semibold transition"
          >
            Explorer les offres
          </Link>
          <Link
            to="/contact"
            className="inline-flex justify-center items-center border border-white/30 hover:border-white/70 hover:bg-white/5 px-8 py-3.5 rounded-full font-semibold transition"
          >
            Nous contacter
          </Link>
        </div>
      </div>
    </section>
  );
}
