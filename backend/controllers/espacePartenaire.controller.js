// 📁 backend/controllers/espacePartenaire.controller.js
// Espace partenaire : profil et soumission d'avis de recrutement.
// Un avis soumis est en attente tant que l'admin ne l'a pas validé (statut_moderation).
// Routes protégées par requireRole("partenaire") et verifierComptePartenaire.
import { pool } from "../config/db.js";
import { toOffrePayload, validateOffre } from "./offres.controller.js";
import { supprimerFichierAvis } from "../middlewares/uploadAvis.js";

// La date de publication d'un avis est celle de sa soumission (ou de sa dernière modification).
const aujourdhui = () => new Date().toISOString().slice(0, 10);

// Retrouve la fiche partenaire du compte connecté (null si absente).
async function partenaireDuCompte(userId) {
  const { rows } = await pool.query("SELECT id, nom FROM partenaires WHERE user_id = $1", [userId]);
  return rows[0] || null;
}

// Réponse d'erreur de validation : supprime la pièce jointe déjà reçue, qui ne sera pas utilisée.
function refuserValidation(req, res, errors) {
  supprimerFichierAvis(req.file?.filename);
  return res.status(400).json({ message: "Validation échouée", errors });
}

// 👤 Fiche partenaire du compte connecté
export const getMonProfilPartenaire = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.id, p.nom, p.contact_nom, p.telephone, p.secteur, p.ville, p.site_web,
              u.email
       FROM partenaires p JOIN users u ON u.id = p.user_id
       WHERE u.id = $1`,
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: "Fiche partenaire introuvable" });
    res.json({ partenaire: rows[0] });
  } catch (err) {
    console.error("getMonProfilPartenaire:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// 📋 Mes avis, avec leur statut de modération
export const listMesAvis = async (req, res) => {
  try {
    const partenaire = await partenaireDuCompte(req.user.id);
    if (!partenaire) return res.status(404).json({ message: "Fiche partenaire introuvable" });

    const { rows } = await pool.query(
      `SELECT id, titre, lieu, type_contrat, date_publication, date_limite,
              statut_moderation, motif_refus, document_url, created_at, updated_at
       FROM offres
       WHERE partenaire_id = $1
       ORDER BY COALESCE(updated_at, created_at) DESC`,
      [partenaire.id]
    );
    res.json({ avis: rows });
  } catch (err) {
    console.error("listMesAvis:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// 🔎 Un de mes avis (complet, pour édition)
export const getMonAvis = async (req, res) => {
  try {
    const partenaire = await partenaireDuCompte(req.user.id);
    if (!partenaire) return res.status(404).json({ message: "Fiche partenaire introuvable" });

    const { rows } = await pool.query(
      `SELECT * FROM offres WHERE id = $1 AND partenaire_id = $2`,
      [req.params.id, partenaire.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: "Avis introuvable" });
    res.json({ avis: rows[0] });
  } catch (err) {
    console.error("getMonAvis:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ➕ Soumission d'un avis (en attente de validation)
export const soumettreAvis = async (req, res) => {
  try {
    const partenaire = await partenaireDuCompte(req.user.id);
    if (!partenaire) return res.status(404).json({ message: "Fiche partenaire introuvable" });

    // Le statut et la modération ne viennent jamais du corps de la requête.
    const payload = toOffrePayload(req.body);
    payload.date_publication = aujourdhui();
    const errors = validateOffre(payload);
    if (Object.keys(errors).length > 0) return refuserValidation(req, res, errors);

    const { rows } = await pool.query(
      `INSERT INTO offres (
         titre, resume, description, attributions, statut, date_publication, date_limite,
         lieu, employeur, type_contrat, type_recrutement, diplome, formation, experience,
         certifications, logiciels, affiliations, competences, langue,
         partenaire_id, statut_moderation, document_url
       )
       VALUES (
         $1, $2, $3, $4, 'publiee', COALESCE($5::date, CURRENT_DATE), $6,
         $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
         $19, 'en_attente', $20
       )
       RETURNING id, titre, statut_moderation`,
      [
        payload.titre, payload.resume, payload.description, payload.attributions,
        payload.date_publication || null, payload.date_limite,
        payload.lieu, payload.employeur || partenaire.nom, payload.type_contrat, payload.type_recrutement,
        payload.diplome, payload.formation, payload.experience, payload.certifications,
        payload.logiciels, payload.affiliations, payload.competences, payload.langue,
        partenaire.id, req.file?.filename || null,
      ]
    );

    res.status(201).json({
      message: "Avis soumis. Il sera publié après validation par l'administration.",
      avis: rows[0],
    });
  } catch (err) {
    supprimerFichierAvis(req.file?.filename);
    console.error("soumettreAvis:", err);
    res.status(500).json({ message: "Erreur lors de la soumission de l'avis." });
  }
};

// ✏️ Modification d'un avis : possible tant qu'il n'est pas validé. Une modification
// renvoie l'avis en attente (un avis refusé repasse ainsi en file de modération).
// Une nouvelle pièce jointe remplace l'ancienne ; sans fichier joint, l'ancienne est conservée.
export const modifierMonAvis = async (req, res) => {
  try {
    const partenaire = await partenaireDuCompte(req.user.id);
    if (!partenaire) return res.status(404).json({ message: "Fiche partenaire introuvable" });

    const { rows: actuels } = await pool.query(
      "SELECT statut_moderation, document_url FROM offres WHERE id = $1 AND partenaire_id = $2",
      [req.params.id, partenaire.id]
    );
    if (actuels.length === 0) {
      supprimerFichierAvis(req.file?.filename);
      return res.status(404).json({ message: "Avis introuvable" });
    }
    if (actuels[0].statut_moderation === "validee") {
      supprimerFichierAvis(req.file?.filename);
      return res.status(409).json({
        message: "Cet avis est déjà publié : contactez l'administration pour le modifier.",
      });
    }

    const payload = toOffrePayload(req.body);
    payload.date_publication = aujourdhui();
    const errors = validateOffre(payload);
    if (Object.keys(errors).length > 0) return refuserValidation(req, res, errors);

    const nouveauDocument = req.file?.filename || actuels[0].document_url;
    const { rows } = await pool.query(
      `UPDATE offres SET
         titre = $1, resume = $2, description = $3, attributions = $4,
         date_publication = COALESCE($5::date, date_publication), date_limite = $6,
         lieu = $7, employeur = $8, type_contrat = $9, type_recrutement = $10,
         diplome = $11, formation = $12, experience = $13, certifications = $14,
         logiciels = $15, affiliations = $16, competences = $17, langue = $18,
         document_url = $19,
         statut_moderation = 'en_attente', motif_refus = NULL, updated_at = NOW()
       WHERE id = $20 AND partenaire_id = $21
       RETURNING id, titre, statut_moderation`,
      [
        payload.titre, payload.resume, payload.description, payload.attributions,
        payload.date_publication || null, payload.date_limite,
        payload.lieu, payload.employeur || partenaire.nom, payload.type_contrat, payload.type_recrutement,
        payload.diplome, payload.formation, payload.experience, payload.certifications,
        payload.logiciels, payload.affiliations, payload.competences, payload.langue,
        nouveauDocument,
        req.params.id, partenaire.id,
      ]
    );

    // L'ancienne pièce n'est plus référencée : on la supprime seulement si elle a été remplacée.
    if (req.file && actuels[0].document_url) supprimerFichierAvis(actuels[0].document_url);

    res.json({ message: "Avis mis à jour. Il est de nouveau soumis à validation.", avis: rows[0] });
  } catch (err) {
    supprimerFichierAvis(req.file?.filename);
    console.error("modifierMonAvis:", err);
    res.status(500).json({ message: "Erreur lors de la mise à jour de l'avis." });
  }
};
