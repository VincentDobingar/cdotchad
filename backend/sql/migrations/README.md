# Migrations

Fichiers SQL numérotés, à appliquer manuellement dans l'ordre (pas d'outil de migration en place) :

```
psql -U <user> -h <host> -d <db> -f sql/migrations/001_users_unifies.sql
```

Chaque fichier est idempotent (peut être rejoué sans erreur). Après application de `001_users_unifies.sql`, redémarrer le backend : le code d'authentification lit désormais la table `users`, plus `administrateurs`/`utilisateurs` directement.
