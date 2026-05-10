# Formulaire visite SDB — Fortis Rénovation

Application Next.js destinée aux prospects Fortis Rénovation avant une visite de qualification pour un projet de salle de bain.

La V1 est volontairement séparée de Notion : le formulaire produit un PDF via PDF.co, puis Apps Script enregistre ce PDF dans Google Drive. Les données ne créent pas automatiquement d’affaire dans le CRM.

## Installation locale

```bash
npm install
cp .env.example .env.local
npm run dev
```

Puis ouvrir `http://localhost:3000`.

## Variables d’environnement Next / Vercel

```env
APPS_SCRIPT_WEBHOOK_URL=
APPS_SCRIPT_WEBHOOK_SECRET=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dlmt2ctha
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=Cloudinary
```

- `APPS_SCRIPT_WEBHOOK_URL` : URL `/exec` du déploiement Web App Apps Script.
- `APPS_SCRIPT_WEBHOOK_SECRET` : secret partagé avec Apps Script.
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` et `TURNSTILE_SECRET_KEY` : optionnels. Si `TURNSTILE_SECRET_KEY` est défini, l’API vérifie le token anti-spam.
- `NEXT_PUBLIC_SITE_URL` : URL publique Vercel.
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` et `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` : configuration de l’upload des photos de la salle de bain actuelle.

## Apps Script

Le projet Apps Script existe déjà :

`Questionnaire client SDB`

Lien d’édition :

https://script.google.com/u/1/home/projects/1R0HDaNnbkQRvtCvkgQ9iIQOB94ZQGEp9xSIqT7ZqPzR-NpCcISj2YP5S/edit

Coller le contenu de `apps-script/Code.gs` dans ce projet.

### Script Properties

Dans Apps Script, configurer :

```txt
PDFCO_API_KEY=<cle PDF.co>
WEBHOOK_SECRET=<même valeur que APPS_SCRIPT_WEBHOOK_SECRET>
SDB_DRIVE_FOLDER_ID=<id du dossier Drive>
```

La clé PDF.co ne doit jamais être commitée. Comme elle a déjà été partagée en clair dans la conversation de préparation, il est recommandé de la régénérer après configuration.

## Déployer Apps Script

1. Ouvrir le projet `Questionnaire client SDB`.
2. Coller `apps-script/Code.gs`.
3. Ajouter les Script Properties.
4. Cliquer sur `Deploy` > `New deployment`.
5. Choisir `Web app`.
6. Exécuter en tant que propriétaire.
7. Copier l’URL `/exec`.
8. Mettre cette URL dans `APPS_SCRIPT_WEBHOOK_URL` côté Vercel.

## Déployer sur Vercel

1. Importer le repo `mbiville-hash/formulaire_visite`.
2. Ajouter les variables d’environnement.
3. Déployer.
4. Tester une soumission complète depuis l’URL de production.

## Tester la génération du PDF

1. Dans Apps Script, vérifier que `PDFCO_API_KEY`, `WEBHOOK_SECRET` et `SDB_DRIVE_FOLDER_ID` sont configurés.
2. Exécuter `testWithExamplePayload` depuis Apps Script.
3. Autoriser les permissions demandées par Google.
4. Vérifier qu’un PDF est créé dans le dossier Drive.
5. Tester ensuite le formulaire depuis Next.js.

## Checklist avant mise en production

- Formulaire lisible sur mobile et desktop.
- Champs obligatoires bloqués : prénom, nom, email, téléphone, adresse, budget.
- Erreur claire si Apps Script échoue.
- Secret invalide refusé par Apps Script.
- PDF généré par PDF.co.
- PDF enregistré dans le bon dossier Drive.
- Photos Cloudinary intégrées dans le PDF si le client en ajoute.
- Nom du fichier au format `preparation-rdv-salle-de-bain-prenom-nom-date.pdf`.
- Aucune donnée écrite dans Notion.
- `npm run build` réussi.
