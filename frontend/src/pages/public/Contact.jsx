// pages/public/Contact.jsx

import { useRef, useState, useEffect } from "react";
import { Mail, MapPin, Phone, Send, CheckCircle2, AlertCircle } from "lucide-react";

const COORDONNEES = [
  { icone: MapPin, titre: "Adresse", valeur: "Klémat, 2ème Arr. N'Djamena (Tchad)" },
  { icone: Phone, titre: "Téléphone", valeur: "+235 98 85 00 78", lien: "tel:+23598850078" },
  { icone: Mail, titre: "E-mail", valeur: "contact@cdotchad.com", lien: "mailto:contact@cdotchad.com" },
];

const champ =
  "w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-600";

export default function Contact() {
  const form = useRef();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const recaptchaKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  // URL backend : en production l'API est sur cdotchad.com/api, en développement elle passe par le proxy /backend
  const backendUrl = import.meta.env.PROD ? "https://cdotchad.com/api" : "/backend";

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
    <div className="min-h-screen bg-slate-50 pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto grid gap-8 lg:grid-cols-5">
        {/* Coordonnées */}
        <aside className="lg:col-span-2 bg-gradient-to-br from-red-900 via-red-800 to-red-700 text-white rounded-2xl p-8 shadow-lg">
          <p className="text-sm uppercase tracking-[0.2em] text-red-200">Contact</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight">Parlons de votre projet</h1>
          <p className="mt-3 text-red-100">
            Une question sur une offre, une candidature ou un partenariat ? Écrivez-nous, l'équipe CDO vous répond.
          </p>

          <ul className="mt-8 space-y-6">
            {COORDONNEES.map(({ icone: Icone, titre, valeur, lien }) => (
              <li key={titre} className="flex gap-4">
                <span className="shrink-0 w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Icone className="w-5 h-5" />
                </span>
                <div>
                  <p className="text-sm text-red-200">{titre}</p>
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
        <section className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <h2 className="text-xl font-semibold">Envoyer un message</h2>
          <p className="mt-1 text-sm text-slate-500">Les champs marqués d'un astérisque sont obligatoires.</p>

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
                <span className="block mb-1 text-sm font-medium text-slate-700">Nom *</span>
                <input type="text" name="user_name" required className={champ} />
              </label>
              <label className="block">
                <span className="block mb-1 text-sm font-medium text-slate-700">Adresse e-mail *</span>
                <input type="email" name="user_email" required className={champ} />
              </label>
            </div>
            <label className="block">
              <span className="block mb-1 text-sm font-medium text-slate-700">Message *</span>
              <textarea name="message" required rows="6" className={champ}></textarea>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white px-6 py-2.5 rounded-lg font-medium shadow-sm disabled:opacity-60"
            >
              <Send className="w-4 h-4" />
              {loading ? "Envoi en cours…" : "Envoyer le message"}
            </button>

            <p className="text-xs text-slate-500">
              Ce formulaire est protégé par reCAPTCHA. Les conditions de Google s'appliquent.
            </p>
          </form>
        </section>
      </div>
    </div>
  );
}
