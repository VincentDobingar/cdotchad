// pages/public/Contact.jsx

import { useRef, useState, useEffect } from "react";
import { Mail, MapPin, Phone, Send, CheckCircle2, AlertCircle } from "lucide-react";

const COORDONNEES = [
  { icone: MapPin, titre: "Adresse", valeur: "Klémat, 2ème Arr. N'Djamena (Tchad)" },
  { icone: Phone, titre: "Téléphone", valeur: "+235 98 85 00 78", lien: "tel:+23598850078" },
  { icone: Mail, titre: "E-mail", valeur: "contact@cdotchad.com", lien: "mailto:contact@cdotchad.com" },
];

const champ =
  "w-full border border-sable rounded-xl px-3.5 py-2.5 text-encre placeholder:text-graphite/50 focus:outline-none focus:ring-2 focus:ring-rouge/30 focus:border-rouge transition";

export default function Contact() {
  const form = useRef();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const recaptchaKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  // URL backend : même origine que la page en production, proxy /backend en développement
  const backendUrl = import.meta.env.PROD ? "https://cdotchad.com/backend" : "/backend";

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

      const res = await fetch(`${backendUrl}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_name, user_email, message, recaptchaToken: token }),
      });

      const data = await res.json();

      if (res.ok) {
        setSent(true);
        form.current.reset();
        setTimeout(() => setSent(false), 6000);
      } else {
        throw new Error(data.message || "Erreur d’envoi");
      }
    } catch (err) {
      console.error("Erreur :", err);
      setError("Le message n'a pas pu être envoyé. Veuillez réessayer ou écrire directement à contact@cdotchad.com.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivoire pt-24 pb-16 px-6">
      <div className="max-w-6xl mx-auto grid gap-8 lg:grid-cols-5">
        {/* Coordonnées */}
        <aside className="relative overflow-hidden lg:col-span-2 bg-gradient-to-br from-encre via-encre to-rougeprofond text-white rounded-2xl p-8 shadow-lg">
          <div className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-rouge/20 blur-3xl" />
          <p className="relative inline-flex items-center gap-2.5 text-sm font-medium text-white/80">
            <span className="h-px w-8 bg-rouge" aria-hidden="true" />
            Contact
          </p>
          <h1 className="relative mt-4 font-display text-3xl md:text-4xl leading-tight">Parlons de votre projet</h1>
          <p className="relative mt-3 text-white/80 leading-relaxed">
            Une question sur une offre, une candidature ou un partenariat ? Écrivez-nous, l'équipe CDO vous répond.
          </p>

          <ul className="relative mt-8 space-y-6">
            {COORDONNEES.map(({ icone: Icone, titre, valeur, lien }) => (
              <li key={titre} className="flex gap-4">
                <span className="shrink-0 w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-rouge">
                  <Icone className="w-5 h-5" />
                </span>
                <div>
                  <p className="text-sm text-white/60">{titre}</p>
                  {lien ? (
                    <a href={lien} className="font-medium hover:underline">
                      {valeur}
                    </a>
                  ) : (
                    <p className="font-medium">{valeur}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </aside>

        {/* Formulaire */}
        <section className="lg:col-span-3 bg-white rounded-2xl border border-sable shadow-sm p-8">
          <h2 className="font-display text-2xl text-encre">Envoyer un message</h2>
          <p className="mt-1 text-sm text-graphite">Les champs marqués d'un astérisque sont obligatoires.</p>

          {sent && (
            <div className="mt-6 flex gap-3 p-4 text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>Merci ! Votre message a bien été envoyé. Nous vous répondrons rapidement.</span>
            </div>
          )}
          {error && (
            <div className="mt-6 flex gap-3 p-4 text-red-800 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form ref={form} onSubmit={sendEmail} className="mt-6 space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="block mb-1 text-sm font-medium text-encre">Nom *</span>
                <input type="text" name="user_name" required className={champ} />
              </label>
              <label className="block">
                <span className="block mb-1 text-sm font-medium text-encre">Adresse e-mail *</span>
                <input type="email" name="user_email" required className={champ} />
              </label>
            </div>
            <label className="block">
              <span className="block mb-1 text-sm font-medium text-encre">Message *</span>
              <textarea name="message" required rows="6" className={champ}></textarea>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 bg-rouge hover:bg-rougeprofond text-white px-6 py-3 rounded-full font-semibold shadow-sm disabled:opacity-60"
            >
              <Send className="w-4 h-4" />
              {loading ? "Envoi en cours…" : "Envoyer le message"}
            </button>

            <p className="text-xs text-graphite/70">
              Ce formulaire est protégé contre les robots par reCAPTCHA v3 — une protection invisible : aucune case « Je ne suis pas un robot » n'est à cocher, c'est normal. Les règles de confidentialité et conditions d'utilisation de Google s'appliquent.
            </p>
          </form>
        </section>
      </div>
    </div>
  );
}
