// 📁 src/pages/admin/MotDePasseOublie.jsx
// Demande de lien de réinitialisation pour un compte d'administration.
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, MailCheck } from "lucide-react";
import api from "@/utils/api";
import AdminAuthLayout, { boutonAuthCls, champAuthCls } from "@/components/admin/AdminAuthLayout";

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
      await api.post("/admin/forgot-password", { email });
      setEnvoye(true);
    } catch {
      setErr("L'envoi du message a échoué. Réessayez dans quelques minutes.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminAuthLayout titre="Mot de passe oublié" sousTitre="Recevez un lien pour choisir un nouveau mot de passe">
      {envoye ? (
        <div className="mt-6 rounded-xl bg-sable/60 p-5 text-sm text-encre">
          <MailCheck className="w-6 h-6 text-rouge mb-2" />
          Si un compte d'administration correspond à <strong>{email}</strong>, un lien de réinitialisation vient de lui être envoyé.
          Pensez à vérifier les courriers indésirables.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {err && <div className="text-sm text-rougeprofond bg-rouge/10 border border-rouge/20 rounded-lg p-3">{err}</div>}
          <label className="block">
            <span className="text-sm font-medium text-encre">Adresse e-mail</span>
            <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={champAuthCls} />
          </label>
          <button type="submit" disabled={loading} className={boutonAuthCls}>
            {loading ? "Envoi en cours…" : "Envoyer le lien"}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      )}
      <div className="mt-6 border-t border-sable pt-6 text-sm text-center">
        <Link to="/admin/login" className="font-semibold text-rouge hover:text-rougeprofond hover:underline underline-offset-4">Retour à la connexion</Link>
      </div>
    </AdminAuthLayout>
  );
}
