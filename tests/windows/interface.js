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
    try { await page.screenshot({ path: path.join(CAPTURES, String(++numero).padStart(2, '0') + ' ÉCHEC ' + nom.replace(/[^\p{L}\p{N} '-]/gu, '') + '.png') }); } catch (e2) { /* rien */ }
    // Revenir au bureau pour que l'échec d'une étape ne fasse pas échouer les suivantes.
    try { await page.evaluate(() => { document.querySelectorAll('#film-dessin').forEach((z) => z.remove()); for (let k = 0; k < 6 && S.vue; k++) A.fermerVue(); }); await pause(300); } catch (e2) { /* rien */ }
    return;
  }
  try { await page.screenshot({ path: path.join(CAPTURES, String(++numero).padStart(2, '0') + ' ' + nom.replace(/[^\p{L}\p{N} '-]/gu, '') + '.png') }); } catch (e) { /* rien */ }
}
const docs = (d) => path.join(os.homedir(), 'Documents', d);
const creationsAvec = (re) => fs.readdirSync(docs('Mes créations')).filter((f) => re.test(f));
const clic = (sel) => page.locator(sel).first().click();
const tuile = (texte) => page.locator('[data-a="tuile"]', { hasText: texte }).first().click();
// Mode découverte : les options avancées sont repliées derrière « Plus d'outils » ; le robot l'ouvre avant de s'en servir.
const plusOutils = async (cle) => { const b = page.locator(`[data-a="outilsPlus"][data-k="${cle}"]`).first(); await b.waitFor(); if ((await b.getAttribute('aria-expanded')) !== 'true') await b.click(); await page.waitForSelector(`[data-a="outilsPlus"][data-k="${cle}"][aria-expanded="true"]`); };
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
  appli = await electron.launch({ executablePath: EXE, env: Object.assign({}, process.env, { FLOCON_COMPTE: COMPTE, FLOCON_CAMERA_FACTICE: '1' }), timeout: 60000 });
  page = await appli.firstWindow();
  erreursPage = [];
  page.on('pageerror', (e) => erreursPage.push(e.message));
  await page.waitForSelector('.carte, .fenetre', { timeout: 30000 });
}
async function fermer() { await toutFermer(); }
const fenetre = () => appli.evaluate(({ BrowserWindow, screen }) => { const w = BrowserWindow.getAllWindows()[0]; return { kiosk: w.isKiosk(), b: w.getBounds(), zone: screen.getPrimaryDisplay().workArea, ecran: screen.getPrimaryDisplay().bounds }; });

(async () => {
  // Point de départ : Test n'a jamais ouvert Flocon.
  try { fs.rmSync(path.join(os.homedir(), 'AppData', 'Roaming', 'Flocon'), { recursive: true, force: true }); } catch (e) { /* rien */ }
  tic();
  const jetonsAvant = etat().jetonsRestants;
  await lancer();

  await etape('Atelier : bienvenue', async () => { await page.waitForSelector('text=Bonjour'); const f = await fenetre(); assert.ok(f.kiosk, 'plein écran pendant l’atelier'); assert.ok(f.b.width >= f.ecran.width && f.b.height >= f.ecran.height, `la fenêtre doit couvrir l’écran : ${JSON.stringify(f.b)} pour ${JSON.stringify(f.ecran)}`); await clic('[data-a="atelierSuiv"]'); });
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
    await new Promise((r) => setTimeout(r, 800));
    const f = await fenetre();
    assert.ok(!f.kiosk, 'plus en plein écran');
    assert.deepStrictEqual(f.b, f.zone, `fenêtre = zone de travail (barre des tâches visible) : ${JSON.stringify(f.b)} pour ${JSON.stringify(f.zone)}`);
  });
  await etape('Bureau : les neuf rubriques s’ouvrent', async () => {
    const n = await page.locator('[data-a="rubrique"]').count();
    assert.strictEqual(n, 9);
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
    await clic('[data-a="fermerVue"]'); await page.waitForSelector('[data-in="nouveauSujet"]'); await clic('[data-a="fermerVue"]');
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
  await etape('Logiciel présent : message d’attente, puis retour à Flocon', async () => {
    await rubrique('Mes outils'); await tuile('Calculatrice');
    if (await page.locator('[data-a="pasOuvrir"]').count()) await clic('[data-a="pasOuvrir"]');
    await page.waitForSelector('text=Calculatrice s’ouvre');
    // La calculatrice prend le premier plan (le message part seul) ; sinon le bouton D’accord le ferme.
    await page.waitForFunction(() => !document.body.innerText.includes('Calculatrice s’ouvre'), null, { timeout: 30000 }).catch(async () => { await clic('[data-a="finOuverture"]'); });
    assert.ok(!(await page.locator('text=Calculatrice s’ouvre').count()), 'message d’attente resté affiché');
    try { execFileSync('taskkill', ['/F', '/IM', 'CalculatorApp.exe', '/IM', 'calc.exe'], { stdio: 'ignore' }); } catch (e) { /* déjà fermée */ }
    await appli.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].focus());
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
  await etape('Vikidia : chercher depuis la barre de Flocon', async () => {
    await rubrique('Je découvre'); await tuile('Vikidia');
    await page.waitForSelector('#site-q');
    await page.fill('#site-q', 'loup'); await page.press('#site-q', 'Enter');
    await page.waitForFunction(() => { const w = document.querySelector('#vue-site'); try { return /vikidia\.org/.test(w.getURL()) && /loup/i.test(decodeURIComponent(w.getURL()) + w.getTitle()) && !w.isLoading(); } catch (e) { return false; } }, null, { timeout: 45000 });
  });
  await etape('Téléchargement : une musique est rangée dans Mes créations', async () => {
    const f = path.join(os.homedir(), 'Documents', 'Mes créations', 'ma-melodie.mid');
    try { fs.unlinkSync(f); } catch (e) { /* rien */ }
    await page.evaluate(() => document.querySelector('#vue-site').executeJavaScript("{ const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['MThd'], { type: 'audio/midi' })); a.download = 'ma-melodie.mid'; document.body.appendChild(a); a.click(); }", true));
    await page.waitForSelector('text=est rangé dans Mes créations', { timeout: 15000 });
    assert.ok(fs.existsSync(f), 'fichier dans Mes créations');
  });
  await etape('Téléchargement : un programme est refusé', async () => {
    try {
    await page.evaluate(() => document.querySelector('#vue-site').executeJavaScript("{ const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['MZ'])); a.download = 'jeu-gratuit.exe'; document.body.appendChild(a); a.click(); }", true));
    await page.waitForSelector('text=ne peut pas être enregistré', { timeout: 15000 });
    assert.ok(!fs.existsSync(path.join(os.homedir(), 'Documents', 'Mes créations', 'jeu-gratuit.exe')), 'aucun .exe enregistré');
    } finally { if (await page.locator('#site-fermer').count()) await clic('#site-fermer'); }
  });
  for (const [nomTuile, domaine] of [['Les étoiles', /stellarium/], ['Les Fondamentaux', /reseau-canope\.fr/]]) {
    await etape(nomTuile + ' : le site s’ouvre (adresse suivie jusqu’au bout)', async () => {
      await rubrique(nomTuile === 'Les étoiles' ? 'Je découvre' : 'J’apprends');
      const refusAvant = await page.locator('text=pas dans la liste autorisée').count();
      await tuile(nomTuile);
      await page.waitForFunction((d) => { const w = document.querySelector('#vue-site'); try { return new RegExp(d).test(w.getURL()) && !w.isLoading(); } catch (e) { return false; } }, domaine.source, { timeout: 45000 });
      await pause(3000);
      assert.strictEqual(await page.locator('text=pas dans la liste autorisée').count(), refusAvant, 'aucune page refusée en chemin');
      await clic('#site-fermer');
    });
  }
  await etape('Journal : un code secret choisi par l’enfant', async () => {
    await rubrique('Mes lectures'); await tuile('Mon journal');
    await clic('[data-a="mettreCodeJournal"]'); await code('1357'); await code('1357');
    await page.waitForSelector('[data-a="enleverCodeJournal"]');
    assert.ok(lire(path.join(os.homedir(), 'AppData', 'Roaming', 'Flocon', 'profil.json')).codeJournal.hash, 'code enregistré (empreinte seulement)');
    await clic('[data-a="fermerVue"]');
  });
  await etape('Mon cahier : écrire un texte, enregistré tout seul', async () => {
    await rubrique('J’écris'); await tuile('Mon cahier');
    await page.fill('[data-in="nouveauTexte"]', 'Le renard des neiges'); await clic('[data-a="creerTexte"]');
    await page.fill('[data-in="texteCorps"]', 'Il était une fois un renard tout blanc.\nIl aimait la neige.'); await pause(1200);
    assert.strictEqual(await page.textContent('.cahier .entete .etiquette'), '12 mots');
    const d = path.join(os.homedir(), 'Documents', 'Mes textes');
    const f = fs.readdirSync(d).find((x) => x.endsWith('.json'));
    const x = lire(path.join(d, f));
    assert.strictEqual(x.titre, 'Le renard des neiges'); assert.ok(x.texte.includes('renard tout blanc'), 'texte enregistré');
    assert.strictEqual(await page.locator('[data-a="texteWriter"]').count(), 0, 'Writer seulement à partir du niveau 2');
  });
  await etape('Mon cahier : imprimer prépare un vrai document', async () => {
    await clic('[data-a="texteImprimer"]'); await page.waitForSelector('text=part à l’imprimante');
    const d = path.join(os.homedir(), 'Documents', 'Mes textes');
    const f = path.join(d, fs.readdirSync(d).find((x) => x.endsWith('.docx')));
    const xml = texteDocx(f);
    assert.ok(xml.includes('Le renard des neiges') && xml.includes('Il aimait la neige'), 'titre et texte dans le document');
    await clic('[data-a="fermerVue"]'); await clic('[data-a="fermerVue"]');
  });
  // ---------- Mon studio de films ----------
  const dossierFilm = () => { const d = path.join(os.homedir(), 'Documents', 'Mes animations'); return path.join(d, fs.readdirSync(d).find((x) => fs.existsSync(path.join(d, x, 'film.json')))); };
  const nbImages = () => page.evaluate(() => FILM.p.images.length);
  await etape('Mon film : le studio s’ouvre avec la caméra', async () => {
    await rubrique('Je crée'); await tuile('Mon film');
    await page.fill('[data-in="filmTitre"]', 'La grande évasion'); await clic('[data-a="filmNouveau"]');
    await page.waitForFunction(() => FILM.flux && document.getElementById('anim-video').readyState >= 2, null, { timeout: 15000 });
    assert.strictEqual(lire(path.join(dossierFilm(), 'film.json')).titre, 'La grande évasion');
  });
  await etape('Mon film : le gros bouton et la barre d’espace prennent les photos', async () => {
    for (let i = 0; i < 3; i++) await clic('.declencheur');
    await page.keyboard.press('Space');
    await page.waitForFunction(() => FILM.p.images.length === 4, null, { timeout: 10000 });
    await pause(800);
    assert.strictEqual(fs.readdirSync(dossierFilm()).filter((x) => x.endsWith('.jpg')).length, 4, '4 photos sur le disque');
    assert.strictEqual(await page.locator('.frise-film .vignette').count(), 4);
    assert.ok(await page.evaluate(() => getComputedStyle(document.getElementById('anim-oignon')).display === 'block'), 'image fantôme visible');
  });
  await etape('Mon film : copier, jeter, annuler dans la frise', async () => {
    await clic('[data-a="filmChoisir"][data-i="1"]'); await clic('[data-a="filmDupliquer"]');
    assert.strictEqual(await nbImages(), 5);
    await clic('[data-a="filmEffacer"]'); assert.strictEqual(await nbImages(), 4);
    await clic('.actions-frise [data-a="filmChoisir"]'); await clic('[data-a="filmAnnuler"]');
    assert.strictEqual(await nbImages(), 3); await pause(800);
    assert.strictEqual(lire(path.join(dossierFilm(), 'film.json')).images.length, 3, 'frise enregistrée');
  });
  await etape('Mon film : les photos de son appareil photo', async () => {
    const jpg = path.join(dossierFilm(), fs.readdirSync(dossierFilm()).find((x) => x.endsWith('.jpg')));
    const mesPhotos = path.join(os.homedir(), 'Pictures', 'Mes photos', '2026-11-28'); fs.mkdirSync(mesPhotos, { recursive: true });
    fs.copyFileSync(jpg, path.join(mesPhotos, 'PICT0001.JPG')); fs.copyFileSync(jpg, path.join(mesPhotos, 'PICT0002.JPG'));
    await clic('[data-a="filmPhotos"]'); await clic('[data-a="filmToutPrendre"][data-k="0"]');
    await clic('[data-a="filmAjouterPhotos"]');
    await page.waitForFunction(() => FILM.p.images.length === 5, null, { timeout: 15000 });
  });
  await etape('Mon film : fond vert avec un décor à elle, filtre, musique', async () => {
    const decors = path.join(os.homedir(), 'Pictures', 'Mes décors'); fs.mkdirSync(decors, { recursive: true });
    fs.copyFileSync(path.join(os.homedir(), 'Pictures', 'Mes photos', '2026-11-28', 'PICT0001.JPG'), path.join(decors, 'chateau.jpg'));
    await clic('[data-a="filmOnglet"][data-o="vert"]'); await clic('[data-a="filmVert"]');
    await clic('[data-a="filmDecor"][data-r="mer"]');
    await page.waitForSelector('[data-a="filmDecor"][data-r$="chateau.jpg"]', { timeout: 10000 });
    await clic('[data-a="filmDecor"][data-r$="chateau.jpg"]');
    await page.waitForFunction(() => FILM.decor && FILM.decor.bmp, null, { timeout: 10000 });
    // la caméra simulée filme sur fond vert : le vert doit disparaître
    const transparent = await page.evaluate(() => { const v = document.getElementById('anim-video'); const c = document.createElement('canvas'); c.width = 64; c.height = 48; const x = c.getContext('2d'); x.drawImage(v, 0, 0, 64, 48); const im = x.getImageData(0, 0, 64, 48); detourer(im, FILM.p.vert.couleur, FILM.p.vert.tolerance); let z = 0; for (let i = 3; i < im.data.length; i += 4) if (im.data[i] < 128) z++; return z / (64 * 48); });
    assert.ok(transparent > 0.2, 'une bonne partie de l’image est détourée (' + Math.round(transparent * 100) + ' %)');
    await clic('[data-a="filmOnglet"][data-o="filtre"]'); await clic('[data-a="filmFiltre"][data-f="vieux"]');
    await clic('[data-a="filmOnglet"][data-o="musique"]'); await clic('[data-a="filmMusique"][data-m="aventure"]');
    await pause(800);
    const f = lire(path.join(dossierFilm(), 'film.json'));
    assert.ok(f.vert.actif && f.vert.decor.type === 'fichier' && f.filtre === 'vieux' && f.musique === 'aventure', 'réglages enregistrés');
  });
  await etape('Mon film : lecture, puis sa voix enregistrée sur le film', async () => {
    await clic('[data-a="filmLecture"]'); await pause(1500);
    assert.ok(await page.evaluate(() => !!FILM.lecture), 'le film se joue'); await clic('[data-a="filmLecture"]');
    await clic('[data-a="filmOnglet"][data-o="voix"]'); await clic('[data-a="filmVoix"]');
    await page.waitForFunction(() => FILM.p.voix, null, { timeout: 30000 });
    assert.ok(fs.statSync(path.join(dossierFilm(), await page.evaluate(() => FILM.p.voix))).size > 1000, 'voix sur le disque');
  });
  await etape('Mon film : « Faire mon film » le range dans la galerie', async () => {
    await clic('[data-a="filmFaire"]');
    await page.waitForSelector('.bravo-film', { timeout: 60000 });
    const nomF = creationsAvec(/^La grande évasion\.(mp4|webm)$/)[0];
    assert.ok(nomF, 'vidéo dans Mes créations : ' + fs.readdirSync(docs('Mes créations')).join(', '));
    const f = path.join(docs('Mes créations'), nomF);
    assert.ok(fs.statSync(f).size > 20000, 'vidéo non vide (' + nomF + ')');
    await clic('[data-a="filmGalerie"]'); await page.waitForSelector('.galerie video');
    assert.ok(await page.evaluate(() => !FILM.flux), 'caméra éteinte en quittant le studio');
    await clic('[data-a="fermerVue"]');
  });
  // ---------- Mes mains ----------
  await etape('Mes mains : ce que j’ai à la maison filtre les défis', async () => {
    await rubrique('Je crée'); await tuile('Mes mains');
    assert.ok(await page.locator('.carte-defi').count() >= 30, 'au moins 30 défis');
    await clic('[data-a="mainsPlacard"]');
    for (const id of ['papier', 'scotch', 'regle', 'spaghettis', 'chamallows', 'ficelle', 'ciseaux']) await clic(`[data-a="mainsPlacardCocher"][data-id="${id}"]`);
    await clic('[data-a="mainsPlacardFini"]');
    const titres = await page.$$eval('.carte-defi b', (l) => l.map((x) => x.textContent));
    assert.ok(titres.includes('La tour spaghettis-chamallow') && !titres.includes('Sauvez l’œuf !'), 'seulement les défis faisables : ' + titres.join(', '));
  });
  await etape('Mes mains : la pause bricolage arrête le temps d’écran', async () => {
    await clic('[data-a="mainsOuvrir"][data-id="tour-spaghettis"]');
    await clic('[data-a="mainsAide"]'); assert.strictEqual(await page.locator('.indices li').count(), 1, 'un indice à la fois');
    await clic('[data-a="mainsPartir"]'); await page.waitForSelector('.pause-mains');
    const d = demande(); assert.ok(d.pause && d.pause.sessionId === d.sessionId, 'pause transmise au gardien');
    const avant = lire(path.join(BASE, 'enfants', 'test', 'etat.json')).session.minutes;
    tic(); tic();
    const e = lire(path.join(BASE, 'enfants', 'test', 'etat.json'));
    assert.strictEqual(e.session.minutes, avant, 'le temps d’écran ne bouge pas pendant la pause');
    // (le décompte précis des minutes de pause est vérifié par les tests de la tirelire)
    await clic('[data-a="mainsEtape"]'); await clic('[data-a="mainsBloquee"]');
    assert.strictEqual(await page.locator('.etapes-pause li.on').count(), 1, 'une étape en cours');
    assert.ok((await page.textContent('#mains-pouce')).length > 10, 'un coup de pouce sous forme de question');
  });
  await etape('Mes mains : photo de la création, mesure et réussite', async () => {
    await clic('[data-a="mainsFini"]');
    assert.ok(!demande().pause, 'pause terminée');
    await page.waitForFunction(() => { const v = document.getElementById('mains-video'); return v && v.readyState >= 2; }, null, { timeout: 15000 });
    await clic('[data-a="mainsClic"]'); await page.waitForSelector('.ecran-photo img', { timeout: 10000 });
    await page.fill('[data-in="mainsMesure"]', '54'); await page.fill('[data-in="mainsAmeliore"]', 'Une base en triangle'); await clic('[data-a="mainsHumeur"][data-h="reussi"]');
    await clic('[data-a="mainsEnregistrer"]'); await page.waitForSelector('.bravo-mains');
    assert.ok(fs.existsSync(path.join(os.homedir(), 'Documents', 'Mes créations', 'Défi La tour spaghettis-chamallow.jpg')), 'photo dans la galerie');
    const p = lire(path.join(os.homedir(), 'AppData', 'Roaming', 'Flocon', 'profil.json'));
    assert.strictEqual(p.defisMains['tour-spaghettis'][0].mesure, '54');
    assert.strictEqual(p.defisMains['tour-spaghettis'][0].ameliore, 'Une base en triangle');
    await clic('[data-a="fermerVue"]'); await clic('[data-a="fermerVue"]');
  });
  // ---------- Écrire, dessiner, construire : et sortir de l'écran ----------
  await etape('Histoire à choix : pages reliées, partie jouée, livret imprimé', async () => {
    await rubrique('J’écris'); await tuile('Histoire à choix');
    await page.fill('[data-in="hNouveau"]', 'Le grenier secret'); await clic('[data-a="hCreer"]');
    await page.fill('[data-in="hTexte"]', 'Dans le grenier, une petite porte.');
    await clic('[data-a="hAjouterChoix"]'); await page.fill('[data-in="hChoixTexte"][data-i="0"]', 'Ouvrir la porte');
    await clic('[data-a="hAjouterChoix"]'); await page.fill('[data-in="hChoixTexte"][data-i="1"]', 'Appeler maman');
    await clic('[data-a="hCreerSuite"][data-i="0"]'); await clic('[data-a="hCreerSuite"][data-i="1"]');
    await clic('.noeud:has-text("Ouvrir la porte")'); await page.fill('[data-in="hTexte"]', 'Un escalier descend dans le noir.'); await clic('[data-a="hFin"][data-f="bonne"]');
    await clic('.noeud:has-text("Appeler maman")'); await page.fill('[data-in="hTexte"]', 'La porte a disparu.'); await clic('[data-a="hFin"][data-f="drole"]');
    await page.waitForSelector('.bien');
    await clic('[data-a="hJouer"]'); await clic('.choix-jeu button >> nth=0'); await page.waitForSelector('.fin-jeu');
    await clic('[data-a="hEcrire"]'); await clic('[data-a="hImprimer"]'); await pause(4000);
    assert.ok(creationsAvec(/^Le grenier secret\.pdf$/).length, 'livret PDF dans Mes créations');
    const h = lire(path.join(docs('Mes histoires'), fs.readdirSync(docs('Mes histoires')).find((f) => f.endsWith('.json'))));
    assert.strictEqual(h.pages.length, 3); assert.strictEqual(h.pages.filter((x) => x.fin).length, 2);
    await clic('[data-a="fermerVue"]'); await clic('[data-a="fermerVue"]');
  });
  await etape('Ma BD : planches vides imprimées, planche dessinée photographiée, bulles, album', async () => {
    await rubrique('J’écris'); await tuile('Ma BD');
    await clic('[data-a="bdVidesDirect"]'); await clic('[data-a="bdImprimerVides"]'); await pause(3000);
    assert.ok(creationsAvec(/^Planches de BD vides\.pdf$/).length, 'planches vides');
    await page.fill('[data-in="bdNouveau"]', 'Les aventures de Givre'); await clic('[data-a="bdCreer"]');
    await clic('[data-a="bdPhotoPlanche"]'); await page.waitForFunction(() => { const v = document.getElementById('bd-video'); return v && v.readyState >= 2; }, null, { timeout: 15000 });
    await clic('[data-a="bdClic"]'); await page.waitForSelector('.carte-album:has-text("dessinée sur papier")', { timeout: 15000 });
    await clic('[data-a="bdAjouter"][data-g="g4"]'); await clic('[data-a="bdBulle"][data-t="parole"]'); await page.fill('[data-in="bdTexteBulle"]', 'On part !');
    await clic('[data-a="fermerVue"]'); await clic('[data-a="bdImprimerAlbum"]'); await pause(4000);
    assert.ok(creationsAvec(/^Les aventures de Givre\.pdf$/).length, 'album PDF');
    const a = lire(path.join(docs('Mes BD'), fs.readdirSync(docs('Mes BD')).find((f) => f.endsWith('.json'))));
    assert.strictEqual(a.planches.length, 2); assert.strictEqual(a.planches[1].cases[0].bulles[0].texte, 'On part !');
    await clic('[data-a="fermerVue"]'); await clic('[data-a="fermerVue"]');
  });
  await etape('Ma BD : recadrer une image, orienter une bulle, taille du texte, bruitage', async () => {
    await rubrique('J’écris'); await tuile('Ma BD');
    await page.fill('[data-in="bdNouveau"]', 'Robot BD'); await clic('[data-a="bdCreer"]'); await pause(400);
    await clic('[data-a="bdAjouter"][data-g="g4"]'); await pause(300);
    await clic('[data-a="bdImages"]'); await pause(800); await clic('[data-a="bdChoisirImage"] >> nth=0'); await pause(300);
    await plusOutils('bd'); await clic('[data-a="bdZoom"][data-d="1"]'); await clic('[data-a="bdZoom"][data-d="1"]');
    const im = await page.locator('[data-cadrer="0"]').boundingBox();
    await page.mouse.move(im.x + im.width / 2, im.y + im.height / 2); await page.mouse.down();
    await page.mouse.move(im.x + im.width / 2 + 50, im.y + im.height / 2 + 30, { steps: 5 }); await page.mouse.up(); await pause(300);
    await clic('[data-a="bdCase"][data-i="0"]');
    await clic('[data-a="bdBulle"][data-t="parole"]'); await page.fill('[data-in="bdTexteBulle"]', 'Salut');
    await clic('[data-a="bdPointe"][data-q="hd"]'); await clic('[data-a="bdTaille"][data-t="g"]');
    await clic('[data-a="bdEffets"]'); await clic('[data-a="bdEffet"][data-k="0"]');
    const c0 = await page.evaluate(() => album().planches[0].cases[0]);
    assert.ok(c0.cadrage && c0.cadrage.z === 1.5, 'cadrage enregistré : ' + JSON.stringify(c0.cadrage));
    assert.strictEqual(c0.bulles[0].queue, 'hd'); assert.strictEqual(c0.bulles[0].taille, 'g'); assert.strictEqual(c0.bulles[1].type, 'effet');
    await clic('[data-a="bdRecentrer"]');
    assert.strictEqual(await page.evaluate(() => album().planches[0].cases[0].cadrage.z), 1, 'recentrer');
    await clic('[data-a="fermerVue"]'); await clic('[data-a="bdImprimerAlbum"]'); await pause(4000);
    assert.ok(creationsAvec(/^Robot BD\.pdf$/).length, 'album PDF avec cadrage et bruitage');
    await clic('[data-a="fermerVue"]'); await clic('[data-a="fermerVue"]');
  });
  await etape('Coloriages : mandala imprimé, coloriage magique vérifié', async () => {
    await rubrique('Je crée'); await tuile('Coloriages');
    await clic('[data-a="colMode"][data-m="mandala"]'); await clic('#col-svg path >> nth=0'); await clic('[data-a="colImprimer"]'); await pause(3000);
    assert.ok(creationsAvec(/^Mandala\.pdf$/).length, 'mandala PDF');
    await clic('[data-a="fermerVue"]'); await clic('[data-a="colMode"][data-m="magique"]'); await clic('[data-a="colMagie"][data-t="tables69"]');
    await page.evaluate(() => { const v = S.vue; const k = Object.keys(SPRITES); const sp = SPRITES[v.sprite || k[v.graine % k.length]]; const p = preparerMagie(sp, 'tables69', v.graine); p.r.liste.forEach((z, i) => { COL.peint['z' + i] = sp.couleurs[z.ch]; }); });
    await clic('[data-a="colVerifier"]'); await page.waitForSelector('.bravo-col');
    await clic('[data-a="colGarder"]'); await pause(1000);
    assert.ok(creationsAvec(/^Coloriage .*\.png$/).length, 'coloriage dans la galerie');
    await clic('[data-a="fermerVue"]'); await clic('[data-a="fermerVue"]');
  });
  await etape('Histoire à choix : image de page, objet à trouver, choix sous condition', async () => {
    await rubrique('J’écris'); await tuile('Histoire à choix');
    await page.fill('[data-in="hNouveau"]', 'La clé du phare'); await clic('[data-a="hCreer"]');
    await page.fill('[data-in="hTexte"]', 'Le phare est fermé. Il y a une barque sur la plage.');
    await clic('[data-a="hImages"]'); await clic('[data-a="hChoisirImage"] >> nth=0'); await page.waitForSelector('.h-image');
    await clic('[data-a="hAjouterChoix"]'); await page.fill('[data-in="hChoixTexte"][data-i="0"]', 'La barque');
    await clic('[data-a="hAjouterChoix"]'); await page.fill('[data-in="hChoixTexte"][data-i="1"]', 'Le phare');
    await clic('[data-a="hCreerSuite"][data-i="0"]'); await clic('[data-a="hCreerSuite"][data-i="1"]');
    await clic('.noeud:has-text("La barque")'); await page.fill('[data-in="hTexte"]', 'Dans la barque, une clé !');
    await plusOutils('histoires'); await clic('[data-a="hObjet"]'); await clic('[data-a="hObjetEmoji"][data-e="🔑"]'); await page.fill('[data-in="hObjetNom"]', 'la clé');
    await clic('[data-a="hCam"]'); await page.waitForFunction(() => { const v = document.getElementById('h-video'); return v && v.readyState >= 2; }, null, { timeout: 15000 });
    await clic('[data-a="hClic"]'); await page.waitForSelector('.h-image', { timeout: 15000 });
    await clic('[data-a="hAjouterChoix"]'); await page.fill('[data-in="hChoixTexte"][data-i="0"]', 'Aller au phare');
    await page.selectOption('[data-in="hChoixVers"][data-i="0"]', { label: 'Le phare' });
    await clic('.noeud:has-text("Le phare")'); await page.fill('[data-in="hTexte"]', 'Tout en haut, la lumière brille.'); await clic('[data-a="hFin"][data-f="bonne"]');
    await clic('.noeud >> nth=0'); await page.selectOption('[data-in="hChoixRequis"][data-i="1"]', 'la clé'); await page.waitForSelector('.bien');
    await clic('[data-a="hJouer"]'); await page.waitForSelector('.choix-jeu button.bloque');
    await clic('.choix-jeu button >> nth=0'); await page.waitForSelector('.trouve-jeu'); await page.waitForSelector('.sac-jeu:has-text("la clé")');
    await clic('.choix-jeu button >> nth=0'); await page.waitForSelector('.fin-jeu');
    await clic('[data-a="hEcrire"]'); await clic('[data-a="hImprimer"]'); await pause(4000);
    assert.ok(creationsAvec(/^La clé du phare\.pdf$/).length, 'livret PDF avec objets');
    assert.ok(creationsAvec(/^Histoire La clé du phare.*\.jpg$/).length, 'photo du dessin de la page');
    const h = fs.readdirSync(docs('Mes histoires')).filter((f) => f.endsWith('.json')).map((f) => lire(path.join(docs('Mes histoires'), f))).find((x) => x.titre === 'La clé du phare');
    assert.ok(h.pages[0].image && h.pages[1].image, 'images des pages');
    assert.strictEqual(h.pages[1].objet.nom, 'la clé'); assert.strictEqual(h.pages[0].choix[1].requis, 'la clé');
    await clic('[data-a="fermerVue"]'); await clic('[data-a="fermerVue"]');
  });
  await etape('Coloriages : nouveaux dessins en pixels, mon dessin au feutre devient un coloriage', async () => {
    await rubrique('Je crée'); await tuile('Coloriages');
    await clic('[data-a="colMode"][data-m="pixel"]');
    for (const k of ['chouette', 'baleine', 'cactus', 'papillon', 'robot', 'voiture', 'pingouin', 'fraise', 'chateau']) { await clic(`[data-a="colSprite"][data-s="${k}"]`); await page.waitForSelector('#col-svg rect.px'); }
    await clic('[data-a="fermerVue"]'); await clic('[data-a="colMode"][data-m="dessin"]');
    await clic('[data-a="coldCam"]'); await page.waitForFunction(() => { const v = document.getElementById('cold-video'); return v && v.readyState >= 2; }, null, { timeout: 15000 });
    await clic('[data-a="coldClic"]'); await page.waitForSelector('#cold-toile', { timeout: 15000 });
    assert.ok(await page.evaluate(() => COLD.cam === null), 'caméra coupée');
    const b = await page.locator('#cold-toile').boundingBox(); await clic('[data-a="colPinceau"][data-i="2"]'); await page.mouse.click(b.x + 10, b.y + 10);
    await clic('[data-a="coldSensib"][data-s="5"]'); await clic('[data-a="coldImprimer"]'); await pause(3000);
    assert.ok(creationsAvec(/^Mon dessin en coloriage\.pdf$/).length, 'mon dessin en PDF');
    await clic('[data-a="colGarder"]'); await pause(1000);
    assert.ok(creationsAvec(/^Mon coloriage .*\.png$/).length, 'mon coloriage dans la galerie');
    await clic('[data-a="fermerVue"]'); await clic('[data-a="fermerVue"]');
  });
  await etape('Atelier 3D : des cubes, le plan de montage et le fichier pour l’imprimante 3D', async () => {
    await page.evaluate(() => ouvrirVue('cubes'));
    await page.fill('[data-in="cNouveau"]', 'Ma tour'); await clic('[data-a="cCreer"]');
    await page.waitForFunction(() => window.C3 && window.C3.rendu, null, { timeout: 15000 });
    const z = await page.locator('#cubes-zone').boundingBox();
    for (let i = 0; i < 3; i++) { await page.mouse.click(z.x + z.width / 2, z.y + z.height / 2 + 40); await pause(250); }
    const n = await page.evaluate(() => window.C3.cubes.size); assert.ok(n >= 1, 'des cubes posés (' + n + ')');
    await clic('[data-a="cPlan"]'); await pause(4000); await clic('[data-a="cStl"]'); await pause(1500);
    assert.ok(creationsAvec(/^Plan de montage Ma tour\.pdf$/).length, 'plan de montage');
    const stl = path.join(docs('Mes créations 3D'), 'Ma tour.stl'); assert.ok(fs.existsSync(stl), 'fichier STL');
    const b = fs.readFileSync(stl); assert.strictEqual(b.length, 84 + 50 * b.readUInt32LE(80), 'STL binaire valide');
    await clic('[data-a="fermerVue"]'); await clic('[data-a="fermerVue"]');
  });
  await etape('Atelier 3D : rectangle, étage par étage, annuler et plan en vraies briques', async () => {
    await page.evaluate(() => ouvrirVue('cubes'));
    await page.fill('[data-in="cNouveau"]', 'Mon mur'); await clic('[data-a="cCreer"]');
    await page.waitForFunction(() => window.C3 && window.C3.rendu, null, { timeout: 15000 });
    const z = await page.locator('#cubes-zone').boundingBox(); const cx = z.x + z.width / 2, cy = z.y + z.height / 2;
    await plusOutils('cubes'); await clic('[data-a="cMode"][data-m="rectangle"]');
    await page.mouse.click(cx - 60, cy + 30); await pause(250); await page.mouse.click(cx + 50, cy + 90); await pause(400);
    const apresRect = await page.evaluate(() => C3.cubes.size);
    assert.ok(apresRect > 1, 'le rectangle a posé plusieurs cubes (' + apresRect + ')');
    await page.keyboard.press('Control+z'); await pause(250);
    assert.strictEqual(await page.evaluate(() => C3.cubes.size), 0, 'Ctrl+Z annule tout le rectangle');
    await clic('[data-a="cMode"][data-m="poser"]'); await clic('[data-a="cVue2d"]');
    await page.waitForSelector('#cubes-2d'); await pause(600); await page.locator('#cubes-2d').scrollIntoViewIfNeeded();
    let g = await page.locator('#cubes-2d').boundingBox(); const t = g.width / 20;
    await page.mouse.move(g.x + 2.5 * t, g.y + 2.5 * t); await page.mouse.down();
    for (let i = 3; i <= 8; i++) { await page.mouse.move(g.x + i * t + t / 2, g.y + 2.5 * t); await pause(40); }
    await page.mouse.up(); await pause(300);
    const n2d = await page.evaluate(() => C3.cubes.size);
    assert.ok(n2d >= 3, 'le glisser en 2D a posé une rangée (' + n2d + ' cubes)');
    await clic('[data-a="cEtage"][data-d="1"]');
    assert.ok(await page.locator('text=Étage 2').count(), 'on peut monter d’un étage');
    await clic('[data-a="cAnnuler"]'); await pause(250);
    assert.strictEqual(await page.evaluate(() => C3.cubes.size), 0, 'Annuler enlève tout le geste');
    const br = await page.evaluate(() => { const c = []; for (let x = 0; x < 4; x++) for (let z = 0; z < 2; z++) c.push([x + ',' + z, 10]); return briquesEtage(c).map((b) => b.nom); });
    assert.deepStrictEqual(br, ['2×4'], 'un bloc 4×2 devient une brique 2×4');
    await page.locator('#cubes-2d').scrollIntoViewIfNeeded(); await pause(300); const g2 = await page.locator('#cubes-2d').boundingBox(); g.x = g2.x; g.y = g2.y;
    await page.mouse.move(g.x + 2.5 * t, g.y + 2.5 * t); await page.mouse.down();
    for (let i = 3; i <= 6; i++) { await page.mouse.move(g.x + i * t + t / 2, g.y + 2.5 * t); await pause(40); }
    await page.mouse.up(); await pause(300);
    assert.ok(await page.evaluate(() => C3.cubes.size) > 0, 'une rangée pour le plan');
    await clic('[data-a="cVue2d"]'); await clic('[data-a="cPlan"]'); await pause(3000);
    assert.ok(creationsAvec(/^Plan de montage Mon mur\.pdf$/).length, 'le plan en briques est dans Mes créations');
    await clic('[data-a="fermerVue"]'); await clic('[data-a="fermerVue"]');
  });
  await etape('Studio : dessiner un dessin animé image par image', async () => {
    await rubrique('Je crée'); await tuile('Mon film');
    await page.fill('[data-in="filmTitre"]', 'Le bonhomme'); await clic('[data-a="filmNouveau"]');
    await clic('[data-a="filmDessiner"]');
    for (let i = 0; i < 2; i++) { const b = await page.locator('#fd-trait').boundingBox(); await page.mouse.move(b.x + 100 + i * 30, b.y + 120); await page.mouse.down(); await page.mouse.move(b.x + 200 + i * 30, b.y + 220, { steps: 6 }); await page.mouse.up(); await clic('#film-dessin [data-d="ajouter"]'); if (i === 0) await page.waitForFunction(() => FILM.p.images.length === 1, null, { timeout: 10000 }); } // la 2e : Fermer tout de suite, comme une enfant pressée
    await clic('#film-dessin [data-d="fermer"]');
    await page.waitForSelector('#film-dessin', { state: 'detached', timeout: 10000 });
    assert.strictEqual(await page.evaluate(() => FILM.p.images.length), 2, 'deux images dessinées dans la frise');
    await clic('[data-a="fermerVue"]'); await clic('[data-a="fermerVue"]');
  });
  await etape('Studio : glisser une image dans la frise, pot de peinture, aperçu, film en MP4 ou WebM', async () => {
    await rubrique('Je crée'); await tuile('Mon film');
    await page.fill('[data-in="filmTitre"]', 'Le saut'); await clic('[data-a="filmNouveau"]');
    await page.waitForFunction(() => FILM.flux && document.getElementById('anim-video').readyState >= 2, null, { timeout: 15000 });
    for (let i = 0; i < 3; i++) await clic('.declencheur');
    await page.waitForFunction(() => FILM.p.images.length === 3, null, { timeout: 10000 });
    const avant = await page.evaluate(() => FILM.p.images[0]);
    await page.locator('#anim-frise').scrollIntoViewIfNeeded(); await pause(300);
    const a = await page.locator('#anim-frise .vignette >> nth=0').boundingBox(); const b = await page.locator('#anim-frise .vignette >> nth=2').boundingBox();
    await page.mouse.move(a.x + 20, a.y + 20); await page.mouse.down(); await page.mouse.move(b.x + b.width - 5, b.y + 20, { steps: 10 }); await page.mouse.up(); await pause(300);
    assert.notStrictEqual(await page.evaluate(() => FILM.p.images[0]), avant, 'image déplacée dans la frise');
    await clic('[data-a="filmDessiner"]'); const t = await page.locator('#fd-trait').boundingBox();
    await clic('#film-dessin [data-d="pot"]'); await page.mouse.click(t.x + 50, t.y + 50); await pause(300);
    assert.ok(await page.evaluate(() => document.getElementById('fd-trait').getContext('2d').getImageData(10, 10, 1, 1).data[3] === 255), 'zone remplie');
    await clic('#film-dessin [data-d="apercu"]'); await pause(500);
    assert.ok(await page.evaluate(() => !document.getElementById('fd-apercu').hidden), 'aperçu animé');
    await clic('#film-dessin [data-d="apercu"]'); await clic('#film-dessin [data-d="fermer"]');
    await clic('[data-a="filmOnglet"][data-o="musique"]'); await clic('[data-a="filmMusique"][data-m="joyeuse"]');
    await clic('[data-a="filmFaire"]'); await page.waitForSelector('.bravo-film', { timeout: 60000 });
    const f = fs.readdirSync(path.join(os.homedir(), 'Documents', 'Mes créations')).find((x) => /^Le saut\.(mp4|webm)$/.test(x));
    assert.ok(f, 'film enregistré en MP4 ou WebM');
    assert.ok(fs.statSync(path.join(os.homedir(), 'Documents', 'Mes créations', f)).size > 20000, 'vidéo non vide (' + f + ')');
    await clic('[data-a="filmContinuer"]'); await clic('[data-a="fermerVue"]'); await clic('[data-a="fermerVue"]');
  });
  // ---------- Apprendre à se servir de l'ordinateur ----------
  await etape('L’école de l’ordinateur : clic, double-clic, glisser, clic droit, accents, Ctrl+Z', async () => {
    await rubrique('Mes outils'); assert.strictEqual(await page.locator('[data-a="tuile"]', { hasText: 'L’école de l’ordi' }).count(), 1, 'tuile de l’école');
    await page.evaluate(() => ouvrirVue('ecole'));
    let jeu = 'liste';
    try {
    jeu = 'clic'; await page.evaluate((i) => A.ecoleJeu({ id: i }), 'clic'); await pause(200); for (let i = 0; i < 10; i++) { await page.click('#eco-flocon', { force: true }); await pause(60); }
    await page.waitForSelector('.bravo-ecole');
    jeu = 'double'; await page.evaluate((i) => A.ecoleJeu({ id: i }), 'double'); await pause(200); for (let k = 0; k < 5; k++) await page.dblclick(`.cadeau[data-k="${k}"]`); await page.waitForSelector('.bravo-ecole');
    jeu = 'glisser'; await page.evaluate((i) => A.ecoleJeu({ id: i }), 'glisser'); await pause(200);
    for (let k = 0; k < 6; k++) { const b = await page.getAttribute(`.objet[data-k="${k}"]`, 'data-b'); const o = await page.locator(`.objet[data-k="${k}"]`).boundingBox(); const c = await page.locator(`.boite[data-b="${b}"]`).boundingBox();
      await page.mouse.move(o.x + o.width / 2, o.y + o.height / 2); await page.mouse.down(); await page.mouse.move(c.x + c.width / 2, c.y + c.height / 2, { steps: 6 }); await page.mouse.up(); await pause(80); }
    await page.waitForSelector('.bravo-ecole');
    jeu = 'droit'; await page.evaluate((i) => A.ecoleJeu({ id: i }), 'droit'); await pause(200); await page.click('.fichier.cible', { button: 'right' }); await clic('#eco-menu [data-m="renommer"]'); await page.fill('#eco-saisie', 'mon chat'); await page.press('#eco-saisie', 'Enter'); await page.waitForSelector('.bravo-ecole');
    jeu = 'accents'; await page.evaluate((i) => A.ecoleJeu({ id: i }), 'accents'); await pause(200); for (const m of ['été', 'très', 'garçon', 'là']) { await page.fill('#eco-saisie', m); await pause(150); } await page.waitForSelector('.bravo-ecole');
    jeu = 'annuler'; await page.evaluate((i) => A.ecoleJeu({ id: i }), 'annuler'); await pause(200); await page.type('#eco-saisie', 'flocon'); await clic('#eco-oups'); await page.keyboard.press('Control+z'); await page.waitForSelector('.bravo-ecole');
    } catch (e) { await page.screenshot({ path: path.join(CAPTURES, 'ecole-' + jeu + '.png') }).catch(() => {}); throw new Error('jeu « ' + jeu + ' » : ' + e.message.split('\n')[0] + ' ' + (e.message.match(/<[^>]+> (from|subtree)[^\n]*/) || [''])[0]); }
    const p = lire(path.join(os.homedir(), 'AppData', 'Roaming', 'Flocon', 'profil.json'));
    assert.strictEqual(Object.keys(p.ecole || {}).length, 6, 'six étoiles');
    await clic('[data-a="fermerVue"]'); await clic('[data-a="fermerVue"]');
  });
  await etape('Permis : « Montre-moi » et le dossier d’entraînement', async () => {
    await page.evaluate(() => ouvrirVue('permis'));
    assert.ok((await page.textContent('.affiche-ecole')).includes('6 sur 10'), 'étoiles de l’école sur le permis');
    await clic('[data-a="guideMission"][data-k="2-1"]'); await page.waitForSelector('.guide-mission');
    await clic('[data-a="entrainement"]'); await pause(1500);
    const d = path.join(os.homedir(), 'Documents', 'Entraînement'); assert.ok(fs.existsSync(path.join(d, 'dessin à renommer.jpg')), 'fichiers d’entraînement');
    await clic('[data-a="fermerVue"]');
  });
  await etape('Visite guidée : Givre montre les boutons du studio, et « ? » la relance', async () => {
    await rubrique('Je crée'); await tuile('Mon film'); await clic('[data-a="filmOuvrir"] >> nth=0');
    await clic('[data-a="revoirVisite"]'); await page.waitForSelector('#visite .visite-bulle');
    let n = 0; while (await page.locator('#visite').count() && n < 10) { await page.click('#visite [data-v="suivant"]'); n++; await pause(150); }
    assert.ok(n >= 4, 'plusieurs étapes (' + n + ')');
    await clic('[data-a="fermerVue"]'); await clic('[data-a="fermerVue"]');
  });
  await etape('Badges : un site utilisé donne « Je découvre »', async () => {
    const p = lire(path.join(os.homedir(), 'AppData', 'Roaming', 'Flocon', 'profil.json'));
    assert.ok(p.badges && p.badges['site:vikidia'] && p.badges['site:vikidia'].jours.length === 1, 'jour noté pour Vikidia');
    await rubrique('Je découvre');
    await page.waitForSelector('[data-a="tuile"]:has-text("Vikidia") .badge-tuile');
    await rubrique('Mes outils'); await tuile('Mon permis');
    await page.waitForSelector('.badge:has-text("Vikidia"):has-text("Je découvre")');
    await page.waitForSelector('text=Encore 3 jours pour « Je me débrouille »');
    await clic('[data-a="fermerVue"]');
  });
  await etape('Mes fiches : une leçon, un quiz corrigé, le score gardé', async () => {
    const { FICHES } = require('../../app/lib/fiches');
    const f = FICHES.find((x) => x.id === 'f-a');
    await rubrique('J’apprends'); await tuile('Mes fiches');
    await clic('[data-a="fichesMatiere"][data-m="francais"]'); await clic('[data-a="ouvrirFiche"][data-id="f-a"]');
    await page.waitForSelector('text=À retenir'); await clic('[data-a="quizCommencer"]');
    // Première question : une erreur volontaire, la correction doit s'afficher.
    await clic(`[data-a="quizRepondre"][data-i="${1 - f.questions[0].bonne}"]`); await page.waitForSelector('text=Pas tout à fait.'); await clic('[data-a="quizSuivant"]');
    for (let i = 1; i < f.questions.length; i++) { await clic(`[data-a="quizRepondre"][data-i="${f.questions[i].bonne}"]`); await page.waitForSelector('text=Bravo !'); await clic('[data-a="quizSuivant"]'); }
    await page.waitForSelector(`text=${f.questions.length - 1} sur ${f.questions.length}`);
    await pause(800);
    assert.strictEqual(lire(path.join(os.homedir(), 'AppData', 'Roaming', 'Flocon', 'profil.json')).quiz['f-a'].meilleur, f.questions.length - 1, 'score gardé');
    await clic('[data-a="fermerVue"]'); await page.waitForSelector('[data-a="ouvrirFiche"][data-id="f-a"] .etoiles-ligne'); await clic('[data-a="fermerVue"]');
  });
  await etape('Défi du jour : un flocon pour la collection, une seule fois par jour', async () => {
    await rubrique('J’apprends'); await tuile('Mes fiches');
    const bonne = await page.evaluate(() => questionDuJour().q.bonne);
    await clic(`[data-a="defiRepondre"][data-i="${bonne}"]`);
    await page.waitForSelector('text=Reviens demain');
    assert.strictEqual(await page.locator('[data-a="defiRepondre"]').count(), 0, 'plus de défi aujourd’hui');
    await pause(800);
    assert.strictEqual(lire(path.join(os.homedir(), 'AppData', 'Roaming', 'Flocon', 'profil.json')).flocons, 1, 'un flocon');
    await clic('[data-a="fermerVue"]');
  });
  await etape('Écrans malins : six leçons réussies, le badge', async () => {
    const { ECRANS } = require('../../app/lib/fiches');
    await rubrique('Mes outils'); await tuile('Écrans malins');
    for (const x of ECRANS) {
      await clic(`[data-a="ouvrirFiche"][data-id="${x.id}"]`); await clic('[data-a="quizCommencer"]');
      for (const q of x.questions) { await clic(`[data-a="quizRepondre"][data-i="${q.bonne}"]`); await clic('[data-a="quizSuivant"]'); }
      await page.waitForSelector(`text=${x.questions.length} sur ${x.questions.length}`);
      await clic('[data-a="fermerVue"]');
    }
    await page.waitForSelector('text=Badge « Écrans malins »');
    await pause(800);
    assert.ok(lire(path.join(os.homedir(), 'AppData', 'Roaming', 'Flocon', 'profil.json')).badgeEcrans, 'badge enregistré');
    await clic('[data-a="fermerVue"]');
  });
  await etape('Espace parent : mauvais code refusé', async () => {
    await rubrique('Mon style'); await clic('[data-a="espaceParent"]');
    await code('9999'); await page.waitForSelector('text=Ce n’est pas le bon code');
  });
  await etape('Espace parent : jetons, niveau 3 et un site', async () => {
    await code('1234'); await page.waitForSelector('[data-in="pJetons"]');
    await page.waitForSelector('.adresse-parent:has-text(":4747")', { timeout: 10000 });
    await page.fill('[data-in="pJetons"]', '6');
    await clic('[data-a="pNiveau"][data-n="3"]');
    const sites = await page.inputValue('[data-in="pSites"]');
    await page.fill('[data-in="pSites"]', sites + '\nexample.org');
    await page.fill('[data-in="pInterdits"]', 'C:\\Program Files\\Ameli\\AmeliPro.exe\nn’importe quoi');
    await clic('[data-a="pEnregistrer"]');
    tic();
    const t = enfant('Test');
    assert.deepStrictEqual(t.interdits, ['AmeliPro.exe'], 'programme interdit enregistré, sans son chemin');
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
  await etape('Arrêt brutal puis relance : la séance reprend, sans nouveaux jetons', async () => {
    // Flocon a été tué avant « Au revoir » : la séance à deux est encore ouverte côté gardien.
    const avant = etat();
    await page.waitForSelector('.fenetre'); await page.waitForSelector('text=Séance à deux');
    assert.ok(!(await fenetre()).kiosk, 'au bureau, pas en plein écran');
    tic();
    assert.strictEqual(etat().session.id, avant.session.id, 'même séance'); assert.strictEqual(etat().jetonsRestants, avant.jetonsRestants, 'aucun jeton pris');
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
    appli = await electron.launch({ executablePath: EXE, args: ['--ouvrir'], env: Object.assign({}, process.env, { FLOCON_COMPTE: COMPTE, FLOCON_CAMERA_FACTICE: '1' }), timeout: 60000 });
    page = await appli.firstWindow(); page.on('pageerror', (e) => erreursPage.push(e.message));
    await page.waitForSelector('.fenetre', { timeout: 30000 });
    await page.waitForSelector('text=Séance à deux');
    assert.ok(!(await fenetre()).kiosk, 'au bureau, pas en plein écran');
    const avant = etat().session.id; tic();
    assert.strictEqual(etat().session.id, avant, 'même séance, aucune nouvelle prise de jetons');
  });
  await etape('Journal : après une relance, le code secret est demandé', async () => {
    await rubrique('Mes lectures'); await tuile('Mon journal');
    await page.waitForSelector('text=Le code secret de ton journal');
    await code('0000'); await page.waitForSelector('text=Ce n’est pas le bon code');
    await code('1357'); await page.waitForSelector('[data-in="pageJournal"]');
    await clic('[data-a="fermerVue"]');
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
