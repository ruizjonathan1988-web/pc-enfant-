'use strict';
// Contrôles des fichiers de Flocon sur la machine de test Windows.
//   node verifier.js <contrôle> [arguments]
// Sort avec le code 1 et un message en français si quelque chose ne va pas.
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const BASE = path.join(process.env.ProgramData || 'C:\\ProgramData', 'Flocon');
const lire = (f) => JSON.parse(fs.readFileSync(f, 'utf8').replace(/^\uFEFF/, ''));
const ecrire = (f, o) => fs.writeFileSync(f, JSON.stringify(o, null, 2));
const config = () => lire(path.join(BASE, 'config.json'));
const enfant = (c, compte) => c.enfants.find((e) => e.compte.toLowerCase() === compte.toLowerCase());
const [, , controle, ...args] = process.argv;

const C = {
  // Installation neuve : une liste d'un seul enfant reste une liste.
  neuf() {
    const c = config();
    assert.strictEqual(c.version, 2, 'config en version 2');
    assert.ok(Array.isArray(c.enfants), 'enfants est une liste (et non un objet seul)');
    assert.strictEqual(c.enfants.length, 1);
    const b = c.enfants[0];
    assert.strictEqual(b.compte, 'Brune'); assert.ok(/^S-1-5-21-/.test(b.sid), 'SID renseigné');
    assert.strictEqual(b.jetonsSemaine, 8); assert.strictEqual(b.maxParSeance, 5); assert.strictEqual(b.niveau, 1);
    assert.ok(Array.isArray(b.jeux), 'jeux est une liste');
    assert.ok(c.pinHash && c.pinSel, 'code parent enregistré');
    const crypto = require('crypto');
    assert.strictEqual(crypto.createHash('sha256').update(c.pinSel + ':1234').digest('hex'), c.pinHash, 'le code 1234 est le bon');
  },
  // Prépare l'ajout : Brune passe au niveau 3 avec un seul site et un seul jeu (listes d'un élément).
  preparerAjout() {
    const c = config(); const b = enfant(c, 'Brune');
    b.niveau = 3; b.sites = ['vikidia.org']; b.jeux = [{ id: '42', nom: 'Un jeu' }];
    ecrire(path.join(BASE, 'config.json'), c);
  },
  ajout() {
    const c = config();
    assert.strictEqual(c.enfants.length, 2, 'deux enfants');
    const b = enfant(c, 'Brune'); const t = enfant(c, 'Test');
    assert.ok(b && t, 'Brune et Test présents');
    assert.strictEqual(b.niveau, 3, 'le niveau de Brune est gardé');
    assert.deepStrictEqual(b.sites, ['vikidia.org'], 'un seul site reste une liste');
    assert.ok(Array.isArray(b.jeux) && b.jeux.length === 1 && b.jeux[0].id === '42', 'un seul jeu reste une liste');
    assert.strictEqual(t.niveau, 1); assert.strictEqual(t.jetonsSemaine, 4); assert.strictEqual(t.maxParSeance, 2);
    assert.ok(/^S-1-5-21-/.test(t.sid));
  },
  photo(fichier) { fs.writeFileSync(fichier, JSON.stringify({ config: config(), etat: lire(path.join(BASE, 'enfants', 'brune', 'etat.json')) })); },
  // Mise à jour : ni la configuration ni la tirelire ne bougent.
  maj(fichier) {
    const avant = lire(fichier);
    assert.deepStrictEqual(config(), avant.config, 'configuration identique après mise à jour');
    const e = lire(path.join(BASE, 'enfants', 'brune', 'etat.json'));
    assert.strictEqual(e.jetonsRestants, avant.etat.jetonsRestants, 'tirelire identique');
  },
  // Remet la machine dans l'état d'une installation 1.4.3 (un seul enfant, tirelire à la racine).
  preparerMigration() {
    const c = config(); const b = enfant(c, 'Brune');
    const v1 = { version: 1, enfant: { prenom: 'Brune', compte: 'Brune', sid: b.sid }, jetonsSemaine: 8, maxParSeance: 5, aDeuxMaxMinutes: 120, graceMinutes: 5, niveau: 2, pinSel: c.pinSel, pinHash: c.pinHash, sites: ['vikidia.org'], jeux: [{ id: '42', nom: 'Un jeu' }], logiciels: null };
    ecrire(path.join(BASE, 'config.json'), v1);
    const e = lire(path.join(BASE, 'enfants', 'brune', 'etat.json')); e.jetonsRestants = 3;
    ecrire(path.join(BASE, 'etat.json'), e);
    fs.rmSync(path.join(BASE, 'enfants'), { recursive: true, force: true });
  },
  migration() {
    const c = config();
    assert.strictEqual(c.version, 2); assert.strictEqual(c.enfants.length, 1);
    const b = c.enfants[0];
    assert.strictEqual(b.niveau, 2, 'niveau repris de la 1.4.3');
    assert.deepStrictEqual(b.sites, ['vikidia.org']); assert.strictEqual(b.jeux.length, 1);
    assert.ok(!fs.existsSync(path.join(BASE, 'etat.json')), 'ancienne tirelire déplacée');
    assert.strictEqual(lire(path.join(BASE, 'enfants', 'brune', 'etat.json')).jetonsRestants, 3, 'tirelire reprise');
  },
  // L'interface a démarré pour ce compte : elle a écrit sa demande d'atelier dans sa boîte.
  interface(compte) {
    const d = lire(path.join(BASE, 'boite', compte.toLowerCase(), 'demande.json'));
    assert.strictEqual(d.atelier, true, 'demande d\u2019atelier écrite par l\u2019interface');
  },
  etat(compte) {
    const e = lire(path.join(BASE, 'enfants', compte.toLowerCase(), 'etat.json'));
    assert.ok(e.semaine && typeof e.jetonsRestants === 'number', 'tirelire tenue par le gardien');
  }
};

try {
  if (!C[controle]) throw new Error('contrôle inconnu : ' + controle);
  C[controle](...args);
} catch (e) {
  console.error('ÉCHEC ' + controle + ' : ' + e.message);
  process.exit(1);
}
