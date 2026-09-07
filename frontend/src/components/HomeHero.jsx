import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function HomeHero() {
  const images = [
    "/images/accueil-cdotchad.png",
    "/images/ac-cdotchad.jpg",
    "/images/ac1-cdotchad.jpg",
    "/images/ac2-cdotchad.png",
  ];

  const phrases = [
    "Explorez les opportunités au Tchad avec CDOTCHAD.",
    "Rejoignez une nouvelle dynamique pour l'emploi et l’innovation.",
    "Donnez-vous la chance d'explorer les opportunités que nous offre l'innovation.",
    "Agissez pour un Tchad plus innovant et prospère.",
  ];

  const [currentImage, setCurrentImage] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fullText = phrases[phraseIndex];
    let typingSpeed = isDeleting ? 40 : 80;

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        setDisplayedText(fullText.slice(0, displayedText.length + 1));
        if (displayedText.length + 1 === fullText.length) {
          setTimeout(() => setIsDeleting(true), 1500);
        }
      } else {
        setDisplayedText(fullText.slice(0, displayedText.length - 1));
        if (displayedText.length === 0) {
          setIsDeleting(false);
          setPhraseIndex((prev) => (prev + 1) % phrases.length);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [displayedText, isDeleting, phraseIndex]);

  return (
    <section id="hero" data-hero className="relative h-screen overflow-hidden">
      {/* ✅ Image de fond animée */}
      <AnimatePresence>
        <motion.div
          key={images[currentImage]}
          initial={{ opacity: 0, scale: 1 }}
          animate={{ opacity: 1, scale: 1.1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 6 }}
          className="absolute inset-0 w-full h-full bg-black bg-cover bg-center"
          style={{ backgroundImage: `url(${images[currentImage]})` }}
        />
      </AnimatePresence>

      {/* ✅ Overlay sombre */}
      <div className="absolute inset-0 bg-black/60 z-10" />

      {/* ✅ Contenu centré */}
        <div className="relative z-20 flex flex-col justify-center items-center text-center text-white h-screen px-4 sm:px-6 max-w-4xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2 }}
            className="mb-6 text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold drop-shadow-md"
          >
            {displayedText}
            <span className="animate-pulse">|</span>
          </motion.h1>

          <p className="text-base sm:text-lg md:text-xl mb-8">
            Pour l’emploi, l’innovation et la transformation économique au Tchad.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 w-full sm:w-auto">
            <Link
              to="/offres"
              className="bg-white text-red-700 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition"
            >
              Découvrir Nos Offres
            </Link>
            <Link
              to="/presentation"
              className="border border-white px-6 py-3 rounded-full font-semibold hover:bg-white hover:text-red-700 transition"
            >
              En Savoir Plus
            </Link>
          </div>

        {/* ✅ Bouton vers services */}
        <a
          href="#services"
          className="mt-10 animate-bounce text-white text-sm flex items-center gap-2"
        >
          Voir les services
          <ChevronRight className="rotate-90" />
        </a>
      </div>
    </section>
  );
}
