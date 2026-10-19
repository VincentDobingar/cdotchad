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
    <div className="min-h-screen bg-slate-50 pt-24 pb-16 px-4 flex items-start justify-center">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
        <h1 className="text-2xl font-bold tracking-tight text-red-700">Nouveau mot de passe</h1>

        {ok ? (
          <div className="mt-6 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            Mot de passe réinitialisé. Redirection vers la connexion…
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {err && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">{err}</div>
            )}
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Nouveau mot de passe</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Confirmer le mot de passe</span>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
                className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-700 hover:bg-red-800 text-white py-2.5 rounded-lg font-medium shadow-sm disabled:opacity-60"
            >
              {loading ? "Mise à jour…" : "Réinitialiser"}
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
