// src/pages/public/MesCandidatures.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/utils/api";
import NotificationsCloche from "@/components/NotificationsCloche";
import { STATUTS, statutLabel } from "@/utils/statutCandidature";

export default function MesCandidatures() {
  const [candidatures, setCandidatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get("/candidatures/mes-candidatures")
      .then((res) => setCandidatures(res.data?.candidatures || []))
      .catch(() => setError("Impossible de charger vos candidatures."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pt-20">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-red-600">Mes candidatures</h2>
        <NotificationsCloche />
      </div>
      <p className="mb-4 text-sm">
        <Link to="/profile" className="text-blue-600 hover:underline">
          Modifier mon profil
        </Link>
      </p>

      {loading && <p>Chargement…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && candidatures.length === 0 && (
        <p>Vous n'avez encore soumis aucune candidature.</p>
      )}

      {!loading && !error && candidatures.length > 0 && (
        <table className="min-w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-2 px-4 text-left">Offre</th>
              <th className="py-2 px-4 text-left">Date</th>
              <th className="py-2 px-4 text-left">Statut</th>
            </tr>
          </thead>
          <tbody>
            {candidatures.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="py-2 px-4">{c.titre_offre || "Offre supprimée"}</td>
                <td className="py-2 px-4">
                  {new Date(c.date_candidature).toLocaleDateString()}
                </td>
                <td className="py-2 px-4">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      STATUTS[c.statut]?.className || "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {statutLabel(c.statut)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
