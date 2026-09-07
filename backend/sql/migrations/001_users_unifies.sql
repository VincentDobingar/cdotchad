-- Migration 001 : table `users` unifiée par rôle (candidat | partenaire | admin | superadmin)
--
-- Contexte : jusqu'ici l'authentification admin passait par `administrateurs` et
-- l'authentification candidat par `utilisateurs`, avec des conventions de rôle
-- incohérentes ("utilisateur" vs "user", pas de colonne role garantie sur
-- administrateurs). Cette migration crée un socle unique réutilisable pour les
-- futurs comptes partenaires (Lot 3) sans toucher aux tables existantes.
--
-- Application : psql -U <user> -d <db> -f 001_users_unifies.sql
-- Idempotent : peut être rejouée sans erreur si déjà appliquée.

BEGIN;

-- Le code applicatif (seedAdmin.js, auth.controller.js) interroge déjà une colonne
-- `role` sur `administrateurs` alors que le dump SQL versionné ne la déclarait pas :
-- on s'assure qu'elle existe, sans écraser une valeur déjà présente.
ALTER TABLE IF EXISTS administrateurs ADD COLUMN IF NOT EXISTS role text DEFAULT 'admin';

CREATE TABLE IF NOT EXISTS users (
    id serial PRIMARY KEY,
    nom text,
    prenom text,
    email text NOT NULL UNIQUE,
    password_hash text NOT NULL,
    role text NOT NULL DEFAULT 'candidat'
        CHECK (role IN ('candidat', 'partenaire', 'admin', 'superadmin')),
    statut_compte text NOT NULL DEFAULT 'actif',
    cree_le timestamp without time zone DEFAULT now()
);

-- Migration des comptes administrateurs existants (rôle admin par défaut si NULL).
INSERT INTO users (email, password_hash, role, cree_le)
SELECT a.email, a.motdepasse, COALESCE(NULLIF(a.role, ''), 'admin'), COALESCE(a.cree_le, now())
FROM administrateurs a
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.email = a.email);

-- Migration des comptes candidats existants (normalise "utilisateur"/"user" -> "candidat").
INSERT INTO users (nom, prenom, email, password_hash, role, cree_le)
SELECT ut.nom, ut.prenom, ut.email, ut.motdepasse, 'candidat', now()
FROM utilisateurs ut
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.email = ut.email);

-- Table d'appui pour "mot de passe oublié" (tokens à usage unique, courte durée de vie).
CREATE TABLE IF NOT EXISTS password_resets (
    id serial PRIMARY KEY,
    user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash text NOT NULL,
    expire_le timestamp without time zone NOT NULL,
    utilise boolean NOT NULL DEFAULT false,
    cree_le timestamp without time zone DEFAULT now()
);

-- NOTE : `administrateurs` et `utilisateurs` sont volontairement conservées telles
-- quelles (aucun DROP) : elles servent de filet de sécurité le temps de valider
-- `users` en conditions réelles. Leur suppression sera une migration séparée
-- ultérieure, une fois le nouveau code d'auth confirmé stable en production.

COMMIT;
