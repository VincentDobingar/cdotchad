// 📁 src/pages/admin/GestionAdmins.jsx
// Comptes d'administration (rôles admin et superadmin). Écran réservé aux superadmins :
// la route est déclarée avec superAdmin: true, et le backend refuse les écritures aux autres.
// Le backend expose : GET /admin/admins -> { admins }, POST /admin/admins,
// POST /admin/admins/:id/reset-password, DELETE /admin/admins/:id.
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { KeyRound, Trash2, UserPlus } from "lucide-react";
import { getAdmins, createAdmin, deleteAdmin, resetAdminPassword } from "@/utils/adminApi";
import { useAuth } from "@/context/AuthContext";

const LIBELLES_ROLE = { admin: "Administrateur", superadmin: "Super-administrateur" };
const MDP_MIN = 8;
const ADMIN_VIDE = { prenom: "", nom: "", email: "", password: "", role: "admin" };

const messageErreur = (err, parDefaut) => err?.response?.data?.message || parDefaut;

export default function GestionAdmins() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [roleFilter, setRoleFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [newAdmin, setNewAdmin] = useState(ADMIN_VIDE);
  const [envoi, setEnvoi] = useState(false);
  // Réinitialisation de mot de passe en cours : { id, password } ou null
  const [reinit, setReinit] = useState(null);

  const fetchAdmins = async () => {
    try {
      const data = await getAdmins();
      setAdmins(Array.isArray(data?.admins) ? data.admins : []);
    } catch (err) {
      toast.error(messageErreur(err, "Erreur lors du chargement des administrateurs"));
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const estMoi = (admin) => admin.id === user?.id;

  const handleCreate = async (e) => {
    e.preventDefault();
    if (newAdmin.password.length < MDP_MIN) {
      return toast.error(`Le mot de passe doit contenir au moins ${MDP_MIN} caractères.`);
    }
    setEnvoi(true);
    try {
      await createAdmin({
        prenom: newAdmin.prenom.trim() || undefined,
        nom: newAdmin.nom.trim() || undefined,
        email: newAdmin.email.trim(),
        password: newAdmin.password,
        role: newAdmin.role,
      });
      toast.success("Administrateur ajouté");
      setNewAdmin(ADMIN_VIDE);
      fetchAdmins();
    } catch (err) {
      toast.error(messageErreur(err, "Erreur lors de l'ajout"));
    } finally {
      setEnvoi(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!reinit || reinit.password.length < MDP_MIN) {
      return toast.error(`Le mot de passe doit contenir au moins ${MDP_MIN} caractères.`);
    }
    try {
      await resetAdminPassword(reinit.id, { password: reinit.password });
      toast.success("Mot de passe réinitialisé");
      setReinit(null);
    } catch (err) {
      toast.error(messageErreur(err, "Erreur lors de la réinitialisation"));
    }
  };

  const handleDelete = async (admin) => {
    if (estMoi(admin)) return toast.error("Vous ne pouvez pas supprimer votre propre compte.");
    if (!window.confirm(`Supprimer le compte de ${admin.email} ?`)) return;
    try {
      await deleteAdmin(admin.id);
      toast.success("Administrateur supprimé");
      fetchAdmins();
    } catch (err) {
      toast.error(messageErreur(err, "Erreur lors de la suppression"));
    }
  };

  const recherche = search.trim().toLowerCase();
  const filteredAdmins = admins.filter((a) => {
    const matchRole = roleFilter === "all" || a.role === roleFilter;
    const texte = `${a.prenom || ""} ${a.nom || ""} ${a.email || ""}`.toLowerCase();
    return matchRole && texte.includes(recherche);
  });

  const nbAdmins = admins.filter((a) => a.role === "admin").length;
  const nbSuperAdmins = admins.filter((a) => a.role === "superadmin").length;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-1 text-red-600">Gestion des administrateurs</h2>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
        Les comptes ci-dessous donnent accès à cet espace d'administration. Un super-administrateur peut en plus
        gérer ces comptes.
      </p>

      <form onSubmit={handleCreate} className="mb-8 bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-3">Ajouter un administrateur</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <input
            type="text"
            value={newAdmin.prenom}
            onChange={(e) => setNewAdmin({ ...newAdmin, prenom: e.target.value })}
            placeholder="Prénom"
            className="border p-2 rounded w-full"
          />
          <input
            type="text"
            value={newAdmin.nom}
            onChange={(e) => setNewAdmin({ ...newAdmin, nom: e.target.value })}
            placeholder="Nom"
            className="border p-2 rounded w-full"
          />
          <input
            type="email"
            value={newAdmin.email}
            onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
            placeholder="Email *"
            required
            className="border p-2 rounded w-full"
          />
          <input
            type="password"
            value={newAdmin.password}
            onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
            placeholder={`Mot de passe * (${MDP_MIN} caractères minimum)`}
            required
            minLength={MDP_MIN}
            autoComplete="new-password"
            className="border p-2 rounded w-full"
          />
          <select
            value={newAdmin.role}
            onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value })}
            aria-label="Rôle"
            className="border p-2 rounded w-full"
          >
            <option value="admin">{LIBELLES_ROLE.admin}</option>
            <option value="superadmin">{LIBELLES_ROLE.superadmin}</option>
          </select>
          <button
            type="submit"
            disabled={envoi}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <UserPlus size={16} />
            {envoi ? "Ajout…" : "Ajouter"}
          </button>
        </div>
      </form>

      <div className="flex flex-wrap items-center gap-4 mb-4">
        <label className="font-semibold text-gray-800 dark:text-gray-200" htmlFor="filtre-role-admin">
          Filtrer par rôle :
        </label>
        <select
          id="filtre-role-admin"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="all">Tous</option>
          <option value="admin">{LIBELLES_ROLE.admin}</option>
          <option value="superadmin">{LIBELLES_ROLE.superadmin}</option>
        </select>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom ou email..."
          className="border p-2 rounded w-64"
        />
      </div>

      <div className="mb-4 text-sm text-gray-600 dark:text-gray-300">
        {admins.length} compte{admins.length > 1 ? "s" : ""} — {nbAdmins} administrateur{nbAdmins > 1 ? "s" : ""},{" "}
        {nbSuperAdmins} super-administrateur{nbSuperAdmins > 1 ? "s" : ""}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border text-sm bg-white">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border text-left">Nom</th>
              <th className="p-2 border text-left">Email</th>
              <th className="p-2 border text-left">Rôle</th>
              <th className="p-2 border">Créé le</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAdmins.map((admin) => (
              <tr key={admin.id}>
                <td className="p-2 border">
                  {[admin.prenom, admin.nom].filter(Boolean).join(" ") || "—"}
                  {estMoi(admin) && <span className="ml-2 text-xs text-gray-500">(vous)</span>}
                </td>
                <td className="p-2 border">{admin.email}</td>
                <td className="p-2 border">{LIBELLES_ROLE[admin.role] || admin.role}</td>
                <td className="p-2 border text-center">
                  {admin.cree_le ? new Date(admin.cree_le).toLocaleDateString("fr-FR") : "—"}
                </td>
                <td className="p-2 border">
                  {estMoi(admin) ? (
                    <p className="text-center text-xs text-gray-500">Votre compte</p>
                  ) : reinit?.id === admin.id ? (
                    <form onSubmit={handleResetPassword} className="flex flex-wrap items-center justify-center gap-2">
                      <input
                        type="password"
                        value={reinit.password}
                        onChange={(e) => setReinit({ ...reinit, password: e.target.value })}
                        placeholder={`Nouveau mot de passe (${MDP_MIN} car. min.)`}
                        minLength={MDP_MIN}
                        required
                        autoFocus
                        autoComplete="new-password"
                        className="border p-1 rounded w-56"
                      />
                      <button type="submit" className="px-3 py-1 bg-green-600 text-white rounded">
                        Valider
                      </button>
                      <button type="button" onClick={() => setReinit(null)} className="px-3 py-1 bg-gray-400 text-white rounded">
                        Annuler
                      </button>
                    </form>
                  ) : (
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setReinit({ id: admin.id, password: "" })}
                        className="px-2 py-1 bg-blue-600 text-white rounded flex items-center gap-1"
                      >
                        <KeyRound size={14} /> Nouveau mot de passe
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(admin)}
                        className="px-2 py-1 bg-red-600 text-white rounded flex items-center gap-1"
                      >
                        <Trash2 size={14} /> Supprimer
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {!chargement && filteredAdmins.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  Aucun administrateur trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
