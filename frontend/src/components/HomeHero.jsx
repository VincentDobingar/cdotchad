// 📁 src/components/HomeHero.jsx
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function HomeHero() {
  return (
    <section
      id="hero"
      data-hero
      className="relative min-h-[92vh] flex items-center overflow-hidden bg-encre text-white pt-24 pb-40 md:py-0"
    >
      <img
        src="/images/hero-cdotchad.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover object-center"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-encre via-encre/80 to-encre/25" />
      <div className="absolute inset-0 bg-gradient-to-t from-encre/90 via-transparent to-encre/30" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-rouge/15 blur-3xl" />

      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="max-w-3xl"
        >
          <span className="inline-flex items-center gap-2.5 text-sm font-medium text-white/80">
            <span className="h-px w-8 bg-rouge" aria-hidden="true" />
            Audit · Conseil · Management · N'Djamena, Tchad
          </span>
          <h1 className="mt-6 font-display font-semibold leading-[1.05] text-[2.6rem] sm:text-5xl lg:text-[4.25rem]">
            Fiabiliser, structurer, faire grandir :
            <br />
            <span className="italic font-medium text-white/95">bâtir l'avenir économique du Tchad.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-white/85 leading-relaxed">
            Nous aidons les entreprises, les institutions et les projets à fiabiliser leur information, à structurer
            leur organisation et à développer leurs équipes : audit, conseil et management.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row gap-4">
            <Link
              to="/services"
              className="inline-flex justify-center items-center bg-rouge hover:bg-rougeprofond text-white px-7 py-3.5 rounded-full font-semibold shadow-lg shadow-rouge/20 transition"
            >
              Nos services
            </Link>
            <Link
              to="/offres"
              className="inline-flex justify-center items-center border border-white/30 hover:border-white/70 hover:bg-white/5 text-white px-7 py-3.5 rounded-full font-semibold transition"
            >
              Découvrir les offres
            </Link>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-0 inset-x-0 z-10 border-t border-white/10 bg-encre/40 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 md:px-8 py-4 flex flex-wrap items-center gap-x-10 gap-y-2 text-sm text-white/75">
          <span>Enregistré au RCCM depuis 2021</span>
          <span className="hidden sm:block h-4 w-px bg-white/20" aria-hidden="true" />
          <span>Audit · Conseil · Management</span>
          <span className="hidden sm:block h-4 w-px bg-white/20" aria-hidden="true" />
          <span>Un réseau de partenaires au Tchad et au-delà</span>
        </div>
      </div>
    </section>
  );
}
