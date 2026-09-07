// 📁 src/pages/admin/ResetPassword.jsx
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/utils/api";
import toast from "react-hot-toast";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas !");
      return;
    }

    setLoading(true);
    try {
      await api.post(`/admin/reset-password/${token}`, { motdepasse: password });
      toast.success("Mot de passe réinitialisé !");
      navigate("/admin/login");
    } catch (err) {
      toast.error("Erreur lors de la réinitialisation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 p-8 rounded shadow-md w-full max-w-md space-y-4"
      >
        <h2 className="text-2xl font-bold text-center text-red-600 dark:text-white">
          Réinitialiser le mot de passe
        </h2>

        <input
          type="password"
          placeholder="Nouveau mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
          required
        />

        <input
          type="password"
          placeholder="Confirmer le mot de passe"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded transition"
        >
          {loading ? "Mise à jour..." : "Réinitialiser"}
        </button>
      </form>
    </div>
  );
}
