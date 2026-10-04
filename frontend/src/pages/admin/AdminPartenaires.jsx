// src/pages/admin/AdminPartenaires.jsx
// Gestion des comptes partenaires : création, mot de passe provisoire, suppression.
import { useEffect, useState } from "react";
import { Trash2, KeyRound, Copy } from "lucide-react";
import api from "@/utils/api";
import toast from "react-hot-toast";
import FormPartenaire from "@/components/admin/FormPartenaire";

export default function AdminPartenaires() {
  const [partenaires, setPartenaires] = useState([]);
  const [loading, setLoading] = useState(true);
  // Mot de passe provisoire affiché une seule fois : { nom, email, motdepasse }
  const [dernierAcces, setDernierAcces] = useState(null);

  const charger = async () => {
    try {
      const { data } = await api.get("/partenaires");
      setPartenaires(data.partenaires || []);
    } catch {
      toast.error("Erreur lors du chargement des partenaires");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    charger();
  }, []);

  const apresCreation = (partenaire, motdepasse) => {
    setDernierAcces({ nom: partenaire.nom, email: partenaire.email, motdepasse });
    charger();
  };

  const reinitialiser = async (p) => {
    if (!window.confirm(`Générer un nouveau mot de passe pour ${p.nom} ? L'ancien ne fonctionnera plus.`)) return;
    try {
      const { data } = await api.post(`/partenaires/${p.id}/reinitialiser-mot-de-passe`);
      setDernierAcces({ nom: p.nom, email: p.email, motdepasse: data.motdepasse_provisoire });
    } catch {
      toast.error("Réinitialisation impossible");
    }
  };

  const changerStatut = async (p) => {
    const suspendre = p.statut_compte === "actif";
    const question = suspendre
      ? `Suspendre le compte de ${p.nom} ? Il ne pourra plus se connecter ni soumettre d'avis.`
      : `Réactiver le compte de ${p.nom} ?`;
    if (!window.confirm(question)) return;
    try {
      await api.patch(`/partenaires/${p.id}/statut`, { statut: suspendre ? "suspendu" : "actif" });
      toast.success(suspendre ? "Compte suspendu" : "Compte réactivé");
      charger();
    } catch {
      toast.error("Action impossible");
    }
  };

  const supprimer = async (p) => {
    if (!window.confirm(`Supprimer le compte de ${p.nom} ? Ses avis déjà soumis seront conservés.`)) return;
    try {
      await api.delete(`/partenaires/${p.id}`);
      toast.success("Partenaire supprimé");
      charger();
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  const copier = async (texte) => {
    try {
      await navigator.clipboard.writeText(texte);
      toast.success("Copié");
    } catch {
      toast.error("Copie impossible : sélectionnez le texte manuellement");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4 text-indigo-700">Partenaires</h2>
      <p className="text-sm text-gray-600 mb-4">
        Un partenaire n'a pas d'inscription libre : vous créez son compte ici et lui transmettez le mot de passe
        provisoire. Il soumet ensuite ses avis de recrutement, que vous validez dans « Modération avis ».
      </p>

      {dernierAcces && (
        <div className="mb-6 p-4 border border-yellow-300 bg-yellow-50 rounded space-y-2">
          <p className="font-semibold">Accès de {dernierAcces.nom}</p>
          <p className="text-sm">Email : <span className="font-mono">{dernierAcces.email}</span></p>
          <p className="text-sm">
            Mot de passe provisoire : <span className="font-mono">{dernierAcces.motdepasse}</span>
            <button type="button" onClick={() => copier(dernierAcces.motdepasse)} className="ml-2 inline-flex items-center gap-1 text-blue-600">
              <Copy size={14} /> Copier
            </button>
          </p>
          <p className="text-xs text-gray-700">Ce mot de passe ne sera plus affiché. Transmettez-le au partenaire : il devra le remplacer à sa première connexion.</p>
          <button type="button" onClick={() => setDernierAcces(null)} className="text-sm text-gray-600 underline">
            Fermer
          </button>
        </div>
      )}

      <FormPartenaire onCreated={apresCreation} />

      {loading ? (
        <p>Chargement…</p>
      ) : partenaires.length === 0 ? (
        <p>Aucun partenaire enregistré.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="py-2 px-3 text-left">Organisation</th>
                <th className="py-2 px-3 text-left">Email</th>
                <th className="py-2 px-3 text-left">Ville</th>
                <th className="py-2 px-3 text-left">Avis en attente</th>
                <th className="py-2 px-3 text-left">Avis total</th>
                <th className="py-2 px-3 text-left">Statut</th>
                <th className="py-2 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {partenaires.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="py-2 px-3">
                    <div className="font-medium">{p.nom}</div>
                    <div className="text-xs text-gray-500">{p.contact_nom || ""}</div>
                  </td>
                  <td className="py-2 px-3">{p.email}</td>
                  <td className="py-2 px-3">{p.ville || "-"}</td>
                  <td className="py-2 px-3">{p.avis_en_attente}</td>
                  <td className="py-2 px-3">{p.avis_total}</td>
                  <td className="py-2 px-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${p.statut_compte === "actif" ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-700"}`}>
                      {p.statut_compte === "actif" ? "Actif" : "Suspendu"}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex justify-end gap-3">
                      <button type="button" onClick={() => changerStatut(p)} className="text-xs text-gray-700 underline self-center">
                        {p.statut_compte === "actif" ? "Suspendre" : "Réactiver"}
                      </button>
                      <button type="button" onClick={() => reinitialiser(p)} title="Nouveau mot de passe" className="text-indigo-600 hover:text-indigo-800">
                        <KeyRound size={18} />
                      </button>
                      <button type="button" onClick={() => supprimer(p)} title="Supprimer" className="text-red-500 hover:text-red-700">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
