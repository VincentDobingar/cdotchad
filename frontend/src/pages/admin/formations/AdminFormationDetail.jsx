// src/pages/admin/formations/AdminFormationDetail.jsx
// Fiche catalogue d'une formation (création / modification) et ses sessions.
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, ExternalLink, Plus, Trash2 } from "lucide-react";
import api from "@/utils/api";
import { dateFr, fcfa, messageErreur } from "@/utils/formation";
import { Badge, Bouton, Carte, Champ, champCls, Modale, STATUT_SESSION } from "@/components/formation/AdminUi";
import FormulaireSession from "@/components/formation/FormulaireSession";
import ImageFormation from "@/components/formation/ImageFormation";

const VIDE = {
  titre: "", slug: "", resume: "", description: "", objectifs: "", public_cible: "", prerequis: "",
  image_url: "", formateur_nom: "", duree_heures: "", statut: "brouillon",
};

export default function AdminFormationDetail() {
  const { id } = useParams();
  const nouvelle = !id;
  const navigate = useNavigate();
  const [v, setV] = useState(VIDE);
  const [sessions, setSessions] = useState([]);
  const [chargement, setChargement] = useState(!nouvelle);
  const [envoi, setEnvoi] = useState(false);
  const [modaleSession, setModaleSession] = useState(false);
  const [image, setImage] = useState(null); // fichier choisi, envoyé à l'enregistrement
  const [imageAvant, setImageAvant] = useState(""); // image enregistrée en base

  const charger = useCallback(() => {
    if (nouvelle) return;
    api
      .get(`/admin/formations/${id}`)
      .then(({ data }) => {
        setV({ ...VIDE, ...Object.fromEntries(Object.entries(data.formation).map(([k, x]) => [k, x ?? ""])) });
        setImageAvant(data.formation.image_url || "");
        setSessions(data.sessions || []);
      })
      .catch((err) => toast.error(messageErreur(err, "Formation introuvable.")))
      .finally(() => setChargement(false));
  }, [id, nouvelle]);

  useEffect(() => { charger(); }, [charger]);

  const maj = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value }));

  const enregistrer = async (e) => {
    e.preventDefault();
    setEnvoi(true);
    // L'image importée est envoyée à part : on ne transmet ici qu'une adresse saisie à la main
    const urlSaisie = /^https?:\/\//i.test(v.image_url) ? v.image_url : null;
    const corps = { ...v, duree_heures: v.duree_heures === "" ? null : Number(v.duree_heures) };
    if (image || (v.image_url && v.image_url === imageAvant)) delete corps.image_url;
    else corps.image_url = urlSaisie;
    const envoyerImage = async (fid) => {
      const fd = new FormData();
      fd.append("image", image);
      const { data } = await api.post(`/admin/formations/${fid}/image`, fd, { timeout: 120000 });
      return data.formation;
    };
    try {
      if (nouvelle) {
        const { data } = await api.post("/admin/formations", corps);
        if (image) {
          try {
            await envoyerImage(data.formation.id);
          } catch (err) {
            toast.error(messageErreur(err, "Formation créée, mais l'image n'a pas pu être envoyée."));
          }
        }
        toast.success("Formation créée. Ajoutez maintenant une session.");
        navigate(`/admin/formations/${data.formation.id}`, { replace: true });
      } else {
        if (!image && !v.image_url && imageAvant) await api.delete(`/admin/formations/${id}/image`);
        let { data: { formation } } = await api.put(`/admin/formations/${id}`, corps);
        if (image) formation = await envoyerImage(id);
        setV((s) => ({ ...s, slug: formation.slug, image_url: formation.image_url || "" }));
        setImageAvant(formation.image_url || "");
        setImage(null);
        toast.success("Formation enregistrée.");
      }
    } catch (err) {
      toast.error(messageErreur(err, "Enregistrement impossible."));
    } finally {
      setEnvoi(false);
    }
  };

  const supprimer = async () => {
    if (!window.confirm("Supprimer définitivement cette formation et ses sessions ?")) return;
    try {
      await api.delete(`/admin/formations/${id}`);
      toast.success("Formation supprimée.");
      navigate("/admin/formations");
    } catch (err) {
      toast.error(messageErreur(err, "Suppression impossible."));
    }
  };

  const creerSession = async (corps) => {
    try {
      const { data } = await api.post(`/admin/formations/${id}/sessions`, corps);
      toast.success("Session créée.");
      navigate(`/admin/formations/sessions/${data.session.id}`);
    } catch (err) {
      toast.error(messageErreur(err, "Création impossible."));
    }
  };

  if (chargement) return <p className="p-8 text-gray-500">Chargement…</p>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <Link to="/admin/formations" className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-red-700">
        <ArrowLeft className="w-4 h-4" /> Formations
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-gray-900">{nouvelle ? "Nouvelle formation" : v.titre}</h1>
        {!nouvelle && v.slug && (
          <a href={`/formations/${v.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-red-700 hover:underline">
            <ExternalLink className="w-4 h-4" /> Voir la fiche publique
          </a>
        )}
      </div>

      {!nouvelle && (
        <Carte titre="Sessions" actions={<Bouton onClick={() => setModaleSession(true)}><Plus className="w-4 h-4" /> Nouvelle session</Bouton>}>
          {sessions.length === 0 ? (
            <p className="text-sm text-gray-500">Aucune session. Une session regroupe des dates, des places, des séances en direct et ses participants.</p>
          ) : (
            <ul className="divide-y">
              {sessions.map((s) => (
                <li key={s.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <Link to={`/admin/formations/sessions/${s.id}`} className="font-medium text-gray-900 hover:text-red-700">{s.intitule}</Link>
                    <p className="text-sm text-gray-500">
                      {s.date_debut ? `${dateFr(s.date_debut)} → ${dateFr(s.date_fin)}` : "Dates à définir"} · {fcfa(s.tarif_fcfa)} ·{" "}
                      {s.nb_seances} séance(s) · {s.nb_inscrits}{s.places_max ? `/${s.places_max}` : ""} inscrit(s)
                      {s.nb_en_attente ? ` · ${s.nb_en_attente} à valider` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={STATUT_SESSION[s.statut]?.className}>{STATUT_SESSION[s.statut]?.label}</Badge>
                    <Link to={`/admin/formations/sessions/${s.id}`} className="text-sm font-medium text-red-700 hover:underline">Gérer →</Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Carte>
      )}

      <Carte titre="Fiche catalogue">
        <form onSubmit={enregistrer} className="grid gap-4 md:grid-cols-2">
          <Champ label="Titre *" className="md:col-span-2"><input required value={v.titre} onChange={maj("titre")} className={champCls} /></Champ>
          <div className="md:col-span-2">
            <ImageFormation
              url={v.image_url}
              fichier={image}
              onFichier={setImage}
              onUrl={(u) => setV((s) => ({ ...s, image_url: u }))}
              onErreur={(m) => toast.error(m)}
              envoi={envoi}
            />
          </div>
          <Champ label="Résumé" aide="Affiché sur la carte du catalogue" className="md:col-span-2">
            <textarea rows={2} value={v.resume} onChange={maj("resume")} className={champCls} />
          </Champ>
          <Champ label="Description" className="md:col-span-2"><textarea rows={6} value={v.description} onChange={maj("description")} className={champCls} /></Champ>
          <Champ label="Objectifs"><textarea rows={4} value={v.objectifs} onChange={maj("objectifs")} className={champCls} /></Champ>
          <Champ label="Public concerné"><textarea rows={4} value={v.public_cible} onChange={maj("public_cible")} className={champCls} /></Champ>
          <Champ label="Prérequis"><textarea rows={3} value={v.prerequis} onChange={maj("prerequis")} className={champCls} /></Champ>
          <div className="grid gap-4">
            <Champ label="Formateur"><input value={v.formateur_nom} onChange={maj("formateur_nom")} className={champCls} /></Champ>
            <Champ label="Durée totale (heures)"><input type="number" min="0" step="0.5" value={v.duree_heures} onChange={maj("duree_heures")} className={champCls} /></Champ>
          </div>
          <Champ label="Adresse de la page" aide={`/formations/${v.slug || "…"}`}><input value={v.slug} onChange={maj("slug")} className={champCls} placeholder="générée depuis le titre" /></Champ>
          <Champ label="Statut">
            <select value={v.statut} onChange={maj("statut")} className={champCls}>
              <option value="brouillon">Brouillon (invisible)</option>
              <option value="publiee">Publiée au catalogue</option>
              <option value="archivee">Archivée</option>
            </select>
          </Champ>
          <div className="md:col-span-2 flex flex-wrap justify-between gap-2 pt-2">
            {!nouvelle ? <Bouton variante="danger" onClick={supprimer}><Trash2 className="w-4 h-4" /> Supprimer</Bouton> : <span />}
            <Bouton type="submit" disabled={envoi}>{envoi ? "Enregistrement…" : nouvelle ? "Créer la formation" : "Enregistrer"}</Bouton>
          </div>
        </form>
      </Carte>

      {modaleSession && (
        <Modale titre="Nouvelle session" onFermer={() => setModaleSession(false)} large>
          <FormulaireSession onEnregistrer={creerSession} onAnnuler={() => setModaleSession(false)} />
        </Modale>
      )}
    </div>
  );
}
