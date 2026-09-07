import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const teamMembers = [
  {
    name: "SOUGNABE Oualoumi",
    role: "Directeur Général",
    image: "/images/ceo-cdotchad.jpg",
    bio: "Expert en gestion de projets et leadership féminin, Sougnabé Oulami pilote CDOTCHAD avec une vision inclusive et durable.",
  },
  {
    name: "Alain PATENGOUH",
    role: "Directeur Associé - PATKA",
    image: "/images/alain-cdotchad.jpg",
    bio: "Spécialiste en stratégie et développement, Alain apporte son expertise pour renforcer l'impact du cabinet dans la sous-région.",
  },
  {
    name: "Guy PIAM",
    role: "Partenaire Nimba Conseil",
    image: "/images/guy-cdotchad.jpg",
    bio: "Expert en accompagnement stratégique et développement organisationnel, Guy contribue à la vision et la croissance de CDOTCHAD.",
  },
  {
    name: "MALKONBE Mbaïoundkom",
    role: "Directeur Général / 2BM",
    image: "/images/malkonbe-cdotchad.jpg",
    bio: "Ingénieur polyvalent et entrepreneur, Malkonbé assure la coordination technique et technologique des projets numériques.",
  },
  {
    name: "DOBINGAR G. Vincent",
    role: "Developpeur Full Stack et Consultant Data Analyste",
    image: "/images/vincent.png",
    bio: "Passionné par les solutions numériques innovantes et l’impact des données dans la prise de décision. Fort d’une solide expérience dans le développement web (frontend & backend), il accompagne les organisations dans la création d'applications robustes, évolutives et orientées utilisateurs. Spécialisé en intégration de systèmes, visualisation de données et automatisation de processus, il intervient aussi bien sur des projets techniques que stratégiques, en mettant les technologies au service du développement durable et de la performance organisationnelle.",
  },
];

export default function Presentation() {
  const [activeMember, setActiveMember] = useState(null);

  return (
    <main className="text-gray-800">
      <div></div>
      {/* SECTION: Présentation */}
      <section className="container mx-auto px-4 flex flex-col-reverse md:flex-row items-center gap-10 mb-16">
        {/* Texte à gauche */}
        <motion.div
          className="md:w-1/2"
          initial={{ x: -100, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div>
            <h1 className="text-4xl font-bold mb-6 text-red-700">Qui sommes-nous ?</h1>
            <p className="text-lg text-gray-700 mb-4">
              CDO TCHAD est une initiative innovante qui vise à transformer le paysage de l'emploi au Tchad en mettant en
              relation les jeunes talents avec les entreprises, en développant les compétences et en favorisant une
              économie inclusive et durable.
            </p>
            <p className="text-lg text-gray-700 mb-4">
            C'est une plateforme stratégique dédiée à la valorisation des
            talents, à l'innovation en ressources humaines et à l’amélioration de
            l’employabilité au Tchad.<br />
            Un cabinet de Consultance spécialisé dans l’ingénierie informatique, la communication digitale et stratégie marketing,
            la Représentation d’affaires, les prestations de services divers en ressources humaines ainsi que la finance.<br />
            Nous accompagnons les entreprises dans la recherche de performance durable à travers des solutions sur mesure, adaptées à leurs enjeux
            organisationnels, opérationnels et humains.
          </p>
            <blockquote className="italic text-gray-600 mt-4 border-l-4 border-red-500 pl-4">
              « Notre engagement est de révéler les talents tchadiens et de les propulser vers des opportunités concrètes. <br />
              Notre mission est d’apporter une expertise ciblée pour renforcer les capacités des organisations et faciliter l’insertion des compétences
              locales dans un écosystème professionnel en constante évolution. »
            </blockquote>
        </div>
        </motion.div>

        {/* Image à droite */}
        <motion.div
          className="md:w-1/2"
          initial={{ x: 100, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <img
            src="/images/dg-cdotchad.jpg"
            alt="Équipe CDOTCHAD"
            className="rounded-2xl shadow-xl w-full"
          />
        </motion.div>
      </section>

      {/* SECTION: Notre mission */}
      <section className="bg-gray-100 py-12 px-4">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold text-red-700 mb-4">Notre mission</h2>
          <p className="text-lg text-gray-700">
            Notre mission est de promouvoir l’employabilité, l’innovation RH et de créer des ponts solides entre les
            talents tchadiens et les opportunités locales et internationales.
          </p>
          <p className="text-lg text-gray-700">
            Elle consiste à nous positionner comme un partenaire de choix auprès des entreprises, organisations et de particuliers afin de leur fournir les services de qualité
            qu’il leur faut pour atteindre leurs objectifs socio-économiques.
          </p>
        </motion.div>
      </section>

      {/* SECTION: Nos valeurs */}
      <section className="py-12 px-4">
        <motion.div
          className="max-w-6xl mx-auto text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold text-red-700 mb-6">Nos valeurs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
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
              <motion.div
                key={i}
                className="bg-white shadow-md rounded-xl p-6 border"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <p className="text-lg font-semibold text-gray-800">{valeur}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* SECTION: Notre équipe */}
      <section className="bg-gray-100 py-12 px-4">
        <motion.div
          className="max-w-6xl mx-auto text-center"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold text-red-700 mb-4">Notre équipe</h2>
          <p className="text-lg text-gray-700 mb-10">
            Une équipe passionnée et engagée, composée de professionnels aux parcours variés, unis par la même vision.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {teamMembers.map((member, index) => (
              <motion.div
                key={index}
                className="flex flex-col items-center bg-white rounded-xl shadow-md p-4 cursor-pointer"
                whileHover={{ scale: 1.05 }}
                onClick={() =>
                  setActiveMember(activeMember === index ? null : index)
                }
              >
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-32 h-32 rounded-full object-cover mb-3 shadow"
                />
                <p className="font-semibold text-gray-800">{member.name}</p>
                <p className="text-sm text-gray-500">{member.role}</p>

                <AnimatePresence>
                  {activeMember === index && (
                    <motion.div
                      className="mt-4 text-sm text-gray-600"
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
            ))}
          </div>
        </motion.div>
      </section>
    </main>
  );
}
