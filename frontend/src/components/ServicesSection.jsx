// components/ServicesSection.jsx
import { BriefcaseBusiness, Search, Users, ShieldCheck, Globe, BookOpenCheck } from "lucide-react";

const servicesData = [
  {
    title: "Recrutement",
    description: "Nous aidons les entreprises à trouver les meilleurs profils au Tchad.",
    icon: <BriefcaseBusiness className="w-12 h-12" />,
  },
  {
    title: "Orientation professionnelle",
    description: "Conseils et accompagnement pour orienter les jeunes vers des carrières prometteuses.",
    icon: <Search className="w-12 h-12" />,
  },
  {
    title: "Mise en relation",
    description: "Connecter les talents aux entreprises de tous secteurs.",
    icon: <Users className="w-12 h-12" />,
  },
  {
    title: "Conformité RH",
    description: "Assistance aux entreprises pour se conformer aux normes RH locales.",
    icon: <ShieldCheck className="w-12 h-12" />,
  },
  {
    title: "Plateforme digitale",
    description: "Un portail moderne pour candidater et gérer les offres.",
    icon: <Globe className="w-12 h-12" />,
  },
  {
    title: "Formations & Ateliers",
    description: "Des sessions pratiques pour renforcer l’employabilité.",
    icon: <BookOpenCheck className="w-12 h-12" />,
  },
];

export default function ServicesSection() {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold mb-6">Nos Services</h2>
        <p className="text-lg text-gray-600 mb-12">
          Nous vous accompagnons à chaque étape : de la recherche d’emploi à la sélection des meilleurs talents.
        </p>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {servicesData.map((service, index) => (
            <div
              key={index}
              className="group bg-gray-50 p-6 rounded-2xl shadow-md transition hover:shadow-xl hover:bg-blue-50"
            >
              <div className="flex justify-center mb-4 text-blue-600">
                {service.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
              <p className="text-gray-600">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
