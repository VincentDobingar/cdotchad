// 📁 src/components/Testimonials.jsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Quote } from "lucide-react";

const testimonials = [
  {
    name: "Fatimé Oumar",
    role: "Jeune diplômée en gestion",
    quote: "Grâce à CDO, j'ai trouvé mon premier emploi dans une entreprise locale. L'accompagnement a fait toute la différence.",
    image: "/images/fatime.jpg",
  },
  {
    name: "Mahamat Ali",
    role: "Responsable RH",
    quote: "Leur appui en recrutement nous a permis d'optimiser nos processus et de recruter plus juste.",
    image: "/images/mahamat.jpg",
  },
  {
    name: "Delphine Moundou",
    role: "Bénéficiaire d'une formation",
    quote: "Les formations m'ont aidée à renforcer mes compétences et à oser entreprendre.",
    image: "/images/delphine.jpg",
  },
];

// Photo ronde, ou initiales si l'image est absente / introuvable
function Avatar({ name, image }) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");

  if (failed || !image) {
    return (
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-rouge/10 text-rouge font-semibold">
        {initials}
      </span>
    );
  }
  return <img src={image} alt={name} onError={() => setFailed(true)} className="h-14 w-14 rounded-full object-cover" />;
}

export default function Testimonials() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % testimonials.length), 6000);
    return () => clearInterval(id);
  }, []);

  const { name, role, quote, image } = testimonials[index];

  return (
    <section className="py-24 bg-ivoire" id="temoignages">
      <div className="max-w-4xl mx-auto px-6 md:px-8">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-rouge">
          <span className="h-px w-6 bg-rouge/60" aria-hidden="true" /> Témoignages
        </span>
        <Quote className="mt-6 h-10 w-10 text-rouge/30" />
        <div className="relative min-h-[220px] mt-2">
          <AnimatePresence mode="wait">
            <motion.figure
              key={index}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.5 }}
            >
              <blockquote className="font-display text-2xl md:text-[2rem] leading-snug text-encre">
                « {quote} »
              </blockquote>
              <figcaption className="mt-7 flex items-center gap-4">
                <Avatar name={name} image={image} />
                <span>
                  <span className="block font-semibold text-encre">{name}</span>
                  <span className="block text-sm text-graphite">{role}</span>
                </span>
              </figcaption>
            </motion.figure>
          </AnimatePresence>
        </div>
        <div className="mt-8 flex gap-2">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Témoignage ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-8 bg-rouge" : "w-3 bg-sablefonce hover:bg-graphite/40"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
