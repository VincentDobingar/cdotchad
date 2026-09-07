// 📁 pages/admin/AdminReferents.jsx
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import api from "@/utils/api";
import toast from "react-hot-toast";
import FormReferent from "@/components/admin/FormReferent";

export default function AdminReferents() {
  const [referents, setReferents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReferents = async () => {
    try {
      const res = await api.get("/referents");
      setReferents(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors du chargement des référents");
    } finally {
      setLoading(false);
    }
  };

  const supprimerReferent = async (id) => {
    if (!confirm("Voulez-vous vraiment supprimer ce référent ?")) return;
    try {
      await api.delete(`/referents/${id}`);
      toast.success("Référent supprimé avec succès");
      fetchReferents();
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la suppression");
    }
  };

  useEffect(() => {
    fetchReferents();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4 text-indigo-700">Gestion des Référents</h2>

      <FormReferent onSuccess={fetchReferents} />

      {loading ? (
        <p>Chargement...</p>
      ) : referents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {referents.map((ref) => (
            <Card key={ref.id} className="relative">
              <CardContent className="p-4 space-y-2 text-center">
                <img
                  src={ref.logo || "/logos/default-logo.png"}
                  alt={ref.nom}
                  className="h-16 object-contain mx-auto"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/logos/default-logo.png";
                  }}
                />
                <h3 className="text-lg font-semibold text-indigo-700">{ref.nom}</h3>
                <p className="text-sm text-gray-600">{ref.resume}</p>
                <p className="text-sm text-gray-500">{ref.description}</p>

                <button
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                  onClick={() => supprimerReferent(ref.id)}
                  title="Supprimer"
                >
                  <Trash2 size={18} />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p>Aucun référent enregistré.</p>
      )}
    </div>
  );
}
