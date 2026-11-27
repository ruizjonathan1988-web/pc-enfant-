'use strict';
// Le gardien : lancé chaque minute par le Planificateur de tâches, avec le compte SYSTEM.
// L'enfant ne peut ni l'arrêter ni modifier ce qu'il écrit.
// Lancement : Flocon.exe avec ELECTRON_RUN_AS_NODE=1 et ce fichier en argument.

const fs = require('fs');
const { execFileSync } = require('child_process');
const T = require('./lib/tirelire');
const { C, lireJson, ecrireJson } = require('./lib/chemins');

function log(msg) {
  try {
    fs.mkdirSync(C.base, { recursive: true });
    const ligne = new Date().toISOString() + ' ' + msg + '\n';
    fs.appendFileSync(C.journalGardien, ligne);
    const st = fs.statSync(C.journalGardien);
    if (st.size > 512 * 1024) fs.writeFileSync(C.journalGardien, fs.readFileSync(C.journalGardien, 'utf8').slice(-128 * 1024));
  } catch (e) { /* rien */ }
}

// Retourne { active, id } pour le compte enfant, d'après « quser ».
function sessionEnfant(compte) {
  if (C.DEV) return { active: process.env.FLOCON_ACTIF === '1', id: null };
  let sortie = '';
  try { sortie = execFileSync('quser', [], { encoding: 'utf8', windowsHide: true }); } catch (e) { sortie = String((e && e.stdout) || ''); }
  for (const brut of sortie.split(/\r?\n/).slice(1)) {
    const l = brut.replace(/^>/, ' ').trim();
    if (!l) continue;
    const morceaux = l.split(/\s+/);
    if (morceaux[0].toLowerCase() !== String(compte).toLowerCase()) continue;
    const idx = morceaux.findIndex((m) => /^\d+$/.test(m));
    const id = idx >= 0 ? morceaux[idx] : null;
    const etatTxt = idx >= 0 ? (morceaux[idx + 1] || '') : '';
    return { active: /^(active|actif)/i.test(etatTxt), id };
  }
  return { active: false, id: null };
}

function deconnecter(id) {
  if (C.DEV || !id) { log('déconnexion (simulée) session ' + id); return; }
  try { execFileSync('logoff', [String(id)], { windowsHide: true }); log('déconnexion session ' + id); } catch (e) { log('échec déconnexion : ' + e.message); }
}

// Remet les verrous du compte enfant si sa ruche de registre est chargée (session ouverte).
function verrous(sid) {
  if (C.DEV || !sid) return;
  const base = 'HKU\\' + sid;
  const cles = [
    [base + '\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\System', 'DisableTaskMgr', '1'],
    [base + '\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\System', 'DisableRegistryTools', '1'],
    [base + '\\Software\\Policies\\Microsoft\\Windows\\System', 'DisableCMD', '1'],
    [base + '\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\Explorer', 'DisallowRun', '1']
  ];
  const interdits = ['powershell.exe', 'pwsh.exe', 'powershell_ise.exe', 'wt.exe', 'cmd.exe', 'regedit.exe', 'taskmgr.exe', 'mmc.exe', 'msedge.exe', 'chrome.exe', 'firefox.exe', 'brave.exe', 'opera.exe'];
  try {
    execFileSync('reg', ['query', base], { windowsHide: true, stdio: 'ignore' });
  } catch (e) { return; } // ruche non chargée : l'enfant n'est pas connectée
  for (const [cle, nom, val] of cles) {
    try { execFileSync('reg', ['add', cle, '/v', nom, '/t', 'REG_DWORD', '/d', val, '/f'], { windowsHide: true, stdio: 'ignore' }); } catch (e) { log('reg ' + nom + ' : ' + e.message); }
  }
  interdits.forEach((exe, i) => {
    try { execFileSync('reg', ['add', base + '\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\Explorer\\DisallowRun', '/v', String(i + 1), '/t', 'REG_SZ', '/d', exe, '/f'], { windowsHide: true, stdio: 'ignore' }); } catch (e) { /* rien */ }
  });
}

function principal() {
  const maintenant = new Date();
  let config = lireJson(C.config, null);
  if (!config) { log('pas de configuration, rien à faire'); return; }
  let etat = lireJson(C.etat, null);

  // Demandes du panneau parent (protégées par le code).
  const reqParent = lireJson(C.parent, null);
  if (reqParent) {
    const r = T.appliquerParent(config, etat, reqParent);
    try { fs.unlinkSync(C.parent); } catch (e) { /* rien */ }
    if (r.ok) { config = r.config; etat = r.etat; ecrireJson(C.config, config); log('réglages parent appliqués'); }
    else log('code parent refusé');
    if (etat) etat.retourParent = { ok: r.ok, le: maintenant.toISOString() };
  }

  const demande = lireJson(C.demande, null);
  const sess = sessionEnfant(config.enfant.compte);
  const r = T.tic(etat, config, demande, maintenant, sess.active);
  if (etat && etat.retourParent) r.etat.retourParent = etat.retourParent;
  if (r.message) r.etat.dernierMessage = { code: r.message, le: maintenant.toISOString(), session: demande && demande.sessionId };
  ecrireJson(C.etat, r.etat);
  if (r.deconnecter) deconnecter(sess.id);
  if (sess.active && maintenant.getMinutes() % 5 === 0) verrous(config.enfant.sid);
  if (sess.active && r.etat.session && r.etat.session.minutes === 1) verrous(config.enfant.sid);
}

try { principal(); } catch (e) { log('erreur : ' + (e && e.stack || e)); }
