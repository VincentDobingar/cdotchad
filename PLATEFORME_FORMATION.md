# Plateforme de formation en ligne — cdotchad-v2

Intégration de l'analyse technique DBS Africa du 8 novembre 2026 (v1.1) dans le site existant.
Le dossier `cdotchad` d'origine n'est pas modifié : tout le travail est dans `cdotchad-v2`,
sur la branche git `plateforme-formation`.

## Ce qui a été ajouté

| Module de l'analyse | Où |
|---|---|
| Catalogue et inscriptions (places limitées, gratuite ou payante, validation) | `/formations`, `/formations/:slug` |
| Classe virtuelle en direct (BigBlueButton piloté par API, ou lien Zoom/Jitsi) | `services/formation/bbb.service.js` |
| Contrôle d'accès : lien d'entrée personnel, jamais de lien public | `POST /formations/espace/seances/:id/rejoindre` |
| Présence (arrivée, départ, durée relevées par BBB ; saisie manuelle possible) | rappel `/formations/bbb/analytique` |
| Replays privés : import MP4 automatique, liens temporaires, journal | `services/formation/replays.service.js`, `stockage.service.js` |
| Supports de cours (même circuit privé) | onglet « Supports et replays » |
| Évaluations : QCM, vrai/faux, réponse courte, devoirs, essais, date limite | `/mes-formations/:id/evaluations/:eid` |
| Certificat PDF (numéro unique, QR code, e-mail) et vérification publique | `/certificats/verifier/:numero` |
| Tableau de bord, export CSV, journal des accès | `/admin/formations` |

Choix « audio d'abord » : caméras des participants coupées par défaut, seules celles des
formateurs sont diffusées. Filigrane nominatif affiché sur le lecteur de replay.

### Fichiers

- `backend/sql/migrations/009_plateforme_formation.sql` (14 tables `formation*`, aucune table existante modifiée)
- `backend/services/formation/` : config, bbb, stockage, replays, résultats, certificat, outils
- `backend/controllers/formations*.controller.js`, `backend/routes/formations*.routes.js`
- `backend/middlewares/uploadFormation.js`, `backend/assets/formation/logo-cdotchad.png`
- `backend/index.js` : montage de `/backend/formations` et `/backend/admin/formations`
- `frontend/src/pages/public/{Formations,FormationDetail,VerifierCertificat}.jsx`
- `frontend/src/pages/formation/` : espace participant
- `frontend/src/pages/admin/formations/` : administration
- Menus : lien « Formations » (barre du site), « Mes formations » (espaces candidat et partenaire), section « Formations » (admin)

## Installation

```bash
cd backend
npm install                       # ajoute qrcode, fast-xml-parser (+ SDK S3 optionnel)
psql -U <user> -h <host> -d <db> -f sql/migrations/009_plateforme_formation.sql
# compléter le .env avec backend/formation.env.example
cd ../frontend && npm install && npm run build
```

## Les deux options d'hébergement (§07 et §08 de l'analyse)

**Option cPanel (démarrage rapide)** : laisser `BBB_URL` vide, `FORMATION_STOCKAGE=local` (ou `s3`).
Créer les séances en « Service hébergé » avec un lien Zoom/Jitsi : le lien n'est remis qu'aux inscrits
validés. La présence se saisit dans « Présences », le replay se dépose dans « Déposer un replay ».
Catalogue, inscriptions, quiz, certificats et tableau de bord fonctionnent tels quels. Les certificats sont
délivrés par lots de 20 pour rester dans les limites de l'hébergement.

**Option VPS + BigBlueButton (cible)** : renseigner `BBB_URL` et `BBB_SECRET`. Sur le serveur vidéo,
activer le format vidéo des enregistrements pour obtenir le MP4 :
installer `bbb-playback-video` et ajouter le format `video` aux étapes (`steps`) de
`/etc/bigbluebutton/recording/recording.yml` (voir la documentation BigBlueButton « Recording »). Sans ce format, le replay apparaît « en erreur » avec
le message correspondant. Passer `FORMATION_STOCKAGE=s3` avec un bucket privé pour les replays.

## Décisions de la direction qui restent ouvertes (§12)

Elles sont toutes réglables sans toucher au code :

- BigBlueButton ou Zoom : par séance (champ « Classe virtuelle »).
- Gratuit/payant : tarif par session. Le paiement est enregistré à la main (« Paiement reçu » + référence) ;
  le paiement Mobile Money en ligne n'est pas branché.
- Seuils du certificat et règle d'absence (replay vu en entier ou non) : par session.
- Téléchargement des replays et durée de conservation : par session.
- Modèle du certificat : signataire, fonction, images de signature et de cachet dans le `.env`.

## Limites connues

- Le filigrane est un calque sur le lecteur, pas incrusté dans la vidéo.
- Le visionnage « en entier » est signalé par le lecteur du navigateur (seuil 95 %).
- Les formateurs utilisent les comptes d'administration (pas de rôle « formateur » distinct).
- Testé avec un faux serveur BigBlueButton reproduisant son API ; à valider sur le serveur réel pendant la formation pilote.
