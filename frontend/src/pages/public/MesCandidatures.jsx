// src/pages/public/MesCandidatures.jsx
// Suivi des candidatures du candidat connecté, dans la coque de l'espace candidat.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, CalendarDays } from "lucide-react";
import api from "@/utils/api";
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

  if (loading) return <p className="text-slate-500">Chargement…</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  if (candidatures.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-sm">
        <Briefcase className="w-10 h-10 mx-auto text-slate-300" />
        <p className="mt-3 font-medium">Vous n'avez encore soumis aucune candidature.</p>
        <Link to="/offres" className="mt-4 inline-block text-sm text-red-700 font-medium hover:underline">
          Découvrir les offres
        </Link>
      </div>
    );
  }

  return (
    <ul className="grid gap-4">
      {candidatures.map((c) => (
        <li
          key={c.id}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-wrap items-center justify-between gap-4"
        >
          <div className="min-w-0">
            <p className="font-semibold truncate">{c.titre_offre || "Offre supprimée"}</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
              <CalendarDays className="w-3.5 h-3.5" />
              Candidature du {new Date(c.date_candidature).toLocaleDateString("fr-FR")}
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              STATUTS[c.statut]?.className || "bg-slate-100 text-slate-700"
            }`}
          >
            {statutLabel(c.statut)}
          </span>
        </li>
      ))}
    </ul>
  );
}
