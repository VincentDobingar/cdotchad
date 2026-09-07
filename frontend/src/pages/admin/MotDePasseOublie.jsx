// 📁 src/pages/admin/MotDePasseOublie.jsx
import { useState } from "react";
import api from "@/utils/api";
import toast from "react-hot-toast";

export default function MotDePasseOublie() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/admin/forgot-password", { email });
      toast.success("Un lien de réinitialisation a été envoyé à votre adresse email.");
    } catch (err) {
      toast.error("Erreur lors de l’envoi du mail.");
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
          Mot de passe oublié
        </h2>

        <input
          type="email"
          placeholder="Votre email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded transition"
        >
          {loading ? "Envoi en cours..." : "Envoyer le lien"}
        </button>
      </form>
    </div>
  );
}
