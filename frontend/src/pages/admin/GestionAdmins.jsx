// 📁 src/pages/admin/GestionAdmins.jsx
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  getAdmins,
  createAdmin,
  deleteAdmin,
  resetAdminPassword,
  updateAdmin,
} from "@/utils/adminApi";
import AdminLayout from "@/layout/AdminLayout";

export default function GestionAdmins() {
  const [admins, setAdmins] = useState([]);
  const [roleFilter, setRoleFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editedAdmin, setEditedAdmin] = useState({ email: "", role: "admin" });
  const [newAdmin, setNewAdmin] = useState({ email: "", motdepasse: "", role: "admin" });
  const adminEmail = localStorage.getItem("adminEmail");
  const adminRole = localStorage.getItem("adminRole");

  const fetchAdmins = async () => {
    try {
      const res = await getAdmins();
      setAdmins(res.data);
    } catch (err) {
      toast.error("Erreur lors du chargement des administrateurs");
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleDelete = async (id, email) => {
    if (email === adminEmail) {
      return toast.error("Vous ne pouvez pas vous supprimer vous-même.");
    }
    const confirm = window.confirm("Êtes-vous sûr de vouloir supprimer cet administrateur ?");
    if (!confirm) return;
    try {
      await deleteAdmin(id);
      toast.success("Administrateur supprimé");
      fetchAdmins();
    } catch (err) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleResetPassword = async (id) => {
    const confirm = window.prompt("Entrez le nouveau mot de passe (au moins 6 caractères):");
    if (!confirm || confirm.length < 6) {
      return toast.error("Mot de passe invalide.");
    }
    try {
      await resetAdminPassword(id, { motdepasse: confirm });
      toast.success("Mot de passe réinitialisé.");
    } catch (err) {
      toast.error("Erreur lors de la réinitialisation");
    }
  };

  const handleEdit = (admin) => {
    setEditingId(admin.id);
    setEditedAdmin({ email: admin.email, role: admin.role });
  };

  const handleUpdate = async () => {
    if (admins.find((a) => a.id === editingId)?.role === "superAdmin" && editedAdmin.role !== "superAdmin") {
      toast.error("Vous ne pouvez pas modifier le rôle du superAdmin.");
      return;
    }
    try {
      await updateAdmin(editingId, editedAdmin);
      setEditingId(null);
      fetchAdmins();
    } catch (err) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createAdmin(newAdmin);
      toast.success("Administrateur ajouté");
      setNewAdmin({ email: "", motdepasse: "", role: "admin" });
      fetchAdmins();
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur lors de l'ajout");
    }
  };

  const filteredAdmins = admins.filter((a) => {
    const matchRole = roleFilter === "all" || a.role === roleFilter;
    const matchEmail = a.email.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchEmail && a.email !== adminEmail;
  });

  const nbAdmins = admins.filter((a) => a.role === "admin").length;
  const nbSuperAdmins = admins.filter((a) => a.role === "superAdmin").length;

  return (
    <AdminLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-4 text-red-600">Gestion des administrateurs</h2>

        {adminRole === "superAdmin" && (
          <form onSubmit={handleCreate} className="mb-8 bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-2">Ajouter un nouvel administrateur</h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                value={newAdmin.email}
                onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                placeholder="Email"
                required
                className="border p-2 rounded w-full"
              />
              <input
                type="password"
                value={newAdmin.motdepasse}
                onChange={(e) => setNewAdmin({ ...newAdmin, motdepasse: e.target.value })}
                placeholder="Mot de passe"
                required
                className="border p-2 rounded w-full"
              />
              <select
                value={newAdmin.role}
                onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value })}
                className="border p-2 rounded"
              >
                <option value="admin">admin</option>
                <option value="superAdmin">superAdmin</option>
              </select>
              <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
                Ajouter
              </button>
            </div>
          </form>
        )}

        <div className="flex items-center gap-4 mb-4">
          <label className="font-semibold">Filtrer par rôle :</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="all">Tous</option>
            <option value="admin">Admin</option>
            <option value="superAdmin">SuperAdmin</option>
          </select>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par email..."
            className="border p-2 rounded w-64"
          />
        </div>

        <div className="mb-4 text-sm text-gray-600">
          {admins.length} total — {nbAdmins} admins, {nbSuperAdmins} superAdmins
        </div>

        <table className="w-full border text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">ID</th>
              <th className="p-2 border">Email</th>
              <th className="p-2 border">Rôle</th>
              <th className="p-2 border">Créé le</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAdmins.map((admin) => (
              <tr key={admin.id}>
                <td className="p-2 border text-center">{admin.id}</td>
                <td className="p-2 border">
                  {editingId === admin.id ? (
                    <input
                      type="email"
                      value={editedAdmin.email}
                      onChange={(e) => setEditedAdmin({ ...editedAdmin, email: e.target.value })}
                      className="border p-1 rounded w-full"
                    />
                  ) : (
                    admin.email
                  )}
                </td>
                <td className="p-2 border">
                  {editingId === admin.id ? (
                    <select
                      value={editedAdmin.role}
                      onChange={(e) => setEditedAdmin({ ...editedAdmin, role: e.target.value })}
                      className="border p-1 rounded"
                    >
                      <option value="admin">admin</option>
                      <option value="superAdmin">superAdmin</option>
                    </select>
                  ) : (
                    admin.role
                  )}
                </td>
                <td className="p-2 border text-center">
                  {new Date(admin.cree_le).toLocaleDateString()}
                </td>
                <td className="p-2 border text-center space-x-2">
                  {editingId === admin.id ? (
                    <>
                      <button onClick={handleUpdate} className="px-3 py-1 bg-green-600 text-white rounded">
                        Enregistrer
                      </button>
                      <button onClick={() => setEditingId(null)} className="px-3 py-1 bg-gray-400 text-white rounded">
                        Annuler
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleEdit(admin)} className="px-2 py-1 bg-yellow-500 text-white rounded">
                        Modifier
                      </button>
                      <button onClick={() => handleResetPassword(admin.id)} className="px-2 py-1 bg-blue-600 text-white rounded">
                        Réinit. mot de passe
                      </button>
                      <button onClick={() => handleDelete(admin.id, admin.email)} className="px-2 py-1 bg-red-600 text-white rounded">
                        Supprimer
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
