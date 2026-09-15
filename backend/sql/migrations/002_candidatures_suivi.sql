-- Migration 002 : suivi de statut + lien compte sur `candidatures` (Phase 2 — espace candidat)
--
-- Contexte : jusqu'ici `candidatures` est une table purement anonyme (nom/email en
-- texte libre, pas de user_id, pas de statut). Phase 2 ajoute le suivi de statut
-- candidat + le rattachement optionnel au compte `users` (table unifiée depuis la
-- migration 001) quand la candidature est soumise en étant connecté. Les
-- candidatures anonymes doivent continuer de fonctionner : user_id reste nullable.
--
-- Application : psql -U <user> -d <db> -f 002_candidatures_suivi.sql
-- Idempotent : peut être rejouée sans erreur si déjà appliquée.

BEGIN;

ALTER TABLE candidatures
    ADD COLUMN IF NOT EXISTS user_id integer REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_candidatures_user_id ON candidatures(user_id);

ALTER TABLE candidatures
    ADD COLUMN IF NOT EXISTS statut text NOT NULL DEFAULT 'recue';

-- Pas de "ADD CONSTRAINT IF NOT EXISTS" en Postgres : on retire puis on recrée,
-- pour rester rejouable sans erreur.
ALTER TABLE candidatures DROP CONSTRAINT IF EXISTS candidatures_statut_check;
ALTER TABLE candidatures
    ADD CONSTRAINT candidatures_statut_check
    CHECK (statut IN ('recue', 'en_cours', 'entretien', 'acceptee', 'refusee'));

COMMIT;
