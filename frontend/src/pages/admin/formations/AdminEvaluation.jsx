// src/pages/admin/formations/AdminEvaluation.jsx
// Édition d'une évaluation : paramètres, questions du quiz, correction des devoirs.
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowDown, ArrowLeft, ArrowUp, Eye, Plus, Trash2 } from "lucide-react";
import api from "@/utils/api";
import { dateHeureFr, messageErreur, ouvrirLien, pct } from "@/utils/formation";
import { Badge, Bouton, Carte, Champ, champCls, versDatetimeLocal } from "@/components/formation/AdminUi";

const nouvelleQuestion = (type = "qcm") => ({
  cle: Math.random().toString(36).slice(2),
  type,
  enonce: "",
  options: type === "qcm" ? ["", ""] : type === "vrai_faux" ? ["Vrai", "Faux"] : [],
  bonnes_reponses: [],
  points: 1,
  explication: "",
});

function EditeurQuestion({ q, index, total, onChange, onSupprimer, onDeplacer }) {
  const maj = (champ, valeur) => onChange({ ...q, [champ]: valeur });
  const basculer = (i) => {
    if (q.type === "vrai_faux") return maj("bonnes_reponses", [i]);
    const s = new Set(q.bonnes_reponses);
    s.has(i) ? s.delete(i) : s.add(i);
    maj("bonnes_reponses", [...s].sort());
  };
  return (
    <div className="border rounded-xl p-4 bg-gray-50/60">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-sm font-semibold text-gray-900">Question {index + 1}</span>
        <select
          value={q.type}
          onChange={(e) => onChange({ ...nouvelleQuestion(e.target.value), cle: q.cle, enonce: q.enonce, points: q.points, explication: q.explication })}
          className={`${champCls} w-auto`}
        >
          <option value="qcm">Choix multiples</option>
          <option value="vrai_faux">Vrai / faux</option>
          <option value="reponse_courte">Réponse courte</option>
        </select>
        <label className="text-sm text-gray-600 flex items-center gap-1">
          Points <input type="number" min="0.5" step="0.5" value={q.points} onChange={(e) => maj("points", e.target.value)} className={`${champCls} w-20`} />
        </label>
        <div className="ml-auto flex gap-1">
          <Bouton variante="secondaire" className="!px-2" disabled={index === 0} onClick={() => onDeplacer(-1)} aria-label="Monter"><ArrowUp className="w-4 h-4" /></Bouton>
          <Bouton variante="secondaire" className="!px-2" disabled={index === total - 1} onClick={() => onDeplacer(1)} aria-label="Descendre"><ArrowDown className="w-4 h-4" /></Bouton>
          <Bouton variante="danger" className="!px-2" onClick={onSupprimer} aria-label="Supprimer"><Trash2 className="w-4 h-4" /></Bouton>
        </div>
      </div>
      <textarea rows={2} value={q.enonce} onChange={(e) => maj("enonce", e.target.value)} placeholder="Énoncé" className={champCls} />

      {q.type !== "reponse_courte" ? (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-gray-500">{q.type === "qcm" ? "Cochez toutes les bonnes réponses." : "Cochez la bonne réponse."}</p>
          {q.options.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type={q.type === "qcm" ? "checkbox" : "radio"}
                checked={q.bonnes_reponses.includes(i)}
                onChange={() => basculer(i)}
                className="text-red-600 focus:ring-red-600"
                aria-label="Bonne réponse"
              />
              <input
                value={o}
                disabled={q.type === "vrai_faux"}
                onChange={(e) => maj("options", q.options.map((x, j) => (j === i ? e.target.value : x)))}
                placeholder={`Choix ${i + 1}`}
                className={champCls}
              />
              {q.type === "qcm" && q.options.length > 2 && (
                <button
                  type="button"
                  className="text-gray-400 hover:text-red-700"
                  onClick={() => onChange({
                    ...q,
                    options: q.options.filter((_, j) => j !== i),
                    bonnes_reponses: q.bonnes_reponses.filter((b) => b !== i).map((b) => (b > i ? b - 1 : b)),
                  })}
                  aria-label="Retirer le choix"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          {q.type === "qcm" && <button type="button" className="text-sm text-red-700 hover:underline" onClick={() => maj("options", [...q.options, ""])}>+ Ajouter un choix</button>}
        </div>
      ) : (
        <Champ label="Réponses acceptées" aide="Une par ligne. Majuscules, accents et espaces ne comptent pas." className="mt-3">
          <textarea rows={2} value={q.bonnes_reponses.join("\n")} onChange={(e) => maj("bonnes_reponses", e.target.value.split("\n"))} className={champCls} />
        </Champ>
      )}
      <Champ label="Explication (montrée après le dernier essai)" className="mt-3">
        <input value={q.explication || ""} onChange={(e) => maj("explication", e.target.value)} className={champCls} />
      </Champ>
    </div>
  );
}

export default function AdminEvaluation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [d, setD] = useState(null);
  const [param, setParam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [notes, setNotes] = useState({});
  const [envoi, setEnvoi] = useState(false);

  const charger = useCallback(() => {
    api.get(`/admin/formations/evaluations/${id}`).then(({ data }) => {
      setD(data);
      const e = data.evaluation;
      setParam({
        titre: e.titre, consignes: e.consignes || "", essais_max: e.essais_max, note_reussite: e.note_reussite ?? "",
        date_limite: versDatetimeLocal(e.date_limite), publiee: e.publiee,
      });
      setQuestions(data.questions.map((q) => ({ ...q, cle: String(q.id), bonnes_reponses: (q.bonnes_reponses || []).map((x) => (q.type === "reponse_courte" ? x : Number(x))) })));
    }).catch((err) => toast.error(messageErreur(err, "Évaluation introuvable.")));
  }, [id]);
  useEffect(() => { charger(); }, [charger]);

  if (!d || !param) return <p className="p-8 text-gray-500">Chargement…</p>;
  const e = d.evaluation;

  const enregistrerParametres = async () => {
    setEnvoi(true);
    try {
      await api.put(`/admin/formations/evaluations/${id}`, {
        ...param,
        essais_max: Number(param.essais_max) || 1,
        note_reussite: param.note_reussite === "" ? null : Number(param.note_reussite),
        date_limite: param.date_limite ? new Date(param.date_limite).toISOString() : null,
      });
      toast.success("Paramètres enregistrés.");
      charger();
    } catch (err) {
      toast.error(messageErreur(err));
    } finally {
      setEnvoi(false);
    }
  };

  const enregistrerQuestions = async () => {
    setEnvoi(true);
    try {
      await api.put(`/admin/formations/evaluations/${id}/questions`, {
        questions: questions.map(({ type, enonce, options, bonnes_reponses, points, explication }) => ({
          type, enonce, options, points: Number(points) || 1, explication,
          bonnes_reponses: type === "reponse_courte" ? bonnes_reponses.map((x) => String(x).trim()).filter(Boolean) : bonnes_reponses,
        })),
      });
      toast.success("Questions enregistrées.");
      charger();
    } catch (err) {
      toast.error(messageErreur(err));
    } finally {
      setEnvoi(false);
    }
  };

  const corriger = async (t) => {
    const n = notes[t.id] || {};
    if (n.note === undefined || n.note === "") return toast.error("Indiquez une note sur 100.");
    try {
      await api.patch(`/admin/formations/tentatives/${t.id}`, { note_pct: Number(n.note), commentaire: n.commentaire || null });
      toast.success("Copie corrigée.");
      charger();
    } catch (err) {
      toast.error(messageErreur(err));
    }
  };

  const supprimer = async () => {
    const forcer = d.tentatives.length > 0;
    if (!window.confirm(forcer ? "Des participants ont répondu : supprimer aussi leurs copies ?" : "Supprimer cette évaluation ?")) return;
    try {
      await api.delete(`/admin/formations/evaluations/${id}`, { params: forcer ? { forcer: 1 } : {} });
      navigate(`/admin/formations/sessions/${e.session_id}`);
    } catch (err) {
      toast.error(messageErreur(err));
    }
  };

  const deplacer = (i, sens) => setQuestions((l) => {
    const c = [...l];
    [c[i], c[i + sens]] = [c[i + sens], c[i]];
    return c;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <Link to={`/admin/formations/sessions/${e.session_id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-red-700">
        <ArrowLeft className="w-4 h-4" /> {e.formation_titre} · {e.session_intitule}
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold text-gray-900">{e.titre}</h1>
        <Badge>{e.type === "quiz" ? "Quiz" : "Devoir"}</Badge>
        <Badge className={e.publiee ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>{e.publiee ? "Publiée" : "Brouillon"}</Badge>
      </div>

      <Carte titre="Paramètres">
        <div className="grid gap-4 sm:grid-cols-2">
          <Champ label="Titre" className="sm:col-span-2"><input value={param.titre} onChange={(ev) => setParam({ ...param, titre: ev.target.value })} className={champCls} /></Champ>
          <Champ label="Consignes" className="sm:col-span-2"><textarea rows={3} value={param.consignes} onChange={(ev) => setParam({ ...param, consignes: ev.target.value })} className={champCls} /></Champ>
          <Champ label="Nombre d'essais"><input type="number" min="1" value={param.essais_max} onChange={(ev) => setParam({ ...param, essais_max: ev.target.value })} className={champCls} /></Champ>
          <Champ label="Note de réussite propre (%)" aide="Vide = seule la note finale de la session compte"><input type="number" min="0" max="100" value={param.note_reussite} onChange={(ev) => setParam({ ...param, note_reussite: ev.target.value })} className={champCls} /></Champ>
          <Champ label="Date limite"><input type="datetime-local" value={param.date_limite} onChange={(ev) => setParam({ ...param, date_limite: ev.target.value })} className={champCls} /></Champ>
          <label className="flex items-center gap-2 text-sm text-gray-700 self-end pb-2">
            <input type="checkbox" checked={param.publiee} onChange={(ev) => setParam({ ...param, publiee: ev.target.checked })} className="rounded text-red-600 focus:ring-red-600" />
            Publiée (visible par les participants)
          </label>
        </div>
        <div className="mt-4 flex justify-between">
          <Bouton variante="danger" onClick={supprimer}><Trash2 className="w-4 h-4" /> Supprimer</Bouton>
          <Bouton onClick={enregistrerParametres} disabled={envoi}>Enregistrer</Bouton>
        </div>
      </Carte>

      {e.type === "quiz" && (
        <Carte
          titre={`Questions (${questions.length})`}
          actions={<Bouton onClick={enregistrerQuestions} disabled={envoi}>{envoi ? "Enregistrement…" : "Enregistrer les questions"}</Bouton>}
        >
          {d.tentatives.length > 0 && (
            <p className="mb-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 px-3 py-2 text-sm">
              {d.tentatives.length} copie(s) déjà rendue(s) : modifier les questions ne recalcule pas les notes déjà obtenues.
            </p>
          )}
          <div className="space-y-4">
            {questions.map((q, i) => (
              <EditeurQuestion
                key={q.cle}
                q={q}
                index={i}
                total={questions.length}
                onChange={(nq) => setQuestions((l) => l.map((x, j) => (j === i ? nq : x)))}
                onSupprimer={() => setQuestions((l) => l.filter((_, j) => j !== i))}
                onDeplacer={(sens) => deplacer(i, sens)}
              />
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Bouton variante="secondaire" onClick={() => setQuestions((l) => [...l, nouvelleQuestion("qcm")])}><Plus className="w-4 h-4" /> Choix multiples</Bouton>
            <Bouton variante="secondaire" onClick={() => setQuestions((l) => [...l, nouvelleQuestion("vrai_faux")])}><Plus className="w-4 h-4" /> Vrai / faux</Bouton>
            <Bouton variante="secondaire" onClick={() => setQuestions((l) => [...l, nouvelleQuestion("reponse_courte")])}><Plus className="w-4 h-4" /> Réponse courte</Bouton>
          </div>
        </Carte>
      )}

      <Carte titre={`Copies (${d.tentatives.length})`}>
        {d.tentatives.length === 0 ? <p className="text-sm text-gray-500">Aucune copie pour le moment.</p> : (
          <ul className="divide-y">
            {d.tentatives.map((t) => (
              <li key={t.id} className="py-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900">{[t.prenom, t.nom].filter(Boolean).join(" ") || t.email}</p>
                    <p className="text-gray-500">Essai {t.numero} · {dateHeureFr(t.soumise_le)}{t.commentaire && e.type === "devoir" ? ` · « ${t.commentaire} »` : ""}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {t.a_un_fichier && <Bouton variante="secondaire" onClick={() => ouvrirLien(`/admin/formations/fichiers/tentative/${t.id}/lien`, { telecharger: true }).catch((er) => toast.error(messageErreur(er)))}><Eye className="w-4 h-4" /> Copie</Bouton>}
                    {t.statut === "corrigee" ? <Badge className="bg-green-100 text-green-800">{pct(t.note_pct)}</Badge> : <Badge className="bg-amber-100 text-amber-800">À corriger</Badge>}
                  </div>
                </div>
                {e.type === "devoir" && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <input type="number" min="0" max="100" placeholder="Note /100" defaultValue={t.statut === "corrigee" ? t.note_pct : ""} onChange={(ev) => setNotes((n) => ({ ...n, [t.id]: { ...n[t.id], note: ev.target.value } }))} className={`${champCls} w-28`} />
                    <input placeholder="Commentaire au participant" onChange={(ev) => setNotes((n) => ({ ...n, [t.id]: { ...n[t.id], commentaire: ev.target.value } }))} className={`${champCls} flex-1 min-w-[12rem]`} />
                    <Bouton onClick={() => corriger(t)}>{t.statut === "corrigee" ? "Modifier la note" : "Noter"}</Bouton>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Carte>
    </div>
  );
}
