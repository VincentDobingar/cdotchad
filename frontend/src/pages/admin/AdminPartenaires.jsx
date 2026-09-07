// 📁 src/pages/admin/AdminPartenaires.jsx
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import api from "@/utils/api";
import toast from "react-hot-toast";
import FormPartenaire from "@/components/admin/FormPartenaire";

export default function AdminPartenaires() {
  const [partenaires, setPartenaires] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPartenaires = async () => {
    try {
      const res = await api.get("/partenaires");
      setPartenaires(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors du chargement des partenaires");
    } finally {
      setLoading(false);
    }
  };

  const supprimerPartenaire = async (id) => {
    if (!confirm("Voulez-vous vraiment supprimer ce partenaire ?")) return;
    try {
      await api.delete(`/partenaires/${id}`);
      toast.success("Partenaire supprimé avec succès");
      fetchPartenaires();
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la suppression");
    }
  };

  useEffect(() => {
    fetchPartenaires();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4 text-indigo-700">Gestion des Partenaires</h2>

      <FormPartenaire onSuccess={fetchPartenaires} />

      {loading ? (
        <p>Chargement...</p>
      ) : partenaires.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {partenaires.map((part) => (
            <Card key={part.id} className="relative">
              <CardContent className="p-4 space-y-2 text-center">
                <img
                  src={part.logo || "/logos/default-logo.png"}
                  alt={part.nom}
                  className="h-16 object-contain mx-auto"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/logos/default-logo.png";
                  }}
                />
                <h3 className="text-lg font-semibold text-indigo-700">{part.nom}</h3>
                <p className="text-sm text-gray-600">{part.resume}</p>

                <button
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                  onClick={() => supprimerPartenaire(part.id)}
                  title="Supprimer"
                >
                  <Trash2 size={18} />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p>Aucun partenaire enregistré.</p>
      )}
    </div>
  );
}
