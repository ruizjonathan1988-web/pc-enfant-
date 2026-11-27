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
