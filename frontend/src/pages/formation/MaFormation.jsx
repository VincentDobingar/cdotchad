// src/pages/formation/MaFormation.jsx
// Espace d'une session pour le participant : séances en direct, replays, supports,
// évaluations, résultats et certificat.
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft, Award, CheckCircle2, ClipboardList, Download, FileText, MonitorPlay, PlayCircle, Video, X,
} from "lucide-react";
import api from "@/utils/api";
import { useAuth } from "@/context/AuthContext";
import {
  dateFr, dateHeureFr, duree, fcfa, messageErreur, ouvrirLien, pct, STATUT_INSCRIPTION, STATUT_SEANCE, taille,
} from "@/utils/formation";

const ONGLETS = [
  { id: "seances", label: "Séances", icon: MonitorPlay },
  { id: "replays", label: "Replays", icon: PlayCircle },
  { id: "supports", label: "Supports", icon: FileText },
  { id: "evaluations", label: "Évaluations", icon: ClipboardList },
  { id: "resultats", label: "Résultats", icon: Award },
];

const carte = "bg-white rounded-2xl border border-sable shadow-sm";

function Vide({ children }) {
  return <p className={`${carte} p-8 text-center text-sm text-graphite/70`}>{children}</p>;
}

/** Lecteur des replays : lien temporaire, filigrane nominatif, suivi du visionnage. */
function LecteurReplay({ replay, onFermer, nom, telechargeable }) {
  const [url, setUrl] = useState(null);
  const [erreur, setErreur] = useState(null);
  const video = useRef(null);
  const dernierEnvoi = useRef(0);

  useEffect(() => {
    api
      .get(`/formations/espace/replays/${replay.id}/lien`)
      .then(({ data }) => setUrl(data.url))
      .catch((err) => setErreur(messageErreur(err, "Replay indisponible.")));
  }, [replay.id]);

  const envoyer = useCallback(
    (termine = false) => {
      const v = video.current;
      if (!v) return;
      const secondes = Math.floor(v.currentTime);
      api.post(`/formations/espace/replays/${replay.id}/progression`, { secondes, termine }).catch(() => {});
    },
    [replay.id]
  );

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-3" role="dialog" aria-modal="true">
      <div className="w-full max-w-5xl">
        <div className="flex items-center justify-between text-white mb-2">
          <p className="font-medium truncate">{replay.titre || replay.seance_titre}</p>
          <button type="button" onClick={() => { envoyer(); onFermer(); }} className="p-2 rounded-full hover:bg-white/10" aria-label="Fermer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="relative bg-black rounded-xl overflow-hidden aspect-video" onContextMenu={(e) => e.preventDefault()}>
          {erreur && <p className="absolute inset-0 flex items-center justify-center text-white/80 text-sm px-6 text-center">{erreur}</p>}
          {url && (
            <video
              ref={video}
              src={url}
              controls
              autoPlay
              playsInline
              controlsList={telechargeable ? undefined : "nodownload"}
              className="w-full h-full"
              onTimeUpdate={() => {
                if (Date.now() - dernierEnvoi.current > 30000) {
                  dernierEnvoi.current = Date.now();
                  envoyer();
                }
              }}
              onPause={() => envoyer()}
              onEnded={() => envoyer(true)}
            />
          )}
          {/* Filigrane nominatif : décourage la diffusion d'une capture d'écran */}
          <span className="pointer-events-none select-none absolute top-3 right-4 text-[11px] text-white/35">{nom}</span>
          <span className="pointer-events-none select-none absolute bottom-14 left-4 text-[11px] text-white/25">{nom}</span>
        </div>
        <p className="mt-2 text-xs text-white/60">Replay réservé aux participants. Chaque lecture est enregistrée.</p>
      </div>
    </div>
  );
}

export default function MaFormation() {
  const { id } = useParams();
  const { user } = useAuth();
  const [d, setD] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [onglet, setOnglet] = useState("seances");
  const [replay, setReplay] = useState(null);
  const [entree, setEntree] = useState(null);

  const charger = useCallback(() => {
    api
      .get(`/formations/espace/inscriptions/${id}`)
      .then(({ data }) => setD(data))
      .catch((err) => setErreur(messageErreur(err, "Impossible de charger cette formation.")));
  }, [id]);

  useEffect(() => {
    charger();
    const t = setInterval(charger, 60000); // l'état « en direct » change avec l'heure
    return () => clearInterval(t);
  }, [charger]);

  const rejoindre = async (seance) => {
    // Fenêtre ouverte tout de suite (sinon bloquée par le navigateur), remplie ensuite
    const fenetre = window.open("", "_blank");
    setEntree(seance.id);
    try {
      const { data } = await api.post(`/formations/espace/seances/${seance.id}/rejoindre`);
      if (fenetre) fenetre.location.href = data.url;
      else window.location.assign(data.url);
    } catch (err) {
      fenetre?.close();
      toast.error(messageErreur(err, "Impossible d'ouvrir la salle."));
    } finally {
      setEntree(null);
    }
  };

  const telecharger = async (chemin, options) => {
    try {
      await ouvrirLien(chemin, options);
    } catch (err) {
      toast.error(messageErreur(err, "Fichier indisponible."));
    }
  };

  if (erreur) return <p className="text-rougeprofond">{erreur}</p>;
  if (!d) return <p className="text-graphite/70">Chargement…</p>;

  const { inscription, formation, session } = d;
  const nom = [user?.prenom, user?.nom].filter(Boolean).join(" ") || user?.email;

  return (
    <div>
      <Link to="/mes-formations" className="inline-flex items-center gap-1.5 text-sm text-graphite hover:text-rouge">
        <ArrowLeft className="w-4 h-4" /> Mes formations
      </Link>

      <div className={`${carte} mt-4 p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl text-encre">{formation.titre}</h2>
            <p className="mt-1 text-sm text-graphite/80">
              {session.intitule}
              {session.date_debut ? ` · du ${dateFr(session.date_debut)}` : ""}
              {session.date_fin ? ` au ${dateFr(session.date_fin)}` : ""}
              {formation.formateur_nom ? ` · ${formation.formateur_nom}` : ""}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUT_INSCRIPTION[inscription.statut]?.className}`}>
            {STATUT_INSCRIPTION[inscription.statut]?.label}
          </span>
        </div>
        {inscription.statut === "en_attente" && (
          <p className="mt-4 text-sm bg-sable rounded-lg px-4 py-3 text-encre">
            {inscription.paiement_statut === "en_attente"
              ? `Votre inscription sera validée à réception du paiement (${fcfa(session.tarif_fcfa)}). Vous recevrez une notification dès sa validation.`
              : "Votre inscription est en cours de validation par l'équipe CDO. Vous recevrez une notification."}
          </p>
        )}
      </div>

      {inscription.statut === "validee" && (
        <>
          <nav className="mt-6 flex gap-1 overflow-x-auto border-b border-sable">
            {ONGLETS.map(({ id: o, label, icon: Icone }) => (
              <button
                key={o}
                type="button"
                onClick={() => setOnglet(o)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition ${
                  onglet === o ? "border-rouge text-rouge" : "border-transparent text-graphite hover:text-encre"
                }`}
              >
                <Icone className="w-4 h-4" /> {label}
              </button>
            ))}
          </nav>

          <div className="mt-6">
            {onglet === "seances" && (
              d.seances.length === 0 ? <Vide>Le programme des séances sera publié prochainement.</Vide> : (
                <ul className="grid gap-3">
                  {d.seances.map((s) => {
                    const etat = STATUT_SEANCE[s.etat];
                    return (
                      <li key={s.id} className={`${carte} p-5 flex flex-wrap items-center justify-between gap-4`}>
                        <div className="min-w-0">
                          <p className="font-semibold text-encre">{s.titre}</p>
                          <p className="mt-0.5 text-sm text-graphite/80">{dateHeureFr(s.debut)} · {duree(s.duree_minutes)}</p>
                          {s.premiere_arrivee && (
                            <p className="mt-1 text-xs text-green-700 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Présence enregistrée
                              {s.duree_secondes > 0 ? ` (${duree(Math.round(s.duree_secondes / 60))})` : ""}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${etat?.className}`}>{etat?.label}</span>
                          {s.etat === "ouverte" && (
                            <button
                              type="button"
                              onClick={() => rejoindre(s)}
                              disabled={entree === s.id}
                              className="inline-flex items-center gap-2 rounded-xl bg-rouge text-white px-4 py-2 text-sm font-semibold hover:bg-rougeprofond disabled:opacity-60"
                            >
                              <Video className="w-4 h-4" /> {entree === s.id ? "Ouverture…" : "Rejoindre"}
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )
            )}
            {onglet === "seances" && d.seances.length > 0 && (
              <p className="mt-4 text-xs text-graphite/70">
                La salle ouvre 30 minutes avant chaque séance. Conseil : connexion stable, écouteurs, et caméra coupée si votre réseau est faible.
              </p>
            )}

            {onglet === "replays" && (
              d.replays.length === 0 ? <Vide>Les replays apparaissent ici quelques minutes à une heure après chaque séance.</Vide> : (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {d.replays.map((r) => (
                    <li key={r.id} className={`${carte} p-5`}>
                      <p className="font-semibold text-encre">{r.titre || r.seance_titre}</p>
                      <p className="mt-0.5 text-sm text-graphite/80">
                        {r.duree_secondes ? duree(Math.round(r.duree_secondes / 60)) : ""}
                        {r.expire_le ? ` · disponible jusqu'au ${dateFr(r.expire_le)}` : ""}
                      </p>
                      {r.termine && <p className="mt-1 text-xs text-green-700">Vu en entier</p>}
                      <div className="mt-4 flex gap-2">
                        <button type="button" onClick={() => setReplay(r)} className="inline-flex items-center gap-2 rounded-xl bg-encre text-white px-4 py-2 text-sm font-semibold hover:bg-graphite">
                          <PlayCircle className="w-4 h-4" /> Regarder
                        </button>
                        {session.replay_telechargeable && (
                          <button type="button" onClick={() => telecharger(`/formations/espace/replays/${r.id}/lien`, { telecharger: true })} className="inline-flex items-center gap-2 rounded-xl border border-sablefonce px-4 py-2 text-sm font-medium text-encre hover:bg-sable">
                            <Download className="w-4 h-4" /> Télécharger
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )
            )}

            {onglet === "supports" && (
              d.supports.length === 0 ? <Vide>Aucun support de cours pour le moment.</Vide> : (
                <ul className={`${carte} divide-y divide-sable`}>
                  {d.supports.map((s) => (
                    <li key={s.id} className="p-4 flex items-center justify-between gap-4">
                      <div className="min-w-0 flex items-center gap-3">
                        <FileText className="w-5 h-5 text-rouge shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-encre truncate">{s.titre}</p>
                          <p className="text-xs text-graphite/70">{s.nom_original} · {taille(s.taille_octets)}</p>
                        </div>
                      </div>
                      <button type="button" onClick={() => telecharger(`/formations/espace/supports/${s.id}/lien`, { telecharger: true })} className="inline-flex items-center gap-1.5 text-sm font-semibold text-rouge hover:underline">
                        <Download className="w-4 h-4" /> Télécharger
                      </button>
                    </li>
                  ))}
                </ul>
              )
            )}

            {onglet === "evaluations" && (
              d.evaluations.length === 0 ? <Vide>Aucune évaluation publiée pour le moment.</Vide> : (
                <ul className="grid gap-3">
                  {d.evaluations.map((e) => (
                    <li key={e.id} className={`${carte} p-5 flex flex-wrap items-center justify-between gap-4`}>
                      <div>
                        <p className="font-semibold text-encre">{e.titre}</p>
                        <p className="mt-0.5 text-sm text-graphite/80">
                          {e.type === "quiz" ? `Quiz · ${e.nb_questions} question${e.nb_questions > 1 ? "s" : ""}` : "Devoir à déposer"}
                          {` · ${e.essais_utilises}/${e.essais_max} essai${e.essais_max > 1 ? "s" : ""}`}
                          {e.date_limite ? ` · avant le ${dateHeureFr(e.date_limite)}` : ""}
                        </p>
                        {e.meilleure_note != null && <p className="mt-1 text-sm text-encre">Meilleure note : <strong>{pct(e.meilleure_note)}</strong></p>}
                        {e.en_correction && e.meilleure_note == null && <p className="mt-1 text-sm text-amber-700">Copie en cours de correction</p>}
                      </div>
                      <Link to={`/mes-formations/${inscription.id}/evaluations/${e.id}`} className="rounded-xl bg-encre text-white px-4 py-2 text-sm font-semibold hover:bg-graphite">
                        {e.essais_utilises < e.essais_max ? (e.essais_utilises ? "Nouvel essai" : "Commencer") : "Voir la correction"}
                      </Link>
                    </li>
                  ))}
                </ul>
              )
            )}

            {onglet === "resultats" && (
              <div className={`${carte} p-6`}>
                <p className="text-sm text-graphite">
                  Certificat délivré avec au moins <strong>{session.seuil_presence} % de présence</strong>
                  {session.regle_absence === "presence_ou_replay" ? " (une séance manquée compte si son replay est vu en entier)" : ""}
                  {" "}et une note finale d'au moins <strong>{session.seuil_note} %</strong>.
                </p>
                <dl className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="rounded-xl bg-sable/60 p-4">
                    <dt className="text-xs text-graphite/70">Présence{d.resultats?.provisoire ? " (provisoire)" : ""}</dt>
                    <dd className="mt-1 font-display text-2xl text-encre">{pct(d.resultats?.presence_pct)}</dd>
                  </div>
                  {!d.resultats?.provisoire && (
                    <>
                      <div className="rounded-xl bg-sable/60 p-4">
                        <dt className="text-xs text-graphite/70">Note finale</dt>
                        <dd className="mt-1 font-display text-2xl text-encre">{pct(d.resultats?.note_finale)}</dd>
                      </div>
                      <div className="rounded-xl bg-sable/60 p-4">
                        <dt className="text-xs text-graphite/70">Décision</dt>
                        <dd className={`mt-1 font-display text-2xl ${d.resultats?.admis ? "text-green-700" : "text-encre"}`}>
                          {d.resultats?.admis ? "Admis(e)" : "Non admis(e)"}
                        </dd>
                      </div>
                    </>
                  )}
                </dl>
                {d.resultats?.provisoire && <p className="mt-4 text-sm text-graphite/70">Les notes et la décision seront visibles après la publication des résultats.</p>}
                {d.certificat && (
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-encre/15 p-4">
                    <div className="flex items-center gap-3">
                      <Award className="w-8 h-8 text-rouge" />
                      <div>
                        <p className="font-semibold text-encre">Certificat n° {d.certificat.numero}</p>
                        <p className="text-xs text-graphite/70">Délivré le {dateFr(d.certificat.delivre_le)} · vérifiable en ligne par QR code</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => telecharger(`/formations/espace/certificats/${d.certificat.id}/lien`, { telecharger: true })} className="inline-flex items-center gap-2 rounded-xl bg-rouge text-white px-4 py-2 text-sm font-semibold hover:bg-rougeprofond">
                      <Download className="w-4 h-4" /> Télécharger le PDF
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {replay && (
        <LecteurReplay replay={replay} nom={nom} telechargeable={session.replay_telechargeable} onFermer={() => { setReplay(null); charger(); }} />
      )}
    </div>
  );
}
