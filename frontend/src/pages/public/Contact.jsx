// pages/public/Contact.jsx

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Contact() {
  const form = useRef();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const recaptchaKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  // ✅ URL backend centralisée
  const backendUrl =
    import.meta.env.MODE === "production"
      ? "https://cdotchad.com/api"
      : "http://localhost:5000/api";

  // ✅ Injecter le script reCAPTCHA une seule fois
  useEffect(() => {
    if (!document.querySelector("#recaptcha-script")) {
      const script = document.createElement("script");
      script.id = "recaptcha-script";
      script.src = `https://www.google.com/recaptcha/api.js?render=${recaptchaKey}`;
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, [recaptchaKey]);

  // ✅ Envoi du formulaire
  const sendEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(form.current);
    const user_name = formData.get("user_name");
    const user_email = formData.get("user_email");
    const message = formData.get("message");

    try {
      if (!window.grecaptcha) throw new Error("reCAPTCHA non chargé");

      const token = await window.grecaptcha.execute(recaptchaKey, { action: "submit" });
      console.log("🔐 Token reCAPTCHA :", token);

      const res = await fetch(`${backendUrl}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_name, user_email, message, recaptchaToken: token }),
      });

      const data = await res.json();

      if (res.ok) {
        setSent(true);
        form.current.reset();
        setTimeout(() => setSent(false), 5000);
      } else {
        throw new Error(data.message || "Erreur d’envoi");
      }
    } catch (err) {
      console.error("Erreur :", err);
      setError("Erreur serveur. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container mx-auto px-4 py-24 space-y-16">
      {/* Section Formulaire de contact */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-lg"
      >
        <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">Contactez-nous</h2>

        <AnimatePresence>
          {sent && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 text-green-700 bg-green-100 rounded"
            >
              ✅ Merci ! Votre message a été envoyé avec succès.
            </motion.div>
          )}
        </AnimatePresence>
        {error && (
          <div className="mb-6 p-4 text-red-700 bg-red-100 rounded">
            {error}
          </div>
        )}

        <form ref={form} onSubmit={sendEmail} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium text-gray-700">Nom</label>
            <input
              type="text"
              name="user_name"
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="user_email"
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700">Message</label>
            <textarea
              name="message"
              required
              rows="4"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
            ></textarea>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-700 text-white py-2 rounded-lg hover:bg-red-800 transition"
          >
            {loading ? "Envoi en cours..." : "Envoyer le message"}
          </button>
        </form>
      </motion.section>
    </main>
  );
}
