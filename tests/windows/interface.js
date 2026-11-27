'use strict';
// Le robot : pilote la vraie fenêtre de Flocon comme le ferait un enfant, et vérifie à chaque geste
// ce que le gardien en a fait. Lancé sur la machine de test Windows, après l'installation de Brune et de Test.
//   node interface.js <dossier des captures>
const { _electron: electron } = require('playwright-core');
const fs = require('fs');
const path = require('path');
const os = require('os');
const assert = require('assert');
const { execFileSync } = require('child_process');

const EXE = path.join(process.env.ProgramFiles, 'Flocon', 'Flocon.exe');
const GARDIEN = path.join(process.env.ProgramFiles, 'Flocon', 'resources', 'app', 'gardien.js');
const BASE = path.join(process.env.ProgramData, 'Flocon');
const CAPTURES = process.argv[2] || path.join(__dirname, 'captures');
const COMPTE = 'Test';
fs.mkdirSync(CAPTURES, { recursive: true });

const lire = (f) => JSON.parse(fs.readFileSync(f, 'utf8').replace(/^﻿/, ''));
const config = () => lire(path.join(BASE, 'config.json'));
const enfant = (compte) => config().enfants.find((e) => e.compte.toLowerCase() === compte.toLowerCase());
const etat = () => lire(path.join(BASE, 'enfants', 'test', 'etat.json'));
const demande = () => lire(path.join(BASE, 'boite', 'test', 'demande.json'));
// Le texte du document Word (word/document.xml) d'un .docx fabriqué par Flocon.
function texteDocx(f) {
  const b = fs.readFileSync(f); let i = 0;
  while (b.readUInt32LE(i) === 0x04034b50) {
    const methode = b.readUInt16LE(i + 8), taille = b.readUInt32LE(i + 18), n = b.readUInt16LE(i + 26), x = b.readUInt16LE(i + 28);
    const nom = b.slice(i + 30, i + 30 + n).toString(); const debut = i + 30 + n + x; const donnees = b.slice(debut, debut + taille);
    if (nom === 'word/document.xml') return (methode === 8 ? require('zlib').inflateRawSync(donnees) : donnees).toString();
    i = debut + taille;
  }
  throw new Error('word/document.xml introuvable');
}
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
// Un tic du gardien, tout de suite (le vrai tourne chaque minute sous SYSTEM).
function tic() { execFileSync(EXE, [GARDIEN], { env: Object.assign({}, process.env, { ELECTRON_RUN_AS_NODE: '1' }), windowsHide: true }); }

const resultats = [];
let page, appli, numero = 0, erreursPage = [];
async function etape(nom, fn) {
  process.stdout.write('  ' + nom + ' … ');
  try {
    await fn();
    resultats.push({ nom, ok: true }); console.log('ok');
  } catch (e) {
    resultats.push({ nom, ok: false, detail: e.message.split('\n')[0] }); console.log('ÉCHEC : ' + e.message.split('\n')[0]);
  }
  try { await page.screenshot({ path: path.join(CAPTURES, String(++numero).padStart(2, '0') + ' ' + nom.replace(/[^\p{L}\p{N} '-]/gu, '') + '.png') }); } catch (e) { /* rien */ }
}
const clic = (sel) => page.locator(sel).first().click();
const tuile = (texte) => page.locator('[data-a="tuile"]', { hasText: texte }).first().click();
const rubrique = (texte) => page.locator('[data-a="rubrique"]', { hasText: texte }).first().click();
async function code(pin) { for (const k of pin) await clic(`[data-a="pin"][data-k="${k}"]`); }
async function dessiner(sel) {
  const b = await page.locator(sel).boundingBox();
  await page.mouse.move(b.x + 20, b.y + 20); await page.mouse.down();
  for (let i = 1; i <= 10; i++) await page.mouse.move(b.x + 20 + i * (b.width - 40) / 10, b.y + b.height / 2 + (i % 2 ? 15 : -15));
  await page.mouse.up();
}
// Flocon n'accepte qu'une copie par compte : avant de relancer, plus aucune ne doit tourner (ni ses processus enfants).
async function toutFermer() {
  try { execFileSync('taskkill', ['/F', '/T', '/IM', 'Flocon.exe', '/FI', 'USERNAME eq ' + os.userInfo().username], { stdio: 'ignore' }); } catch (e) { /* aucune */ }
  for (let i = 0; i < 20; i++) {
    const l = execFileSync('tasklist', ['/FI', 'IMAGENAME eq Flocon.exe', '/FI', 'USERNAME eq ' + os.userInfo().username, '/NH'], { encoding: 'utf8' });
    if (!/Flocon\.exe/i.test(l)) return;
    await pause(500);
  }
}
async function lancer() {
  await toutFermer();
  appli = await electron.launch({ executablePath: EXE, env: Object.assign({}, process.env, { FLOCON_COMPTE: COMPTE }), timeout: 60000 });
  page = await appli.firstWindow();
  erreursPage = [];
  page.on('pageerror', (e) => erreursPage.push(e.message));
  await page.waitForSelector('.carte', { timeout: 30000 });
}
async function fermer() { await toutFermer(); }
const fenetre = () => appli.evaluate(({ BrowserWindow, screen }) => { const w = BrowserWindow.getAllWindows()[0]; return { kiosk: w.isKiosk(), b: w.getBounds(), zone: screen.getPrimaryDisplay().workArea }; });

(async () => {
  // Point de départ : Test n'a jamais ouvert Flocon.
  try { fs.rmSync(path.join(os.homedir(), 'AppData', 'Roaming', 'Flocon'), { recursive: true, force: true }); } catch (e) { /* rien */ }
  tic();
  const jetonsAvant = etat().jetonsRestants;
  await lancer();

  await etape('Atelier : bienvenue', async () => { await page.waitForSelector('text=Bonjour'); assert.ok((await fenetre()).kiosk, 'plein écran pendant l’atelier'); await clic('[data-a="atelierSuiv"]'); });
  await etape('Atelier : prénom', async () => { await page.fill('#in-prenom', 'Testine'); await clic('[data-a="atelierSuiv"]'); });
  await etape('Atelier : compagnon', async () => {
    const n = await page.locator('[data-a="choisirCompa"]').count();
    assert.strictEqual(n, 14, '14 compagnons proposés (' + n + ')');
    await clic('[data-a="choisirCompa"][data-id="renardpolaire"]');
    assert.strictEqual(await page.inputValue('[data-in="nomCompa"]'), 'Givre', 'le renard polaire propose « Givre »');
    await clic('[data-a="atelierSuiv"]');
  });
  await etape('Atelier : monde', async () => { await page.locator('[data-a="choisirTheme"]').nth(1).click(); await clic('[data-a="atelierSuiv"]'); });
  await etape('Atelier : portrait', async () => { await dessiner('#toile-avatar'); await clic('[data-a="atelierSuiv"]'); });
  await etape('Atelier : envies', async () => { await clic('[data-a="basculerEnvie"][data-id="lire"]'); await clic('[data-a="atelierSuiv"]'); });
  await etape('Atelier : le pacte se signe avec le code', async () => {
    assert.ok(await page.locator('[data-a="signerPacte"]').isDisabled(), 'pas de signature avant les trois engagements');
    for (let i = 0; i < 3; i++) await clic(`[data-a="cocher"][data-i="${i}"]`);
    await dessiner('#toile-sig1'); await dessiner('#toile-sig2');
    await clic('[data-a="signerPacte"]');
    await code('0000'); await page.waitForSelector('text=Ce n’est pas le bon code');
    await code('1234');
    await page.waitForSelector('text=Bonjour Testine');
  });
  await etape('Accueil : la tirelire de Test', async () => {
    assert.strictEqual(await page.locator('.jeton').count(), jetonsAvant, 'autant de jetons affichés que dans la tirelire');
    await clic('[data-a="jetonsPlus"]'); await clic('[data-a="jetonsPlus"]'); await clic('[data-a="jetonsPlus"]');
    assert.strictEqual(await page.textContent('.compteur .val'), '2', 'plafonné à 2 jetons par séance');
    await clic('[data-a="versIntention"]');
    assert.ok(await page.locator('[data-a="commencer"]').isDisabled(), 'il faut une intention');
    await clic('[data-a="intention"][data-id="creer"]');
    await clic('[data-a="commencer"]');
    await page.waitForSelector('.fenetre');
  });
  await etape('Le gardien ouvre la séance et prend les jetons', async () => {
    tic();
    const e = etat();
    assert.ok(e.session && !e.session.fermee, 'séance ouverte'); assert.strictEqual(e.session.pris, 2);
    assert.strictEqual(e.jetonsRestants, jetonsAvant - 2);
    assert.strictEqual(enfant('Brune').jetonsSemaine, 8, 'Brune non touchée');
  });
  await etape('Bureau : fenêtre calée sur la zone de travail', async () => {
    const f = await fenetre();
    assert.ok(!f.kiosk, 'plus en plein écran');
    assert.deepStrictEqual(f.b, f.zone, 'fenêtre = zone de travail (barre des tâches visible)');
  });
  await etape('Bureau : les huit rubriques s’ouvrent', async () => {
    const n = await page.locator('[data-a="rubrique"]').count();
    assert.strictEqual(n, 8);
    for (let i = 0; i < n; i++) { await page.locator('[data-a="rubrique"]').nth(i).click(); await page.waitForSelector('.contenu'); }
    assert.strictEqual(await page.locator('[data-a="rubrique"]').first().textContent(), 'Mes lectures', 'son envie « lire » passe en premier');
  });
  await etape('Exposé : créer, écrire, cocher, document Word', async () => {
    await rubrique('J’apprends'); await tuile('Mes exposés');
    await page.fill('[data-in="nouveauSujet"]', 'Les loups'); await clic('[data-a="creerExpose"]');
    await page.fill('[data-in="noteExpose"]', 'Comment vivent les loups ?'); await pause(1200);
    await clic('[data-a="etapeFaite"]');
    await page.waitForSelector('text=1 étape sur 6');
    await clic('[data-a="documentWord"]'); await pause(1500);
    const d = path.join(os.homedir(), 'Documents', 'Mes exposés');
    const docx = fs.readdirSync(d).filter((f) => f.endsWith('.docx'));
    assert.ok(docx.length, 'un .docx dans Mes exposés');
    const b = fs.readFileSync(path.join(d, docx[0])); assert.strictEqual(b.readUInt32LE(0), 0x04034b50, 'archive Word valide');
    const json = fs.readdirSync(d).find((f) => f.endsWith('.json'));
    assert.strictEqual(lire(path.join(d, json)).etapes[0].notes, 'Comment vivent les loups ?', 'les notes sont enregistrées');
    assert.ok(texteDocx(path.join(d, docx[0])).includes('Comment vivent les loups'), 'les notes sont dans le document Word');
  });
  await etape('Exposé : le document Word suit ses nouvelles notes', async () => {
    await clic('[data-a="etapeExpose"][data-i="0"]');
    await page.fill('[data-in="noteExpose"]', 'Ils vivent en meute.'); await pause(1200);
    await clic('[data-a="documentWord"]'); await page.waitForSelector('text=avec tes dernières notes'); await pause(800);
    const d = path.join(os.homedir(), 'Documents', 'Mes exposés'); const f = path.join(d, fs.readdirSync(d).find((x) => x.endsWith('.docx')));
    assert.ok(texteDocx(f).includes('Ils vivent en meute'), 'document régénéré avec les nouvelles notes');
  });
  await etape('Exposé : un document retouché dans Writer n’est jamais écrasé', async () => {
    const d = path.join(os.homedir(), 'Documents', 'Mes exposés'); const f = path.join(d, fs.readdirSync(d).find((x) => x.endsWith('.docx')));
    const plusTard = new Date(Date.now() + 120000); fs.utimesSync(f, plusTard, plusTard); // comme si elle l'avait enregistré dans Writer
    await page.fill('[data-in="noteExpose"]', 'Changement à ne pas écrire.'); await pause(1200);
    await clic('[data-a="documentWord"]'); await page.waitForSelector('text=retouché dans Writer');
    assert.ok(!texteDocx(f).includes('Changement'), 'son travail dans Writer est gardé');
    await clic('[data-a="fermerVue"]');
  });
  await etape('Carnets : lecture, journal, Grand Pourquoi', async () => {
    await rubrique('Mes lectures'); await tuile('Mon carnet de lecture');
    await page.fill('[data-in="livreTitre"]', 'Le Petit Prince'); await clic('[data-a="noteLivre"][data-k="5"]'); await clic('[data-a="ajouterLivre"]');
    await clic('[data-a="fermerVue"]'); await tuile('Mon journal');
    await page.fill('[data-in="pageJournal"]', 'Aujourd’hui, un test.'); await clic('[data-a="ajouterPage"]'); await clic('[data-a="fermerVue"]');
    await rubrique('J’apprends'); await tuile('Grand Pourquoi');
    await page.fill('[data-in="nouvelleQuestion"]', 'Pourquoi le ciel est bleu ?'); await clic('[data-a="ajouterQuestion"]'); await clic('[data-a="fermerVue"]');
    const c = path.join(os.homedir(), 'Documents', 'Mes carnets');
    assert.strictEqual(lire(path.join(c, 'lectures.json')).livres[0].titre, 'Le Petit Prince');
    assert.strictEqual(lire(path.join(c, 'journal.json')).pages.length, 1);
    assert.strictEqual(lire(path.join(c, 'grand-pourquoi.json')).questions[0].q, 'Pourquoi le ciel est bleu ?');
  });
  await etape('Outils : agenda, minuteur, semaine, permis', async () => {
    await rubrique('Mes outils'); await tuile('Mon agenda');
    await page.fill('[data-in="evTitre"]', 'Piscine'); await clic('[data-a="ajouterEv"]');
    assert.strictEqual(lire(path.join(os.homedir(), 'Documents', 'Mes carnets', 'agenda.json')).evenements[0].titre, 'Piscine');
    await clic('[data-a="fermerVue"]'); await tuile('Minuteur'); await clic('[data-a="minuteur"][data-k="1"]'); await pause(1500);
    assert.match(await page.textContent('#aff-minuteur'), /^00:5\d$/, 'le minuteur décompte');
    await clic('[data-a="minuteurStop"]'); await clic('[data-a="fermerVue"]');
    await tuile('Ma semaine'); await page.waitForSelector('text=Jour par jour'); await clic('[data-a="fermerVue"]');
    await tuile('Mon permis'); await page.waitForSelector('text=Tu es ici'); await clic('[data-a="fermerVue"]');
  });
  await etape('Une idée : trois tirages, pas plus', async () => {
    await rubrique('Je crée'); await tuile('Une idée');
    for (let i = 0; i < 3; i++) await clic('[data-a="autreIdee"]');
    await page.waitForSelector('text=C’était la dernière');
    await clic('[data-a="fermerVue"]');
  });
  await etape('Logiciel absent : premiers pas puis message clair', async () => {
    await tuile('Dessin');
    await page.waitForSelector('text=Premiers pas avec');
    await clic('[data-a="pasOuvrir"]');
    await page.waitForSelector('text=pas encore installé');
  });
  await etape('Site autorisé : Vikidia s’ouvre', async () => {
    await rubrique('Je découvre'); await tuile('Vikidia');
    await page.waitForFunction(() => { const w = document.querySelector('#vue-site'); try { return w && /vikidia\.org/.test(w.getURL()) && !w.isLoading(); } catch (e) { return false; } }, null, { timeout: 45000 });
  });
  await etape('Site interdit : un lien vers Google est bloqué', async () => {
    await page.evaluate(() => document.querySelector('#vue-site').executeJavaScript("location.href = 'https://www.google.com/'"));
    await page.waitForSelector('text=pas dans la liste autorisée', { timeout: 15000 });
    await pause(2000);
    assert.match(await page.evaluate(() => document.querySelector('#vue-site').getURL()), /vikidia\.org/, 'toujours sur Vikidia');
  });
  await etape('Site interdit : une fenêtre surgissante est bloquée', async () => {
    await page.evaluate(() => document.querySelector('#vue-site').executeJavaScript("window.open('https://www.youtube.com/')", true));
    await page.waitForSelector('text=pas dans la liste autorisée', { timeout: 15000 });
    const n = await appli.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().length);
    assert.strictEqual(n, 1, 'aucune nouvelle fenêtre');
    await clic('#site-fermer');
  });
  await etape('Espace parent : mauvais code refusé', async () => {
    await rubrique('Mon style'); await clic('[data-a="espaceParent"]');
    await code('9999'); await page.waitForSelector('text=Ce n’est pas le bon code');
  });
  await etape('Espace parent : jetons, niveau 3 et un site', async () => {
    await code('1234'); await page.waitForSelector('[data-in="pJetons"]');
    await page.fill('[data-in="pJetons"]', '6');
    await clic('[data-a="pNiveau"][data-n="3"]');
    const sites = await page.inputValue('[data-in="pSites"]');
    await page.fill('[data-in="pSites"]', sites + '\nexample.org');
    await clic('[data-a="pEnregistrer"]');
    tic();
    const t = enfant('Test');
    assert.strictEqual(t.jetonsSemaine, 6); assert.strictEqual(t.niveau, 3); assert.ok(t.sites.includes('example.org'), 'site ajouté');
    const b = enfant('Brune'); assert.strictEqual(b.jetonsSemaine, 8, 'jetons de Brune inchangés'); assert.deepStrictEqual(b.sites, ['vikidia.org'], 'sites de Brune inchangés');
  });
  await etape('Niveau 3 : la tuile Internet apparaît', async () => {
    await rubrique('Je découvre');
    // Sans aucun clic : l'interface relit l'état toutes les 15 secondes et se redessine d'elle-même.
    await page.waitForSelector('[data-a="tuile"]:has-text("Internet")', { timeout: 25000 });
  });
  await etape('Espace parent : code faux envoyé en douce, refusé par le gardien', async () => {
    fs.writeFileSync(path.join(BASE, 'boite', 'test', 'parent.json'), JSON.stringify({ pin: '0000', changements: { jetonsSemaine: 40 } }));
    tic();
    assert.strictEqual(enfant('Test').jetonsSemaine, 6, 'réglage inchangé');
    assert.ok(!fs.existsSync(path.join(BASE, 'boite', 'test', 'parent.json')), 'demande effacée');
  });
  await etape('Fin du temps : l’écran d’au revoir arrive tout seul', async () => {
    // Le gardien a fermé la séance (temps écoulé) : l'interface doit le voir à sa prochaine lecture.
    const f = path.join(BASE, 'enfants', 'test', 'etat.json'); const e = lire(f);
    e.session.fermee = true; e.session.raison = 'temps'; e.resteMinutes = 0;
    fs.writeFileSync(f, JSON.stringify(e));
    await page.waitForSelector('text=Ton temps est terminé', { timeout: 25000 });
    assert.ok((await fenetre()).kiosk, 'plein écran pour l’au revoir');
  });
  await etape('Aucune erreur JavaScript pendant la séance', async () => { assert.deepStrictEqual(erreursPage, []); });
  await fermer();

  // Deuxième séance : « à deux », gratuite.
  await lancer();
  await etape('Deuxième séance : l’atelier ne revient pas', async () => { await page.waitForSelector('text=Bonjour Testine'); });
  await etape('À deux : gratuit, et le code ne reste pas dans la boîte', async () => {
    await clic('[data-a="aDeux"]'); await code('1234');
    await clic('[data-a="intention"][data-id="jouer"]'); await clic('[data-a="commencer"]');
    await page.waitForSelector('.fenetre');
    tic();
    const e = etat();
    assert.ok(e.session.aDeux, 'séance à deux'); assert.strictEqual(e.session.pris, 0, 'aucun jeton pris');
    assert.strictEqual(demande().aDeuxPin, null, 'code effacé de la boîte');
    await page.waitForSelector('text=Séance à deux');
  });
  await etape('J’ai fini : bilan et jetons non commencés', async () => {
    await clic('[data-a="jaiFini"]');
    await page.waitForSelector('text=Les jetons que tu n’as pas commencés');
    assert.ok((await fenetre()).kiosk, 'plein écran pour l’au revoir');
    await clic('[data-a="fierte"][data-i="0"]');
    assert.ok(await page.locator('[data-a="fierte"][data-i="0"].on').count(), 'fierté cochée');
  });
  await fermer();
  await lancer();
  await etape('Troisième séance, à deux : refaire l’atelier', async () => {
    await page.waitForSelector('text=Bonjour Testine');
    await clic('[data-a="aDeux"]'); await code('1234');
    await clic('[data-a="intention"][data-id="creer"]'); await clic('[data-a="commencer"]');
    await page.waitForSelector('.fenetre');
    tic();
  });
  await etape('Niveau 4 : elle ferme Flocon elle-même', async () => {
    await rubrique('Mon style'); await clic('[data-a="espaceParent"]'); await code('1234');
    await page.waitForSelector('[data-in="pJetons"]'); await clic('[data-a="pNiveau"][data-n="4"]'); await clic('[data-a="pEnregistrer"]');
    tic(); assert.strictEqual(enfant('Test').niveau, 4);
    await page.waitForSelector('[data-a="fermerFlocon"]', { timeout: 25000 });
    const proc = appli.process(); const fin = new Promise((r) => proc.once('exit', r));
    await clic('[data-a="fermerFlocon"]');
    await Promise.race([fin, pause(15000).then(() => { throw new Error('Flocon ne s’est pas fermé'); })]);
  });
  await etape('Niveau 4 : la relance automatique ne le rouvre pas', async () => {
    await toutFermer();
    const p = require('child_process').spawn(EXE, [], { env: Object.assign({}, process.env, { FLOCON_COMPTE: COMPTE }), stdio: 'ignore' });
    const code = await Promise.race([new Promise((r) => p.once('exit', r)), pause(20000).then(() => 'toujours ouvert')]);
    if (code === 'toujours ouvert') { try { p.kill(); } catch (e) { /* rien */ } }
    assert.notStrictEqual(code, 'toujours ouvert', 'Flocon s’est rouvert tout seul');
  });
  await etape('Niveau 4 : rouvert par le menu Démarrer, il reprend la séance', async () => {
    appli = await electron.launch({ executablePath: EXE, args: ['--ouvrir'], env: Object.assign({}, process.env, { FLOCON_COMPTE: COMPTE }), timeout: 60000 });
    page = await appli.firstWindow(); page.on('pageerror', (e) => erreursPage.push(e.message));
    await page.waitForSelector('.fenetre', { timeout: 30000 });
    await page.waitForSelector('text=Séance à deux');
    assert.ok(!(await fenetre()).kiosk, 'au bureau, pas en plein écran');
    const avant = etat().session.id; tic();
    assert.strictEqual(etat().session.id, avant, 'même séance, aucune nouvelle prise de jetons');
  });
  await etape('Espace parent : refaire l’atelier', async () => {
    await rubrique('Mon style'); await clic('[data-a="espaceParent"]'); await code('1234');
    await page.waitForSelector('[data-a="pRefaireAtelier"]'); await clic('[data-a="pRefaireAtelier"]');
    await page.waitForSelector('text=Cet ordinateur est presque prêt');
    assert.ok((await fenetre()).kiosk, 'plein écran');
    const p = lire(path.join(os.homedir(), 'AppData', 'Roaming', 'Flocon', 'profil.json'));
    assert.strictEqual(p.atelierFait, false); assert.strictEqual(p.prenom, 'Testine', 'le reste du profil est gardé');
  });
  await etape('Aucune erreur JavaScript pendant la deuxième séance', async () => { assert.deepStrictEqual(erreursPage, []); });
  await fermer();

  const lignes = resultats.map((r) => `| Interface : ${r.nom} | ${r.ok ? 'ok' : 'ÉCHEC : ' + String(r.detail).replace(/\|/g, '/')} |`);
  fs.writeFileSync(path.join(CAPTURES, 'interface.md'), lignes.join('\n') + '\n');
  process.exit(resultats.every((r) => r.ok) ? 0 : 1);
})().catch(async (e) => { console.error('Le robot s’est arrêté : ' + e.stack); try { await page.screenshot({ path: path.join(CAPTURES, 'arret.png') }); } catch (x) { /* rien */ } await fermer(); process.exit(1); });
