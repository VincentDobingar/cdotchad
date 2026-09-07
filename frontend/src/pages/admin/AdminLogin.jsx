// 📁 src/pages/admin/AdminLogin.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";

import logoLight from "@/assets/logo-cdotchad.png";
import logoDark from "@/assets/logo-cdo-dark.png";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); // ← on garde “password” côté state
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      // ✅ Envoie les deux clés pour couvrir {password} ET {motdepasse}
      const res = await api.post("/admin/login", {
        email,
        password,
        motdepasse: password,
        remember,
      });

      // 🔎 Cas : .htaccess mal configuré → le backend renvoie du HTML (index.html)
      if (typeof res.data === "string" && /<!doctype html>/i.test(res.data)) {
        throw new Error("Le backend a renvoyé du HTML (probable réécriture). Vérifie .htaccess.");
      }

      const { token, admin } = res.data || {};
      if (!token) {
        throw new Error("Identifiants valides ? Le serveur n'a renvoyé aucun token.");
      }

      await login({ token, user: admin, remember, roleHint: "admin" });

      toast.success("Connexion réussie !");
      navigate("/admin/dashboard", { replace: true });
    } catch (e) {
      const message = e?.response?.data?.message || e?.message || "Connexion impossible";
      setErr(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow w-full max-w-md space-y-4">
        <div className="flex justify-center mb-2">
          <img src={logoLight} alt="Logo CDO" className="h-16 block dark:hidden" />
          <img src={logoDark} alt="Logo CDO (dark)" className="h-16 hidden dark:block" />
        </div>

        <h2 className="text-2xl font-bold text-center text-red-600 dark:text-white">Connexion Admin</h2>

        {err && (
          <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-2">
            {err}
          </div>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
          required
        />

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-300"
            tabIndex={-1}
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <label className="flex items-center space-x-2 text-sm dark:text-white">
          <input type="checkbox" checked={remember} onChange={() => setRemember(!remember)} />
          <span>Se souvenir de moi</span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded transition disabled:opacity-60"
        >
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </div>
  );
}
