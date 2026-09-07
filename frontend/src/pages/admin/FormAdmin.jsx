// 📁 src/pages/admin/FormAdmin.jsx
import { useState } from "react";
import { toast } from "react-toastify";
import api from "@/utils/api";
import { useNavigate } from "react-router-dom";

export default function FormAdmin() {
  const [email, setEmail] = useState("");
  const [motdepasse, setMotdepasse] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !motdepasse || !confirmPassword) {
      return toast.error("Veuillez remplir tous les champs.");
    }

    if (motdepasse !== confirmPassword) {
      return toast.error("Les mots de passe ne correspondent pas.");
    }

    try {
      await api.post("/admin/ajouter", { email, motdepasse });
      toast.success("Administrateur ajouté !");
      navigate("/admin/gestion-admins");
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur lors de la création.");
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-900 p-6 rounded shadow">
      <h2 className="text-2xl font-bold text-red-600 mb-6">Créer un nouvel administrateur</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Adresse email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border p-2 rounded"
          required
        />

        <input
          type="password"
          placeholder="Mot de passe"
          value={motdepasse}
          onChange={(e) => setMotdepasse(e.target.value)}
          className="w-full border p-2 rounded"
          required
        />

        <input
          type="password"
          placeholder="Confirmer le mot de passe"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full border p-2 rounded"
          required
        />

        <button
          type="submit"
          className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700"
        >
          Créer l’administrateur
        </button>
      </form>
    </div>
  );
}
