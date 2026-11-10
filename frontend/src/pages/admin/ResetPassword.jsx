// 📁 src/pages/admin/ResetPassword.jsx
// Choix d'un nouveau mot de passe à partir du lien reçu par e-mail.
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowRight } from "lucide-react";
import api from "@/utils/api";
import AdminAuthLayout, { boutonAuthCls, champAuthCls } from "@/components/admin/AdminAuthLayout";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    if (password.length < 8) return setErr("Le mot de passe doit contenir au moins 8 caractères.");
    if (password !== confirmPassword) return setErr("Les deux mots de passe ne correspondent pas.");
    setLoading(true);
    try {
      await api.post(`/admin/reset-password/${token}`, { newPassword: password });
      toast.success("Mot de passe réinitialisé. Vous pouvez vous connecter.");
      navigate("/admin/login");
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Lien invalide ou expiré. Demandez un nouveau lien.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminAuthLayout titre="Nouveau mot de passe" sousTitre="Au moins 8 caractères">
      {err && <div className="mt-6 text-sm text-rougeprofond bg-rouge/10 border border-rouge/20 rounded-lg p-3">{err}</div>}
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-encre">Nouveau mot de passe</span>
          <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required className={champAuthCls} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-encre">Confirmer le mot de passe</span>
          <input type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className={champAuthCls} />
        </label>
        <button type="submit" disabled={loading} className={boutonAuthCls}>
          {loading ? "Mise à jour…" : "Enregistrer"}
          {!loading && <ArrowRight className="w-4 h-4" />}
        </button>
      </form>
      <div className="mt-6 border-t border-sable pt-6 text-sm text-center">
        <Link to="/admin/mot-de-passe-oublie" className="font-semibold text-rouge hover:text-rougeprofond hover:underline underline-offset-4">Demander un nouveau lien</Link>
      </div>
    </AdminAuthLayout>
  );
}
