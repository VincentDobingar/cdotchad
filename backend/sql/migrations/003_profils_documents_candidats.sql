-- Migration 003 : profil et documents enregistrés du candidat (Phase 2 — espace candidat)
--
-- Contexte : un candidat connecté doit pouvoir garder ses informations et ses
-- documents (CV, lettre, diplôme) pour ne pas les ressaisir à chaque candidature.
-- Les documents sont stockés dans un dossier privé (backend/uploads_prives/), jamais
-- exposé en statique : ils ne sont téléchargeables que par leur propriétaire.
--
-- Application : psql -U <user> -d <db> -f 003_profils_documents_candidats.sql
-- Idempotent : peut être rejouée sans erreur si déjà appliquée.

BEGIN;

CREATE TABLE IF NOT EXISTS profils_candidats (
    user_id integer PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    telephone text,
    ville text,
    pays text,
    lien_linkedin text,
    lien_portfolio text,
    resume text,
    maj_le timestamp without time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS documents_candidats (
    id serial PRIMARY KEY,
    user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('cv', 'lettre', 'diplome')),
    chemin text NOT NULL,
    nom_original text,
    taille integer,
    cree_le timestamp without time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_candidats_user_type ON documents_candidats(user_id, type);

COMMIT;
