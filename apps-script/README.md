# Apps Script — Questionnaire client SDB

Ce dossier contient le script à coller dans le projet Apps Script existant :

`Questionnaire client SDB`

Projet :

`1R0HDaNnbkQRvtCvkgQ9iIQOB94ZQGEp9xSIqT7ZqPzR-NpCcISj2YP5S`

## Propriétés à configurer

Dans `Project Settings` > `Script Properties`, ajouter :

```txt
PDFCO_API_KEY=<cle PDF.co>
WEBHOOK_SECRET=<secret partage avec Vercel>
SDB_DRIVE_FOLDER_ID=<id du dossier Drive de destination>
```

La clé PDF.co ne doit pas être écrite dans le code.

## Déploiement

1. Coller le contenu de `Code.gs` dans Apps Script.
2. Configurer les Script Properties.
3. Déployer en `Web app`.
4. Exécuter en tant que propriétaire du script.
5. Autoriser l’accès à toute personne disposant du lien ou selon le réglage souhaité.
6. Copier l’URL `/exec` dans `APPS_SCRIPT_WEBHOOK_URL` côté Vercel.

L’URL d’édition Apps Script n’est pas utilisable comme webhook.
