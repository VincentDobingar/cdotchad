import { useEffect, useState } from "react";
import {
  ajouterUtilisateur,
  fetchUtilisateurs,
  supprimerUtilisateur,
  updateUtilisateur,
} from "@/utils/adminApi";
import { toast } from "react-toastify";
import { Save, Trash2, Pencil, FileDown } from "lucide-react";

export default function AdminUtilisateurs() {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [search, setSearch] = useState("");
  const [newUser, setNewUser] = useState({ nom: "", email: "", role: "" });
  const [editUserId, setEditUserId] = useState(null);
  const [editUserData, setEditUserData] = useState({ nom: "", email: "", role: "" });

  useEffect(() => {
    chargerUtilisateurs();
  }, []);

  const chargerUtilisateurs = async () => {
    try {
      const data = await fetchUtilisateurs();
      setUtilisateurs(data);
    } catch (err) {
      toast.error("Erreur chargement utilisateurs");
    }
  };

  const handleAjouter = async (e) => {
    e.preventDefault();
    try {
      await ajouterUtilisateur(newUser);
      toast.success("Utilisateur ajouté");
      setNewUser({ nom: "", email: "", role: "" });
      chargerUtilisateurs();
    } catch (err) {
      toast.error("Erreur ajout utilisateur");
    }
  };

  const handleSupprimer = async (id) => {
    if (!window.confirm("Confirmer la suppression ?")) return;
    try {
      await supprimerUtilisateur(id);
      toast.success("Utilisateur supprimé");
      chargerUtilisateurs();
    } catch (err) {
      toast.error("Erreur suppression");
    }
  };

  const handleEdit = (user) => {
    setEditUserId(user.id);
    setEditUserData({ nom: user.nom, email: user.email, role: user.role });
  };

  const handleUpdate = async () => {
    try {
      await updateUtilisateur(editUserId, editUserData);
      toast.success("Utilisateur modifié");
      setEditUserId(null);
      chargerUtilisateurs();
    } catch (err) {
      toast.error("Erreur modification");
    }
  };

  const exportToCSV = () => {
    const headers = ["ID", "Nom", "Email", "Role"];
    const rows = utilisateurs.map((u) => [u.id, u.nom, u.email, u.role]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows].map((row) => row.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = csvContent;
    link.download = "utilisateurs.csv";
    link.click();
  };

  const filteredUtilisateurs = utilisateurs.filter(
    (u) =>
      u.nom.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Gestion des Utilisateurs</h2>

      {/* Recherche + Export */}
      <div className="flex flex-wrap gap-4 mb-4 items-center">
        <input
          type="text"
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-3 py-2 rounded w-full sm:w-auto"
        />
        <button
          onClick={exportToCSV}
          className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <FileDown size={16} />
          Export CSV
        </button>
      </div>

      {/* Formulaire d'ajout */}
      <form onSubmit={handleAjouter} className="bg-white p-4 rounded shadow mb-6 space-y-3">
        <h3 className="text-lg font-semibold">Ajouter un utilisateur</h3>
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Nom"
            value={newUser.nom}
            onChange={(e) => setNewUser({ ...newUser, nom: e.target.value })}
            required
            className="border p-2 rounded w-full sm:w-auto"
          />
          <input
            type="email"
            placeholder="Email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            required
            className="border p-2 rounded w-full sm:w-auto"
          />
          <select
            value={newUser.role}
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            required
            className="border p-2 rounded w-full sm:w-auto"
          >
            <option value="">Rôle</option>
            <option value="admin">Admin</option>
            <option value="superAdmin">SuperAdmin</option>
          </select>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Ajouter
          </button>
        </div>
      </form>

      {/* Tableau des utilisateurs */}
      <div className="overflow-x-auto">
        <table className="min-w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 border">Nom</th>
              <th className="px-3 py-2 border">Email</th>
              <th className="px-3 py-2 border">Rôle</th>
              <th className="px-3 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUtilisateurs.map((user) => (
              <tr key={user.id} className="border-b">
                <td className="px-3 py-2 border">
                  {editUserId === user.id ? (
                    <input
                      type="text"
                      value={editUserData.nom}
                      onChange={(e) =>
                        setEditUserData({ ...editUserData, nom: e.target.value })
                      }
                      className="border px-2 py-1 rounded"
                    />
                  ) : (
                    user.nom
                  )}
                </td>
                <td className="px-3 py-2 border">
                  {editUserId === user.id ? (
                    <input
                      type="email"
                      value={editUserData.email}
                      onChange={(e) =>
                        setEditUserData({ ...editUserData, email: e.target.value })
                      }
                      className="border px-2 py-1 rounded"
                    />
                  ) : (
                    user.email
                  )}
                </td>
                <td className="px-3 py-2 border">
                  {editUserId === user.id ? (
                    <select
                      value={editUserData.role}
                      onChange={(e) =>
                        setEditUserData({ ...editUserData, role: e.target.value })
                      }
                      className="border px-2 py-1 rounded"
                    >
                      <option value="admin">Admin</option>
                      <option value="superAdmin">SuperAdmin</option>
                    </select>
                  ) : (
                    user.role
                  )}
                </td>
                <td className="px-3 py-2 border flex gap-2 justify-center">
                  {editUserId === user.id ? (
                    <button
                      onClick={handleUpdate}
                      className="bg-green-600 text-white px-2 py-1 rounded"
                    >
                      <Save size={16} />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEdit(user)}
                      className="bg-yellow-500 text-white px-2 py-1 rounded"
                    >
                      <Pencil size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => handleSupprimer(user.id)}
                    className="bg-red-600 text-white px-2 py-1 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {filteredUtilisateurs.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-4 text-gray-500">
                  Aucun utilisateur trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
