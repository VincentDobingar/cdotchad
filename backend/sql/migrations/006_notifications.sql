-- Migration 006 : notifications dans l'application (Phase 5)
--
-- Une notification est créée côté serveur quand l'état d'un dossier change :
--   - statut d'une candidature (candidat concerné) ;
--   - décision de modération d'un avis de recrutement (partenaire concerné).
-- Le destinataire les lit dans son espace et peut les marquer comme lues.
--
-- Application : psql -U <user> -d <db> -f 006_notifications.sql
-- Idempotent : peut être rejouée sans erreur si déjà appliquée.

BEGIN;

CREATE TABLE IF NOT EXISTS notifications (
    id serial PRIMARY KEY,
    user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type text NOT NULL,
    message text NOT NULL,
    lien text,
    lue boolean NOT NULL DEFAULT false,
    cree_le timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_lue ON notifications(user_id, lue);

COMMIT;
