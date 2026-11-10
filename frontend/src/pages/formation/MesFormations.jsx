// src/pages/formation/MesFormations.jsx
// Liste des formations du participant connecté (dans la coque de l'espace connecté).
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Award, CalendarClock, GraduationCap } from "lucide-react";
import api from "@/utils/api";
import { dateFr, dateHeureFr, STATUT_INSCRIPTION } from "@/utils/formation";

export default function MesFormations() {
  const [liste, setListe] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    api
      .get("/formations/espace")
      .then(({ data }) => setListe(data?.inscriptions || []))
      .catch(() => setErreur("Impossible de charger vos formations."))
      .finally(() => setChargement(false));
  }, []);

  if (chargement) return <p className="text-graphite/70">Chargement…</p>;
  if (erreur) return <p className="text-rougeprofond">{erreur}</p>;

  if (liste.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-sable p-10 text-center shadow-sm">
        <GraduationCap className="w-10 h-10 mx-auto text-graphite/40" />
        <p className="mt-3 font-medium text-encre">Vous n'êtes inscrit(e) à aucune formation.</p>
        <Link to="/formations" className="mt-4 inline-block text-sm text-rouge font-semibold hover:text-rougeprofond hover:underline underline-offset-4">
          Découvrir le catalogue
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-display text-2xl text-encre mb-5">Mes formations</h2>
      <ul className="grid gap-4">
        {liste.map((i) => (
          <li key={i.id}>
            <Link
              to={`/mes-formations/${i.id}`}
              className="block bg-white rounded-2xl border border-sable shadow-sm p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-display text-lg text-encre truncate">{i.titre}</p>
                  <p className="mt-0.5 text-sm text-graphite/80">
                    {i.intitule}
                    {i.date_debut ? ` · dès le ${dateFr(i.date_debut)}` : ""}
                  </p>
                  {i.prochaine_seance && i.statut === "validee" && (
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-rouge font-medium">
                      <CalendarClock className="w-4 h-4" /> Prochaine séance : {dateHeureFr(i.prochaine_seance)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {i.certificat_id && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-encre text-white">
                      <Award className="w-3.5 h-3.5" /> Certificat
                    </span>
                  )}
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUT_INSCRIPTION[i.statut]?.className || "bg-sable"}`}>
                    {STATUT_INSCRIPTION[i.statut]?.label || i.statut}
                  </span>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
