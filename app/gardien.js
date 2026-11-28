'use strict';
// Le gardien : lancé chaque minute par le Planificateur de tâches, avec le compte SYSTEM.
// L'enfant ne peut ni l'arrêter ni modifier ce qu'il écrit.
// Lancement : Flocon.exe avec ELECTRON_RUN_AS_NODE=1 et ce fichier en argument.

const fs = require('fs');
const { execFileSync } = require('child_process');
const T = require('./lib/tirelire');
const { C, lireJson, ecrireJson } = require('./lib/chemins');
const CAT = require('./lib/catalogue');

function log(msg) {
  try {
    fs.mkdirSync(C.base, { recursive: true });
    const ligne = new Date().toISOString() + ' ' + msg + '\n';
    fs.appendFileSync(C.journalGardien, ligne);
    const st = fs.statSync(C.journalGardien);
    if (st.size > 512 * 1024) fs.writeFileSync(C.journalGardien, fs.readFileSync(C.journalGardien, 'utf8').slice(-128 * 1024));
  } catch (e) { /* rien */ }
}

const path = require('path');
const E = require('./lib/enfants');
const SCRIPT_SESSIONS = path.join(__dirname, 'lib', 'sessions.ps1');
const PS = ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', SCRIPT_SESSIONS];

// Sessions Windows ouvertes : [{ id, user, active }].
// D'abord l'API WTS (présente partout, Windows Famille compris), sinon quser (Pro seulement).
function listerSessions() {
  if (C.DEV) return (process.env.FLOCON_ACTIF || '').split(',').filter(Boolean).map((u, i) => ({ id: i + 1, user: u, active: true }));
  try {
    const out = execFileSync('powershell.exe', PS.concat(['liste']), { encoding: 'utf8', windowsHide: true, timeout: 60000 });
    const l = JSON.parse(String(out).trim() || '[]');
    if (Array.isArray(l)) return l;
  } catch (e) { log('sessions (WTS) : ' + e.message); }
  return listerQuser();
}

function listerQuser() {
  let sortie = '';
  try { sortie = execFileSync('quser', [], { encoding: 'utf8', windowsHide: true }); } catch (e) { sortie = String((e && e.stdout) || ''); }
  const res = [];
  for (const brut of sortie.split(/\r?\n/).slice(1)) {
    const l = brut.replace(/^>/, ' ').trim();
    if (!l) continue;
    const morceaux = l.split(/\s+/);
    const idx = morceaux.findIndex((m) => /^\d+$/.test(m));
    if (idx < 0) continue;
    res.push({ id: Number(morceaux[idx]), user: morceaux[0], active: /^(active|actif)/i.test(morceaux[idx + 1] || '') });
  }
  return res;
}

function deconnecter(id) {
  if (C.DEV || !id) { log('déconnexion (simulée) session ' + id); return; }
  try { execFileSync('powershell.exe', PS.concat(['deconnecter', String(id)]), { windowsHide: true, timeout: 60000 }); log('déconnexion session ' + id); return; } catch (e) { log('déconnexion (WTS) : ' + e.message); }
  try { execFileSync('logoff', [String(id)], { windowsHide: true }); log('déconnexion session ' + id + ' (logoff)'); } catch (e) { log('échec déconnexion : ' + e.message); }
}

function reg(args) { try { execFileSync('reg', args, { windowsHide: true, stdio: 'ignore' }); return true; } catch (e) { return false; } }

// Remet les verrous du compte enfant si sa ruche de registre est chargée (session ouverte).
// Ils dépendent du niveau du permis : au niveau 3, Edge s'ouvre, mais seulement sur les sites autorisés.
// Programmes interdits sur sa session (lancés depuis Windows : menu Démarrer, bureau, explorateur).
// Le Microsoft Store n'y est pas : sur Windows Famille rien ne l'interdit vraiment à un seul compte
// (la stratégie RemoveWindowsStore ne vaut qu'en Entreprise et Éducation), et Stop Motion Studio s'installe par lui.
const INTERDITS_BASE = ['powershell.exe', 'pwsh.exe', 'powershell_ise.exe', 'wt.exe', 'cmd.exe', 'regedit.exe', 'taskmgr.exe', 'mmc.exe', 'chrome.exe', 'firefox.exe', 'brave.exe', 'opera.exe'];
// Minecraft.Windows.exe (Bedrock) n'y est plus : le lanceur l'ouvre, et le temps est compté par la séance de toute façon.
function listeInterdits(config) {
  const niveau = (config && config.niveau) || 1;
  // Ceux que le parent ajoute (ameli, carte CPS…) : des noms de fichiers .exe, sans chemin.
  const parent = ((config && config.interdits) || []).map((x) => String(x).trim()).filter((x) => /^[\w .()+-]+\.exe$/i.test(x));
  const l = INTERDITS_BASE.concat(niveau >= 3 ? [] : ['msedge.exe'], parent);
  return Array.from(new Set(l.map((x) => x.toLowerCase()))).map((x) => l.find((y) => y.toLowerCase() === x));
}

// Niveaux 1 et 2 : liste blanche. Windows n'ouvre plus, depuis le menu Démarrer, la barre des tâches, la recherche
// ou l'Explorateur, que Flocon et les logiciels de son catalogue (Word, jeux téléchargés, .exe double-cliqués : refusés).
// Les logiciels que Flocon lance lui-même ne passent pas par là.
const PERMIS_EN_PLUS = ['Flocon.exe', 'soffice.exe', 'soffice.bin', 'Minecraft.Windows.exe', 'CalculatorApp.exe', 'WindowsCamera.exe', 'SoundRec.exe', 'VoiceRecorder.exe', 'gcompris-qt.exe', 'GCompris.exe', 'RapidTyping.exe', 'steam.exe'];
function listeAutorises(niveau) {
  // Edge n'y est qu'à partir du niveau 3.
  const l = Object.values(CAT.LOGICIELS).flatMap((x) => (x.chemins || []).map((c) => c.split('\\').pop())).concat(PERMIS_EN_PLUS).filter((x) => x.toLowerCase() !== 'msedge.exe').concat(niveau >= 3 ? ['msedge.exe'] : []);
  return Array.from(new Set(l.map((x) => x.toLowerCase()))).map((x) => l.find((y) => y.toLowerCase() === x));
}

function verrous(sid, config) {
  const niveau = (config && config.niveau) || 1;
  if (C.DEV || !sid) return;
  const base = 'HKU\\' + sid;
  const cles = [
    [base + '\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\System', 'DisableTaskMgr', '1'],
    [base + '\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\System', 'DisableRegistryTools', '1'],
    [base + '\\Software\\Policies\\Microsoft\\Windows\\System', 'DisableCMD', '1'],
    [base + '\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\Explorer', 'DisallowRun', '1']
  ];
  const interdits = listeInterdits(config);
  // Aux niveaux 1 et 2, tout passe par Flocon : bureau sans icônes, ni Paramètres ni « Toutes les applications ».
  const explorer = base + '\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\Explorer';
  // TaskbarNoPinnedList : plus d'icônes épinglées dans la barre des tâches (Word, Edge, Store…).
  const parNiveau = [[explorer, 'NoDesktop'], [explorer, 'NoControlPanel'], [explorer, 'NoStartMenuMorePrograms'], [explorer, 'TaskbarNoPinnedList']];
  try {
    execFileSync('reg', ['query', base], { windowsHide: true, stdio: 'ignore' });
  } catch (e) { return; } // ruche non chargée : l'enfant n'est pas connectée
  for (const [cle, nom, val] of cles) {
    try { execFileSync('reg', ['add', cle, '/v', nom, '/t', 'REG_DWORD', '/d', val, '/f'], { windowsHide: true, stdio: 'ignore' }); } catch (e) { log('reg ' + nom + ' : ' + e.message); }
  }
  for (const [cle, nom] of parNiveau) {
    if (niveau <= 2) reg(['add', cle, '/v', nom, '/t', 'REG_DWORD', '/d', '1', '/f']);
    else reg(['delete', cle, '/v', nom, '/f']);
  }
  // Liste blanche jusqu'au niveau 3 compris : avec Edge ouvert, on ne lance pas pour autant un programme
  // trouvé en fouillant le disque C:. Le disque C: est caché dans « Ce PC », et Win+R désactivé.
  const cleRR = explorer + '\\RestrictRun';
  reg(['delete', cleRR, '/f']);
  if (niveau <= 3) {
    reg(['add', explorer, '/v', 'RestrictRun', '/t', 'REG_DWORD', '/d', '1', '/f']);
    listeAutorises(niveau).forEach((exe, i) => reg(['add', cleRR, '/v', String(i + 1), '/t', 'REG_SZ', '/d', exe, '/f']));
    reg(['add', explorer, '/v', 'NoDrives', '/t', 'REG_DWORD', '/d', '4', '/f']);
    reg(['add', explorer, '/v', 'NoRun', '/t', 'REG_DWORD', '/d', '1', '/f']);
  } else ['RestrictRun', 'NoDrives', 'NoRun'].forEach((v) => reg(['delete', explorer, '/v', v, '/f']));
  const cleDR = base + '\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\Explorer\\DisallowRun';
  reg(['delete', cleDR, '/f']);
  interdits.forEach((exe, i) => reg(['add', cleDR, '/v', String(i + 1), '/t', 'REG_SZ', '/d', exe, '/f']));
  // Edge : stratégies utilisateur. Tout est bloqué sauf la liste blanche, recherche dans Vikidia, pas de navigation privée.
  const edge = base + '\\Software\\Policies\\Microsoft\\Edge';
  if (niveau >= 3) {
    reg(['delete', edge, '/f']);
    reg(['add', edge + '\\URLBlocklist', '/v', '1', '/t', 'REG_SZ', '/d', '*', '/f']);
    CAT.domainesAutorises(config.sites).forEach((d, i) => reg(['add', edge + '\\URLAllowlist', '/v', String(i + 1), '/t', 'REG_SZ', '/d', d, '/f']));
    const dw = [['InPrivateModeAvailability', '1'], ['DeveloperToolsAvailability', '2'], ['BrowserAddProfileEnabled', '0'], ['BrowserGuestModeEnabled', '0'], ['HideFirstRunExperience', '1'], ['DefaultSearchProviderEnabled', '1'], ['DownloadRestrictions', '3']];
    dw.forEach(([n, v]) => reg(['add', edge, '/v', n, '/t', 'REG_DWORD', '/d', v, '/f']));
    const sz = [['DefaultSearchProviderName', 'Vikidia'], ['DefaultSearchProviderSearchURL', 'https://fr.vikidia.org/w/index.php?search={searchTerms}'], ['HomepageLocation', 'https://fr.vikidia.org']];
    sz.forEach(([n, v]) => reg(['add', edge, '/v', n, '/t', 'REG_SZ', '/d', v, '/f']));
  } else {
    reg(['delete', edge, '/f']);
  }
}

// Une configuration et un état de la version 1 passent en version 2 (un dossier par enfant).
function migrer(config) {
  const c = E.normaliser(config);
  if (c === config) return c;
  ecrireJson(C.config, c);
  const p = C.pour(c.enfants[0].compte);
  if (!fs.existsSync(p.etat) && fs.existsSync(C.etat)) { fs.mkdirSync(path.dirname(p.etat), { recursive: true }); fs.renameSync(C.etat, p.etat); }
  log('configuration passée en version 2');
  return c;
}

function unEnfant(config, enfant, sessions, maintenant) {
  const p = C.pour(enfant.compte);
  let v = E.vue(config, enfant);
  let etat = lireJson(p.etat, null);

  // Demandes du panneau parent (protégées par le code).
  const reqParent = lireJson(p.parent, null);
  if (reqParent) {
    const r = T.appliquerParent(v, etat, reqParent);
    try { fs.unlinkSync(p.parent); } catch (e) { /* rien */ }
    if (r.ok) { config = E.integrer(config, enfant.compte, r.config); v = E.vue(config, enfant); etat = r.etat; ecrireJson(C.config, config); log(enfant.compte + ' : réglages parent appliqués'); }
    else log(enfant.compte + ' : code parent refusé');
    if (etat) etat.retourParent = { ok: r.ok, le: maintenant.toISOString() };
  }

  const demande = lireJson(p.demande, null);
  const sess = sessions.find((s) => E.memeCompte(s.user, enfant.compte)) || { active: false, id: null };
  const r = T.tic(etat, v, demande, maintenant, !!sess.active);
  if (etat && etat.retourParent) r.etat.retourParent = etat.retourParent;
  if (r.message) r.etat.dernierMessage = { code: r.message, le: maintenant.toISOString(), session: demande && demande.sessionId };
  ecrireJson(p.etat, r.etat);
  // Le code tapé pour « à deux » ne reste pas en clair dans la boîte : il ne sert qu'à ouvrir la séance.
  if (demande && demande.aDeuxPin && r.etat.session && r.etat.session.id === demande.sessionId) {
    try { ecrireJson(p.demande, Object.assign({}, demande, { aDeuxPin: null })); } catch (e) { /* rien */ }
  }
  if (r.deconnecter) deconnecter(sess.id);
  if (sess.active && (maintenant.getMinutes() % 5 === 0 || (r.etat.session && r.etat.session.minutes === 1) || reqParent)) verrous(enfant.sid, v);
  return config;
}

function principal() {
  const maintenant = new Date();
  let config = lireJson(C.config, null);
  if (!config) { log('pas de configuration, rien à faire'); return; }
  config = migrer(config);
  const sessions = listerSessions();
  for (const enfant of config.enfants.slice()) {
    try { config = unEnfant(config, config.enfants.find((e) => E.memeCompte(e.compte, enfant.compte)), sessions, maintenant); }
    catch (e) { log(enfant.compte + ' : erreur : ' + (e && e.stack || e)); }
  }
}

// Lancé par le Planificateur : un tic. Chargé par un test : on expose les briques, sans rien lancer.
// « gardien.js verrous <compte> » : l'installateur fait poser les verrous par le gardien lui-même (une seule source).
function verrousDe(compte) {
  const c = E.normaliser(lireJson(C.config, null));
  const e = c && E.trouver(c, compte);
  if (!e || !e.sid) throw new Error('enfant inconnu : ' + compte);
  verrous(e.sid, E.vue(c, e));
}
if (require.main === module) {
  if (process.argv[2] === 'verrous') { try { verrousDe(process.argv[3]); } catch (e) { console.error(e.message); process.exit(1); } }
  else { try { principal(); } catch (e) { log('erreur : ' + (e && e.stack || e)); } }
}
module.exports = { verrous, verrousDe, listeInterdits, listeAutorises, listerSessions, deconnecter, principal };
