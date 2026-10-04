-- Migration 004 : espace partenaire et modération des avis de recrutement (Phase 3)
--
-- Contexte : les partenaires envoyaient leurs avis via des gabarits Publisher ressaisis
-- à la main. Un partenaire a désormais un compte (role = 'partenaire' dans `users`)
-- et soumet ses avis en ligne. Un avis reste en attente tant que l'admin ne l'a pas
-- validé : il n'apparaît pas sur le site public avant.
--
-- Les offres existantes (créées par l'admin) passent en 'validee' : rien ne change pour le public.
--
-- Application : psql -U <user> -d <db> -f 004_partenaires_moderation.sql
-- Idempotent : peut être rejouée sans erreur si déjà appliquée.

BEGIN;

CREATE TABLE IF NOT EXISTS partenaires (
    id serial PRIMARY KEY,
    user_id integer NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    nom text NOT NULL,
    contact_nom text,
    telephone text,
    secteur text,
    ville text,
    site_web text,
    cree_le timestamp without time zone DEFAULT now()
);

-- Colonnes déjà utilisées par le code (offres.controller.js) mais absentes du dump initial.
ALTER TABLE offres ADD COLUMN IF NOT EXISTS statut text DEFAULT 'publiee';
ALTER TABLE offres ADD COLUMN IF NOT EXISTS type_recrutement text DEFAULT 'externe';

ALTER TABLE offres ADD COLUMN IF NOT EXISTS partenaire_id integer REFERENCES partenaires(id) ON DELETE SET NULL;
ALTER TABLE offres ADD COLUMN IF NOT EXISTS statut_moderation text NOT NULL DEFAULT 'validee';
ALTER TABLE offres ADD COLUMN IF NOT EXISTS motif_refus text;

ALTER TABLE offres DROP CONSTRAINT IF EXISTS offres_statut_moderation_check;
ALTER TABLE offres
    ADD CONSTRAINT offres_statut_moderation_check
    CHECK (statut_moderation IN ('en_attente', 'validee', 'refusee'));

CREATE INDEX IF NOT EXISTS idx_offres_partenaire_id ON offres(partenaire_id);
CREATE INDEX IF NOT EXISTS idx_offres_statut_moderation ON offres(statut_moderation);

COMMIT;
