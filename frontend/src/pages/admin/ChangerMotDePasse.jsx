import { useState } from "react";
import api from "@/utils/api";
import { toast } from "react-hot-toast";
import AdminLayout from "@/layout/AdminLayout";

export default function ChangerMotDePasse() {
  const [ancien, setAncien] = useState("");
  const [nouveau, setNouveau] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (nouveau !== confirm) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }
    if (nouveau.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/admin/change-password", { ancien, nouveau });
      toast.success("Mot de passe modifié !");
      setAncien("");
      setNouveau("");
      setConfirm("");
    } catch (err) {
      toast.error("Erreur : " + (err.response?.data?.message || "impossible de changer"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-md mx-auto p-6 mt-10 bg-white dark:bg-gray-800 shadow rounded">
        <h2 className="text-xl font-semibold mb-4 text-red-600 dark:text-white">
          Modifier mon mot de passe
        </h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <input
            type="password"
            placeholder="Ancien mot de passe"
            value={ancien}
            onChange={(e) => setAncien(e.target.value)}
            required
            className="w-full border p-2 rounded dark:bg-gray-700 dark:text-white"
          />
          <input
            type="password"
            placeholder="Nouveau mot de passe"
            value={nouveau}
            onChange={(e) => setNouveau(e.target.value)}
            required
            className="w-full border p-2 rounded dark:bg-gray-700 dark:text-white"
          />
          <input
            type="password"
            placeholder="Confirmer le nouveau mot de passe"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            className="w-full border p-2 rounded dark:bg-gray-700 dark:text-white"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-red-700 text-white px-4 py-2 rounded hover:bg-red-800 w-full"
          >
            {loading ? "Mise à jour..." : "Changer le mot de passe"}
          </button>
        </form>
      </div>
    </AdminLayout>
  );
}
