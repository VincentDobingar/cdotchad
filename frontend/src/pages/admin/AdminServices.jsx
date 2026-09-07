// 📁 pages/admin/AdminServices.jsx
import { useEffect, useState } from "react";
import {
  ajouterService,
  fetchServices,
  modifierService,
  supprimerService,
} from "@/utils/adminApi";
import { toast } from "react-toastify";
import { Pencil, Trash2, Plus, Check, X } from "lucide-react";

/** Normalise n'importe quelle réponse en tableau */
const asArray = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.rows)) return raw.rows;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.services)) return raw.services;
  if (raw && typeof raw === "object") return Object.values(raw);
  return [];
};

export default function AdminServices() {
  const [services, setServices] = useState([]);            // toujours un tableau
  const [search, setSearch] = useState("");
  const [nouveauService, setNouveauService] = useState({ titre: "", description: "" });
  const [editServiceId, setEditServiceId] = useState(null);
  const [editedService, setEditedService] = useState({ titre: "", description: "" });

  useEffect(() => {
    chargerServices();
  }, []);

  const chargerServices = async () => {
    try {
      const data = await fetchServices();                 // peut être {services: [...]}, ou autre
      setServices(asArray(data?.services ?? data));       // 👉 normalisé en tableau
    } catch (err) {
      console.error("Erreur chargement services:", err);
      toast.error("Erreur chargement des services");
      setServices([]);                                    // sécurité
    }
  };

  const handleAjouter = async (e) => {
    e.preventDefault();
    try {
      await ajouterService(nouveauService);
      toast.success("Service ajouté !");
      setNouveauService({ titre: "", description: "" });
      chargerServices();
    } catch (err) {
      console.error("Erreur ajout:", err);
      toast.error("Erreur ajout");
    }
  };

  const handleSupprimer = async (id) => {
    if (window.confirm("Confirmer la suppression ?")) {
      try {
        await supprimerService(id);
        toast.success("Supprimé !");
        chargerServices();
      } catch (err) {
        console.error("Erreur suppression:", err);
        toast.error("Erreur suppression");
      }
    }
  };

  const handleEdit = (service) => {
    const currentId = service.id ?? service._id ?? service.uuid ?? null;
    setEditServiceId(currentId);
    setEditedService({
      titre: service.titre ?? "",
      description: service.description ?? "",
    });
  };

  const handleUpdate = async (id) => {
    try {
      await modifierService(id, editedService);
      toast.success("Service modifié !");
      setEditServiceId(null);
      chargerServices();
    } catch (err) {
      console.error("Erreur modification:", err);
      toast.error("Erreur modification");
    }
  };

  const q = search.trim().toLowerCase();
  const servicesFiltres = asArray(services).filter((s) =>
    (s?.titre ?? "").toLowerCase().includes(q)
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-red-600 mb-4">Gestion des Services</h1>

      {/* 🔍 Recherche */}
      <input
        type="text"
        placeholder="Rechercher un service..."
        value={search}
        onChange={(ev) => setSearch(ev.target.value)}
        className="w-full border px-4 py-2 rounded mb-4"
      />

      {/* ➕ Formulaire d'ajout */}
      <form onSubmit={handleAjouter} className="bg-white p-4 rounded shadow mb-6 space-y-3">
        <h2 className="text-lg font-semibold">Ajouter un service</h2>
        <input
          type="text"
          placeholder="Titre"
          value={nouveauService.titre}
          onChange={(e) => setNouveauService({ ...nouveauService, titre: e.target.value })}
          className="w-full border px-3 py-2 rounded"
          required
        />
        <textarea
          placeholder="Description"
          value={nouveauService.description}
          onChange={(e) => setNouveauService({ ...nouveauService, description: e.target.value })}
          className="w-full border px-3 py-2 rounded"
          rows={3}
          required
        />
        <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
          <Plus className="inline mr-1" size={18} />
          Ajouter
        </button>
      </form>

      {/* 📋 Liste des services */}
      <div className="space-y-4">
        {servicesFiltres.map((service) => {
          const sid = service.id ?? service._id ?? service.uuid ?? String(service.titre || Math.random());
          return (
            <div
              key={sid}
              className="bg-white p-4 shadow rounded flex justify-between items-start gap-4"
            >
              {editServiceId === sid ? (
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={editedService.titre}
                    onChange={(e) => setEditedService({ ...editedService, titre: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                  <textarea
                    value={editedService.description}
                    onChange={(e) =>
                      setEditedService({ ...editedService, description: e.target.value })
                    }
                    className="w-full border rounded px-3 py-2"
                    rows={3}
                  />
                </div>
              ) : (
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{service.titre}</h3>
                  <p className="text-gray-700">{service.description}</p>
                </div>
              )}

              <div className="flex-shrink-0 space-x-2">
                {editServiceId === sid ? (
                  <>
                    <button
                      onClick={() => handleUpdate(sid)}
                      className="text-green-600 hover:underline"
                      title="Enregistrer"
                    >
                      <Check size={20} />
                    </button>
                    <button
                      onClick={() => setEditServiceId(null)}
                      className="text-gray-500 hover:underline"
                      title="Annuler"
                    >
                      <X size={20} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleEdit({ ...service, id: sid })}
                      className="text-blue-600 hover:underline"
                      title="Modifier"
                    >
                      <Pencil size={20} />
                    </button>
                    <button
                      onClick={() => handleSupprimer(sid)}
                      className="text-red-600 hover:underline"
                      title="Supprimer"
                    >
                      <Trash2 size={20} />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
