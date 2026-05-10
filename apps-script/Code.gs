const CONFIG = {
  pdfCoEndpoint: 'https://api.pdf.co/v1/pdf/convert/from/html',
  pdfMargins: '10mm 10mm 10mm 10mm',
  pdfPaperSize: 'A4',
};

function doPost(e) {
  try {
    const payload = parseRequest_(e);
    validateWebhookSecret_(e, payload);
    validatePayload_(payload);

    const result = processBathroomPreparation_(payload);

    return jsonResponse_({
      ok: true,
      fileId: result.file.getId(),
      fileName: result.file.getName(),
      fileUrl: result.file.getUrl(),
    });
  } catch (error) {
    console.error(error.stack || error);
    return jsonResponse_({ ok: false, error: error.message });
  }
}

function processBathroomPreparation_(payload) {
  const pdfCoApiKey = getRequiredProperty_('PDFCO_API_KEY');
  const driveFolderId = getRequiredProperty_('SDB_DRIVE_FOLDER_ID');
  const folder = DriveApp.getFolderById(driveFolderId);
  const filename = buildFilename_(payload);
  const html = buildPdfHtml_(payload);
  const pdfBlob = createPdfWithPdfCo_(html, filename, pdfCoApiKey);
  const file = folder.createFile(pdfBlob.setName(filename));

  return { file };
}

function parseRequest_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error('Requete vide.');
  }

  return JSON.parse(e.postData.contents);
}

function validateWebhookSecret_(e, payload) {
  const expectedSecret = PropertiesService.getScriptProperties().getProperty('WEBHOOK_SECRET');
  if (!expectedSecret) return;

  const querySecret = e && e.parameter && e.parameter.secret;
  const payloadSecret = payload && payload.webhook_secret;
  if (querySecret !== expectedSecret && payloadSecret !== expectedSecret) {
    throw new Error('Secret webhook invalide.');
  }
}

function validatePayload_(payload) {
  const required = ['firstName', 'lastName', 'email', 'phone', 'projectAddress', 'budget'];
  const missing = required.filter(function(field) {
    return !String(payload[field] || '').trim();
  });

  if (missing.length) {
    throw new Error('Champs manquants: ' + missing.join(', '));
  }
}

function getRequiredProperty_(name) {
  const value = PropertiesService.getScriptProperties().getProperty(name);
  if (!value) {
    throw new Error('Propriete Apps Script manquante: ' + name);
  }

  return value;
}

function createPdfWithPdfCo_(html, filename, apiKey) {
  const response = UrlFetchApp.fetch(CONFIG.pdfCoEndpoint, {
    method: 'post',
    contentType: 'application/json',
    headers: { 'x-api-key': apiKey },
    payload: JSON.stringify({
      html: html,
      name: filename,
      margins: CONFIG.pdfMargins,
      paperSize: CONFIG.pdfPaperSize,
      async: false,
    }),
    muteHttpExceptions: true,
  });

  const responseText = response.getContentText();
  let body;
  try {
    body = JSON.parse(responseText);
  } catch (error) {
    throw new Error('Reponse PDF.co illisible: ' + responseText.substring(0, 240));
  }

  if (response.getResponseCode() >= 300 || body.error) {
    throw new Error('Erreur PDF.co: ' + (body.message || responseText));
  }
  if (!body.url) {
    throw new Error('PDF.co n a pas retourne d URL de PDF.');
  }

  const pdfResponse = UrlFetchApp.fetch(body.url, {
    method: 'get',
    muteHttpExceptions: true,
  });

  if (pdfResponse.getResponseCode() >= 300) {
    throw new Error('Telechargement PDF impossible: ' + pdfResponse.getResponseCode());
  }

  return pdfResponse.getBlob().setContentType('application/pdf');
}

function buildFilename_(data) {
  const date = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const firstName = slug_(data.firstName || 'client');
  const lastName = slug_(data.lastName || 'fortis');
  return sanitizeFilename_('preparation-rdv-salle-de-bain-' + firstName + '-' + lastName + '-' + date + '.pdf');
}

function buildPdfHtml_(data) {
  const submittedAt = data.submittedAt ? new Date(data.submittedAt) : new Date();
  const submissionDate = Utilities.formatDate(submittedAt, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');
  const fullName = [data.firstName, data.lastName].filter(Boolean).join(' ');
  const photoUrls = normalizeArray_(data.currentBathroomPhotos).filter(Boolean).slice(0, 6);

  return '<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/>' +
    '<link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:wght@400;700&family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet"/>' +
    '<style>' +
    '*{box-sizing:border-box;margin:0;padding:0}' +
    ':root{--dark:#111110;--gold:#b8975a;--paper:#f5f0e8;--white:#fff;--ink:#1a1a18;--soft:rgba(26,26,24,.62);--line:rgba(184,151,90,.28)}' +
    'body{background:var(--paper);font-family:Montserrat,sans-serif;color:var(--ink);font-size:12px;line-height:1.62;-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
    '.page{width:210mm;min-height:297mm;margin:0 auto;background:var(--paper)}' +
    '.header{background:var(--dark);padding:30px 40px 26px;color:var(--white)}' +
    '.brand{font-family:"Bodoni Moda",serif;font-size:18px;font-weight:700;letter-spacing:.04em}.brand span{color:var(--gold)}' +
    '.kicker{margin-top:6px;font-size:8px;font-weight:700;letter-spacing:.24em;text-transform:uppercase;color:rgba(255,255,255,.45)}' +
    '.title{margin-top:28px;font-family:"Bodoni Moda",serif;font-size:28px;line-height:1.12;max-width:520px}' +
    '.subtitle{margin-top:12px;color:rgba(255,255,255,.62);font-size:11px;letter-spacing:.02em}' +
    '.goldbar{height:3px;background:var(--gold)}' +
    '.body{padding:30px 40px 42px}' +
    '.meta{display:grid;grid-template-columns:1fr 1fr;border:1px solid var(--line);background:#fff;margin-bottom:28px}' +
    '.meta-cell{padding:12px 14px;border-right:1px solid var(--line);border-bottom:1px solid var(--line)}.meta-cell:nth-child(even){border-right:none}.meta-cell:nth-last-child(-n+2){border-bottom:none}' +
    '.label{font-size:8px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--gold);margin-bottom:4px}.value{font-size:12px;font-weight:600;color:var(--ink)}' +
    '.summary{background:var(--dark);color:#fff;padding:20px 22px;margin-bottom:28px;break-inside:avoid}.summary-title{font-family:"Bodoni Moda",serif;font-size:20px;margin-bottom:14px}.summary-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.summary-item{border-top:1px solid rgba(184,151,90,.35);padding-top:8px}.summary-label{font-size:7px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--gold);margin-bottom:4px}.summary-value{font-size:11px;color:rgba(255,255,255,.82)}' +
    '.section{margin:0 0 22px}.section-title{font-size:9px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:var(--gold);padding-bottom:8px;border-bottom:1px solid var(--line);margin-bottom:12px;display:flex;align-items:center;gap:10px}.section-title:before{content:"";width:20px;height:1px;background:var(--gold);display:block}' +
    '.qa{break-inside:avoid;background:#fff;border-left:2px solid var(--gold);padding:10px 14px;margin-bottom:8px}.question{font-size:9px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--soft);margin-bottom:4px}.answer{white-space:pre-wrap;font-size:12px;color:var(--ink)}' +
    '.photos{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.photo{height:118px;background:#e8e2d8;border:1px solid var(--line);overflow:hidden}.photo img{width:100%;height:100%;object-fit:cover;display:block}' +
    '.footer{background:var(--dark);color:rgba(255,255,255,.45);padding:14px 40px;font-size:9px;display:flex;justify-content:space-between}.footer strong{color:var(--gold);font-weight:600}' +
    '</style></head><body><div class="page">' +
    '<div class="header"><div class="brand">FORTIS<span>.</span></div><div class="kicker">Renovation salle de bain</div>' +
    '<h1 class="title">Préparation rendez-vous — Rénovation salle de bain</h1>' +
    '<p class="subtitle">Document généré automatiquement à partir du questionnaire client.</p></div><div class="goldbar"></div>' +
    '<div class="body">' +
    '<div class="meta">' +
    metaCell_('Date de soumission', submissionDate) +
    metaCell_('Client', fullName) +
    metaCell_('Email', data.email) +
    metaCell_('Téléphone', data.phone) +
    metaCell_('Adresse du projet', data.projectAddress) +
    metaCell_('Budget', data.budget) +
    '</div>' +
    '<div class="summary"><div class="summary-title">Synthèse du projet</div><div class="summary-grid">' +
    summaryCell_('Logement', data.housingType || 'Non renseigné') +
    summaryCell_('Budget', data.budget || 'Non renseigné') +
    summaryCell_('Aménagement', data.layoutPreference || 'Non renseigné') +
    summaryCell_('Échéance', buildTimelineSummary_(data)) +
    summaryCell_('Accompagnement', formatValue_(data.supportNeeds) || 'Non renseigné') +
    summaryCell_('Photos jointes', photoUrls.length ? photoUrls.length + ' photo(s)' : 'Aucune photo jointe') +
    '</div></div>' +
    section_('Informations client', [
      ['Type de logement', data.housingType],
      ['Logement occupé pendant les travaux', data.occupiedDuringWorks],
    ]) +
    section_('Votre projet', [
      ['Motivation principale', data.mainMotivation],
      ['Salle de bain idéale', data.idealBathroom],
      ['Utilisateurs principaux', data.bathroomUsers],
    ]) +
    section_('Aménagement souhaité', [
      ['Préférence', data.layoutPreference],
      ['Équipements souhaités', data.equipments],
      ['Éléments à conserver ou éviter', data.conserveOrAvoid],
    ]) +
    section_('Style et ambiance', [
      ['Inspirations', data.inspirations],
      ['Style attirant', data.preferredStyles],
      ['Matériaux ou finitions aimés', data.likedMaterials],
    ]) +
    section_('Délais et contraintes', [
      ['Échéance', data.timeline],
      ['Date précise', data.preciseDate],
      ['Contraintes particulières', data.constraints],
    ]) +
    section_('Accompagnement souhaité', [
      ['Accompagnement attendu', data.supportNeeds],
      ['Niveau de liberté souhaité', data.designFreedom],
    ]) +
    '<div class="section"><div class="section-title">Photos de la salle de bain actuelle</div>' +
    (photoUrls.length ? '<div class="photos">' + photoGrid_(photoUrls) + '</div>' : qa_('Photos jointes', 'Aucune photo jointe.')) +
    qa_('Compléments', 'Le client pourra transmettre des plans ou inspirations complémentaires par email ou SMS après l’envoi du formulaire.') +
    '</div>' +
    '</div><div class="footer"><span>193 Rue du Renard · 76000 Rouen · 07 67 49 13 24</span><strong>fortisrenovation.fr</strong></div>' +
    '</div></body></html>';
}

function summaryCell_(label, value) {
  return '<div class="summary-item"><div class="summary-label">' + escapeHtml_(label) + '</div><div class="summary-value">' + escapeHtml_(value || 'Non renseigné') + '</div></div>';
}

function metaCell_(label, value) {
  return '<div class="meta-cell"><div class="label">' + escapeHtml_(label) + '</div><div class="value">' + escapeHtml_(value || 'Non renseigné') + '</div></div>';
}

function section_(title, rows) {
  return '<div class="section"><div class="section-title">' + escapeHtml_(title) + '</div>' +
    rows.map(function(row) {
      return qa_(row[0], row[1]);
    }).join('') +
    '</div>';
}

function qa_(question, value) {
  const answer = formatValue_(value);
  return '<div class="qa"><div class="question">' + escapeHtml_(question) + '</div><div class="answer">' + escapeHtml_(answer || 'Non renseigné') + '</div></div>';
}

function formatValue_(value) {
  if (Array.isArray(value)) return value.length ? value.join(', ') : '';
  return String(value || '');
}

function buildTimelineSummary_(data) {
  if (data.timeline === 'Avant une date précise' && data.preciseDate) {
    return 'Fin souhaitée le ' + data.preciseDate;
  }
  return data.timeline || 'Non renseigné';
}

function photoGrid_(urls) {
  return urls.map(function(url, index) {
    return '<div class="photo"><img src="' + escapeAttribute_(url) + '" alt="Salle de bain actuelle ' + (index + 1) + '"/></div>';
  }).join('');
}

function normalizeArray_(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return [value];
}

function slug_(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);
}

function sanitizeFilename_(name) {
  return String(name).replace(/[\\/:*?"<>|]/g, '-');
}

function escapeHtml_(value) {
  return String(value === undefined || value === null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttribute_(value) {
  return escapeHtml_(value).replace(/`/g, '&#96;');
}

function jsonResponse_(body) {
  return ContentService
    .createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}

function testWithExamplePayload() {
  return processBathroomPreparation_({
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean@example.fr',
    phone: '06 12 34 56 78',
    projectAddress: '10 rue Exemple, 76000 Rouen',
    housingType: 'Appartement',
    occupiedDuringWorks: 'Oui',
    mainMotivation: 'Moderniser une installation vieillissante.',
    idealBathroom: 'Esprit hôtel, chaleureuse et intemporelle.',
    bathroomUsers: ['Couple', 'Invités'],
    layoutPreference: 'Une douche',
    equipments: ['Meuble vasque', 'Douche à l’italienne', 'Miroir lumineux'],
    conserveOrAvoid: 'Éviter le noir mat.',
    inspirations: ['Photos Pinterest / Instagram'],
    preferredStyles: ['Contemporain', 'Hôtel / spa'],
    likedMaterials: 'Travertin, laiton, bois clair.',
    budget: '14 000 à 17 000 €',
    timeline: 'Dans les 3 mois',
    preciseDate: '',
    constraints: 'Appartement au 3e étage.',
    supportNeeds: ['La conception complète', 'Une solution clé en main'],
    designFreedom: 'J’ai quelques envies, mais je veux être guidé',
    photosPlansAvailability: 'Je peux les envoyer plus tard',
    currentBathroomPhotos: [],
    submittedAt: new Date().toISOString(),
  });
}
