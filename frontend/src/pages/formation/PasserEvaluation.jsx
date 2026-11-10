// src/pages/formation/PasserEvaluation.jsx
// Passage d'un quiz (corrigé automatiquement) ou dépôt d'un devoir.
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, CheckCircle2, Upload, XCircle } from "lucide-react";
import api from "@/utils/api";
import { dateHeureFr, messageErreur, pct } from "@/utils/formation";

const carte = "bg-white rounded-2xl border border-sable shadow-sm";

export default function PasserEvaluation() {
  const { id, evaluationId } = useParams();
  const [d, setD] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [reponses, setReponses] = useState({});
  const [fichier, setFichier] = useState(null);
  const [commentaire, setCommentaire] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [resultat, setResultat] = useState(null);

  const charger = useCallback(() => {
    api
      .get(`/formations/espace/evaluations/${evaluationId}`)
      .then(({ data }) => setD(data))
      .catch((err) => setErreur(messageErreur(err, "Évaluation introuvable.")));
  }, [evaluationId]);

  useEffect(() => { charger(); }, [charger]);

  if (erreur) return <p className="text-rougeprofond">{erreur}</p>;
  if (!d) return <p className="text-graphite/70">Chargement…</p>;

  const { evaluation: e, questions, tentatives, essais_restants: restants, correction_visible: correction } = d;
  const derniere = tentatives[tentatives.length - 1];
  const detail = correction && derniere?.reponses ? derniere.reponses : null;
  const peutRepondre = restants > 0 && (!e.date_limite || new Date(e.date_limite) > new Date());

  const choisir = (q, index) => {
    setReponses((r) => {
      if (q.type === "qcm") {
        const actuel = new Set(r[q.id] || []);
        actuel.has(index) ? actuel.delete(index) : actuel.add(index);
        return { ...r, [q.id]: [...actuel] };
      }
      return { ...r, [q.id]: index };
    });
  };

  const soumettre = async () => {
    const sansReponse = questions.filter((q) => reponses[q.id] === undefined || (Array.isArray(reponses[q.id]) && !reponses[q.id].length) || reponses[q.id] === "");
    if (sansReponse.length && !window.confirm(`${sansReponse.length} question(s) sans réponse. Envoyer quand même ?`)) return;
    setEnvoi(true);
    try {
      const { data } = await api.post(`/formations/espace/evaluations/${e.id}/tentatives`, { reponses });
      setResultat(data);
      setReponses({});
      charger();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      toast.error(messageErreur(err, "Envoi impossible."));
    } finally {
      setEnvoi(false);
    }
  };

  const deposer = async () => {
    if (!fichier) return toast.error("Choisissez un fichier.");
    const fd = new FormData();
    fd.append("fichier", fichier);
    if (commentaire) fd.append("commentaire", commentaire);
    setEnvoi(true);
    try {
      await api.post(`/formations/espace/evaluations/${e.id}/devoir`, fd, { timeout: 300000 });
      toast.success("Devoir déposé. Vous serez notifié(e) de sa correction.");
      setFichier(null);
      setCommentaire("");
      charger();
    } catch (err) {
      toast.error(messageErreur(err, "Dépôt impossible."));
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div>
      <Link to={`/mes-formations/${id}`} className="inline-flex items-center gap-1.5 text-sm text-graphite hover:text-rouge">
        <ArrowLeft className="w-4 h-4" /> Retour à la formation
      </Link>

      <div className={`${carte} mt-4 p-6`}>
        <h2 className="font-display text-2xl text-encre">{e.titre}</h2>
        <p className="mt-1 text-sm text-graphite/80">
          {e.type === "quiz" ? "Quiz" : "Devoir"} · {restants} essai{restants > 1 ? "s" : ""} restant{restants > 1 ? "s" : ""} sur {e.essais_max}
          {e.note_reussite != null ? ` · réussite à ${e.note_reussite} %` : ""}
          {e.date_limite ? ` · avant le ${dateHeureFr(e.date_limite)}` : ""}
        </p>
        {e.consignes && <p className="mt-4 text-sm text-graphite whitespace-pre-line">{e.consignes}</p>}
      </div>

      {resultat && (
        <div className={`mt-4 rounded-2xl p-5 border ${resultat.reussi === false ? "bg-amber-50 border-amber-200" : "bg-green-50 border-green-200"}`}>
          <p className="font-semibold text-encre">Votre note : {pct(resultat.tentative.note_pct)}</p>
          <p className="text-sm text-graphite">
            {resultat.reussi === true ? "Évaluation réussie." : resultat.reussi === false ? "Note de réussite non atteinte." : ""}
            {resultat.essais_restants > 0 ? ` Il vous reste ${resultat.essais_restants} essai(s).` : " Correction détaillée ci-dessous."}
          </p>
        </div>
      )}

      {tentatives.length > 0 && (
        <div className={`${carte} mt-4 p-5`}>
          <p className="text-sm font-semibold text-encre">Vos essais</p>
          <ul className="mt-2 text-sm text-graphite space-y-1">
            {tentatives.map((t) => (
              <li key={t.id}>
                Essai {t.numero} — {dateHeureFr(t.soumise_le)} — {t.statut === "corrigee" ? <strong>{pct(t.note_pct)}</strong> : "en correction"}
                {t.commentaire && e.type === "devoir" && t.statut === "corrigee" ? <span className="block text-graphite/80">Commentaire : {t.commentaire}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      )}

      {e.type === "quiz" && (peutRepondre || correction) && (
        <ol className="mt-6 space-y-4">
          {questions.map((q, n) => {
            const d2 = detail?.[q.id];
            return (
              <li key={q.id} className={`${carte} p-5`}>
                <p className="font-medium text-encre">
                  {n + 1}. {q.enonce}
                  <span className="ml-2 text-xs text-graphite/60">({Number(q.points)} pt{Number(q.points) > 1 ? "s" : ""}{q.type === "qcm" ? " · plusieurs réponses possibles" : ""})</span>
                </p>
                {q.type === "reponse_courte" ? (
                  <input
                    disabled={!peutRepondre}
                    value={reponses[q.id] || ""}
                    onChange={(ev) => setReponses((r) => ({ ...r, [q.id]: ev.target.value }))}
                    className="mt-3 w-full rounded-lg border-sablefonce text-sm focus:border-rouge focus:ring-rouge"
                    placeholder="Votre réponse"
                  />
                ) : (
                  <div className="mt-3 space-y-2">
                    {q.options.map((o, i) => {
                      const coche = q.type === "qcm" ? (reponses[q.id] || []).includes(i) : reponses[q.id] === i;
                      const bonne = correction && q.bonnes_reponses?.map(Number).includes(i);
                      return (
                        <label key={i} className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm cursor-pointer ${bonne ? "border-green-400 bg-green-50" : coche ? "border-rouge bg-rouge/5" : "border-sable"}`}>
                          <input
                            type={q.type === "qcm" ? "checkbox" : "radio"}
                            name={`q-${q.id}`}
                            disabled={!peutRepondre}
                            checked={coche}
                            onChange={() => choisir(q, i)}
                            className="text-rouge focus:ring-rouge"
                          />
                          {o}
                        </label>
                      );
                    })}
                  </div>
                )}
                {correction && (
                  <div className="mt-3 text-sm">
                    {d2 && (d2.juste
                      ? <p className="flex items-center gap-1.5 text-green-700"><CheckCircle2 className="w-4 h-4" /> Bonne réponse à votre dernier essai</p>
                      : <p className="flex items-center gap-1.5 text-rougeprofond"><XCircle className="w-4 h-4" /> Réponse incorrecte à votre dernier essai</p>)}
                    {q.type === "reponse_courte" && <p className="text-graphite">Réponse attendue : {q.bonnes_reponses?.join(" / ")}</p>}
                    {q.explication && <p className="mt-1 text-graphite/80">{q.explication}</p>}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}

      {e.type === "quiz" && peutRepondre && (
        <div className="mt-6 flex justify-end">
          <button type="button" onClick={soumettre} disabled={envoi} className="rounded-xl bg-rouge text-white px-6 py-3 text-sm font-semibold hover:bg-rougeprofond disabled:opacity-60">
            {envoi ? "Envoi…" : "Envoyer mes réponses"}
          </button>
        </div>
      )}

      {e.type === "devoir" && peutRepondre && (
        <div className={`${carte} mt-6 p-6`}>
          <p className="font-semibold text-encre">Déposer mon devoir</p>
          <p className="text-xs text-graphite/70">PDF, Word, Excel, PowerPoint, image ou ZIP — 20 Mo maximum.</p>
          <input type="file" onChange={(ev) => setFichier(ev.target.files?.[0] || null)} className="mt-4 block text-sm" />
          <textarea
            value={commentaire}
            onChange={(ev) => setCommentaire(ev.target.value)}
            rows={3}
            placeholder="Message au formateur (facultatif)"
            className="mt-3 w-full rounded-lg border-sablefonce text-sm focus:border-rouge focus:ring-rouge"
          />
          <button type="button" onClick={deposer} disabled={envoi} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rouge text-white px-5 py-2.5 text-sm font-semibold hover:bg-rougeprofond disabled:opacity-60">
            <Upload className="w-4 h-4" /> {envoi ? "Envoi…" : "Déposer"}
          </button>
        </div>
      )}

      {!peutRepondre && !correction && (
        <p className="mt-6 text-sm text-graphite/70">Plus d'essai disponible pour cette évaluation.</p>
      )}
    </div>
  );
}
