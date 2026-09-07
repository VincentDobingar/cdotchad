// src/pages
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${backendUrl}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, motDePasse }),
      });

      if (!res.ok) {
        alert("Identifiants invalides");
        return;
      }

      const data = await res.json();

      await login({
        token: data.token,
        admin: data.admin || { email, role: "admin" },
        remember: true,
      });

      navigate("/admin");
    } catch (err) {
      console.error("Erreur lors de la connexion :", err);
      alert("Erreur lors de la connexion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Connexion Administrateur</h2>

      <form onSubmit={handleLogin}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="text"
          placeholder="Nom d'utilisateur ou email"
          className="border w-full mb-4 p-2"
        />

        <input
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          type="password"
          placeholder="Mot de passe"
          className="border w-full mb-4 p-2"
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