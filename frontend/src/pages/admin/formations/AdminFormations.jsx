// src/pages/admin/formations/AdminFormations.jsx
// Tableau de bord de la plateforme de formation et liste des formations.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarClock, Plus } from "lucide-react";
import api from "@/utils/api";
import { dateHeureFr, pct } from "@/utils/formation";
import { STATUT_INSCRIPTION } from "@/utils/formation";
import { Badge, Carte, Chiffre, STATUT_FORMATION } from "@/components/formation/AdminUi";

export default function AdminFormations() {
  const [tdb, setTdb] = useState(null);
  const [formations, setFormations] = useState([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/admin/formations/tableau-de-bord"), api.get("/admin/formations")])
      .then(([a, b]) => {
        setTdb(a.data);
        setFormations(b.data?.formations || []);
      })
      .catch(() => {})
      .finally(() => setChargement(false));
  }, []);

  const c = tdb?.chiffres || {};

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Formations en ligne</h1>
          <p className="text-gray-600 mt-2">Catalogue, sessions en direct, replays, évaluations et certificats.</p>
        </div>
        <Link to="/admin/formations/nouvelle" className="inline-flex items-center justify-center gap-2 bg-red-600 text-white px-5 py-3 rounded-xl hover:bg-red-700 font-medium">
          <Plus className="w-4 h-4" /> Nouvelle formation
        </Link>
      </div>

      {chargement ? (
        <p className="text-gray-500">Chargement…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
            <Chiffre label="Formations publiées" valeur={c.formations_publiees} />
            <Chiffre label="Sessions ouvertes" valeur={c.sessions_ouvertes} />
            <Chiffre label="Participants inscrits" valeur={c.inscrits} />
            <Chiffre label="À valider" valeur={c.en_attente} />
            <Chiffre label="Présence moyenne" valeur={pct(c.presence_moyenne)} />
            <Chiffre label="Note moyenne" valeur={pct(c.note_moyenne)} />
            <Chiffre label="Devoirs à corriger" valeur={c.devoirs_a_corriger} />
            <Chiffre label="Certificats délivrés" valeur={c.certificats} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Carte titre="Prochaines séances">
              {tdb?.prochaines_seances?.length ? (
                <ul className="divide-y">
                  {tdb.prochaines_seances.map((s) => (
                    <li key={s.id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <Link to={`/admin/formations/sessions/${s.session_id}`} className="font-medium text-gray-900 hover:text-red-700 truncate block">
                          {s.titre}
                        </Link>
                        <p className="text-gray-500 truncate">{s.formation_titre} · {s.intitule} · {s.inscrits} inscrit(s)</p>
                      </div>
                      <span className="flex items-center gap-1.5 text-gray-700 whitespace-nowrap">
                        <CalendarClock className="w-4 h-4" /> {dateHeureFr(s.debut)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">Aucune séance programmée.</p>
              )}
            </Carte>
            <Carte titre="Dernières inscriptions">
              {tdb?.dernieres_inscriptions?.length ? (
                <ul className="divide-y">
                  {tdb.dernieres_inscriptions.map((i) => (
                    <li key={i.id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{[i.prenom, i.nom].filter(Boolean).join(" ") || i.email}</p>
                        <Link to={`/admin/formations/sessions/${i.session_id}`} className="text-gray-500 hover:text-red-700 truncate block">
                          {i.formation_titre} · {i.intitule}
                        </Link>
                      </div>
                      <Badge className={STATUT_INSCRIPTION[i.statut]?.className}>{STATUT_INSCRIPTION[i.statut]?.label}</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">Aucune inscription pour le moment.</p>
              )}
            </Carte>
          </div>

          <Carte titre="Catalogue">
            {formations.length === 0 ? (
              <p className="text-sm text-gray-500">Aucune formation. Commencez par en créer une.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      <th className="py-2 pr-4 font-medium">Formation</th>
                      <th className="py-2 pr-4 font-medium">Statut</th>
                      <th className="py-2 pr-4 font-medium">Sessions</th>
                      <th className="py-2 pr-4 font-medium">Inscrits</th>
                      <th className="py-2 pr-4 font-medium">À valider</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {formations.map((f) => (
                      <tr key={f.id}>
                        <td className="py-3 pr-4">
                          <Link to={`/admin/formations/${f.id}`} className="font-medium text-gray-900 hover:text-red-700">{f.titre}</Link>
                          {f.formateur_nom && <p className="text-xs text-gray-500">{f.formateur_nom}</p>}
                        </td>
                        <td className="py-3 pr-4"><Badge className={STATUT_FORMATION[f.statut]?.className}>{STATUT_FORMATION[f.statut]?.label}</Badge></td>
                        <td className="py-3 pr-4">{f.nb_sessions}</td>
                        <td className="py-3 pr-4">{f.nb_inscrits}</td>
                        <td className="py-3 pr-4">{f.nb_en_attente > 0 ? <Badge className="bg-amber-100 text-amber-800">{f.nb_en_attente}</Badge> : 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Carte>
        </>
      )}
    </div>
  );
}
