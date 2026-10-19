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
    <div className="min-h-screen bg-slate-50 pt-24 pb-16 px-4 flex items-start justify-center">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
        <h1 className="text-2xl font-bold tracking-tight text-red-700">Mot de passe oublié</h1>
        <p className="mt-1 text-sm text-slate-500">
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
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">{err}</div>
            )}
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Adresse e-mail</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-700 hover:bg-red-800 text-white py-2.5 rounded-lg font-medium shadow-sm disabled:opacity-60"
            >
              {loading ? "Envoi…" : "Envoyer le lien"}
            </button>
          </form>
        )}

        <div className="mt-8 border-t border-slate-100 pt-6 text-sm text-center text-slate-600">
          <Link to="/login" className="font-medium text-red-700 hover:underline">← Retour à la connexion</Link>
        </div>
      </div>
    </div>
  );
}
