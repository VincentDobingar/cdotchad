# Migrations

Fichiers SQL numérotés, à appliquer manuellement dans l'ordre (pas d'outil de migration en place) :

```
psql -U <user> -h <host> -d <db> -f sql/migrations/001_users_unifies.sql
psql -U <user> -h <host> -d <db> -f sql/migrations/002_candidatures_suivi.sql
psql -U <user> -h <host> -d <db> -f sql/migrations/003_profils_documents_candidats.sql
psql -U <user> -h <host> -d <db> -f sql/migrations/004_partenaires_moderation.sql
psql -U <user> -h <host> -d <db> -f sql/migrations/005_partenaires_securite.sql
```

Chaque fichier est idempotent (peut être rejoué sans erreur). Après application de `001_users_unifies.sql`, redémarrer le backend : le code d'authentification lit désormais la table `users`, plus `administrateurs`/`utilisateurs` directement.

Après application de `002_candidatures_suivi.sql`, `candidatures` a les colonnes `user_id` (nullable) et `statut` (défaut `recue`) : `getAllCandidatures`, `postCandidature` et le nouvel endpoint `GET /candidatures/mes-candidatures` en dépendent.
