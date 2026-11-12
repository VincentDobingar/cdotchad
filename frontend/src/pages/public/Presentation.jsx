import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import PageHero from "@/components/ui/PageHero";
import { METIERS } from "@/data/contenuCabinet";

const teamMembers = [
  {
    name: "SOUGNABE Oualoumi",
    role: "Directeur Général",
    image: "/images/ceo-cdotchad.jpg?v=4",
    bio: "Expert en gestion de projets et leadership féminin, Sougnabé Oulami pilote CDOTCHAD avec une vision inclusive et durable.",
  },
  {
    name: "Alain PATENGOUH",
    role: "Directeur Associé - PATKA",
    image: "/images/alain-cdotchad.jpg?v=4",
    bio: "Spécialiste en stratégie et développement, Alain apporte son expertise pour renforcer l'impact du cabinet dans la sous-région.",
  },
  {
    name: "Guy PIAM",
    role: "Partenaire Nimba Conseil",
    image: "/images/guy-cdotchad.jpg?v=4",
    bio: "Expert en accompagnement stratégique et développement organisationnel, Guy contribue à la vision et la croissance de CDOTCHAD.",
  },
  {
    name: "MALKONBE Mbaïoundkom",
    role: "Directeur Général / 2BM",
    image: "/images/malkonbe-cdotchad.jpg?v=4",
    bio: "Ingénieur polyvalent et entrepreneur, Malkonbé assure la coordination technique et technologique des projets numériques.",
  },
  {
    name: "DOBINGAR G. Vincent",
    role: "Fondateur & Directeur Général / DBS Africa",
    lien: "https://dbs-africa.org",
    image: "/images/vincent.jpg?v=4",
    bio: "Passionné par les solutions numériques innovantes et l’impact des données dans la prise de décision. Fort d’une solide expérience dans le développement web (frontend & backend), il accompagne les organisations dans la création d'applications robustes, évolutives et orientées utilisateurs. Spécialisé en intégration de systèmes, visualisation de données et automatisation de processus, il intervient aussi bien sur des projets techniques que stratégiques, en mettant les technologies au service du développement durable et de la performance organisationnelle.",
  },
];

export default function Presentation() {
  const [activeMember, setActiveMember] = useState(null);

  // Carte d'un membre dans l'organigramme (photo, nom, rôle, bio dépliable au clic).
  const Carte = ({ index }) => {
    const member = teamMembers[index];
    return (
      <motion.div
        className="flex flex-col items-center bg-white border border-sable rounded-2xl shadow-sm hover:shadow-xl p-5 cursor-pointer w-64 max-w-full z-10 transition-shadow"
        whileHover={{ scale: 1.02 }}
        onClick={() => setActiveMember(activeMember === index ? null : index)}
      >
        <img src={member.image} alt={member.name} className="w-28 h-28 rounded-full object-cover mb-3 ring-2 ring-sable" />
        <p className="font-display text-lg text-encre text-center leading-tight">{member.name}</p>
        <p className="text-sm text-rouge text-center mt-1">{member.role}</p>
        {member.lien && (
          <a
            href={member.lien}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mt-1 text-xs font-medium text-rouge hover:text-rougeprofond hover:underline"
          >
            {member.lien.replace(/^https?:\/\//, "")}
          </a>
        )}

        <AnimatePresence>
          {activeMember === index && (
            <motion.div
              className="mt-3 text-sm text-graphite text-center overflow-hidden"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <p>{member.bio}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <main className="bg-ivoire text-encre">
      <PageHero
        label="Le cabinet"
        title="Qui sommes-nous ?"
        intro="CDO Consulting Tchad est un cabinet d’audit, de conseil et de management basé à N’Djaména. Il accompagne les entreprises, les institutions et les projets de développement dans la fiabilisation de leur information financière, la structuration de leur organisation et le développement de leurs équipes."
      />

      {/* SECTION: Présentation */}
      <section className="max-w-6xl mx-auto px-6 py-16 md:py-20 flex flex-col-reverse md:flex-row items-center gap-12">
        <motion.div
          className="md:w-1/2"
          initial={{ x: -60, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div>
            <p className="text-lg text-graphite leading-relaxed mb-4">
              CDO Consulting Tchad est un cabinet d’audit, de conseil et de management qui accompagne les entreprises, les
              institutions publiques et les projets de développement dans leur recherche de performance durable.
            </p>
            <p className="text-lg text-graphite leading-relaxed mb-3">Nous intervenons sur trois métiers complémentaires :</p>
            <ul className="space-y-3 mb-5">
              {METIERS.map(({ id, titre, Icon, prestations }) => (
                <li key={id} className="flex gap-3">
                  <span className="shrink-0 grid place-items-center h-9 w-9 rounded-lg bg-rouge/10 text-rouge">
                    <Icon className="w-5 h-5" />
                  </span>
                  <p className="text-graphite leading-relaxed">
                    <strong className="text-encre">{titre} :</strong> {prestations.map((x) => x.charAt(0).toLowerCase() + x.slice(1)).join(", ")}.
                  </p>
                </li>
              ))}
            </ul>
            <p className="text-lg text-graphite leading-relaxed mb-4">
              Nous proposons des solutions sur mesure, adaptées aux enjeux financiers, organisationnels et humains de chaque
              client, et nous nous appuyons sur une maîtrise des référentiels régionaux : OHADA/SYSCOHADA, COBAC, CEMAC,
              ainsi que sur les procédures des bailleurs.
            </p>
            <blockquote className="font-display italic text-xl text-encre mt-6 border-l-2 border-rouge pl-5 leading-relaxed">
              « Notre engagement est de bâtir des organisations solides, capables de prendre des décisions en toute confiance
              et de se développer durablement. Notre mission est d’apporter une expertise ciblée pour fiabiliser la gestion,
              renforcer les capacités des équipes et valoriser les compétences locales au service de l’économie tchadienne. »
              <footer className="mt-3 not-italic font-sans text-sm font-semibold text-rouge">
                Dr. Sougnabé Oualoumi, Directeur Général
              </footer>
            </blockquote>
          </div>
        </motion.div>

        <motion.div
          className="md:w-1/2"
          initial={{ x: 60, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <img src="/images/dg-cdotchad.jpg?v=4" alt="Équipe CDOTCHAD" className="rounded-2xl shadow-xl w-full" />
        </motion.div>
      </section>

      {/* SECTION: Notre mission */}
      <section className="bg-white border-y border-sable py-16 md:py-20 px-6">
        <motion.div
          className="max-w-3xl mx-auto text-center"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <span className="inline-flex items-center gap-2.5 text-sm font-medium text-rouge">
            <span className="h-px w-6 bg-rouge/60" aria-hidden="true" />
            Notre mission
            <span className="h-px w-6 bg-rouge/60" aria-hidden="true" />
          </span>
          <h2 className="mt-3 font-display text-3xl md:text-4xl text-encre mb-5">
            Un partenaire de confiance pour les organisations
          </h2>
          <p className="text-lg text-graphite leading-relaxed mb-3">
            Fiabiliser la gestion, structurer les organisations et développer les compétences, pour des entreprises et des
            institutions tchadiennes plus solides et plus performantes.
          </p>
          <p className="text-lg text-graphite leading-relaxed">
            Nous sommes le partenaire des entreprises, des institutions publiques, des projets de développement et des
            organisations internationales. Par des missions d’audit, de conseil et de management, nous les aidons à
            atteindre leurs objectifs économiques et sociaux, avec rigueur, indépendance et sens du résultat.
          </p>
        </motion.div>
      </section>

      {/* SECTION: Nos valeurs */}
      <section className="py-16 md:py-20 px-6">
        <motion.div
          className="max-w-6xl mx-auto text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-3xl md:text-4xl text-encre mb-8">Nos valeurs</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              "Innovation",
              "Transparence",
              "Équité",
              "Excellence",
              "Collaboration",
              "Responsabilité",
              "Écoute",
              "Savoir-faire",
              "Respect",
              "Efficacité",
              "Fidélité",
            ].map((valeur, i) => (
              <motion.span
                key={i}
                className="inline-flex items-center rounded-full bg-white border border-sable px-5 py-2.5 text-base font-medium text-encre shadow-sm hover:border-rouge hover:text-rouge transition-colors"
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {valeur}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </section>

      {/* SECTION: Notre équipe (organigramme) */}
      <section className="bg-white border-t border-sable py-16 md:py-20 px-6">
        <motion.div
          className="max-w-6xl mx-auto text-center"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="font-display text-3xl md:text-4xl text-encre mb-3">Notre équipe</h2>
          <p className="text-lg text-graphite mb-12 max-w-2xl mx-auto">
            Une équipe passionnée et engagée, composée de professionnels aux parcours variés, unis par la même vision.
          </p>

          <div className="flex flex-col items-center">
            <Carte index={0} />
            <div className="w-px h-8 bg-sablefonce" aria-hidden="true" />
            <p className="text-sm font-medium tracking-wide text-graphite mb-3">Associés & partenaires</p>
            <div className="flex flex-wrap justify-center gap-6">
              <Carte index={1} />
              <Carte index={2} />
              <Carte index={3} />
            </div>
            <div className="w-px h-8 bg-sablefonce mt-2" aria-hidden="true" />
            <p className="text-sm font-medium tracking-wide text-graphite mb-3">Équipe technique</p>
            <Carte index={4} />
          </div>
        </motion.div>
      </section>
    </main>
  );
}
