// src/pages/public/FormationDetail.jsx
// Fiche d'une formation : programme, sessions datées, places restantes, inscription.
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, CalendarDays, CheckCircle2, Clock, GraduationCap, Users, Video } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import api from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import { dateFr, dateHeureFr, duree, fcfa, messageErreur, STATUT_INSCRIPTION } from "@/utils/formation";

function Bloc({ titre, children }) {
  if (!children) return null;
  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl text-encre">{titre}</h2>
      <div className="mt-3 text-graphite leading-relaxed whitespace-pre-line">{children}</div>
    </section>
  );
}

export default function FormationDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { status, user } = useAuth();
  const [donnees, setDonnees] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [choix, setChoix] = useState(null); // session en cours d'inscription
  const [consentement, setConsentement] = useState(false);
  const [envoi, setEnvoi] = useState(false);

  const charger = useCallback(() => {
    api
      .get(`/formations/fiche/${encodeURIComponent(slug)}`)
      .then(({ data }) => setDonnees(data))
      .catch((err) => setErreur(err?.response?.status === 404 ? "Formation introuvable." : "Impossible de charger cette formation."));
  }, [slug]);

  useEffect(() => {
    if (status !== "checking") charger();
  }, [charger, status]);

  const participant = ["candidat", "partenaire"].includes(user?.role);

  const demarrerInscription = (session) => {
    if (status !== "authenticated") {
      navigate(`/login?next=${encodeURIComponent(`/formations/${slug}`)}`);
      return;
    }
    if (!participant) {
      toast.error("Connectez-vous avec un compte candidat ou partenaire pour vous inscrire.");
      return;
    }
    setConsentement(false);
    setChoix(session);
  };

  const confirmer = async () => {
    setEnvoi(true);
    try {
      const { data } = await api.post(`/formations/sessions/${choix.id}/inscription`, { consentement });
      toast.success(data?.message || "Inscription enregistrée.");
      setChoix(null);
      navigate(`/mes-formations/${data.inscription.id}`);
    } catch (err) {
      toast.error(messageErreur(err, "Inscription impossible."));
    } finally {
      setEnvoi(false);
    }
  };

  if (erreur) {
    return (
      <div className="min-h-screen bg-ivoire pt-32 px-6 text-center">
        <p className="text-encre font-medium">{erreur}</p>
        <Link to="/formations" className="mt-4 inline-block text-rouge font-semibold hover:underline">Voir toutes les formations</Link>
      </div>
    );
  }
  if (!donnees) return <div className="min-h-screen bg-ivoire pt-32 px-6 text-graphite/70">Chargement…</div>;

  const { formation: f, sessions } = donnees;

  return (
    <div className="bg-ivoire min-h-screen">
      <PageHero label="Formation en ligne" title={f.titre} intro={f.resume}>
        <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/80">
          {f.formateur_nom && <li className="flex items-center gap-2"><Users className="w-4 h-4 text-rouge" /> {f.formateur_nom}</li>}
          {f.duree_heures && <li className="flex items-center gap-2"><Clock className="w-4 h-4 text-rouge" /> {Number(f.duree_heures)} heures</li>}
          <li className="flex items-center gap-2"><Video className="w-4 h-4 text-rouge" /> En direct et en replay</li>
          <li className="flex items-center gap-2"><GraduationCap className="w-4 h-4 text-rouge" /> Certificat vérifiable</li>
        </ul>
      </PageHero>

      <div className="max-w-6xl mx-auto px-6 py-12 grid gap-12 lg:grid-cols-[1fr_380px]">
        <article>
          <Link to="/formations" className="inline-flex items-center gap-1.5 text-sm text-graphite hover:text-rouge">
            <ArrowLeft className="w-4 h-4" /> Toutes les formations
          </Link>
          {f.statut !== "publiee" && (
            <p className="mt-4 rounded-lg bg-amber-100 text-amber-900 px-4 py-2 text-sm">Aperçu administrateur : cette formation n'est pas publiée.</p>
          )}
          <Bloc titre="Présentation">{f.description}</Bloc>
          <Bloc titre="Objectifs">{f.objectifs}</Bloc>
          <Bloc titre="Public concerné">{f.public_cible}</Bloc>
          <Bloc titre="Prérequis">{f.prerequis}</Bloc>
          <section className="mt-10 rounded-2xl bg-white border border-sable p-6">
            <h2 className="font-display text-xl text-encre">Comment ça se passe</h2>
            <ul className="mt-4 space-y-3 text-sm text-graphite">
              {[
                "Les séances ont lieu en direct dans une classe virtuelle : un simple navigateur suffit, ordinateur ou téléphone.",
                "Pour les connexions modestes, la classe fonctionne « audio d'abord » : votre caméra reste coupée.",
                "Chaque séance est enregistrée ; le replay n'est accessible qu'aux participants, depuis leur espace.",
                "Le certificat est délivré à l'issue de la formation selon la présence et les résultats aux évaluations.",
              ].map((t) => (
                <li key={t} className="flex gap-2.5"><CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-rouge" />{t}</li>
              ))}
            </ul>
          </section>
        </article>

        <aside className="lg:sticky lg:top-28 self-start space-y-4">
          <h2 className="font-display text-2xl text-encre">Sessions</h2>
          {sessions.length === 0 && <p className="text-sm text-graphite/70">Aucune session programmée pour le moment.</p>}
          {sessions.map((s) => {
            const inscrit = s.mon_inscription && ["validee", "en_attente"].includes(s.mon_inscription.statut);
            const complet = s.places_restantes === 0;
            return (
              <div key={s.id} className="bg-white rounded-2xl border border-sable shadow-sm p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold text-encre">{s.intitule}</p>
                  <span className="text-sm font-semibold text-rouge whitespace-nowrap">{fcfa(s.tarif_fcfa)}</span>
                </div>
                {(s.date_debut || s.date_fin) && (
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-graphite/80">
                    <CalendarDays className="w-4 h-4" />
                    {s.date_debut && s.date_fin && s.date_debut !== s.date_fin
                      ? `Du ${dateFr(s.date_debut)} au ${dateFr(s.date_fin)}`
                      : dateFr(s.date_debut || s.date_fin)}
                  </p>
                )}
                {s.seances.length > 0 && (
                  <ul className="mt-3 space-y-1 text-xs text-graphite/80 border-t border-sable pt-3">
                    {s.seances.map((se, i) => (
                      <li key={i} className="flex justify-between gap-2">
                        <span className="truncate">{se.titre}</span>
                        <span className="whitespace-nowrap">{dateHeureFr(se.debut)} · {duree(se.duree_minutes)}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-3 text-xs text-graphite/70">
                  {s.places_restantes == null ? "Places illimitées" : complet ? "Session complète" : `${s.places_restantes} place${s.places_restantes > 1 ? "s" : ""} restante${s.places_restantes > 1 ? "s" : ""}`}
                  {" · "}Certificat : {s.seuil_presence} % de présence{s.seuil_note ? `, note ≥ ${s.seuil_note} %` : ""}
                </p>
                {inscrit ? (
                  <Link
                    to={`/mes-formations/${s.mon_inscription.id}`}
                    className="mt-4 block text-center rounded-xl border border-encre text-encre px-4 py-2.5 text-sm font-semibold hover:bg-encre hover:text-white transition"
                  >
                    {STATUT_INSCRIPTION[s.mon_inscription.statut]?.label} — ouvrir mon espace
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled={s.statut !== "ouverte" || complet}
                    onClick={() => demarrerInscription(s)}
                    className="mt-4 w-full rounded-xl bg-rouge text-white px-4 py-2.5 text-sm font-semibold hover:bg-rougeprofond disabled:bg-sablefonce disabled:text-graphite/60 transition"
                  >
                    {s.statut !== "ouverte" ? "Inscriptions fermées" : complet ? "Complet" : "S'inscrire"}
                  </button>
                )}
              </div>
            );
          })}
        </aside>
      </div>

      {choix && (
        <div className="fixed inset-0 z-[60] bg-encre/60 flex items-end sm:items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6">
            <h2 className="font-display text-2xl text-encre">Confirmer l'inscription</h2>
            <p className="mt-2 text-sm text-graphite">
              {f.titre} — {choix.intitule} · <strong>{fcfa(choix.tarif_fcfa)}</strong>
            </p>
            {choix.tarif_fcfa > 0 && (
              <p className="mt-3 text-sm bg-sable rounded-lg px-3 py-2 text-encre">
                Formation payante : votre inscription sera validée à réception du paiement. Les modalités vous seront communiquées par l'équipe CDO.
              </p>
            )}
            {choix.tarif_fcfa === 0 && choix.mode_inscription === "manuelle" && (
              <p className="mt-3 text-sm bg-sable rounded-lg px-3 py-2 text-encre">Les inscriptions à cette session sont validées par l'administration.</p>
            )}
            <label className="mt-5 flex gap-3 text-sm text-graphite">
              <input type="checkbox" checked={consentement} onChange={(e) => setConsentement(e.target.checked)} className="mt-0.5 rounded text-rouge focus:ring-rouge" />
              <span>
                J'accepte que les séances soient enregistrées. Les replays sont réservés aux participants de la session, chaque accès est journalisé
                {choix.replay_telechargeable ? "" : " et la lecture se fait en ligne uniquement"}.
              </span>
            </label>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setChoix(null)} className="px-4 py-2.5 rounded-xl text-sm font-medium text-graphite hover:bg-sable">
                Annuler
              </button>
              <button
                type="button"
                disabled={!consentement || envoi}
                onClick={confirmer}
                className="px-5 py-2.5 rounded-xl bg-rouge text-white text-sm font-semibold hover:bg-rougeprofond disabled:opacity-50"
              >
                {envoi ? "Envoi…" : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
