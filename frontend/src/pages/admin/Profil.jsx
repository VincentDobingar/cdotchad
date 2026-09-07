// 📁 src/pages/admin/Profil.jsx
import { useEffect, useState } from "react";
import api from "@/utils/api";

export default function AdminProfil() {
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    api.get("/admin/profil")
      .then((res) => setAdmin(res.data))
      .catch((err) => console.error("Erreur chargement profil admin :", err));
  }, []);

  if (!admin) return <p className="p-4">Chargement...</p>;

  return (
    <div className="p-6 max-w-xl mx-auto bg-white rounded shadow">
      <h1 className="text-2xl font-semibold mb-4 text-red-700">Profil Administrateur</h1>
      <p><strong>Nom :</strong> {admin.nom}</p>
      <p><strong>Email :</strong> {admin.email}</p>
      <p><strong>Rôle :</strong> {admin.role}</p>
    </div>
  );
}
