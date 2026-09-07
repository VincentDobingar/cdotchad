import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  BriefcaseBusiness,
  Users,
  GraduationCap,
  Target,
  BookOpenCheck,
  ShieldCheck,
} from "lucide-react";


export default function HomeServices() {
  const services = [
    {
      title: "Recrutement",
      description: "Nous aidons les entreprises à trouver les meilleurs profils au Tchad.",
      icon: <BriefcaseBusiness className="w-10 h-10 text-red-600 mb-4" />,
    },
    {
      title: "Orientation professionnelle",
      description: "Conseils personnalisés pour orienter les jeunes vers des carrières prometteuses.",
      icon: <GraduationCap className="w-10 h-10 text-red-600 mb-4" />,
    },
    {
      title: "Formation & Coaching",
      description: "Sessions de formation et accompagnement pour développer les compétences clés.",
      icon: <BookOpenCheck className="w-10 h-10 text-red-600 mb-4" />,
    },
    {
      title: "Renforcement RH",
      description: "Appui stratégique aux entreprises pour améliorer leur gestion RH.",
      icon: <Users className="w-10 h-10 text-red-600 mb-4" />,
    },
    {
      title: "Évaluation & Tests",
      description: "Mise en place d’outils pour évaluer les compétences techniques et comportementales.",
      icon: <Target className="w-10 h-10 text-red-600 mb-4" />,
    },
    {
      title: "Conformité & Sécurité",
      description: "Sensibilisation à la conformité légale et au respect des normes sociales.",
      icon: <ShieldCheck className="w-10 h-10 text-red-600 mb-4" />,
    },
  ];

  return (
    <section className="py-24 bg-gray-50" id="services">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold mb-6 text-red-600">
          <Link
            to="/services"
            className="inline-block mt-4 text-red-600 hover:underline font-semibold"
          >
            Nos Services
          </Link>
        </h2>
        <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
          Des solutions adaptées pour accompagner les entreprises et les chercheurs d’emploi.
        </p>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.03 }}
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl text-left"
            >
              <div className="flex flex-col items-start">
                {service.icon}
                <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
                <p className="text-gray-600 text-sm">{service.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="mt-10">
          <a
            href="/services"
            className="inline-block bg-red-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-red-700 transition"
          >
            Voir plus de services
          </a>
        </div>
      </div>
    </section>
  );
}
