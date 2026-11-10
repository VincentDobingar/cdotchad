// src/pages/admin/formations/AdminSession.jsx
// Gestion complète d'une session : séances en direct, inscriptions, supports et replays,
// évaluations, résultats et certificats, journal des accès, paramètres.
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  AlertTriangle, ArrowLeft, Award, CheckCircle2, Download, Eye, FileUp, Play, Plus, RefreshCw, Square, Trash2, Upload, Users, Video,
} from "lucide-react";
import api from "@/utils/api";
import {
  dateFr, dateHeureFr, duree, fcfa, messageErreur, ouvrirLien, pct, STATUT_INSCRIPTION, taille,
} from "@/utils/formation";
import { Badge, Bouton, Carte, Champ, champCls, Modale, STATUT_SESSION, versDatetimeLocal } from "@/components/formation/AdminUi";
import FormulaireSession from "@/components/formation/FormulaireSession";

const ONGLETS = [
  ["seances", "Séances"],
  ["inscriptions", "Inscriptions"],
  ["contenus", "Supports et replays"],
  ["evaluations", "Évaluations"],
  ["resultats", "Résultats et certificats"],
  ["journal", "Journal"],
  ["parametres", "Paramètres"],
];

const STATUT_SEANCE_ADMIN = {
  planifiee: { label: "Planifiée", className: "bg-blue-100 text-blue-800" },
  en_cours: { label: "En cours", className: "bg-red-600 text-white" },
  terminee: { label: "Terminée", className: "bg-gray-200 text-gray-700" },
  annulee: { label: "Annulée", className: "bg-gray-200 text-gray-500" },
};
const STATUT_REPLAY = {
  traitement: { label: "En traitement", className: "bg-amber-100 text-amber-800" },
  disponible: { label: "Disponible", className: "bg-green-100 text-green-800" },
  erreur: { label: "Erreur", className: "bg-red-100 text-red-800" },
};
const PAIEMENT = { gratuit: "Gratuit", en_attente: "Paiement attendu", paye: "Payé" };

const nomDe = (p) => [p.prenom, p.nom].filter(Boolean).join(" ") || p.email;

/* ------------------------------ Séances ------------------------------ */

function FormulaireSeance({ initial, onEnregistrer, onAnnuler }) {
  const [v, setV] = useState({
    titre: initial?.titre || "",
    debut: versDatetimeLocal(initial?.debut),
    duree_minutes: initial?.duree_minutes || 120,
    fournisseur: initial?.fournisseur || "bbb",
    lien_externe: initial?.lien_externe || "",
    cameras_participants: Boolean(initial?.cameras_participants),
    statut: initial?.statut || "planifiee",
  });
  const maj = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onEnregistrer({ ...v, debut: new Date(v.debut).toISOString(), duree_minutes: Number(v.duree_minutes), lien_externe: v.lien_externe || null });
      }}
      className="grid gap-4 sm:grid-cols-2"
    >
      <Champ label="Titre *" className="sm:col-span-2"><input required value={v.titre} onChange={maj("titre")} className={champCls} /></Champ>
      <Champ label="Début *"><input required type="datetime-local" value={v.debut} onChange={maj("debut")} className={champCls} /></Champ>
      <Champ label="Durée (minutes)"><input type="number" min="5" value={v.duree_minutes} onChange={maj("duree_minutes")} className={champCls} /></Champ>
      <Champ label="Classe virtuelle" className="sm:col-span-2">
        <select value={v.fournisseur} onChange={maj("fournisseur")} className={champCls}>
          <option value="bbb">BigBlueButton (sur nos serveurs, enregistrement et présence automatiques)</option>
          <option value="externe">Service hébergé (Zoom, Jitsi…) : lien remis aux seuls inscrits</option>
        </select>
      </Champ>
      {v.fournisseur === "externe" && (
        <Champ label="Lien de la réunion" aide="Jamais affiché publiquement. Présence à saisir, replay à déposer à la main." className="sm:col-span-2">
          <input type="url" value={v.lien_externe} onChange={maj("lien_externe")} placeholder="https://…" className={champCls} />
        </Champ>
      )}
      {v.fournisseur === "bbb" && (
        <label className="sm:col-span-2 flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={v.cameras_participants} onChange={maj("cameras_participants")} className="rounded text-red-600 focus:ring-red-600" />
          Autoriser les caméras des participants (déconseillé pour les connexions lentes)
        </label>
      )}
      {initial && (
        <Champ label="Statut">
          <select value={v.statut} onChange={maj("statut")} className={champCls}>
            {Object.entries(STATUT_SEANCE_ADMIN).map(([k, x]) => <option key={k} value={k}>{x.label}</option>)}
          </select>
        </Champ>
      )}
      <div className="sm:col-span-2 flex justify-end gap-2">
        <Bouton variante="secondaire" onClick={onAnnuler}>Annuler</Bouton>
        <Bouton type="submit">Enregistrer</Bouton>
      </div>
    </form>
  );
}

function ModalePresences({ seance, onFermer }) {
  const [liste, setListe] = useState(null);
  useEffect(() => {
    api.get(`/admin/formations/seances/${seance.id}/presences`).then(({ data }) => {
      setListe(data.presences.map((p) => ({ ...p, minutes: Math.round(p.duree_secondes / 60) })));
    });
  }, [seance.id]);
  const enregistrer = async () => {
    try {
      await api.put(`/admin/formations/seances/${seance.id}/presences`, {
        presences: liste.map((p) => ({ inscription_id: p.inscription_id, minutes: Number(p.minutes) || 0 })),
      });
      toast.success("Présences enregistrées.");
      onFermer(true);
    } catch (err) {
      toast.error(messageErreur(err));
    }
  };
  return (
    <Modale titre={`Présences — ${seance.titre}`} onFermer={() => onFermer(false)} large>
      {!liste ? <p className="text-sm text-gray-500">Chargement…</p> : liste.length === 0 ? <p className="text-sm text-gray-500">Aucun participant validé.</p> : (
        <>
          <p className="text-sm text-gray-600 mb-3">
            Temps de présence en minutes (sur {seance.duree_minutes}). Les relevés BigBlueButton sont remplis automatiquement en fin de séance ; une saisie ici les remplace.
          </p>
          <div className="max-h-[55vh] overflow-y-auto divide-y">
            {liste.map((p, i) => (
              <div key={p.inscription_id} className="py-2 flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{nomDe(p)}</p>
                  <p className="text-xs text-gray-500">
                    {p.premiere_arrivee ? `Arrivée ${dateHeureFr(p.premiere_arrivee)}` : "Pas d'entrée relevée"}
                    {p.derniere_sortie ? ` · sortie ${dateHeureFr(p.derniere_sortie)}` : ""}
                    {p.source ? ` · ${p.source === "bbb" ? "relevé BBB" : p.source === "manuel" ? "saisie manuelle" : "clic Rejoindre"}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" className="text-xs text-red-700 hover:underline" onClick={() => setListe((l) => l.map((x, j) => (j === i ? { ...x, minutes: seance.duree_minutes } : x)))}>Présent</button>
                  <input type="number" min="0" max={seance.duree_minutes} value={p.minutes} onChange={(e) => setListe((l) => l.map((x, j) => (j === i ? { ...x, minutes: e.target.value } : x)))} className={`${champCls} w-24`} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Bouton variante="secondaire" onClick={() => setListe((l) => l.map((x) => ({ ...x, minutes: seance.duree_minutes })))}>Tous présents</Bouton>
            <Bouton onClick={enregistrer}>Enregistrer</Bouton>
          </div>
        </>
      )}
    </Modale>
  );
}

function DepotFichier({ titre, url, champs = [], accept, aide, onFermer }) {
  const [fichier, setFichier] = useState(null);
  const [valeurs, setValeurs] = useState({});
  const [progression, setProgression] = useState(null);
  const envoyer = async () => {
    if (!fichier) return toast.error("Choisissez un fichier.");
    const fd = new FormData();
    Object.entries(valeurs).forEach(([k, v]) => v !== "" && v != null && fd.append(k, v));
    fd.append("fichier", fichier);
    setProgression(0);
    try {
      await api.post(url, fd, { timeout: 0, onUploadProgress: (e) => e.total && setProgression(Math.round((e.loaded / e.total) * 100)) });
      toast.success("Fichier déposé.");
      onFermer(true);
    } catch (err) {
      toast.error(messageErreur(err, "Dépôt impossible."));
      setProgression(null);
    }
  };
  return (
    <Modale titre={titre} onFermer={() => onFermer(false)}>
      <div className="space-y-4">
        {champs.map((c) => (
          <Champ key={c.nom} label={c.label}>
            {c.options ? (
              <select className={champCls} value={valeurs[c.nom] ?? ""} onChange={(e) => setValeurs((s) => ({ ...s, [c.nom]: e.target.value }))}>
                {c.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            ) : (
              <input type={c.type || "text"} className={champCls} value={valeurs[c.nom] ?? ""} onChange={(e) => setValeurs((s) => ({ ...s, [c.nom]: e.target.value }))} />
            )}
          </Champ>
        ))}
        <Champ label="Fichier" aide={aide}><input type="file" accept={accept} onChange={(e) => setFichier(e.target.files?.[0] || null)} className="block text-sm" /></Champ>
        {progression != null && (
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden"><div className="h-full bg-red-600 transition-all" style={{ width: `${progression}%` }} /></div>
        )}
        <div className="flex justify-end gap-2">
          <Bouton variante="secondaire" onClick={() => onFermer(false)}>Annuler</Bouton>
          <Bouton onClick={envoyer} disabled={progression != null}><Upload className="w-4 h-4" /> {progression != null ? `${progression} %` : "Déposer"}</Bouton>
        </div>
      </div>
    </Modale>
  );
}

/* ------------------------------ Page ------------------------------ */

export default function AdminSession() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [d, setD] = useState(null);
  const [onglet, setOnglet] = useState("seances");
  const [modale, setModale] = useState(null); // { type, objet }
  const [resultats, setResultats] = useState(null);
  const [journal, setJournal] = useState(null);
  const [occupe, setOccupe] = useState(false);

  const charger = useCallback(() => {
    api.get(`/admin/formations/sessions/${id}`).then(({ data }) => setD(data)).catch((err) => toast.error(messageErreur(err, "Session introuvable.")));
  }, [id]);
  useEffect(() => { charger(); }, [charger]);

  const chargerResultats = useCallback(() => {
    api.get(`/admin/formations/sessions/${id}/resultats`).then(({ data }) => setResultats(data)).catch(() => {});
  }, [id]);
  useEffect(() => {
    if (onglet === "resultats") chargerResultats();
    if (onglet === "journal") api.get(`/admin/formations/journal`, { params: { session: id } }).then(({ data }) => setJournal(data.journal)).catch(() => {});
  }, [onglet, id, chargerResultats]);

  const action = async (fn, succes) => {
    setOccupe(true);
    try {
      const r = await fn();
      if (succes) toast.success(typeof succes === "function" ? succes(r?.data) : succes);
      charger();
      return r;
    } catch (err) {
      toast.error(messageErreur(err));
      return null;
    } finally {
      setOccupe(false);
    }
  };

  const fermer = (rafraichir) => {
    setModale(null);
    if (rafraichir) charger();
  };

  if (!d) return <p className="p-8 text-gray-500">Chargement…</p>;
  const { session: s, seances, inscriptions, supports, replays, evaluations, certificats, visio } = d;
  const certificatDe = Object.fromEntries(certificats.map((c) => [c.inscription_id, c]));
  const enAttente = inscriptions.filter((i) => i.statut === "en_attente").length;
  const validees = inscriptions.filter((i) => i.statut === "validee").length;

  const demarrer = async (se) => {
    const fenetre = window.open("", "_blank");
    const r = await action(() => api.post(`/admin/formations/seances/${se.id}/demarrer`));
    if (r?.data?.url) {
      if (fenetre) fenetre.location.href = r.data.url;
      else window.location.assign(r.data.url);
    } else fenetre?.close();
  };

  const exporterCsv = async () => {
    try {
      const { data } = await api.get(`/admin/formations/sessions/${id}/export.csv`, { responseType: "blob" });
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `participants-${s.intitule}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(messageErreur(err, "Export impossible."));
    }
  };

  const genererCertificats = async () => {
    setOccupe(true);
    let total = 0;
    try {
      // Par lots de 20 : reste dans les limites de temps de l'hébergement mutualisé
      for (;;) {
        const { data } = await api.post(`/admin/formations/sessions/${id}/certificats`, { limite: 20 }, { timeout: 120000 });
        total += data.delivres;
        if (!data.restants || !data.delivres) break;
      }
      toast.success(total ? `${total} certificat(s) délivré(s) et envoyé(s).` : "Aucun nouveau certificat à délivrer.");
    } catch (err) {
      toast.error(messageErreur(err));
    } finally {
      setOccupe(false);
      charger();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <Link to={`/admin/formations/${s.formation_id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-red-700">
        <ArrowLeft className="w-4 h-4" /> {s.formation_titre}
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{s.intitule}</h1>
          <p className="text-gray-600 mt-1">
            {s.date_debut ? `${dateFr(s.date_debut)} → ${dateFr(s.date_fin)}` : "Dates à définir"} · {fcfa(s.tarif_fcfa)} · {validees}
            {s.places_max ? `/${s.places_max}` : ""} participant(s){enAttente ? ` · ${enAttente} à valider` : ""}
          </p>
        </div>
        <Badge className={STATUT_SESSION[s.statut]?.className}>{STATUT_SESSION[s.statut]?.label}</Badge>
      </div>

      {!visio.bbb_configure && seances.some((x) => x.fournisseur === "bbb") && (
        <p className="flex gap-2 items-start rounded-xl bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 text-sm">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          BigBlueButton n'est pas encore configuré sur ce serveur (BBB_URL et BBB_SECRET). Les séances BigBlueButton ne pourront pas s'ouvrir :
          utilisez en attendant une séance « Service hébergé » avec un lien Zoom ou Jitsi.
        </p>
      )}

      <nav className="flex gap-1 overflow-x-auto border-b">
        {ONGLETS.map(([k, l]) => (
          <button key={k} type="button" onClick={() => setOnglet(k)} className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px ${onglet === k ? "border-red-600 text-red-700" : "border-transparent text-gray-600 hover:text-gray-900"}`}>
            {l}
            {k === "inscriptions" && enAttente > 0 && <span className="ml-1.5 inline-block min-w-[1.25rem] rounded-full bg-amber-500 text-white text-xs px-1">{enAttente}</span>}
          </button>
        ))}
      </nav>

      {onglet === "seances" && (
        <Carte titre="Séances en direct" actions={<Bouton onClick={() => setModale({ type: "seance" })}><Plus className="w-4 h-4" /> Nouvelle séance</Bouton>}>
          {seances.length === 0 ? <p className="text-sm text-gray-500">Aucune séance programmée.</p> : (
            <ul className="divide-y">
              {seances.map((se) => (
                <li key={se.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{se.titre}</p>
                    <p className="text-sm text-gray-500">
                      {dateHeureFr(se.debut)} · {duree(se.duree_minutes)} · {se.fournisseur === "bbb" ? "BigBlueButton" : "Service hébergé"} · {se.nb_presents} présent(s)
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={STATUT_SEANCE_ADMIN[se.statut]?.className}>{STATUT_SEANCE_ADMIN[se.statut]?.label}</Badge>
                    {["planifiee", "en_cours"].includes(se.statut) && (
                      <Bouton onClick={() => demarrer(se)} disabled={occupe}><Play className="w-4 h-4" /> {se.statut === "en_cours" ? "Rejoindre" : "Démarrer"}</Bouton>
                    )}
                    {se.statut === "en_cours" && (
                      <Bouton variante="secondaire" disabled={occupe} onClick={() => window.confirm("Terminer la séance pour tous les participants ?") && action(() => api.post(`/admin/formations/seances/${se.id}/terminer`), "Séance terminée.")}>
                        <Square className="w-4 h-4" /> Terminer
                      </Bouton>
                    )}
                    <Bouton variante="secondaire" onClick={() => setModale({ type: "presences", objet: se })}><Users className="w-4 h-4" /> Présences</Bouton>
                    {se.fournisseur === "bbb" && se.bbb_meeting_id && (
                      <Bouton variante="secondaire" disabled={occupe} onClick={() => action(() => api.post(`/admin/formations/seances/${se.id}/synchroniser-replays`), (r) => `${r.importes} replay(s) importé(s)${r.erreurs?.length ? ` — ${r.erreurs.join(" ; ")}` : ""}`)}>
                        <RefreshCw className="w-4 h-4" /> Replays
                      </Bouton>
                    )}
                    <Bouton variante="secondaire" onClick={() => setModale({ type: "replay", objet: se })}><FileUp className="w-4 h-4" /> Déposer un replay</Bouton>
                    <Bouton variante="secondaire" onClick={() => setModale({ type: "seance", objet: se })}>Modifier</Bouton>
                    <Bouton variante="danger" onClick={() => window.confirm("Supprimer cette séance ?") && action(() => api.delete(`/admin/formations/seances/${se.id}`), "Séance supprimée.")}><Trash2 className="w-4 h-4" /></Bouton>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Carte>
      )}

      {onglet === "inscriptions" && (
        <Carte
          titre={`Inscriptions (${inscriptions.length})`}
          actions={
            <>
              <Bouton variante="secondaire" onClick={exporterCsv}><Download className="w-4 h-4" /> Export CSV</Bouton>
              <Bouton onClick={() => setModale({ type: "participant" })}><Plus className="w-4 h-4" /> Inscrire un participant</Bouton>
            </>
          }
        >
          {inscriptions.length === 0 ? <p className="text-sm text-gray-500">Aucune inscription.</p> : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead><tr className="text-left text-gray-500 border-b"><th className="py-2 pr-4 font-medium">Participant</th><th className="py-2 pr-4 font-medium">Inscription</th><th className="py-2 pr-4 font-medium">Paiement</th><th className="py-2 pr-4 font-medium">Date</th><th className="py-2 font-medium text-right">Actions</th></tr></thead>
                <tbody className="divide-y">
                  {inscriptions.map((i) => (
                    <tr key={i.id}>
                      <td className="py-2.5 pr-4"><p className="font-medium text-gray-900">{nomDe(i)}</p><p className="text-xs text-gray-500">{i.email} · {i.role}</p></td>
                      <td className="py-2.5 pr-4"><Badge className={STATUT_INSCRIPTION[i.statut]?.className}>{STATUT_INSCRIPTION[i.statut]?.label}</Badge></td>
                      <td className="py-2.5 pr-4">{PAIEMENT[i.paiement_statut]}{i.paiement_reference ? <span className="block text-xs text-gray-500">{i.paiement_reference}</span> : null}</td>
                      <td className="py-2.5 pr-4 text-gray-600">{dateFr(i.cree_le)}</td>
                      <td className="py-2.5 text-right whitespace-nowrap space-x-1">
                        {i.paiement_statut === "en_attente" && (
                          <Bouton variante="secondaire" onClick={() => {
                            const ref = window.prompt("Référence du paiement (Mobile Money, reçu…) :", "");
                            if (ref !== null) action(() => api.patch(`/admin/formations/inscriptions/${i.id}`, { paiement_statut: "paye", paiement_reference: ref, statut: "validee" }), "Paiement enregistré, inscription validée.");
                          }}>Paiement reçu</Bouton>
                        )}
                        {i.statut !== "validee" && <Bouton variante="secondaire" onClick={() => action(() => api.patch(`/admin/formations/inscriptions/${i.id}`, { statut: "validee" }), "Inscription validée.")}><CheckCircle2 className="w-4 h-4" /> Valider</Bouton>}
                        {["en_attente", "validee"].includes(i.statut) && <Bouton variante="danger" onClick={() => window.confirm(`Refuser l'inscription de ${nomDe(i)} ?`) && action(() => api.patch(`/admin/formations/inscriptions/${i.id}`, { statut: "refusee" }), "Inscription refusée.")}>Refuser</Bouton>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Carte>
      )}

      {onglet === "contenus" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Carte titre="Supports de cours" actions={<Bouton onClick={() => setModale({ type: "support" })}><Upload className="w-4 h-4" /> Ajouter</Bouton>}>
            {supports.length === 0 ? <p className="text-sm text-gray-500">Aucun support.</p> : (
              <ul className="divide-y">
                {supports.map((sp) => (
                  <li key={sp.id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0"><p className="font-medium text-gray-900 truncate">{sp.titre}</p><p className="text-xs text-gray-500">{sp.nom_original} · {taille(sp.taille_octets)}</p></div>
                    <div className="flex gap-1">
                      <Bouton variante="secondaire" onClick={() => ouvrirLien(`/admin/formations/fichiers/support/${sp.id}/lien`).catch((e) => toast.error(messageErreur(e)))}><Eye className="w-4 h-4" /></Bouton>
                      <Bouton variante="danger" onClick={() => window.confirm("Supprimer ce support ?") && action(() => api.delete(`/admin/formations/supports/${sp.id}`), "Support supprimé.")}><Trash2 className="w-4 h-4" /></Bouton>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Carte>
          <Carte titre="Replays">
            {replays.length === 0 ? <p className="text-sm text-gray-500">Les replays BigBlueButton arrivent seuls après chaque séance. Pour un service hébergé, déposez la vidéo depuis l'onglet Séances.</p> : (
              <ul className="divide-y">
                {replays.map((r) => (
                  <li key={r.id} className="py-2.5 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{r.titre || r.seance_titre}</p>
                        <p className="text-xs text-gray-500">
                          {r.seance_titre} · {r.duree_secondes ? duree(Math.round(r.duree_secondes / 60)) : "durée inconnue"}
                          {r.taille_octets ? ` · ${taille(r.taille_octets)}` : ""} · {r.nb_spectateurs} spectateur(s)
                          {r.expire_le ? ` · expire le ${dateFr(r.expire_le)}` : ""}
                        </p>
                      </div>
                      <Badge className={STATUT_REPLAY[r.statut]?.className}>{STATUT_REPLAY[r.statut]?.label}</Badge>
                    </div>
                    {r.erreur && <p className="mt-1 text-xs text-red-700">{r.erreur}</p>}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {r.statut === "disponible" && <Bouton variante="secondaire" onClick={() => ouvrirLien(`/admin/formations/fichiers/replay/${r.id}/lien`).catch((e) => toast.error(messageErreur(e)))}><Video className="w-4 h-4" /> Voir</Bouton>}
                      <Bouton variante="secondaire" onClick={() => action(() => api.patch(`/admin/formations/replays/${r.id}`, { publie: !r.publie }), r.publie ? "Replay masqué aux participants." : "Replay publié.")}>
                        {r.publie ? "Masquer" : "Publier"}
                      </Bouton>
                      <Bouton variante="danger" onClick={() => window.confirm("Supprimer ce replay et sa vidéo ?") && action(() => api.delete(`/admin/formations/replays/${r.id}`), "Replay supprimé.")}><Trash2 className="w-4 h-4" /></Bouton>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Carte>
        </div>
      )}

      {onglet === "evaluations" && (
        <Carte titre="Évaluations" actions={<Bouton onClick={() => setModale({ type: "evaluation" })}><Plus className="w-4 h-4" /> Nouvelle évaluation</Bouton>}>
          {evaluations.length === 0 ? <p className="text-sm text-gray-500">Aucune évaluation. Sans évaluation, seul le critère de présence compte pour le certificat.</p> : (
            <ul className="divide-y">
              {evaluations.map((e) => (
                <li key={e.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <Link to={`/admin/formations/evaluations/${e.id}`} className="font-medium text-gray-900 hover:text-red-700">{e.titre}</Link>
                    <p className="text-sm text-gray-500">
                      {e.type === "quiz" ? `Quiz · ${e.nb_questions} question(s)` : "Devoir"} · {e.essais_max} essai(s) · {e.nb_tentatives} copie(s)
                      {e.date_limite ? ` · avant le ${dateHeureFr(e.date_limite)}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {e.nb_a_corriger > 0 && <Badge className="bg-amber-100 text-amber-800">{e.nb_a_corriger} à corriger</Badge>}
                    <Badge className={e.publiee ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>{e.publiee ? "Publiée" : "Brouillon"}</Badge>
                    <Link to={`/admin/formations/evaluations/${e.id}`} className="text-sm font-medium text-red-700 hover:underline">Ouvrir →</Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Carte>
      )}

      {onglet === "resultats" && (
        <Carte
          titre="Résultats et certificats"
          actions={
            <>
              <Bouton variante="secondaire" disabled={occupe} onClick={() => action(() => api.post(`/admin/formations/sessions/${id}/resultats/calculer`), "Résultats calculés et enregistrés.").then(chargerResultats)}>
                <RefreshCw className="w-4 h-4" /> Calculer
              </Bouton>
              <Bouton variante="sombre" disabled={occupe} onClick={() => window.confirm("Publier les résultats ? Chaque participant verra sa note et sa décision.") && action(() => api.post(`/admin/formations/sessions/${id}/resultats/publier`), "Résultats publiés.").then(chargerResultats)}>
                Publier les résultats
              </Bouton>
              <Bouton disabled={occupe || !s.resultats_publies_le} onClick={genererCertificats}><Award className="w-4 h-4" /> Délivrer les certificats</Bouton>
            </>
          }
        >
          <p className="text-sm text-gray-600 mb-4">
            Règle : présence ≥ {s.seuil_presence} % {s.regle_absence === "presence_ou_replay" ? "(séance rattrapable par le replay vu en entier)" : "(directs uniquement)"} et note finale ≥ {s.seuil_note} %.
            {" "}1. Calculez · 2. ajustez une décision au besoin · 3. publiez · 4. délivrez les certificats (PDF envoyé par e-mail).
            {s.resultats_publies_le && <strong className="block mt-1 text-green-800">Résultats publiés le {dateFr(s.resultats_publies_le)}.</strong>}
          </p>
          {!resultats ? <p className="text-sm text-gray-500">Chargement…</p> : resultats.lignes.length === 0 ? <p className="text-sm text-gray-500">Aucun participant validé.</p> : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="py-2 pr-4 font-medium">Participant</th><th className="py-2 pr-4 font-medium">Présence</th>
                    {resultats.evaluations.map((e) => <th key={e.id} className="py-2 pr-4 font-medium">{e.titre}</th>)}
                    <th className="py-2 pr-4 font-medium">Note finale</th><th className="py-2 pr-4 font-medium">Calcul</th><th className="py-2 pr-4 font-medium">Décision</th><th className="py-2 font-medium">Certificat</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {resultats.lignes.map((l) => {
                    const c = certificatDe[l.inscription_id];
                    return (
                      <tr key={l.inscription_id}>
                        <td className="py-2.5 pr-4 font-medium text-gray-900">{nomDe(l)}</td>
                        <td className={`py-2.5 pr-4 ${l.presence_pct != null && l.presence_pct < s.seuil_presence ? "text-red-700" : ""}`}>{pct(l.presence_pct)}</td>
                        {l.notes.map((n) => <td key={n.evaluation_id} className="py-2.5 pr-4">{pct(n.note)}</td>)}
                        <td className="py-2.5 pr-4 font-semibold">{pct(l.note_finale)}</td>
                        <td className="py-2.5 pr-4">{l.admis_calcule ? "Admis" : "Non admis"}</td>
                        <td className="py-2.5 pr-4">
                          <select
                            value={l.admis == null ? "" : l.admis ? "1" : "0"}
                            onChange={(e) => action(() => api.patch(`/admin/formations/inscriptions/${l.inscription_id}`, { admis: e.target.value === "" ? null : e.target.value === "1" }), "Décision enregistrée.").then(chargerResultats)}
                            className={`${champCls} w-36`}
                          >
                            <option value="">À décider</option><option value="1">Admis</option><option value="0">Non admis</option>
                          </select>
                        </td>
                        <td className="py-2.5 whitespace-nowrap">
                          {c ? (
                            <div className="flex items-center gap-1">
                              <span className={`font-mono text-xs ${c.revoque ? "line-through text-gray-400" : ""}`}>{c.numero}</span>
                              {!c.revoque && (
                                <>
                                  <Bouton variante="secondaire" className="!px-2" onClick={() => ouvrirLien(`/admin/formations/fichiers/certificat/${c.id}/lien`).catch((e) => toast.error(messageErreur(e)))}><Eye className="w-4 h-4" /></Bouton>
                                  <Bouton variante="secondaire" className="!px-2" onClick={() => action(() => api.post(`/admin/formations/certificats/${c.id}/renvoyer`), (r) => (r.envoye ? "E-mail renvoyé." : "Échec de l'envoi de l'e-mail."))}>Renvoyer</Bouton>
                                  <Bouton variante="danger" className="!px-2" onClick={() => { const motif = window.prompt("Motif de la révocation :"); if (motif !== null) action(() => api.post(`/admin/formations/certificats/${c.id}/revoquer`, { motif }), "Certificat révoqué."); }}>Révoquer</Bouton>
                                </>
                              )}
                            </div>
                          ) : <span className="text-gray-400">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Carte>
      )}

      {onglet === "journal" && (
        <Carte titre="Journal des accès">
          {!journal ? <p className="text-sm text-gray-500">Chargement…</p> : journal.length === 0 ? <p className="text-sm text-gray-500">Aucun accès enregistré.</p> : (
            <div className="overflow-x-auto max-h-[60vh]">
              <table className="min-w-full text-sm">
                <thead><tr className="text-left text-gray-500 border-b"><th className="py-2 pr-4 font-medium">Date</th><th className="py-2 pr-4 font-medium">Compte</th><th className="py-2 pr-4 font-medium">Action</th><th className="py-2 font-medium">Adresse IP</th></tr></thead>
                <tbody className="divide-y">
                  {journal.map((j) => (
                    <tr key={j.id}>
                      <td className="py-2 pr-4 whitespace-nowrap">{new Date(j.cree_le).toLocaleString("fr-FR")}</td>
                      <td className="py-2 pr-4">{j.email ? nomDe(j) : "—"}</td>
                      <td className="py-2 pr-4">{j.action.replaceAll("_", " ")} {j.objet_type ? `(${j.objet_type} ${j.objet_id})` : ""}</td>
                      <td className="py-2 font-mono text-xs text-gray-500">{j.ip}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Carte>
      )}

      {onglet === "parametres" && (
        <Carte titre="Paramètres de la session">
          <FormulaireSession initial={s} onEnregistrer={(corps) => action(() => api.put(`/admin/formations/sessions/${id}`, corps), "Session enregistrée.")} />
          <div className="mt-6 pt-4 border-t">
            <Bouton variante="danger" onClick={async () => {
              if (!window.confirm("Supprimer définitivement cette session ?")) return;
              const r = await action(() => api.delete(`/admin/formations/sessions/${id}`), "Session supprimée.");
              if (r) navigate(`/admin/formations/${s.formation_id}`);
            }}><Trash2 className="w-4 h-4" /> Supprimer la session</Bouton>
          </div>
        </Carte>
      )}

      {/* Modales */}
      {modale?.type === "seance" && (
        <Modale titre={modale.objet ? "Modifier la séance" : "Nouvelle séance"} onFermer={() => fermer(false)} large>
          <FormulaireSeance
            initial={modale.objet}
            onAnnuler={() => fermer(false)}
            onEnregistrer={async (corps) => {
              const r = await action(() => (modale.objet ? api.put(`/admin/formations/seances/${modale.objet.id}`, corps) : api.post(`/admin/formations/sessions/${id}/seances`, corps)), "Séance enregistrée.");
              if (r) setModale(null);
            }}
          />
        </Modale>
      )}
      {modale?.type === "presences" && <ModalePresences seance={modale.objet} onFermer={fermer} />}
      {modale?.type === "replay" && (
        <DepotFichier
          titre={`Déposer le replay — ${modale.objet.titre}`}
          url={`/admin/formations/seances/${modale.objet.id}/replays`}
          accept="video/mp4,video/webm,.m4v"
          aide="MP4 ou WebM. Pour une vidéo très lourde, préférez le stockage S3 (voir la documentation)."
          champs={[{ nom: "titre", label: "Titre (facultatif)" }, { nom: "duree_minutes", label: "Durée (minutes)", type: "number" }]}
          onFermer={fermer}
        />
      )}
      {modale?.type === "support" && (
        <DepotFichier
          titre="Ajouter un support de cours"
          url={`/admin/formations/sessions/${id}/supports`}
          aide="PDF, présentations, documents, images ou ZIP — 50 Mo maximum."
          champs={[
            { nom: "titre", label: "Titre" },
            { nom: "seance_id", label: "Séance (facultatif)", options: [["", "Toute la session"], ...seances.map((x) => [x.id, x.titre])] },
          ]}
          onFermer={fermer}
        />
      )}
      {modale?.type === "participant" && (
        <Modale titre="Inscrire un participant" onFermer={() => fermer(false)}>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const r = await action(() => api.post(`/admin/formations/sessions/${id}/inscriptions`, { email: e.target.email.value }), "Participant inscrit.");
            if (r) setModale(null);
          }} className="space-y-4">
            <Champ label="Adresse e-mail du compte" aide="La personne doit avoir un compte candidat ou partenaire sur le site."><input name="email" type="email" required className={champCls} /></Champ>
            <div className="flex justify-end gap-2"><Bouton variante="secondaire" onClick={() => fermer(false)}>Annuler</Bouton><Bouton type="submit">Inscrire</Bouton></div>
          </form>
        </Modale>
      )}
      {modale?.type === "evaluation" && (
        <Modale titre="Nouvelle évaluation" onFermer={() => fermer(false)}>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const f = e.target;
            const r = await action(() => api.post(`/admin/formations/sessions/${id}/evaluations`, {
              titre: f.titre.value, type: f.type.value, essais_max: Number(f.essais_max.value) || 1,
              note_reussite: f.note_reussite.value === "" ? null : Number(f.note_reussite.value),
              date_limite: f.date_limite.value ? new Date(f.date_limite.value).toISOString() : null,
            }));
            if (r?.data?.evaluation) navigate(`/admin/formations/evaluations/${r.data.evaluation.id}`);
          }} className="grid gap-4 sm:grid-cols-2">
            <Champ label="Titre *" className="sm:col-span-2"><input name="titre" required className={champCls} /></Champ>
            <Champ label="Type"><select name="type" className={champCls}><option value="quiz">Quiz (corrigé automatiquement)</option><option value="devoir">Devoir à déposer</option></select></Champ>
            <Champ label="Nombre d'essais"><input name="essais_max" type="number" min="1" defaultValue={1} className={champCls} /></Champ>
            <Champ label="Note de réussite (%)" aide="Facultatif : exigence propre à cette évaluation"><input name="note_reussite" type="number" min="0" max="100" className={champCls} /></Champ>
            <Champ label="Date limite"><input name="date_limite" type="datetime-local" className={champCls} /></Champ>
            <div className="sm:col-span-2 flex justify-end gap-2"><Bouton variante="secondaire" onClick={() => fermer(false)}>Annuler</Bouton><Bouton type="submit">Créer</Bouton></div>
          </form>
        </Modale>
      )}
    </div>
  );
}
