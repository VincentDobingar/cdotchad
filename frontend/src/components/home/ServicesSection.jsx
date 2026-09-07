// src/components/home/ServicesSection.jsx
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Briefcase, BarChart, CreditCard, MonitorSmartphone } from "lucide-react";

const services = [
  {
    icon: <Briefcase className="w-10 h-10 text-red-600" />,
    title: "Ressources Humaines",
    description: "Recrutement, formation, coaching, paie...",
    anchor: "#rh",
  },
  {
    icon: <BarChart className="w-10 h-10 text-red-600" />,
    title: "Stratégie & Conseil",
    description: "Organisation, redressement, cartographies...",
    anchor: "#conseil",
  },
  {
    icon: <CreditCard className="w-10 h-10 text-red-600" />,
    title: "Services Financiers",
    description: "Fiscalité, business plan, levée de fonds...",
    anchor: "#finances",
  },
  {
    icon: <MonitorSmartphone className="w-10 h-10 text-red-600" />,
    title: "Solutions Digitales",
    description: "Développement, télécoms, marketing...",
    anchor: "#digital",
  },
];

export default function ServicesSection() {
  return (
    <section className="py-20 bg-gray-50 text-center">
      <div className="container mx-auto px-4">
        <motion.h2
          className="text-3xl md:text-4xl font-bold text-red-700 mb-12"
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Nos services
        </motion.h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((item, index) => (
            <motion.div
              key={index}
              className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition"
              whileHover={{ scale: 1.05 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="mb-4 flex justify-center">{item.icon}</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">{item.title}</h3>
              <p className="text-gray-600 mb-4">{item.description}</p>
              <Link
                to={`/services${item.anchor}`}
                className="text-red-600 font-medium hover:underline"
              >
                En savoir plus
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}