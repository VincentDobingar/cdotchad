// 📁 src/pages/admin/AdminUtilisateurs.jsx
// Comptes des candidats (table `users`, rôle « candidat »). Le backend /utilisateurs ne
// gère que ce rôle : les administrateurs se gèrent dans « Gestion Admins » et les
// partenaires dans « Partenaires ».
import { useEffect, useState } from "react";
import {
  ajouterUtilisateur,
  fetchUtilisateurs,
  supprimerUtilisateur,
  updateUtilisateur,
} from "@/utils/adminApi";
import { toast } from "react-toastify";
import { Save, Trash2, Pencil, FileDown, X } from "lucide-react";

const MDP_MIN = 8;
const UTILISATEUR_VIDE = { prenom: "", nom: "", email: "", motdepasse: "" };

// Le backend répond { erreur } sur ces routes
const messageErreur = (err, parDefaut) => err?.response?.data?.erreur || err?.response?.data?.message || parDefaut;

const texte = (v) => String(v ?? "");

export default function AdminUtilisateurs() {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [search, setSearch] = useState("");
  const [newUser, setNewUser] = useState(UTILISATEUR_VIDE);
  const [envoi, setEnvoi] = useState(false);
  const [editUserId, setEditUserId] = useState(null);
  const [editUserData, setEditUserData] = useState({ prenom: "", nom: "", email: "" });

  useEffect(() => {
    chargerUtilisateurs();
  }, []);

  const chargerUtilisateurs = async () => {
    try {
      const data = await fetchUtilisateurs();
      setUtilisateurs(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(messageErreur(err, "Erreur chargement utilisateurs"));
    }
  };

  const handleAjouter = async (e) => {
    e.preventDefault();
    if (newUser.motdepasse.length < MDP_MIN) {
      return toast.error(`Le mot de passe doit contenir au moins ${MDP_MIN} caractères.`);
    }
    setEnvoi(true);
    try {
      await ajouterUtilisateur({
        prenom: newUser.prenom.trim(),
        nom: newUser.nom.trim(),
        email: newUser.email.trim(),
        motdepasse: newUser.motdepasse,
      });
      toast.success("Compte candidat créé");
      setNewUser(UTILISATEUR_VIDE);
      chargerUtilisateurs();
    } catch (err) {
      toast.error(messageErreur(err, "Erreur ajout utilisateur"));
    } finally {
      setEnvoi(false);
    }
  };

  const handleSupprimer = async (id) => {
    if (!window.confirm("Confirmer la suppression ?")) return;
    try {
      await supprimerUtilisateur(id);
      toast.success("Utilisateur supprimé");
      chargerUtilisateurs();
    } catch (err) {
      toast.error(messageErreur(err, "Erreur suppression"));
    }
  };

  const handleEdit = (user) => {
    setEditUserId(user.id);
    setEditUserData({ prenom: texte(user.prenom), nom: texte(user.nom), email: texte(user.email) });
  };

  const handleUpdate = async () => {
    try {
      await updateUtilisateur(editUserId, {
        prenom: editUserData.prenom.trim(),
        nom: editUserData.nom.trim(),
        email: editUserData.email.trim(),
      });
      toast.success("Utilisateur modifié");
      setEditUserId(null);
      chargerUtilisateurs();
    } catch (err) {
      toast.error(messageErreur(err, "Erreur modification"));
    }
  };

  const exportToCSV = () => {
    const cellule = (v) => `"${texte(v).replace(/"/g, '""')}"`;
    const headers = ["ID", "Prénom", "Nom", "Email", "Inscrit le"];
    const rows = utilisateurs.map((u) => [
      u.id,
      u.prenom,
      u.nom,
      u.email,
      u.cree_le ? new Date(u.cree_le).toLocaleDateString("fr-FR") : "",
    ]);
    // BOM + point-virgule : le fichier s'ouvre directement dans Excel en français
    const csv = "﻿" + [headers, ...rows].map((row) => row.map(cellule).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "utilisateurs.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const recherche = search.trim().toLowerCase();
  const filteredUtilisateurs = utilisateurs.filter((u) =>
    `${texte(u.prenom)} ${texte(u.nom)} ${texte(u.email)}`.toLowerCase().includes(recherche)
  );

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-1 text-gray-900 dark:text-white">Gestion des Utilisateurs</h2>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
        Comptes des candidats inscrits sur le site. Les administrateurs se gèrent dans « Gestion Admins » et les
        partenaires dans « Partenaires ».
      </p>

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
        <h3 className="text-lg font-semibold">Ajouter un candidat</h3>
        <div className="flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Prénom"
            value={newUser.prenom}
            onChange={(e) => setNewUser({ ...newUser, prenom: e.target.value })}
            className="border p-2 rounded w-full sm:w-auto"
          />
          <input
            type="text"
            placeholder="Nom *"
            value={newUser.nom}
            onChange={(e) => setNewUser({ ...newUser, nom: e.target.value })}
            required
            className="border p-2 rounded w-full sm:w-auto"
          />
          <input
            type="email"
            placeholder="Email *"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            required
            className="border p-2 rounded w-full sm:w-auto"
          />
          <input
            type="password"
            placeholder={`Mot de passe * (${MDP_MIN} car. min.)`}
            value={newUser.motdepasse}
            onChange={(e) => setNewUser({ ...newUser, motdepasse: e.target.value })}
            required
            minLength={MDP_MIN}
            autoComplete="new-password"
            className="border p-2 rounded w-full sm:w-64"
          />
          <button
            type="submit"
            disabled={envoi}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60"
          >
            {envoi ? "Ajout…" : "Ajouter"}
          </button>
        </div>
        <p className="text-xs text-gray-500">
          Transmettez ensuite ce mot de passe au candidat : il pourra le changer depuis son profil.
        </p>
      </form>

      {/* Tableau des utilisateurs */}
      <div className="overflow-x-auto">
        <table className="min-w-full border bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 border">Prénom</th>
              <th className="px-3 py-2 border">Nom</th>
              <th className="px-3 py-2 border">Email</th>
              <th className="px-3 py-2 border">Inscrit le</th>
              <th className="px-3 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUtilisateurs.map((user) => {
              const enEdition = editUserId === user.id;
              return (
                <tr key={user.id} className="border-b">
                  <td className="px-3 py-2 border">
                    {enEdition ? (
                      <input
                        type="text"
                        aria-label="Prénom"
                        value={editUserData.prenom}
                        onChange={(e) => setEditUserData({ ...editUserData, prenom: e.target.value })}
                        className="border px-2 py-1 rounded w-full"
                      />
                    ) : (
                      user.prenom || "—"
                    )}
                  </td>
                  <td className="px-3 py-2 border">
                    {enEdition ? (
                      <input
                        type="text"
                        aria-label="Nom"
                        value={editUserData.nom}
                        onChange={(e) => setEditUserData({ ...editUserData, nom: e.target.value })}
                        className="border px-2 py-1 rounded w-full"
                      />
                    ) : (
                      user.nom || "—"
                    )}
                  </td>
                  <td className="px-3 py-2 border">
                    {enEdition ? (
                      <input
                        type="email"
                        aria-label="Email"
                        value={editUserData.email}
                        onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })}
                        className="border px-2 py-1 rounded w-full"
                      />
                    ) : (
                      user.email
                    )}
                  </td>
                  <td className="px-3 py-2 border text-center">
                    {user.cree_le ? new Date(user.cree_le).toLocaleDateString("fr-FR") : "—"}
                  </td>
                  <td className="px-3 py-2 border">
                    <div className="flex gap-2 justify-center">
                      {enEdition ? (
                        <>
                          <button
                            onClick={handleUpdate}
                            title="Enregistrer"
                            aria-label="Enregistrer"
                            className="bg-green-600 text-white px-2 py-1 rounded"
                          >
                            <Save size={16} />
                          </button>
                          <button
                            onClick={() => setEditUserId(null)}
                            title="Annuler"
                            aria-label="Annuler"
                            className="bg-gray-400 text-white px-2 py-1 rounded"
                          >
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(user)}
                            title="Modifier"
                            aria-label="Modifier"
                            className="bg-yellow-500 text-white px-2 py-1 rounded"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleSupprimer(user.id)}
                            title="Supprimer"
                            aria-label="Supprimer"
                            className="bg-red-600 text-white px-2 py-1 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredUtilisateurs.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-4 text-gray-500">
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
