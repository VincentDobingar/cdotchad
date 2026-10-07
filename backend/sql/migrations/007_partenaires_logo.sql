-- Migration 007 : logo du partenaire (page profil partenaire)
--
-- logo_url stocke le nom du fichier dans backend/uploads/logos_partenaires/
-- (même convention que offres.document_url). Le logo est public : il peut
-- apparaître avec les avis de recrutement.
--
-- Application : psql -U <user> -d <db> -f 007_partenaires_logo.sql
-- Idempotent : peut être rejouée sans erreur si déjà appliquée.

BEGIN;

ALTER TABLE partenaires ADD COLUMN IF NOT EXISTS logo_url text;

COMMIT;
