'use strict';
const { app, BrowserWindow, ipcMain, shell, dialog, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn, execFile } = require('child_process');
const { C, lireJson, ecrireJson } = require('./lib/chemins');
const CAT = require('./lib/catalogue');
const E = require('./lib/enfants');
const os = require('os');

app.setName('Flocon');
if (!app.requestSingleInstanceLock()) { app.quit(); process.exit(0); }
// Relancé chaque minute par le Planificateur : si une copie tourne déjà, celle-ci s'arrête sans rien faire.
app.on('second-instance', (_e, argv) => {
  // Le raccourci « Flocon » du menu Démarrer (niveau 4) rouvre la fenêtre ; les relances automatiques ne font rien.
  if (argv.includes('--ouvrir') && fen) { try { fs.unlinkSync(FICHIER_FERME); } catch (e) { /* rien */ } fen.show(); fen.restore(); fen.focus(); }
});

let fen = null;
let quitter = false;
let pleinEcran = true;

const DOSSIER_PROFIL = path.join(app.getPath('appData'), 'Flocon');
const FICHIER_PROFIL = path.join(DOSSIER_PROFIL, 'profil.json');
const FICHIER_FERME = path.join(DOSSIER_PROFIL, 'ferme.json');
let seanceCourante = null;

function dossiers() {
  const docs = app.getPath('documents');
  return {
    exposes: path.join(docs, 'Mes exposés'),
    carnets: path.join(docs, 'Mes carnets'),
    creations: path.join(docs, 'Mes créations'),
    photos: path.join(app.getPath('pictures'), 'Mes photos'),
    musique: app.getPath('music'),
    livresAudio: path.join(app.getPath('music'), 'Mes livres audio'),
    films: path.join(app.getPath('videos'), 'Mes films')
  };
}

// L'enfant de cette session : celui dont le compte Windows est ouvert.
// En test (ou depuis un compte inconnu), le premier enfant de la configuration.
const COMPTE = process.env.FLOCON_COMPTE || os.userInfo().username;
function configComplete() { return E.normaliser(lireJson(C.config, null) || require('./lib/tirelire').configParDefaut()); }
function enfantCourant(c) { return E.trouver(c, COMPTE) || c.enfants[0]; }
function config() { const c = configComplete(); return E.vue(c, enfantCourant(c)); }
function fichiers() { return C.pour(enfantCourant(configComplete()).compte); }

function configPublique() {
  const c = config();
  // Le sel et l'empreinte du code servent à vérifier le code à l'écran ; ce qui compte vraiment
  // (temps à deux, réglages) est revérifié par le gardien, que l'enfant ne peut pas contourner.
  return { niveau: c.niveau || 1, enfant: { prenom: c.enfant && c.enfant.prenom }, jetonsSemaine: c.jetonsSemaine, maxParSeance: c.maxParSeance, aDeuxMaxMinutes: c.aDeuxMaxMinutes, sites: c.sites, jeux: c.jeux || [], pinSel: c.pinSel, pinHash: c.pinHash };
}

function creerFenetre() {
  fen = new BrowserWindow({
    width: 1180, height: 760, minWidth: 640, minHeight: 480, resizable: false, maximizable: false,
    frame: false, show: false, backgroundColor: '#0F0B2E',
    closable: false, fullscreenable: true, autoHideMenuBar: true,
    title: 'Flocon',
    icon: path.join(__dirname, 'ui', 'img', 'icone.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: false, webviewTag: true, spellcheck: false }
  });
  fen.setMenu(null);
  screen.on('display-metrics-changed', caler);
  screen.on('display-added', caler);
  screen.on('display-removed', caler);
  fen.loadFile(path.join(__dirname, 'ui', 'index.html'));
  fen.once('ready-to-show', () => { appliquerMode(true); fen.show(); });
  fen.on('close', (e) => {
    if (quitter) return;
    // Niveau 4 : elle peut fermer Flocon. On note la séance pour ne pas le rouvrir automatiquement.
    if ((config().niveau || 1) >= 4 && !pleinEcran) { ecrireJson(FICHIER_FERME, { seance: seanceCourante, le: new Date().toISOString() }); quitter = true; return; }
    e.preventDefault();
  });
  // Alt+F4, Ctrl+W, Ctrl+R, F5, F11, F12 et outils de développement neutralisés.
  fen.webContents.on('before-input-event', (e, input) => {
    const k = (input.key || '').toLowerCase();
    if ((input.alt && k === 'f4') || (input.control && ['w', 'r', 'q'].includes(k)) || ['f5', 'f11', 'f12'].includes(k) || (input.control && input.shift && k === 'i')) e.preventDefault();
  });
  fen.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  fen.webContents.on('will-navigate', (e) => e.preventDefault());
}

function caler() {
  if (!fen || pleinEcran) return;
  const d = screen.getDisplayMatching(fen.getBounds()) || screen.getPrimaryDisplay();
  fen.setBounds(d.workArea);
}
function appliquerMode(plein) {
  if (!fen) return;
  pleinEcran = plein;
  if (plein) {
    fen.setKiosk(true);
    fen.setAlwaysOnTop(true, 'screen-saver');
  } else {
    fen.setAlwaysOnTop(false);
    fen.setKiosk(false);
    // Le bureau occupe tout l'écran sauf la barre des tâches, qui reste visible pour retrouver ses logiciels.
    caler();
  }
}

// ---------- Navigation filtrée : tout webview ne va que sur les sites autorisés ----------
function domaines() { return CAT.domainesAutorises(config().sites); }

app.on('web-contents-created', (_e, wc) => {
  if (wc.getType() !== 'webview') return;
  const garde = (e, url) => { if (!CAT.urlAutorisee(url, domaines())) { e.preventDefault(); if (fen) fen.webContents.send('site-refuse', url); } };
  wc.on('will-navigate', garde);
  wc.on('will-redirect', garde);
  wc.on('will-frame-navigate', (e) => { if (e.isMainFrame && !CAT.urlAutorisee(e.url, domaines())) { e.preventDefault(); if (fen) fen.webContents.send('site-refuse', e.url); } });
  wc.setWindowOpenHandler(({ url }) => {
    if (CAT.urlAutorisee(url, domaines())) wc.loadURL(url); else if (fen) fen.webContents.send('site-refuse', url);
    return { action: 'deny' };
  });
  wc.session.on('will-download', (e) => e.preventDefault());
});

// Permissions des sites : tout est refusé, sauf la caméra pour les sites qui en ont besoin (Teachable Machine).
function permisCamera(url) {
  let h = ''; try { h = new URL(url).hostname; } catch (e) { return false; }
  return Object.values(CAT.SITES).some((s) => s.camera && s.domaines.some((d) => h === d || h.endsWith('.' + d)));
}
app.whenReady().then(() => {
  const ses = require('electron').session.fromPartition('persist:sites');
  ses.setPermissionRequestHandler((wc, perm, cb, details) => {
    const url = (details && (details.requestingUrl || details.securityOrigin)) || wc.getURL();
    const media = perm === 'media' && (!details || !details.mediaTypes || details.mediaTypes.every((t) => t === 'video'));
    cb(media && permisCamera(url));
  });
  ses.setPermissionCheckHandler((wc, perm, origin) => perm === 'media' && permisCamera(origin));
});

app.on('web-contents-created', (_e, wc) => {
  wc.on('will-attach-webview', (e, prefs, params) => {
    delete prefs.preload;
    prefs.nodeIntegration = false; prefs.contextIsolation = true; prefs.sandbox = true;
    params.partition = 'persist:sites';
    if (!CAT.urlAutorisee(params.src, domaines())) e.preventDefault();
  });
});

// ---------- Lancement des logiciels ----------
function developper(p) { return p.replace(/%([^%]+)%/g, (_, v) => process.env[v] || process.env[v.toUpperCase()] || ''); }
const cacheMenu = {};

function idDemarrer(nom) {
  return new Promise((ok) => {
    if (cacheMenu[nom]) return ok(cacheMenu[nom]);
    if (process.platform !== 'win32') return ok(null);
    const cmd = "Get-StartApps | Where-Object { $_.Name -like '*" + nom.replace(/'/g, "''") + "*' } | Select-Object -First 1 -ExpandProperty AppID";
    execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', cmd], { windowsHide: true, timeout: 15000 }, (err, out) => {
      const id = String(out || '').trim();
      if (id) cacheMenu[nom] = id;
      ok(id || null);
    });
  });
}

async function lancerLogiciel(ref) {
  const l = CAT.LOGICIELS[ref] || (config().logiciels || {})[ref];
  if (!l) return { ok: false, raison: 'inconnu' };
  if (l.uri) { await shell.openExternal(l.uri); return { ok: true }; }
  for (const c of (l.chemins || []).map(developper)) {
    if (fs.existsSync(c)) { spawn(c, [], { detached: true, stdio: 'ignore', cwd: path.dirname(c) }).unref(); return { ok: true }; }
  }
  for (const m of (l.menus || (l.menu ? [l.menu] : []))) {
    const id = await idDemarrer(m);
    if (id) { spawn('explorer.exe', ['shell:AppsFolder\\' + id], { detached: true, stdio: 'ignore' }).unref(); return { ok: true }; }
  }
  return { ok: false, raison: 'absent', nom: l.nom };
}

// ---------- Jeux Steam installés (pour le panneau parent) ----------
function jeuxSteam() {
  const racines = [developper('%ProgramFiles(x86)%\\Steam'), developper('%ProgramFiles%\\Steam')];
  const biblio = new Set();
  for (const r of racines) {
    if (!fs.existsSync(r)) continue;
    biblio.add(path.join(r, 'steamapps'));
    const vdf = path.join(r, 'steamapps', 'libraryfolders.vdf');
    try { const t = fs.readFileSync(vdf, 'utf8'); for (const m of t.matchAll(/"path"\s+"([^"]+)"/g)) biblio.add(path.join(m[1].replace(/\\\\/g, '\\'), 'steamapps')); } catch (e) { /* rien */ }
  }
  const jeux = [];
  for (const b of biblio) {
    let fichiers = [];
    try { fichiers = fs.readdirSync(b).filter((f) => /^appmanifest_\d+\.acf$/.test(f)); } catch (e) { continue; }
    for (const f of fichiers) {
      try {
        const t = fs.readFileSync(path.join(b, f), 'utf8');
        const id = (t.match(/"appid"\s+"(\d+)"/) || [])[1];
        const nom = (t.match(/"name"\s+"([^"]+)"/) || [])[1];
        if (id && nom && !/Steamworks|Redistributable|Proton|Runtime/i.test(nom)) jeux.push({ id, nom });
      } catch (e) { /* rien */ }
    }
  }
  return jeux.sort((a, b) => a.nom.localeCompare(b.nom));
}

// ---------- Fichiers de l'enfant ----------
function sur(nomDossier, fichier) {
  const d = dossiers()[nomDossier];
  if (!d) throw new Error('dossier inconnu');
  const p = path.join(d, path.basename(fichier || ''));
  return { d, p };
}

const EXT_IMG = /\.(jpe?g|png|gif|webp|bmp)$/i, EXT_SON = /\.(mp3|m4a|ogg|wav|flac|aac)$/i, EXT_VID = /\.(mp4|webm|m4v|mov)$/i;

function listerRecursif(d, filtre, max = 400) {
  const res = [];
  const pile = [d];
  while (pile.length && res.length < max) {
    const cur = pile.pop();
    let ent = [];
    try { ent = fs.readdirSync(cur, { withFileTypes: true }); } catch (e) { continue; }
    for (const x of ent) {
      const p = path.join(cur, x.name);
      if (x.isDirectory()) pile.push(p);
      else if (filtre.test(x.name)) { let t = 0; try { t = fs.statSync(p).mtimeMs; } catch (e) { /* rien */ } res.push({ nom: x.name.replace(/\.[^.]+$/, ''), chemin: p, url: 'file:///' + p.replace(/\\/g, '/').replace(/^\//, '').split('/').map(encodeURIComponent).join('/').replace(/^([A-Za-z])%3A/, '$1:'), date: t }); }
    }
  }
  return res.sort((a, b) => b.date - a.date);
}

function lecteursAmovibles() {
  if (process.platform !== 'win32') return [];
  const res = [];
  for (const l of 'DEFGHIJKLMNOPQRSTUVWXYZ') { const r = l + ':\\'; try { if (fs.existsSync(r)) res.push(r); } catch (e) { /* rien */ } }
  return res;
}

function importerPhotos() {
  const dest = path.join(dossiers().photos, new Date().toISOString().slice(0, 10));
  let copies = 0, trouve = false;
  for (const r of lecteursAmovibles()) {
    const dcim = path.join(r, 'DCIM');
    if (!fs.existsSync(dcim)) continue;
    trouve = true;
    for (const f of listerRecursif(dcim, /\.(jpe?g|png|mp4|mov|avi)$/i, 3000)) {
      const cible = path.join(dest, path.basename(f.chemin));
      if (fs.existsSync(cible)) continue;
      fs.mkdirSync(dest, { recursive: true });
      try { fs.copyFileSync(f.chemin, cible); copies++; } catch (e) { /* rien */ }
    }
  }
  return { trouve, copies };
}

function dossierCasque() {
  for (const r of lecteursAmovibles()) {
    for (const n of ['MUSIC', 'Music', 'MUSIQUE', 'Musique']) { const p = path.join(r, n); if (fs.existsSync(p)) return p; }
  }
  return null;
}

// ---------- IPC ----------
function poser(canal, fn) { ipcMain.handle(canal, async (_e, ...a) => { try { return await fn(...a); } catch (err) { return { erreur: String(err && err.message || err) }; } }); }

poser('init', () => {
  const ds = dossiers();
  Object.values(ds).forEach((d) => { try { fs.mkdirSync(d, { recursive: true }); } catch (e) { /* rien */ } });
  const compagnons = [];
  const racine = path.join(__dirname, 'ui', 'img', 'compagnons');
  for (const d of fs.readdirSync(racine)) {
    const p = path.join(racine, d);
    if (fs.statSync(p).isDirectory()) {
      const poses = fs.readdirSync(p).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).map((f) => f.replace(/\.[^.]+$/, ''));
      const ext = (fs.readdirSync(p).find((f) => /\.(png|jpe?g|webp)$/i.test(f)) || '.jpg').replace(/^.*\./, '.');
      compagnons.push({ id: d, poses, ext });
    }
  }
  return {
    dev: C.DEV, plateforme: process.platform,
    catalogue: { PERMIS: CAT.PERMIS, PREMIERS_PAS: CAT.PREMIERS_PAS, IDEES: CAT.IDEES, PROJETS: CAT.PROJETS, RUBRIQUES: CAT.RUBRIQUES, SITES: CAT.SITES, EXPOSE_ETAPES: CAT.EXPOSE_ETAPES, INTENTIONS: CAT.INTENTIONS, ICONES: CAT.ICONES },
    config: configPublique(), etat: lireJson(fichiers().etat, null), profil: lireJson(FICHIER_PROFIL, null), compagnons
  };
});

poser('seance', (id) => { seanceCourante = id; return true; });
poser('fermer', () => { if (fen) fen.close(); return true; });
poser('documentExpose', (fichier) => {
  const { p } = sur('exposes', fichier);
  const x = lireJson(p, null); if (!x) return { ok: false };
  const docx = p.replace(/\.json$/, '.docx');
  if (!fs.existsSync(docx)) fs.writeFileSync(docx, require('./lib/docx').exposeDocx(x, CAT.EXPOSE_ETAPES));
  const writer = (CAT.LOGICIELS.writer.chemins || []).map(developper).find((c) => fs.existsSync(c));
  if (writer) spawn(writer, [docx], { detached: true, stdio: 'ignore' }).unref(); else shell.openPath(docx);
  return { ok: true, chemin: docx };
});
poser('imprimer', (chemin) => {
  const permis = Object.values(dossiers()).map((d) => path.resolve(d));
  const c = path.resolve(String(chemin || ''));
  if (!permis.some((d) => c.startsWith(d + path.sep)) || !fs.existsSync(c)) return { ok: false };
  if (process.platform !== 'win32') return { ok: true, simule: true };
  spawn('powershell.exe', ['-NoProfile', '-Command', 'Start-Process -FilePath $args[0] -Verb Print', c], { detached: true, stdio: 'ignore', windowsHide: true }).unref();
  return { ok: true };
});
poser('etat', () => ({ etat: lireJson(fichiers().etat, null), config: configPublique() }));
poser('demande', (d) => { const f = fichiers().demande; const cur = lireJson(f, {}) || {}; ecrireJson(f, Object.assign(cur, d, { le: new Date().toISOString() })); return true; });
poser('parent', (req) => { ecrireJson(fichiers().parent, Object.assign({}, req, { le: new Date().toISOString() })); return true; });
poser('profil', (p) => { if (p) ecrireJson(FICHIER_PROFIL, p); return lireJson(FICHIER_PROFIL, null); });
poser('mode', (plein) => { appliquerMode(!!plein); return true; });
poser('reduire', () => { if (fen && !pleinEcran) fen.minimize(); return true; });
poser('lancer', async (t) => {
  if (t.type === 'logiciel') return lancerLogiciel(t.ref);
  if (t.type === 'jeu') { await shell.openExternal('steam://rungameid/' + encodeURIComponent(t.ref)); return { ok: true }; }
  return { ok: false };
});
poser('urlAutorisee', (u) => CAT.urlAutorisee(u, domaines()));
poser('jeuxSteam', () => jeuxSteam());
poser('lireDoc', (dossier, fichier) => { const { p } = sur(dossier, fichier); return lireJson(p, null); });
poser('ecrireDoc', (dossier, fichier, contenu) => { const { p } = sur(dossier, fichier); ecrireJson(p, contenu); return true; });
poser('listerDocs', (dossier) => { const { d } = sur(dossier, ''); try { return fs.readdirSync(d).filter((f) => f.endsWith('.json')).map((f) => ({ fichier: f, ...(lireJson(path.join(d, f), {}) || {}) })); } catch (e) { return []; } });
poser('ouvrirDossier', (dossier) => { const { d } = sur(dossier, ''); fs.mkdirSync(d, { recursive: true }); return shell.openPath(d); });
poser('photos', () => listerRecursif(dossiers().photos, EXT_IMG, 300));
poser('musique', () => listerRecursif(dossiers().musique, EXT_SON, 400));
poser('livresAudio', () => listerRecursif(dossiers().livresAudio, EXT_SON, 400));
poser('creations', () => listerRecursif(dossiers().creations, /\.(jpe?g|png|gif|webp|bmp|mp4|webm|m4v|mov|mp3|m4a|ogg|wav)$/i, 300).map((f) => Object.assign(f, { type: EXT_IMG.test(f.chemin) ? 'image' : EXT_VID.test(f.chemin) ? 'video' : 'son' })));
poser('films', () => listerRecursif(dossiers().films, EXT_VID, 200));
poser('importerPhotos', () => importerPhotos());
poser('casque', () => ({ dossier: dossierCasque() }));
poser('copierCasque', (chemins) => {
  const d = dossierCasque(); if (!d) return { ok: false };
  const permis = dossiers().musique; let n = 0;
  for (const c of chemins || []) { if (!path.resolve(c).startsWith(path.resolve(permis))) continue; try { fs.copyFileSync(c, path.join(d, path.basename(c))); n++; } catch (e) { /* rien */ } }
  return { ok: true, n };
});
poser('choisirFond', async () => {
  const r = await dialog.showOpenDialog(fen, { title: 'Choisis ta photo', defaultPath: dossiers().photos, properties: ['openFile'], filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp'] }] });
  if (r.canceled || !r.filePaths[0]) return null;
  fs.mkdirSync(DOSSIER_PROFIL, { recursive: true });
  const dest = path.join(DOSSIER_PROFIL, 'fond' + path.extname(r.filePaths[0]).toLowerCase());
  fs.copyFileSync(r.filePaths[0], dest);
  return 'file:///' + dest.replace(/\\/g, '/') + '?t=' + Date.now();
});
poser('finir', () => {
  // Fin de séance : on ferme la session Windows. En test, on quitte simplement.
  if (C.DEV) { quitter = true; setTimeout(() => app.quit(), 300); return true; }
  setTimeout(() => spawn('shutdown.exe', ['/l'], { detached: true, stdio: 'ignore' }).unref(), 1500);
  return true;
});

// Réglages de LibreOffice pour son compte, posés une seule fois avant le premier lancement :
// affichage en onglets (comme Word), enregistrement en .docx/.pptx/.xlsx sans alerte, pas d'astuce au démarrage.
function reglagesLibreOffice() {
  if (process.platform !== 'win32') return;
  const f = path.join(app.getPath('appData'), 'LibreOffice', '4', 'user', 'registrymodifications.xcu');
  if (fs.existsSync(f)) return;
  const item = (chemin, prop, type, val) => `<item oor:path="${chemin}"><prop oor:name="${prop}" oor:op="fuse"><value>${val}</value></prop></item>`;
  const fab = (doc, filtre) => item(`/org.openoffice.Setup/Office/Factories/org.openoffice.Setup:Factory['${doc}']`, 'ooSetupFactoryDefaultFilter', 'string', filtre);
  const barre = (app2) => item(`/org.openoffice.Office.UI.ToolbarMode/Applications/org.openoffice.Office.UI.ToolbarMode:Application['${app2}']`, 'Active', 'string', 'notebookbar.ui');
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<oor:items xmlns:oor="http://openoffice.org/2001/registry" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">\n'
    + [fab('com.sun.star.text.TextDocument', 'MS Word 2007 XML'), fab('com.sun.star.presentation.PresentationDocument', 'Impress MS PowerPoint 2007 XML'), fab('com.sun.star.sheet.SpreadsheetDocument', 'Calc MS Excel 2007 XML'),
      item('/org.openoffice.Office.Common/Save/Document', 'WarnAlienFormat', 'boolean', 'false'), item('/org.openoffice.Office.Common/Misc', 'ShowTipOfTheDay', 'boolean', 'false'),
      barre('Writer'), barre('Impress'), barre('Calc')].join('\n') + '\n</oor:items>\n';
  try { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, xml, 'utf8'); } catch (e) { /* rien */ }
}

app.whenReady().then(() => {
  // Niveau 4 : si elle a fermé Flocon pendant cette séance, la relance automatique ne le rouvre pas.
  if ((config().niveau || 1) >= 4 && !process.argv.includes('--ouvrir')) {
    const f = lireJson(FICHIER_FERME, null); const e = lireJson(fichiers().etat, null);
    if (f && e && e.session && !e.session.fermee && e.session.id === f.seance) { app.quit(); return; }
  }
  try { fs.unlinkSync(FICHIER_FERME); } catch (e) { /* rien */ }
  reglagesLibreOffice();
  creerFenetre();
});
app.on('window-all-closed', () => { if (quitter) app.quit(); });
