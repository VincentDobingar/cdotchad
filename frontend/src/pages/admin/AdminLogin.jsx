// 📁 src/pages/admin/AdminLogin.jsx
// Connexion à l'espace d'administration (même identité visuelle que la connexion candidats).
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import api from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import AdminAuthLayout, { boutonAuthCls, champAuthCls } from "@/components/admin/AdminAuthLayout";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Retour à la page demandée avant la connexion, si elle appartient à l'administration
  const suite = (() => {
    const next = searchParams.get("next") || "";
    return next.startsWith("/admin") && !/^\/admin\/(login|mot-de-passe-oublie|reset-password)/.test(next) ? next : "/admin/dashboard";
  })();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      // Les deux clés couvrent {password} et {motdepasse} côté serveur
      const res = await api.post("/admin/login", { email, password, motdepasse: password, remember });

      // .htaccess mal configuré : le serveur renvoie la page HTML au lieu de l'API
      if (typeof res.data === "string" && /<!doctype html>/i.test(res.data)) {
        throw new Error("Le backend a renvoyé du HTML (probable réécriture). Vérifie .htaccess.");
      }
      const { token, admin } = res.data || {};
      if (!token) throw new Error("Le serveur n'a renvoyé aucun jeton de connexion.");

      await login({ token, user: admin, remember, roleHint: "admin" });
      toast.success("Connexion réussie !");
      navigate(suite, { replace: true });
    } catch (e2) {
      setErr(e2?.response?.data?.message || e2?.message || "Connexion impossible");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminAuthLayout titre="Connexion" sousTitre="Espace d'administration — réservé à l'équipe CDO">
      {err && <div className="mt-6 text-sm text-rougeprofond bg-rouge/10 border border-rouge/20 rounded-lg p-3">{err}</div>}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-encre">Adresse e-mail</span>
          <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required className={champAuthCls} />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-encre">Mot de passe</span>
          <span className="relative block">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={`${champAuthCls} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 mt-[3px] text-graphite/60 hover:text-encre"
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </span>
        </label>

        <div className="flex items-center justify-between gap-4">
          <label className="flex items-center gap-2 text-sm text-graphite">
            <input type="checkbox" checked={remember} onChange={() => setRemember((v) => !v)} className="rounded border-sablefonce text-rouge focus:ring-rouge" />
            Se souvenir de moi
          </label>
          <Link to="/admin/mot-de-passe-oublie" className="text-sm font-medium text-rouge hover:text-rougeprofond hover:underline underline-offset-4">
            Mot de passe oublié ?
          </Link>
        </div>

        <button type="submit" disabled={loading} className={boutonAuthCls}>
          {loading ? "Connexion…" : "Se connecter"}
          {!loading && <ArrowRight className="w-4 h-4" />}
        </button>
      </form>

      <div className="mt-6 border-t border-sable pt-6 text-sm text-center text-graphite">
        Candidat ou partenaire ?{" "}
        <Link to="/login" className="font-semibold text-rouge hover:text-rougeprofond hover:underline underline-offset-4">
          Connexion à votre espace
        </Link>
      </div>
    </AdminAuthLayout>
  );
}
