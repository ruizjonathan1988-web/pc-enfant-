const assert = require('assert');
const T = require('../app/lib/tirelire');

const cfg = Object.assign(T.configParDefaut(), { pinSel: 'abc' });
cfg.pinHash = T.hacherPin('1234', 'abc');
const lundi = new Date(2026, 10, 23, 17, 0); // lundi 23/11/2026
const min = (d, n) => new Date(d.getTime() + n * 60000);

// semaine
assert.strictEqual(T.idSemaine(new Date(2026, 10, 29, 20)), '2026-11-23');
assert.strictEqual(T.idSemaine(new Date(2026, 10, 30, 8)), '2026-11-30');

// séance de 2 jetons
let r = T.tic(null, cfg, { sessionId: 'a', jetons: 2 }, lundi, true);
assert.strictEqual(r.etat.jetonsRestants, 6);
assert.strictEqual(r.etat.session.minutes, 1);
let e = r.etat;
for (let i = 1; i < 29; i++) { r = T.tic(e, cfg, { sessionId: 'a', jetons: 2 }, min(lundi, i), true); e = r.etat; assert.ok(!r.deconnecter, 'pas avant 30'); }
r = T.tic(e, cfg, { sessionId: 'a', jetons: 2 }, min(lundi, 29), true);
assert.ok(!r.deconnecter, 'séance fermée à 30 min, au revoir affiché');
assert.ok(r.etat.session.fermee); assert.strictEqual(r.etat.session.rendus, 0);
r = T.tic(r.etat, cfg, { sessionId: 'a', jetons: 2 }, min(lundi, 30), true);
assert.ok(!r.deconnecter);
r = T.tic(r.etat, cfg, { sessionId: 'a', jetons: 2 }, min(lundi, 31), true);
assert.ok(r.deconnecter, 'déconnexion deux minutes après la fin');

// plafond par séance et tirelire
r = T.tic(r.etat, cfg, { sessionId: 'b', jetons: 99 }, min(lundi, 60), true);
assert.strictEqual(r.etat.session.pris, 5);
assert.strictEqual(r.etat.jetonsRestants, 1);

// J'ai fini après 10 min : rend 4 jetons sur 5
e = r.etat;
for (let i = 1; i < 10; i++) e = T.tic(e, cfg, { sessionId: 'b', jetons: 5 }, min(lundi, 60 + i), true).etat;
assert.strictEqual(e.session.minutes, 10);
r = T.tic(e, cfg, { sessionId: 'b', jetons: 5, fini: true }, min(lundi, 71), true);
assert.strictEqual(r.etat.session.rendus, 4);
assert.strictEqual(r.etat.jetonsRestants, 5);

// session sans séance : grâce puis déconnexion
e = r.etat; let dec = false;
for (let i = 0; i < 7; i++) { const x = T.tic(e, cfg, { sessionId: 'b', jetons: 5, fini: true }, min(lundi, 80 + i), true); e = x.etat; dec = dec || x.deconnecter; }
assert.ok(dec, 'grâce dépassée');

// à deux avec bon code : gratuit
r = T.tic(e, cfg, { sessionId: 'c', aDeuxPin: '1234' }, min(lundi, 100), true);
assert.ok(r.etat.session.aDeux); assert.strictEqual(r.etat.jetonsRestants, 5);
// mauvais code
r = T.tic(r.etat, cfg, { sessionId: 'd', aDeuxPin: '0000', jetons: 1 }, min(lundi, 101), true);
assert.ok(!r.etat.session.aDeux); assert.strictEqual(r.message, 'pin-refuse'); assert.strictEqual(r.etat.session.pris, 1);

// nouvelle semaine : remplissage sans report
r = T.tic(r.etat, cfg, null, new Date(2026, 10, 30, 9), false);
assert.strictEqual(r.etat.jetonsRestants, 8);

// panneau parent
let p = T.appliquerParent(cfg, r.etat, { pin: '1234', changements: { jetonsSemaine: 10, ajouterJetons: 2, sites: ['a.fr'] } });
assert.ok(p.ok); assert.strictEqual(p.config.jetonsSemaine, 10); assert.strictEqual(p.etat.jetonsRestants, 10); assert.deepStrictEqual(p.config.sites, ['a.fr']);
assert.ok(!T.appliquerParent(cfg, r.etat, { pin: '9', changements: { jetonsSemaine: 40 } }).ok);
p = T.appliquerParent(cfg, r.etat, { pin: '1234', changements: { nouveauPin: '5678' } });
assert.ok(T.pinValide(p.config, '5678')); assert.ok(!T.pinValide(p.config, '1234'));
console.log('tirelire : tous les tests passent');
// atelier : 30 minutes de grâce la toute première fois
{
  let e2 = null, dec2 = false;
  for (let i = 0; i < 25; i++) { const x = T.tic(e2, cfg, { atelier: true }, min(lundi, i), true); e2 = x.etat; dec2 = dec2 || x.deconnecter; }
  assert.ok(!dec2, 'pas de déconnexion pendant l’atelier');
}
console.log('atelier : ok');
// niveau 4 : fin douce (5 minutes de grâce après la fin du temps)
{
  const c4 = Object.assign({}, cfg, { niveau: 4 });
  let e4 = T.tic(null, c4, { sessionId: 'n4', jetons: 1 }, lundi, true).etat; let dec4 = -1;
  for (let i = 1; i < 30 && dec4 < 0; i++) { const x = T.tic(e4, c4, { sessionId: 'n4', jetons: 1 }, min(lundi, i), true); e4 = x.etat; if (x.deconnecter) dec4 = i; }
  assert.strictEqual(dec4, 20, 'niveau 4 : déconnexion 5 minutes après la fin (15 + 5)');
  const p4 = T.appliquerParent(cfg, null, { pin: '1234', changements: { niveau: 9 } });
  assert.strictEqual(p4.config.niveau, 4);
}
console.log('niveaux : ok');
// Après une fin de temps : grâce courte tout de suite, mais grâce normale à la connexion suivante.
{
  let e = T.tic(null, cfg, { sessionId: 'g', jetons: 1 }, lundi, true).etat; let dec = -1;
  for (let i = 1; i < 30 && dec < 0; i++) { const x = T.tic(e, cfg, { sessionId: 'g', jetons: 1 }, min(lundi, i), true); e = x.etat; if (x.deconnecter) dec = i; }
  assert.strictEqual(dec, 16, 'déconnexion une minute après la fin');
  assert.ok(e.session.fermeeLe, 'heure de fin notée');
  // Le lendemain, elle se reconnecte : elle a de nouveau ses cinq minutes à l'accueil.
  const demain = new Date(2026, 10, 24, 17, 0); let dec2 = -1;
  for (let i = 0; i < 10 && dec2 < 0; i++) { const x = T.tic(e, cfg, { sessionId: 'g', jetons: 1 }, min(demain, i), true); e = x.etat; if (x.deconnecter) dec2 = i; }
  assert.strictEqual(dec2, 5, 'grâce normale (5 minutes) le lendemain, et non une minute');
}
console.log('grâce après fin du temps : ok');

// Document Word d'un exposé : archive valide, CRC correct.
{
  const assert = require('assert'); const zlib = require('zlib');
  const { exposeDocx, crc32 } = require('../app/lib/docx');
  assert.strictEqual(crc32(Buffer.from('123456789')), 0xCBF43926);
  const b = exposeDocx({ sujet: 'Les <loups> & co', etapes: [{ notes: 'a\nb' }] }, []);
  assert.strictEqual(b.readUInt32LE(0), 0x04034b50);
  const n = b.readUInt16LE(26); const taille = b.readUInt32LE(18);
  const ct = zlib.inflateRawSync(b.slice(30 + n, 30 + n + taille)).toString();
  assert.ok(ct.includes('wordprocessingml'));
  assert.ok(b.includes(Buffer.from('word/document.xml')));
  console.log('document Word : ok');
}

// Plusieurs enfants : migration de la version 1, vues séparées, code commun.
{
  const assert = require('assert');
  const E = require('../app/lib/enfants');
  const v1 = { version: 1, enfant: { prenom: 'Brune', compte: 'Brune', sid: 'S-1' }, jetonsSemaine: 8, maxParSeance: 5, aDeuxMaxMinutes: 120, graceMinutes: 5, niveau: 3, pinSel: 'abc', pinHash: T.hacherPin('1234', 'abc'), sites: ['vikidia.org'], jeux: [{ id: '1', nom: 'Jeu' }], logiciels: null };
  const c = E.normaliser(v1);
  assert.strictEqual(c.version, 2); assert.strictEqual(c.enfants.length, 1);
  assert.strictEqual(c.enfants[0].niveau, 3); assert.deepStrictEqual(c.enfants[0].sites, ['vikidia.org']);
  assert.strictEqual(E.normaliser(c), c, 'version 2 inchangée');
  c.enfants.push({ compte: 'Test', prenom: 'Test', sid: 'S-2', jetonsSemaine: 4, maxParSeance: 2, niveau: 1, sites: null, jeux: [] });
  assert.strictEqual(E.trouver(c, 'brune').prenom, 'Brune', 'compte sans tenir compte de la casse');
  const vt = E.vue(c, E.trouver(c, 'Test'));
  assert.strictEqual(vt.jetonsSemaine, 4); assert.strictEqual(vt.pinHash, v1.pinHash); assert.strictEqual(vt.enfant.compte, 'Test');
  // Le panneau parent de Test ne touche pas Brune ; un nouveau code vaut pour tous.
  const r = T.appliquerParent(vt, null, { pin: '1234', changements: { niveau: 2, jetonsSemaine: 6, nouveauPin: '9876' } });
  assert.ok(r.ok);
  const c2 = E.integrer(c, 'Test', r.config);
  assert.strictEqual(E.trouver(c2, 'Test').niveau, 2); assert.strictEqual(E.trouver(c2, 'Brune').niveau, 3);
  assert.ok(T.pinValide(E.vue(c2, E.trouver(c2, 'Brune')), '9876'));
  assert.strictEqual(E.dossierCompte('Léa Martin'), 'lea_martin');
  console.log('plusieurs enfants : ok');
}

// Le gardien en mode test : migration d'une installation 1.4.3, deux enfants, code « à deux » effacé.
{
  const assert = require('assert'); const fs = require('fs'); const path = require('path'); const { execFileSync } = require('child_process');
  const { C } = require('../app/lib/chemins');
  if (!C.DEV) throw new Error('ce test efface ses données : lancer avec FLOCON_DEV=1 sous Windows');
  fs.rmSync(C.base, { recursive: true, force: true }); fs.mkdirSync(path.join(C.base, 'boite'), { recursive: true });
  const v1 = Object.assign(T.configParDefaut(), { enfant: { prenom: 'Brune', compte: 'Brune', sid: null }, niveau: 3, pinSel: 'abc', pinHash: T.hacherPin('1234', 'abc') });
  fs.writeFileSync(C.config, JSON.stringify(v1));
  fs.writeFileSync(C.etat, JSON.stringify(T.etatInitial(v1, new Date())));
  const gardien = (actifs) => execFileSync(process.execPath, [path.join(__dirname, '..', 'app', 'gardien.js')], { env: Object.assign({}, process.env, { FLOCON_ACTIF: actifs }) });
  gardien('');
  let c = JSON.parse(fs.readFileSync(C.config, 'utf8'));
  assert.strictEqual(c.version, 2); assert.strictEqual(c.enfants[0].niveau, 3);
  assert.ok(fs.existsSync(C.pour('Brune').etat) && !fs.existsSync(C.etat), 'tirelire déplacée');
  c.enfants.push({ compte: 'Test', prenom: 'Test', sid: null, jetonsSemaine: 4, maxParSeance: 2, niveau: 1, sites: null, jeux: [] });
  fs.writeFileSync(C.config, JSON.stringify(c));
  const pt = C.pour('Test'); fs.mkdirSync(pt.boite, { recursive: true });
  fs.writeFileSync(pt.demande, JSON.stringify({ sessionId: 's1', jetons: 0, aDeuxPin: '1234' }));
  gardien('Test');
  const et = JSON.parse(fs.readFileSync(pt.etat, 'utf8'));
  assert.ok(et.session.aDeux, 'séance à deux ouverte pour Test'); assert.strictEqual(et.session.minutes, 1);
  assert.strictEqual(JSON.parse(fs.readFileSync(pt.demande, 'utf8')).aDeuxPin, null, 'code effacé de la boîte');
  const eb = JSON.parse(fs.readFileSync(C.pour('Brune').etat, 'utf8'));
  assert.strictEqual(eb.jetonsRestants, 8, 'Brune non touchée');
  fs.rmSync(C.base, { recursive: true, force: true });
  console.log('gardien, plusieurs enfants : ok');
}

// Programmes interdits : la base, Edge selon le niveau, ceux du parent (noms .exe seulement).
{
  const assert = require('assert');
  const { listeInterdits } = require('../app/gardien');
  const l1 = listeInterdits({ niveau: 1, interdits: ['AmeliPro.exe', 'C:\\x\\y.exe', 'rm -rf', 'CMD.exe'] });
  assert.ok(l1.includes('msedge.exe') && l1.includes('AmeliPro.exe'));
  assert.ok(!l1.some((x) => x.includes('\\') || x.includes('rm')), 'pas de chemin ni de commande');
  assert.strictEqual(l1.filter((x) => x.toLowerCase() === 'cmd.exe').length, 1, 'sans doublon');
  assert.ok(!listeInterdits({ niveau: 3 }).includes('msedge.exe'), 'Edge permis au niveau 3');
  console.log('programmes interdits : ok');
}

// Liste blanche des niveaux 1 et 2 : Flocon et ses logiciels, ni Word ni Edge.
{
  const assert = require('assert');
  const { listeAutorises } = require('../app/gardien');
  const l = listeAutorises().map((x) => x.toLowerCase());
  for (const x of ['flocon.exe', 'scratch 3.exe', 'tuxpaint.exe', 'swriter.exe', 'soffice.exe', 'minecraftlauncher.exe']) assert.ok(l.includes(x), x + ' permis');
  assert.ok(!l.includes('winword.exe') && !l.includes('msedge.exe'), 'Word et Edge absents');
  console.log('liste blanche : ok');
}

// Fiches et leçons écrans : chaque question a une bonne réponse valide et une correction.
{
  const assert = require('assert');
  const { FICHES, ECRANS, MATIERES } = require('../app/lib/fiches');
  const ids = new Set();
  for (const f of FICHES.concat(ECRANS)) {
    assert.ok(!ids.has(f.id), 'identifiant unique : ' + f.id); ids.add(f.id);
    assert.ok(f.titre && f.retenir.length >= 2 && f.questions.length >= 3, f.id + ' complète');
    if (f.matiere) assert.ok(MATIERES.some((m) => m.id === f.matiere), f.id + ' matière connue');
    for (const q of f.questions) {
      assert.ok(Number.isInteger(q.bonne) && q.bonne >= 0 && q.bonne < q.choix.length, f.id + ' : bonne réponse valide pour « ' + q.q + ' »');
      assert.ok(new Set(q.choix).size === q.choix.length, f.id + ' : choix distincts');
      assert.ok(q.pourquoi, f.id + ' : correction');
    }
  }
  console.log('fiches (' + FICHES.length + ') et leçons écrans (' + ECRANS.length + ') : ok');
}
