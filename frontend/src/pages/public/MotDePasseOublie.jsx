// src/pages/public/MotDePasseOublie.jsx
// Demande de réinitialisation de mot de passe pour les comptes candidat / partenaire.
import { useState } from "react";
import { Link } from "react-router-dom";
import api from "@/utils/api";

export default function MotDePasseOublie() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [envoye, setEnvoye] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setEnvoye(true);
    } catch (e2) {
      setErr("Une erreur est survenue. Réessayez dans un instant.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivoire pt-28 pb-16 px-4 flex items-start justify-center">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-sable p-8">
        <h1 className="font-display text-3xl text-encre">Mot de passe oublié</h1>
        <p className="mt-2 text-sm text-graphite/70">
          Saisissez votre adresse e-mail : si un compte existe, vous recevrez un lien de réinitialisation.
        </p>

        {envoye ? (
          <div className="mt-6 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            Si ce compte existe, un e-mail de réinitialisation vient d'être envoyé. Pensez à vérifier vos courriers
            indésirables. Le lien est valable 30 minutes.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {err && (
              <div className="text-sm text-rougeprofond bg-rouge/10 border border-rouge/20 rounded-lg p-3">{err}</div>
            )}
            <label className="block">
              <span className="text-sm font-medium text-encre">Adresse e-mail</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="mt-1.5 w-full border border-sable rounded-lg px-3 py-2.5 bg-ivoire/40 focus:outline-none focus:ring-2 focus:ring-rouge focus:border-rouge transition"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-rouge hover:bg-rougeprofond text-white py-3 rounded-full font-semibold shadow-sm shadow-rouge/20 disabled:opacity-60 transition"
            >
              {loading ? "Envoi…" : "Envoyer le lien"}
            </button>
          </form>
        )}

        <div className="mt-8 border-t border-sable pt-6 text-sm text-center text-graphite">
          <Link to="/login" className="font-semibold text-rouge hover:text-rougeprofond hover:underline underline-offset-4">← Retour à la connexion</Link>
        </div>
      </div>
    </div>
  );
}
