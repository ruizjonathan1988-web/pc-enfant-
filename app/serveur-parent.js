'use strict';
// Flocon : le tableau parent, sur le téléphone, par le Wi-Fi de la maison (rien ne passe par Internet).
// Lancé au démarrage par la tâche « Flocon Parent » (SYSTEM) : Flocon.exe avec ELECTRON_RUN_AS_NODE=1.
//
// Il lit la configuration et les tirelires. Pour agir (jetons, niveau, terminer une séance), il dépose une demande
// dans la boîte de l'enfant, avec le code parent, exactement comme l'espace parent du PC : c'est le gardien qui
// vérifie le code et l'applique dans la minute. Un seul chemin pour changer les réglages.

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { C, lireJson, ecrireJson } = require('./lib/chemins');
function log(m) { try { fs.appendFileSync(path.join(C.base, 'parent.log'), new Date().toISOString() + ' ' + m + '\r\n'); } catch (e) { /* rien */ } }
const T = require('./lib/tirelire');
const E = require('./lib/enfants');

const PORT = Number(process.env.FLOCON_PORT || 4747);
const DUREE_JETON = 12 * 3600 * 1000;      // une connexion dure 12 h
const ESSAIS = 5;                          // codes faux avant blocage
const BLOCAGE = 15 * 60 * 1000;            // 15 minutes
const PAGE = path.join(__dirname, 'parent', 'index.html');

const jetons = new Map();                  // jeton → { pin, expire } (en mémoire seulement)
let echecs = { n: 0, jusqua: 0 };

function config() { return E.normaliser(lireJson(C.config, null)); }

function etatEnfant(c, e) {
  const st = lireJson(C.pour(e.compte).etat, null) || {};
  const s = st.session && !st.session.fermee ? st.session : null;
  const semaine = (st.journal || []).filter((j) => j.debut && T.idSemaine(new Date(j.debut)) === st.semaine);
  const minutesSemaine = semaine.reduce((a, j) => a + (j.minutes || 0), 0) + (s ? s.minutes || 0 : 0);
  return {
    compte: e.compte, prenom: e.prenom, niveau: e.niveau || 1, jetonsSemaine: e.jetonsSemaine, maxParSeance: e.maxParSeance,
    jetonsRestants: st.jetonsRestants, minutesSemaine, seancesSemaine: semaine.length + (s ? 1 : 0),
    seance: s ? { minutes: s.minutes || 0, pris: s.pris || 0, aDeux: !!s.aDeux, debut: s.debut, resteMinutes: st.resteMinutes } : null,
    dernieres: (st.journal || []).slice(-5).reverse().map((j) => ({ debut: j.debut, minutes: j.minutes, aDeux: !!j.aDeux, raison: j.raison }))
  };
}

function lireCorps(req) {
  return new Promise((ok, ko) => {
    let d = '';
    req.on('data', (x) => { d += x; if (d.length > 10000) { ko(new Error('trop long')); req.destroy(); } });
    req.on('end', () => { try { ok(d ? JSON.parse(d) : {}); } catch (e) { ko(e); } });
  });
}
function repondre(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(JSON.stringify(obj));
}
function session(req) {
  const j = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const s = jetons.get(j);
  if (!s || s.expire < Date.now()) { jetons.delete(j); return null; }
  return s;
}

const ACTIONS = {
  ajouter: (v) => ({ ajouterJetons: Math.max(1, Math.min(8, Math.floor(Number(v) || 1))) }),
  niveau: (v) => ({ niveau: Math.max(1, Math.min(4, Math.floor(Number(v) || 1))) }),
  jetonsSemaine: (v) => ({ jetonsSemaine: Math.max(0, Math.min(40, Math.floor(Number(v) || 0))) }),
  terminer: () => ({ terminer: true })
};

async function traiter(req, res) {
  const url = new URL(req.url, 'http://flocon');
  if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Frame-Options': 'DENY' });
    return res.end(fs.readFileSync(PAGE));
  }
  if (req.method === 'POST' && url.pathname === '/api/connexion') {
    if (echecs.jusqua > Date.now()) return repondre(res, 429, { erreur: 'bloque', attente: Math.ceil((echecs.jusqua - Date.now()) / 60000) });
    const corps = await lireCorps(req);
    const c = config();
    if (!c || !c.enfants.length) return repondre(res, 503, { erreur: 'pas-installe' });
    const pin = String(corps.pin || '');
    if (!T.pinValide(E.vue(c, c.enfants[0]), pin)) {
      echecs.n++;
      if (echecs.n >= ESSAIS) { echecs = { n: 0, jusqua: Date.now() + BLOCAGE }; log('tableau parent : bloqué 15 minutes après ' + ESSAIS + ' codes faux'); }
      return repondre(res, 401, { erreur: 'code', restants: ESSAIS - echecs.n });
    }
    echecs.n = 0;
    const jeton = crypto.randomBytes(24).toString('hex');
    jetons.set(jeton, { pin, expire: Date.now() + DUREE_JETON });
    return repondre(res, 200, { jeton });
  }
  const s = session(req);
  if (url.pathname.startsWith('/api/') && !s) return repondre(res, 401, { erreur: 'connexion' });
  if (req.method === 'GET' && url.pathname === '/api/etat') {
    const c = config();
    return repondre(res, 200, { enfants: c.enfants.map((e) => etatEnfant(c, e)), le: new Date().toISOString() });
  }
  if (req.method === 'POST' && url.pathname === '/api/action') {
    const corps = await lireCorps(req);
    const c = config(); const e = E.trouver(c, corps.compte);
    const fabrique = ACTIONS[corps.action];
    if (!e || !fabrique) return repondre(res, 400, { erreur: 'demande' });
    // Même boîte que l'espace parent du PC : le gardien vérifie le code et applique dans la minute.
    const f = C.pour(e.compte).parent;
    const avant = lireJson(f, null);
    const changements = Object.assign({}, avant && avant.pin === s.pin ? avant.changements : {}, fabrique(corps.valeur));
    if (avant && avant.changements && avant.changements.ajouterJetons && changements.ajouterJetons && corps.action === 'ajouter') changements.ajouterJetons += avant.changements.ajouterJetons;
    ecrireJson(f, { pin: s.pin, changements, le: new Date().toISOString(), source: 'telephone' });
    log('tableau parent : ' + corps.action + ' pour ' + e.compte);
    return repondre(res, 200, { ok: true, applique: 'dans la minute' });
  }
  repondre(res, 404, { erreur: 'introuvable' });
}

const serveur = http.createServer((req, res) => { traiter(req, res).catch((e) => repondre(res, 400, { erreur: String(e.message || e) })); });
serveur.listen(PORT, '0.0.0.0', () => log('tableau parent : à l’écoute sur le port ' + PORT));
serveur.on('error', (e) => { log('tableau parent : ' + e.message); process.exit(1); });
