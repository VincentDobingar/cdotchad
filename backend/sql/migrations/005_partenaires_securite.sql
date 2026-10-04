-- Migration 005 : sécurité des comptes partenaires
--
-- doit_changer_mdp : un mot de passe provisoire (création ou réinitialisation par l'admin)
-- doit être changé à la première connexion. Tant qu'il ne l'est pas, l'espace partenaire
-- reste fermé.
--
-- statut_compte existe déjà (défaut 'actif') ; l'admin peut le passer à 'suspendu'.
-- La connexion et les routes partenaire refusent alors le compte.
--
-- Application : psql -U <user> -d <db> -f 005_partenaires_securite.sql
-- Idempotent : peut être rejouée sans erreur si déjà appliquée.

BEGIN;

ALTER TABLE users ADD COLUMN IF NOT EXISTS statut_compte text NOT NULL DEFAULT 'actif';
ALTER TABLE users ADD COLUMN IF NOT EXISTS doit_changer_mdp boolean NOT NULL DEFAULT false;

COMMIT;
