-- Migration 009 : plateforme de formation en ligne
-- (analyse technique DBS Africa du 8 novembre 2026, version 1.1)
--
-- Parcours couvert : catalogue -> sessions datées -> inscription -> séances en direct
-- (BigBlueButton ou lien d'un service hébergé) -> présences -> replays et supports privés
-- -> évaluations (quiz, devoirs) -> résultats -> certificat PDF vérifiable par QR code.
--
-- Les comptes restent ceux de la table `users` (candidats et partenaires participent,
-- l'administration gère). Aucune table existante n'est modifiée.
--
-- Application : psql -U <user> -d <db> -f 009_plateforme_formation.sql
-- Idempotent : peut être rejouée sans erreur si déjà appliquée.

BEGIN;

-- Fiche catalogue
CREATE TABLE IF NOT EXISTS formations (
    id serial PRIMARY KEY,
    slug text NOT NULL UNIQUE,
    titre text NOT NULL,
    resume text,
    description text,
    objectifs text,
    public_cible text,
    prerequis text,
    image_url text,
    formateur_nom text,
    duree_heures numeric(6,1),
    statut text NOT NULL DEFAULT 'brouillon'
        CHECK (statut IN ('brouillon', 'publiee', 'archivee')),
    cree_par integer,
    cree_le timestamptz NOT NULL DEFAULT now(),
    maj_le timestamptz NOT NULL DEFAULT now()
);

-- Session datée (cohorte) d'une formation : places, tarif et règles du certificat
CREATE TABLE IF NOT EXISTS formation_sessions (
    id serial PRIMARY KEY,
    formation_id integer NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
    intitule text NOT NULL,
    date_debut date,
    date_fin date,
    places_max integer CHECK (places_max IS NULL OR places_max > 0),
    tarif_fcfa integer NOT NULL DEFAULT 0 CHECK (tarif_fcfa >= 0),
    mode_inscription text NOT NULL DEFAULT 'automatique'
        CHECK (mode_inscription IN ('automatique', 'manuelle')),
    statut text NOT NULL DEFAULT 'ouverte'
        CHECK (statut IN ('ouverte', 'fermee', 'terminee', 'annulee')),
    seuil_presence integer NOT NULL DEFAULT 80 CHECK (seuil_presence BETWEEN 0 AND 100),
    seuil_note integer NOT NULL DEFAULT 70 CHECK (seuil_note BETWEEN 0 AND 100),
    -- 'presence' : seule la présence aux directs compte ;
    -- 'presence_ou_replay' : une séance manquée compte si son replay a été vu en entier.
    regle_absence text NOT NULL DEFAULT 'presence_ou_replay'
        CHECK (regle_absence IN ('presence', 'presence_ou_replay')),
    replay_telechargeable boolean NOT NULL DEFAULT false,
    conservation_replays_jours integer CHECK (conservation_replays_jours IS NULL OR conservation_replays_jours > 0),
    resultats_publies_le timestamptz,
    cree_le timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_formation_sessions_formation ON formation_sessions(formation_id);

-- Séance en direct (classe virtuelle)
CREATE TABLE IF NOT EXISTS formation_seances (
    id serial PRIMARY KEY,
    session_id integer NOT NULL REFERENCES formation_sessions(id) ON DELETE CASCADE,
    titre text NOT NULL,
    debut timestamptz NOT NULL,
    duree_minutes integer NOT NULL DEFAULT 120 CHECK (duree_minutes > 0),
    -- 'bbb' : BigBlueButton piloté par le site ; 'externe' : service hébergé (Zoom, Jitsi...)
    -- dont le lien n'est jamais affiché publiquement, seulement remis aux inscrits validés.
    fournisseur text NOT NULL DEFAULT 'bbb' CHECK (fournisseur IN ('bbb', 'externe')),
    lien_externe text,
    bbb_meeting_id text UNIQUE,
    bbb_cree_le timestamptz,
    cameras_participants boolean NOT NULL DEFAULT false,
    statut text NOT NULL DEFAULT 'planifiee'
        CHECK (statut IN ('planifiee', 'en_cours', 'terminee', 'annulee')),
    demarree_le timestamptz,
    terminee_le timestamptz,
    cree_le timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_formation_seances_session ON formation_seances(session_id, debut);

-- Inscription d'un compte à une session
CREATE TABLE IF NOT EXISTS formation_inscriptions (
    id serial PRIMARY KEY,
    session_id integer NOT NULL REFERENCES formation_sessions(id) ON DELETE CASCADE,
    user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    statut text NOT NULL DEFAULT 'en_attente'
        CHECK (statut IN ('en_attente', 'validee', 'refusee', 'annulee')),
    paiement_statut text NOT NULL DEFAULT 'gratuit'
        CHECK (paiement_statut IN ('gratuit', 'en_attente', 'paye')),
    paiement_reference text,
    consentement_enregistrement boolean NOT NULL DEFAULT false,
    consentement_le timestamptz,
    presence_pct numeric(5,2),
    note_finale numeric(5,2),
    admis boolean,
    cree_le timestamptz NOT NULL DEFAULT now(),
    valide_le timestamptz,
    UNIQUE (session_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_formation_inscriptions_user ON formation_inscriptions(user_id);

-- Présence par séance (relevée par BigBlueButton, au clic « Rejoindre » ou saisie manuelle)
CREATE TABLE IF NOT EXISTS formation_presences (
    id serial PRIMARY KEY,
    seance_id integer NOT NULL REFERENCES formation_seances(id) ON DELETE CASCADE,
    inscription_id integer NOT NULL REFERENCES formation_inscriptions(id) ON DELETE CASCADE,
    premiere_arrivee timestamptz,
    derniere_sortie timestamptz,
    duree_secondes integer NOT NULL DEFAULT 0 CHECK (duree_secondes >= 0),
    source text NOT NULL DEFAULT 'lien' CHECK (source IN ('bbb', 'lien', 'manuel')),
    maj_le timestamptz NOT NULL DEFAULT now(),
    UNIQUE (seance_id, inscription_id)
);

-- Fichier privé (stockage local hors dossier public, ou stockage objet compatible S3).
-- Jamais servi directement : uniquement par lien temporaire délivré après contrôle des droits.
CREATE TABLE IF NOT EXISTS formation_fichiers (
    id serial PRIMARY KEY,
    pilote text NOT NULL CHECK (pilote IN ('local', 's3')),
    cle text NOT NULL,
    nom_original text,
    type_mime text,
    taille_octets bigint,
    cree_le timestamptz NOT NULL DEFAULT now()
);

-- Supports de cours (PDF, présentations, exercices) d'une session ou d'une séance
CREATE TABLE IF NOT EXISTS formation_supports (
    id serial PRIMARY KEY,
    session_id integer NOT NULL REFERENCES formation_sessions(id) ON DELETE CASCADE,
    seance_id integer REFERENCES formation_seances(id) ON DELETE SET NULL,
    titre text NOT NULL,
    fichier_id integer NOT NULL REFERENCES formation_fichiers(id) ON DELETE CASCADE,
    cree_le timestamptz NOT NULL DEFAULT now()
);

-- Enregistrements (replays) d'une séance
CREATE TABLE IF NOT EXISTS formation_replays (
    id serial PRIMARY KEY,
    seance_id integer NOT NULL REFERENCES formation_seances(id) ON DELETE CASCADE,
    titre text,
    statut text NOT NULL DEFAULT 'traitement'
        CHECK (statut IN ('traitement', 'disponible', 'erreur')),
    bbb_record_id text UNIQUE,
    fichier_id integer REFERENCES formation_fichiers(id) ON DELETE SET NULL,
    duree_secondes integer,
    publie boolean NOT NULL DEFAULT true,
    erreur text,
    expire_le timestamptz,
    cree_le timestamptz NOT NULL DEFAULT now()
);

-- Visionnage des replays (règle « présence ou replay vu en entier »)
CREATE TABLE IF NOT EXISTS formation_replay_vues (
    replay_id integer NOT NULL REFERENCES formation_replays(id) ON DELETE CASCADE,
    inscription_id integer NOT NULL REFERENCES formation_inscriptions(id) ON DELETE CASCADE,
    secondes_vues integer NOT NULL DEFAULT 0,
    termine boolean NOT NULL DEFAULT false,
    maj_le timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (replay_id, inscription_id)
);

-- Évaluations : quiz corrigé automatiquement ou devoir noté par le formateur
CREATE TABLE IF NOT EXISTS formation_evaluations (
    id serial PRIMARY KEY,
    session_id integer NOT NULL REFERENCES formation_sessions(id) ON DELETE CASCADE,
    titre text NOT NULL,
    type text NOT NULL DEFAULT 'quiz' CHECK (type IN ('quiz', 'devoir')),
    consignes text,
    note_reussite integer CHECK (note_reussite IS NULL OR note_reussite BETWEEN 0 AND 100),
    essais_max integer NOT NULL DEFAULT 1 CHECK (essais_max > 0),
    date_limite timestamptz,
    publiee boolean NOT NULL DEFAULT false,
    ordre integer NOT NULL DEFAULT 0,
    cree_le timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS formation_questions (
    id serial PRIMARY KEY,
    evaluation_id integer NOT NULL REFERENCES formation_evaluations(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('qcm', 'vrai_faux', 'reponse_courte')),
    enonce text NOT NULL,
    -- qcm : ["choix A", "choix B", ...] ; vrai_faux : ["Vrai", "Faux"] ; reponse_courte : []
    options jsonb NOT NULL DEFAULT '[]'::jsonb,
    -- qcm / vrai_faux : indices des bonnes réponses [0, 2] ; reponse_courte : réponses acceptées ["..."]
    bonnes_reponses jsonb NOT NULL DEFAULT '[]'::jsonb,
    explication text,
    points numeric(6,2) NOT NULL DEFAULT 1 CHECK (points > 0),
    ordre integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS formation_tentatives (
    id serial PRIMARY KEY,
    evaluation_id integer NOT NULL REFERENCES formation_evaluations(id) ON DELETE CASCADE,
    inscription_id integer NOT NULL REFERENCES formation_inscriptions(id) ON DELETE CASCADE,
    numero integer NOT NULL DEFAULT 1,
    reponses jsonb,
    fichier_id integer REFERENCES formation_fichiers(id) ON DELETE SET NULL,
    score numeric(8,2),
    score_max numeric(8,2),
    note_pct numeric(5,2),
    statut text NOT NULL DEFAULT 'soumise' CHECK (statut IN ('soumise', 'corrigee')),
    commentaire text,
    soumise_le timestamptz NOT NULL DEFAULT now(),
    corrigee_le timestamptz,
    UNIQUE (evaluation_id, inscription_id, numero)
);

-- Certificats délivrés (numéro unique, vérifiable publiquement)
CREATE TABLE IF NOT EXISTS formation_certificats (
    id serial PRIMARY KEY,
    inscription_id integer NOT NULL UNIQUE REFERENCES formation_inscriptions(id) ON DELETE CASCADE,
    numero text NOT NULL UNIQUE,
    fichier_id integer REFERENCES formation_fichiers(id) ON DELETE SET NULL,
    delivre_le timestamptz NOT NULL DEFAULT now(),
    envoye_le timestamptz,
    revoque boolean NOT NULL DEFAULT false,
    revoque_le timestamptz,
    motif_revocation text
);

-- Journal des accès (lectures, téléchargements, entrées en salle)
CREATE TABLE IF NOT EXISTS formation_journal (
    id bigserial PRIMARY KEY,
    user_id integer,
    action text NOT NULL,
    objet_type text,
    objet_id integer,
    ip text,
    user_agent text,
    cree_le timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_formation_journal_objet ON formation_journal(objet_type, objet_id);
CREATE INDEX IF NOT EXISTS idx_formation_journal_date ON formation_journal(cree_le DESC);

COMMIT;
