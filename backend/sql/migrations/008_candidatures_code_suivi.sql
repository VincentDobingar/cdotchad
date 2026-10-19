-- Migration 008 : code de suivi public des candidatures (#15)
-- Ajoute une colonne code_suivi unique permettant de suivre une candidature
-- sans être connecté. Rejouable sans erreur.
BEGIN;

ALTER TABLE candidatures
    ADD COLUMN IF NOT EXISTS code_suivi text;

-- Backfill des candidatures existantes dépourvues de code (format CDO-XXXXXXXX).
UPDATE candidatures
SET code_suivi = 'CDO-' || upper(substr(md5(random()::text || id::text || clock_timestamp()::text), 1, 8))
WHERE code_suivi IS NULL;

-- Unicité (via index unique, rejouable).
CREATE UNIQUE INDEX IF NOT EXISTS idx_candidatures_code_suivi ON candidatures(code_suivi);

COMMIT;
