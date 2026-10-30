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
    let actif = true;
    const charger = () => {
      api
        .get("/candidatures/mes-candidatures")
        .then((res) => { if (actif) setCandidatures(res.data?.candidatures || []); })
        .catch(() => { if (actif) setError("Impossible de charger vos candidatures."); })
        .finally(() => { if (actif) setLoading(false); });
    };
    charger();
    // Rafraîchissement : le statut peut changer côté administration sans action de l'utilisateur.
    const intervalle = setInterval(charger, 30000);
    const auRetour = () => { if (document.visibilityState === "visible") charger(); };
    document.addEventListener("visibilitychange", auRetour);
    return () => {
      actif = false;
      clearInterval(intervalle);
      document.removeEventListener("visibilitychange", auRetour);
    };
  }, []);

  if (loading) return <p className="text-graphite/70">Chargement…</p>;
  if (error) return <p className="text-rougeprofond">{error}</p>;

  if (candidatures.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-sable p-10 text-center shadow-sm">
        <Briefcase className="w-10 h-10 mx-auto text-graphite/40" />
        <p className="mt-3 font-medium text-encre">Vous n'avez encore soumis aucune candidature.</p>
        <Link to="/offres" className="mt-4 inline-block text-sm text-rouge font-semibold hover:text-rougeprofond hover:underline underline-offset-4">
          Découvrir les offres
        </Link>
      </div>
    );
  }

  return (
    <ul className="grid gap-4">
      {candidatures.map((c) => (
        <li key={c.id}>
          <Link
            to={`/mes-candidatures/${c.id}`}
            className="block bg-white rounded-2xl border border-sable shadow-sm p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-display text-lg text-encre truncate">{c.titre_offre || "Offre supprimée"}</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-graphite/70">
                  <CalendarDays className="w-3.5 h-3.5" />
                  Candidature du {new Date(c.date_candidature).toLocaleDateString("fr-FR")}
                </p>
                {c.code_suivi && (
                  <p className="mt-1 text-xs text-graphite/60">
                    Code de suivi : <span className="font-mono text-encre">{c.code_suivi}</span>
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    STATUTS[c.statut]?.className || "bg-sable text-encre"
                  }`}
                >
                  {statutLabel(c.statut)}
                </span>
                <span className="text-sm text-rouge font-semibold hover:text-rougeprofond hover:underline underline-offset-4">Voir le détail →</span>
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
