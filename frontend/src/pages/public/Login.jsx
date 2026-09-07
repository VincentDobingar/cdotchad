// src/pages/public/Login.jsx
// Connexion candidat (l'espace admin a son propre écran : AdminLogin.jsx / /admin/login).
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "@/utils/api";
import { useAuth } from "@/context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [motdepasse, setMotdepasse] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      const { data } = await api.post("/auth/login", { email, motdepasse });

      await login({
        token: data.accessToken,
        user: data.utilisateur,
        remember: true,
        roleHint: "candidat",
      });

      navigate(searchParams.get("next") || "/profile");
    } catch (err) {
      setErr(err?.response?.data?.message || "Identifiants invalides");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Connexion candidat</h2>

      {err && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2 mb-4">
          {err}
        </div>
      )}

      <form onSubmit={handleLogin}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Email"
          className="border w-full mb-4 p-2"
          required
        />

        <input
          value={motdepasse}
          onChange={(e) => setMotdepasse(e.target.value)}
          type="password"
          placeholder="Mot de passe"
          className="border w-full mb-4 p-2"
          required
        />

        <button
          className="bg-red-700 text-white px-4 py-2 w-full disabled:opacity-50"
          type="submit"
          disabled={loading}
        >
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>
    </div>
  );
};

export default Login;
