import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

const ScrollToTop = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      setVisible(window.scrollY > 200);
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return visible ? (
    <button
      onClick={scrollToTop}
      className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-red-600 text-white shadow-lg hover:bg-red-700 transition"
      aria-label="Retour en haut"
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  ) : null;
};

export default ScrollToTop;
