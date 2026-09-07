import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  HandHeart,
  Target,
  Lightbulb,
  ShieldCheck,
  Users,
  BarChart3,
} from "lucide-react";

export default function HomeObjectifs() {
  const objectifs = [
    {
      icon: <Target className="w-8 h-8 text-red-600 mb-3" />,
      title: "Insertion professionnelle",
      description: "Faciliter l'accès à l'emploi des jeunes et des femmes au Tchad.",
    },
    {
      icon: <HandHeart className="w-8 h-8 text-red-600 mb-3" />,
      title: "Accompagnement humain",
      description: "Placer l'humain au centre des stratégies RH et des politiques publiques.",
    },
    {
      icon: <Lightbulb className="w-8 h-8 text-red-600 mb-3" />,
      title: "Innovation sociale",
      description: "Favoriser l’émergence de nouvelles approches pour un développement durable.",
    },
    {
      icon: <ShieldCheck className="w-8 h-8 text-red-600 mb-3" />,
      title: "Engagement éthique",
      description: "Promouvoir la transparence, l’équité et la responsabilité dans nos actions.",
    },
    {
      icon: <Users className="w-8 h-8 text-red-600 mb-3" />,
      title: "Renforcement de capacités",
      description: "Outiller les acteurs locaux pour une gestion des talents plus efficace.",
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-red-600 mb-3" />,
      title: "Analyse et veille RH",
      description: "Observer les tendances du marché pour orienter les interventions.",
    },
  ];

  return (
    <section className="py-24 bg-white" id="objectifs">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold mb-6 text-red-600">
          <Link to="/objectifs" className="text-red-600 hover:underline font-semibold">
              Nos Objectifs
          </Link>    
    		</h2>
        <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
          Nous œuvrons pour un avenir professionnel inclusif et durable au Tchad à travers les axes suivants :
        </p>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {objectifs.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.03 }}
              className="bg-gray-50 p-6 rounded-xl shadow hover:shadow-xl"
            >
              {item.icon}
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              <p className="text-gray-600 text-sm">{item.description}</p>
            </motion.div>
          ))}
        </div>
        <div className="mt-10">
          <a
            href="/objectifs"
            className="inline-block bg-red-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-red-700 transition"
          >
            Voir plus d'Objectifs
          </a>
        </div>
      </div>
    </section>
  );
}
