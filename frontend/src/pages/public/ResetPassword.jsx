// src/pages/public/ResetPassword.jsx
// Définition d'un nouveau mot de passe depuis le lien reçu par e-mail (candidat / partenaire).
import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "@/utils/api";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    if (password.length < 8) {
      setErr("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirm) {
      setErr("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { newPassword: password });
      setOk(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Lien invalide ou expiré.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivoire pt-28 pb-16 px-4 flex items-start justify-center">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-sable p-8">
        <h1 className="font-display text-3xl text-encre">Nouveau mot de passe</h1>

        {ok ? (
          <div className="mt-6 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            Mot de passe réinitialisé. Redirection vers la connexion…
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {err && (
              <div className="text-sm text-rougeprofond bg-rouge/10 border border-rouge/20 rounded-lg p-3">{err}</div>
            )}
            <label className="block">
              <span className="text-sm font-medium text-encre">Nouveau mot de passe</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="mt-1.5 w-full border border-sable rounded-lg px-3 py-2.5 bg-ivoire/40 focus:outline-none focus:ring-2 focus:ring-rouge focus:border-rouge transition"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-encre">Confirmer le mot de passe</span>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
                className="mt-1.5 w-full border border-sable rounded-lg px-3 py-2.5 bg-ivoire/40 focus:outline-none focus:ring-2 focus:ring-rouge focus:border-rouge transition"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-rouge hover:bg-rougeprofond text-white py-3 rounded-full font-semibold shadow-sm shadow-rouge/20 disabled:opacity-60 transition"
            >
              {loading ? "Mise à jour…" : "Réinitialiser"}
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
