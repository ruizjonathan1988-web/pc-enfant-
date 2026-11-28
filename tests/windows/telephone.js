'use strict';
// Joue le téléphone du parent contre le vrai serveur installé (tâche « Flocon Parent »).
//   node telephone.js <compte> <code>
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const B = 'http://localhost:4747';
const [, , compte, code] = process.argv;
const EXE = path.join(process.env.ProgramFiles, 'Flocon', 'Flocon.exe');
const GARDIEN = path.join(process.env.ProgramFiles, 'Flocon', 'resources', 'app', 'gardien.js');
const ETAT = path.join(process.env.ProgramData, 'Flocon', 'enfants', compte.toLowerCase(), 'etat.json');
const lire = (f) => JSON.parse(fs.readFileSync(f, 'utf8').replace(/^﻿/, ''));
const post = (u, corps, jeton) => fetch(B + u, { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, jeton ? { Authorization: 'Bearer ' + jeton } : {}), body: JSON.stringify(corps) });

(async () => {
  let page;
  for (let i = 0; i < 30; i++) { try { page = await fetch(B + '/'); break; } catch (e) { await new Promise((r) => setTimeout(r, 2000)); } }
  assert.ok(page && page.ok, 'le serveur répond');
  assert.ok((await page.text()).includes('Flocon · Parent'), 'la page du téléphone');
  assert.strictEqual((await fetch(B + '/api/etat')).status, 401, 'rien sans connexion');
  const faux = await post('/api/connexion', { pin: '0000' });
  assert.strictEqual(faux.status, 401, 'code faux refusé');
  const ok = await (await post('/api/connexion', { pin: code })).json();
  assert.ok(ok.jeton, 'connexion avec le bon code');
  const etat = await (await fetch(B + '/api/etat', { headers: { Authorization: 'Bearer ' + ok.jeton } })).json();
  const e = etat.enfants.find((x) => x.compte === compte);
  assert.ok(e && typeof e.jetonsRestants === 'number', 'la tirelire de ' + compte + ' est visible');
  const avant = lire(ETAT).jetonsRestants;
  assert.ok((await post('/api/action', { compte, action: 'ajouter', valeur: 2 }, ok.jeton)).ok, 'ajout de jetons accepté');
  execFileSync(EXE, [GARDIEN], { env: Object.assign({}, process.env, { ELECTRON_RUN_AS_NODE: '1' }) });
  assert.strictEqual(lire(ETAT).jetonsRestants, avant + 2, 'le gardien a ajouté les 2 jetons');
  for (let i = 0; i < 5; i++) await post('/api/connexion', { pin: '9999' });
  assert.strictEqual((await post('/api/connexion', { pin: code })).status, 429, 'bloqué après cinq codes faux, même avec le bon');
  console.log('téléphone : ok');
})().catch((e) => { console.error('ÉCHEC téléphone : ' + e.message); process.exit(1); });
