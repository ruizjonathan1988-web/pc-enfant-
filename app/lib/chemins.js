'use strict';
const path = require('path');
const fs = require('fs');

const DEV = process.platform !== 'win32' || !!process.env.FLOCON_DEV;
const BASE = DEV ? path.join(__dirname, '..', '..', '_dev', 'ProgramData', 'Flocon') : path.join(process.env.ProgramData || 'C:\\ProgramData', 'Flocon');

const C = {
  DEV,
  base: BASE,
  config: path.join(BASE, 'config.json'),          // écrit par l'installateur et le gardien seulement
  etat: path.join(BASE, 'etat.json'),              // écrit par le gardien seulement
  journalGardien: path.join(BASE, 'gardien.log'),
  boite: path.join(BASE, 'boite'),                 // seul dossier où l'enfant peut écrire
  // Version 1 (un seul enfant) : gardés pour la migration.
  demande: path.join(BASE, 'boite', 'demande.json'),
  parent: path.join(BASE, 'boite', 'parent.json')
};

// Version 2 : un dossier par enfant. Sa boîte aux lettres n'est modifiable que par son compte.
const { dossierCompte } = require('./enfants');
function pour(compte) {
  const d = dossierCompte(compte);
  return {
    etat: path.join(BASE, 'enfants', d, 'etat.json'),          // écrit par le gardien seulement
    boite: path.join(BASE, 'boite', d),
    demande: path.join(BASE, 'boite', d, 'demande.json'),
    parent: path.join(BASE, 'boite', d, 'parent.json')
  };
}
C.pour = pour;

function lireJson(f, defaut) {
  try { return JSON.parse(fs.readFileSync(f, 'utf8').replace(/^\uFEFF/, '')); } catch (e) { return defaut; }
}

function ecrireJson(f, obj) {
  fs.mkdirSync(path.dirname(f), { recursive: true });
  const tmp = f + '.' + process.pid + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2), 'utf8');
  fs.renameSync(tmp, f);
}

module.exports = { C, lireJson, ecrireJson };
