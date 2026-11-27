'use strict';
// Plusieurs enfants sur le même ordinateur. Logique pure, testable sans Windows.
//
// config.json (version 2) :
//   { version: 2, pinSel, pinHash, aDeuxMaxMinutes, graceMinutes,
//     enfants: [ { compte, prenom, sid, jetonsSemaine, maxParSeance, niveau, sites, jeux, logiciels } ] }
// Le code parent est commun ; tout le reste est propre à chaque enfant.
// La tirelire (tirelire.js) travaille sur une « vue » à plat, au format de la version 1.

const CLES_ENFANT = ['jetonsSemaine', 'maxParSeance', 'niveau', 'sites', 'jeux', 'logiciels', 'interdits'];
const CLES_COMMUNES = ['pinSel', 'pinHash', 'aDeuxMaxMinutes', 'graceMinutes'];

function copie(x) { return x === undefined ? undefined : JSON.parse(JSON.stringify(x)); }

// Accepte une configuration de la version 1 (un seul enfant) et la passe en version 2.
function normaliser(config) {
  if (!config) return null;
  if (Array.isArray(config.enfants)) return config;
  const c = { version: 2 };
  for (const k of CLES_COMMUNES) if (config[k] !== undefined) c[k] = config[k];
  const e = config.enfant || {};
  const enfant = { compte: e.compte || 'Enfant', prenom: e.prenom || '', sid: e.sid || null };
  for (const k of CLES_ENFANT) if (config[k] !== undefined) enfant[k] = copie(config[k]);
  c.enfants = [enfant];
  return c;
}

const memeCompte = (a, b) => String(a || '').toLowerCase() === String(b || '').toLowerCase();

function trouver(config, compte) {
  const c = normaliser(config);
  if (!c) return null;
  return c.enfants.find((e) => memeCompte(e.compte, compte)) || null;
}

// Vue à plat d'un enfant, au format attendu par la tirelire et l'interface.
function vue(config, enfant) {
  const c = normaliser(config);
  const v = { version: 1 };
  for (const k of CLES_COMMUNES) if (c[k] !== undefined) v[k] = c[k];
  for (const k of CLES_ENFANT) if (enfant[k] !== undefined) v[k] = copie(enfant[k]);
  if (v.jeux === undefined) v.jeux = [];
  v.enfant = { prenom: enfant.prenom, compte: enfant.compte, sid: enfant.sid };
  return v;
}

// Reporte une vue à plat modifiée (par le panneau parent) dans la configuration complète.
function integrer(config, compte, v) {
  const c = copie(normaliser(config));
  const e = c.enfants.find((x) => memeCompte(x.compte, compte));
  if (!e) return c;
  for (const k of CLES_ENFANT) if (v[k] !== undefined) e[k] = copie(v[k]);
  for (const k of CLES_COMMUNES) if (v[k] !== undefined) c[k] = v[k];
  return c;
}

// Nom de dossier sûr pour un compte Windows.
function dossierCompte(compte) {
  return String(compte || 'enfant').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9._-]/g, '_') || 'enfant';
}

module.exports = { CLES_ENFANT, CLES_COMMUNES, normaliser, trouver, vue, integrer, dossierCompte, memeCompte };
