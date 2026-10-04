// src/pages/public/Inscription.jsx
// Création d'un compte candidat. Connecte automatiquement le candidat à la fin.
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/utils/api";
import { useAuth } from "@/context/AuthContext";

export default function Inscription() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ prenom: "", nom: "", email: "", motdepasse: "", confirmation: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    if (form.motdepasse !== form.confirmation) {
      setErr("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", {
        prenom: form.prenom,
        nom: form.nom,
        email: form.email,
        motdepasse: form.motdepasse,
      });

      await login({
        token: data.accessToken,
        user: data.utilisateur,
        remember: true,
        roleHint: "candidat",
      });

      navigate("/profile");
    } catch (error) {
      setErr(error?.response?.data?.message || "Inscription impossible. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  const champ = "w-full border p-2 rounded";

  return (
    <div className="max-w-md mx-auto px-4 py-8 pt-20">
      <h2 className="text-xl font-bold text-red-600 mb-2">Créer mon compte candidat</h2>
      <p className="text-sm text-gray-600 mb-6">
        Votre compte vous permet d'enregistrer vos documents et de suivre vos candidatures.
      </p>

      {err && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2 mb-4">{err}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <input name="prenom" placeholder="Prénom" value={form.prenom} onChange={handleChange} className={champ} />
          <input name="nom" placeholder="Nom" value={form.nom} onChange={handleChange} className={champ} />
        </div>
        <input type="email" name="email" placeholder="Email" required value={form.email} onChange={handleChange} className={champ} />
        <input
          type="password"
          name="motdepasse"
          placeholder="Mot de passe (8 caractères minimum)"
          required
          minLength={8}
          value={form.motdepasse}
          onChange={handleChange}
          className={champ}
        />
        <input
          type="password"
          name="confirmation"
          placeholder="Confirmer le mot de passe"
          required
          minLength={8}
          value={form.confirmation}
          onChange={handleChange}
          className={champ}
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? "Création…" : "Créer mon compte"}
        </button>
      </form>

      <p className="text-sm mt-6 text-center">
        Déjà inscrit ?{" "}
        <Link to="/login" className="text-blue-600 hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
