// 📁 src/pages/admin/FormUtilisateur.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";

export default function FormUtilisateur() {
  const { id } = useParams(); // récupère l’ID si édition
  const navigate = useNavigate();

  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("utilisateur");
  const [actif, setActif] = useState(true);
  const [motdepasse, setMotdepasse] = useState("");

  const modeEdition = !!id;

  // 📥 Charger les données existantes
  useEffect(() => {
    if (modeEdition) {
      fetch(`/api/utilisateurs/${id}`)
        .then((res) => res.json())
        .then((data) => {
          setNom(data.nom);
          setEmail(data.email);
          setRole(data.role);
          setActif(data.actif);
        })
        .catch(() => toast.error("Erreur lors du chargement"));
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = modeEdition
        ? `/api/utilisateurs/${id}`
        : "/api/utilisateurs";

      const method = modeEdition ? "PUT" : "POST";
      const payload = modeEdition
        ? { nom, email, role, actif }
        : { nom, email, motdepasse, role, actif };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.erreur || "Erreur");

      toast.success(
        modeEdition ? "Utilisateur modifié" : "Utilisateur ajouté"
      );
      navigate("/admin/utilisateurs");
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow mt-10">
      <h2 className="text-2xl font-semibold mb-4 text-center text-red-700">
        {modeEdition ? "Modifier l'utilisateur" : "Ajouter un utilisateur"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Nom</label>
          <input
            type="text"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />
        </div>

        {!modeEdition && (
          <div>
            <label className="block text-sm font-medium">Mot de passe</label>
            <input
              type="password"
              value={motdepasse}
              onChange={(e) => setMotdepasse(e.target.value)}
              required
              className="w-full p-2 border rounded"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium">Rôle</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="utilisateur">Utilisateur</option>
            <option value="administrateur">Administrateur</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={actif}
            onChange={(e) => setActif(e.target.checked)}
          />
          <label>Actif</label>
        </div>

        <div className="text-center">
          <button
            type="submit"
            className="bg-red-700 hover:bg-red-600 text-white px-6 py-2 rounded"
          >
            {modeEdition ? "Modifier" : "Enregistrer"}
          </button>
        </div>
      </form>
    </div>
  );
}
