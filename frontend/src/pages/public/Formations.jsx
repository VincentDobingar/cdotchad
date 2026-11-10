// src/pages/public/Formations.jsx
// Catalogue public des formations en ligne (sessions datées, places limitées).
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Clock, GraduationCap, MonitorPlay, Search, Users } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import api from "@/utils/api";
import { dateFr, fcfa } from "@/utils/formation";

export default function Formations() {
  const [formations, setFormations] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [recherche, setRecherche] = useState("");

  useEffect(() => {
    api
      .get("/formations")
      .then(({ data }) => setFormations(data?.formations || []))
      .catch(() => setErreur("Impossible de charger le catalogue pour le moment."))
      .finally(() => setChargement(false));
  }, []);

  const visibles = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return formations;
    return formations.filter((f) => [f.titre, f.resume, f.formateur_nom].some((v) => (v || "").toLowerCase().includes(q)));
  }, [formations, recherche]);

  return (
    <div className="bg-ivoire min-h-screen">
      <PageHero
        label="Formations en ligne"
        title="Se former en direct, avec nos experts"
        intro="Classes virtuelles en direct, replays réservés aux participants, évaluations et certificat vérifiable en ligne."
      >
        <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/80">
          <li className="flex items-center gap-2"><MonitorPlay className="w-4 h-4 text-rouge" /> Sessions en direct</li>
          <li className="flex items-center gap-2"><Clock className="w-4 h-4 text-rouge" /> Replays pour réviser</li>
          <li className="flex items-center gap-2"><GraduationCap className="w-4 h-4 text-rouge" /> Certificat avec QR code</li>
        </ul>
      </PageHero>

      <section className="max-w-6xl mx-auto px-6 py-14">
        <div className="relative max-w-md mb-10">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-graphite/50" />
          <input
            type="search"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher une formation"
            className="w-full rounded-xl border border-sablefonce bg-white pl-10 pr-4 py-3 text-sm focus:border-rouge focus:ring-rouge"
          />
        </div>

        {chargement && <p className="text-graphite/70">Chargement…</p>}
        {erreur && <p className="text-rougeprofond">{erreur}</p>}
        {!chargement && !erreur && visibles.length === 0 && (
          <div className="bg-white rounded-2xl border border-sable p-10 text-center">
            <GraduationCap className="w-10 h-10 mx-auto text-graphite/40" />
            <p className="mt-3 font-medium text-encre">
              {formations.length ? "Aucune formation ne correspond à votre recherche." : "Les prochaines formations seront bientôt annoncées."}
            </p>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visibles.map((f) => {
            const prochaine = f.sessions?.[0];
            return (
              <Link
                key={f.id}
                to={`/formations/${f.slug}`}
                className="group flex flex-col bg-white rounded-2xl border border-sable shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                <div className="aspect-[16/9] bg-encre relative overflow-hidden">
                  {f.image_url ? (
                    <img src={f.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-rouge/30 blur-2xl" />
                      <GraduationCap className="w-12 h-12 text-white/70" />
                    </div>
                  )}
                </div>
                <div className="flex-1 flex flex-col p-6">
                  <h2 className="font-display text-xl text-encre leading-snug">{f.titre}</h2>
                  {f.resume && <p className="mt-2 text-sm text-graphite line-clamp-3">{f.resume}</p>}
                  <div className="mt-auto pt-5 space-y-1.5 text-sm text-graphite/80">
                    {f.formateur_nom && <p className="flex items-center gap-2"><Users className="w-4 h-4" /> {f.formateur_nom}</p>}
                    {f.duree_heures && <p className="flex items-center gap-2"><Clock className="w-4 h-4" /> {Number(f.duree_heures)} heures</p>}
                    {prochaine ? (
                      <p className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4" />
                        {prochaine.date_debut ? `Dès le ${dateFr(prochaine.date_debut)}` : prochaine.intitule}
                        <span className="ml-auto font-semibold text-encre">{fcfa(prochaine.tarif_fcfa)}</span>
                      </p>
                    ) : (
                      <p className="flex items-center gap-2 text-graphite/60"><CalendarDays className="w-4 h-4" /> Prochaine session à venir</p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <p className="mt-14 text-sm text-graphite/70">
          Vous avez reçu un certificat ?{" "}
          <Link to="/certificats/verifier" className="text-rouge font-semibold hover:underline underline-offset-4">
            Vérifier son authenticité
          </Link>
        </p>
      </section>
    </div>
  );
}
