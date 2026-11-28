'use strict';
// ======================================================================
// L'ÉCOLE DE L'ORDINATEUR : les « premiers pas » du permis (niveau 1).
// Dix petits jeux de 2-3 minutes, validés tout seuls par Flocon :
// la souris (clic, double-clic, glisser, molette, clic droit),
// le clavier (prénom, accents, effacer et Entrée), annuler, et les fenêtres.
// ======================================================================
/* global S, F, A, SAISIES, esc, entete, toast, render, pluieDeFlocons, prenom, sauverProfil, dire */

const ECOLE = [
  { id: 'clic', e: '👆', titre: 'Le clic', intro: 'Le clic, c’est appuyer une fois sur le bouton de gauche de la souris, celui sous ton index. Attrape 10 flocons !', astuce: 'Pose ta main sur la souris sans serrer, et regarde l’écran, pas ta main.' },
  { id: 'double', e: '🎁', titre: 'Le double-clic', intro: 'Pour ouvrir quelque chose, on clique deux fois très vite, sans bouger la souris. Ouvre les 5 cadeaux !', astuce: 'Clic-clic, comme un petit galop. Si tu attends trop entre les deux, ça ne marche pas.' },
  { id: 'glisser', e: '✋', titre: 'Glisser-déposer', intro: 'Pour déplacer quelque chose : appuie sur le bouton, garde-le enfoncé, bouge la souris, puis lâche. Range chaque objet dans sa boîte !', astuce: 'Ne lâche le bouton qu’au-dessus de la bonne boîte.' },
  { id: 'molette', e: '🛞', titre: 'La molette', intro: 'La petite roue au milieu de la souris fait descendre et monter la page. Un trésor est caché tout en bas !', astuce: 'Fais rouler la molette vers toi pour descendre, vers l’écran pour remonter.' },
  { id: 'droit', e: '📋', titre: 'Le clic droit', intro: 'Le bouton de droite ouvre un petit menu avec des choses à faire. Renomme le fichier « dessin » en « mon chat » !', astuce: 'Clique avec le bouton de droite sur le fichier, puis choisis « Renommer » avec le bouton de gauche.' },
  { id: 'prenom', e: '✍️', titre: 'Mon prénom', intro: 'Écris ton prénom avec une majuscule au début.', astuce: 'La majuscule : garde la touche ⇧ (Maj) enfoncée, et appuie sur la lettre en même temps.' },
  { id: 'accents', e: 'é', titre: 'Les accents', intro: 'Sur le clavier français, les lettres avec accent sont sur la rangée des chiffres. Écris les 4 mots.', astuce: 'Sans appuyer sur Maj : é est sur le 2, è sur le 7, ç sur le 9, à sur le 0.' },
  { id: 'corriger', e: '⌫', titre: 'Effacer et valider', intro: 'Il y a une faute ! Clique juste après la faute, efface-la avec la touche ⌫ (au-dessus de Entrée), puis valide avec Entrée ↵.', astuce: 'La touche ⌫ efface la lettre à gauche du petit trait qui clignote.' },
  { id: 'annuler', e: '↶', titre: 'Annuler : Ctrl + Z', intro: 'Ctrl + Z, c’est la touche magique qui annule ta dernière action, presque partout. Écris un mot, appuie sur « Oups ! », puis répare avec Ctrl + Z.', astuce: 'Garde Ctrl (en bas à gauche) enfoncée, et appuie sur Z.' },
  { id: 'fenetres', e: '🪟', titre: 'Les fenêtres', intro: 'Chaque logiciel s’ouvre dans une fenêtre. On peut passer de l’une à l’autre avec la barre en bas de l’écran.', astuce: 'En bas de l’écran, chaque logiciel ouvert a son icône : clique dessus pour y aller.' }
];
const ECO = { prets: null };
const faitE = (id) => !!((S.profil.ecole || {})[id]);
const nbEcole = () => ECOLE.filter((x) => faitE(x.id)).length;

function vueEcole() {
  const v = S.vue; const m = ECOLE.find((x) => x.id === v.id);
  if (!m) {
    const n = nbEcole();
    return `<div class="section ecole">${entete('L’école de l’ordinateur', `<span class="etiquette">${n} sur ${ECOLE.length} ★</span>`)}
      <div class="panneau affiche-ecole"><div class="grow"><h3>${n === ECOLE.length ? '🎓 Bravo, tu as tous tes premiers pas !' : 'Apprends à te servir de l’ordinateur, en jouant'}</h3><p class="muet" style="margin:4px 0 0">${n === ECOLE.length ? 'Montre ton permis à un adulte : tu es prête pour le niveau 2.' : 'Dix petits jeux de deux minutes. Chaque jeu réussi te donne une étoile sur ton permis.'}</p></div><div class="grande-e">${n === ECOLE.length ? '🎓' : '🖱️'}</div></div>
      <div class="grille-ecole">${ECOLE.map((x, i) => `<button class="carte-ecole ${faitE(x.id) ? 'fait' : ''}" data-a="ecoleJeu" data-id="${x.id}"><span class="num">${faitE(x.id) ? '★' : i + 1}</span><span class="e">${esc(x.e)}</span><b>${esc(x.titre)}</b></button>`).join('')}</div></div>`;
  }
  const i = ECOLE.indexOf(m); const suivant = ECOLE[i + 1];
  return `<div class="section ecole">${entete(m.e + ' ' + m.titre, `<span class="etiquette">${i + 1} sur ${ECOLE.length}</span>`)}
    <div class="consigne-ecole"><span class="givre">❄️</span><div><p class="texte-defi" style="font-size:19px">${esc(m.intro)}</p><p class="muet" style="margin:6px 0 0">💡 ${esc(m.astuce)}</p></div></div>
    <div class="aire-ecole" id="ecole-aire" data-jeu="${m.id}">${aireHtml(m.id)}</div>
    <div class="rang entre"><span class="muet" id="ecole-score"></span><span class="rang">${v.reussi ? `${suivant ? `<button class="btn" style="background:#2FA36B" data-a="ecoleJeu" data-id="${suivant.id}">Jeu suivant : ${esc(suivant.titre)} →</button>` : '<button class="btn" style="background:#2FA36B" data-a="ecoleListe">Voir mes étoiles 🎓</button>'}` : '<button class="btn doux" data-a="ecoleRejouer">Recommencer</button>'}</span></div></div>`;
}
function aireHtml(id) {
  const v = S.vue;
  if (v.reussi) return `<div class="bravo-ecole">${pluieDeFlocons(30)}<span class="grande-e">⭐</span><h3>Réussi ! Une étoile de plus sur ton permis.</h3></div>`;
  if (id === 'clic') return '<button class="cible-flocon" id="eco-flocon" aria-label="Flocon">❄️</button>';
  if (id === 'double') return `<div class="cadeaux">${['🧸', '🚀', '🦄', '🎨', '📚'].map((x, k) => `<button class="cadeau" data-k="${k}" data-dans="${x}">🎁</button>`).join('')}</div><p class="muet centre" id="eco-aide"></p>`;
  if (id === 'glisser') {
    const objets = [['🍎', 'fruits'], ['🐶', 'animaux'], ['🚗', 'vehicules'], ['🍌', 'fruits'], ['🐱', 'animaux'], ['🚲', 'vehicules']];
    return `<div class="objets">${objets.map(([e, b], k) => `<span class="objet" data-b="${b}" data-k="${k}">${e}</span>`).join('')}</div>
      <div class="boites">${[['fruits', '🧺 Les fruits'], ['animaux', '🏠 Les animaux'], ['vehicules', '🅿️ Les véhicules']].map(([b, n]) => `<div class="boite" data-b="${b}"><b>${n}</b><div class="dedans"></div></div>`).join('')}</div>`;
  }
  if (id === 'molette') return `<div class="longue-page" id="eco-page">${['🌊 La surface de la mer', '🐠 Des poissons…', '🐙 Une pieuvre te fait coucou', '🦈 Attention, un requin !', '🐢 Une tortue nage par là', '🪸 Des coraux', '🐡 Encore plus profond…', '🦑 Un calmar géant', '⚓ Une vieille ancre', '🌑 Il fait tout noir…'].map((t) => `<p>${t}</p>`).join('')}<button class="tresor" data-a="ecoleTresor">💰 Le trésor ! Clique dessus</button></div>`;
  if (id === 'droit') return `<div class="bureau-fictif"><div class="fichier" data-f="photo">🖼️<span>photo.png</span></div><div class="fichier cible" data-f="dessin">🎨<span id="eco-nom">dessin.png</span></div><div class="fichier" data-f="histoire">📄<span>histoire.txt</span></div><div class="menu-fictif" id="eco-menu" hidden><button data-m="ouvrir">Ouvrir</button><button data-m="renommer">Renommer</button><button data-m="supprimer">Supprimer</button></div></div><p class="muet centre" id="eco-aide"></p>`;
  if (id === 'prenom') return `<div class="champ-ecole"><input class="champ grand-champ" id="eco-saisie" autocomplete="off" spellcheck="false" placeholder="Ton prénom"><p class="muet" id="eco-aide">${prenom() ? '' : 'Écris le prénom que tu as choisi pour Flocon.'}</p></div>${clavierHtml(['Maj'])}`;
  if (id === 'accents') { const mots = ['été', 'très', 'garçon', 'là']; const k = v.mot || 0; return `<div class="champ-ecole"><p class="mot-modele">Écris : <b>${mots[k]}</b> <span class="muet">(${k + 1} sur 4)</span></p><input class="champ grand-champ" id="eco-saisie" autocomplete="off" spellcheck="false"><p class="muet" id="eco-aide"></p></div>${clavierHtml(['é', 'è', 'ç', 'à'])}`; }
  if (id === 'corriger') return `<div class="champ-ecole"><p class="mot-modele">La bonne phrase : <b>Le chat dort sur le canapé.</b></p><input class="champ grand-champ" id="eco-saisie" value="Le chatt dort sur le canapé." autocomplete="off" spellcheck="false"><p class="muet" id="eco-aide">Quand c’est corrigé, appuie sur Entrée ↵.</p></div>`;
  if (id === 'annuler') return `<div class="champ-ecole"><input class="champ grand-champ" id="eco-saisie" autocomplete="off" spellcheck="false" placeholder="Écris un mot, par exemple flocon"><div class="rang"><button class="btn" style="background:#E53935" id="eco-oups" type="button">Oups ! (tout effacer)</button></div><p class="muet" id="eco-aide"></p></div>`;
  if (id === 'fenetres') return `<ol class="etapes-pause etapes-ecole"><li class="on"><span class="num">1</span><span>Clique ici pour ouvrir la calculatrice : <button class="btn petit" data-a="ecoleCalculatrice">Ouvrir la calculatrice</button></span></li><li><span class="num">2</span><span>Dans la calculatrice, calcule <b>12 + 30</b>.</span></li><li><span class="num">3</span><span>Reviens dans Flocon : clique sur l’icône de Flocon dans la barre en bas de l’écran (ou sur le trait — en haut de la calculatrice pour la réduire).</span></li><li><span class="num">4</span><span>Écris le résultat ici et appuie sur Entrée : <input class="champ" id="eco-saisie" inputmode="numeric" style="width:120px"></span></li></ol><p class="muet" id="eco-aide"></p>`;
  return '';
}
function clavierHtml(touches) {
  const ligne = [['²', ''], ['&', '1'], ['é', '2'], ['"', '3'], ['\'', '4'], ['(', '5'], ['-', '6'], ['è', '7'], ['_', '8'], ['ç', '9'], ['à', '0']];
  return `<div class="clavier-ecole"><div class="touches">${ligne.map(([b, h]) => `<span class="touche ${touches.includes(b) ? 'brille' : ''}"><small>${h}</small>${esc(b)}</span>`).join('')}</div>
    <div class="touches"><span class="touche large ${touches.includes('Maj') ? 'brille' : ''}">⇧ Maj</span><span class="touche">A</span><span class="touche">Z</span><span class="touche">E</span><span class="touche">R</span><span class="touche">T</span><span class="touche">Y</span><span class="touche large">⌫</span><span class="touche large">Entrée ↵</span></div></div>`;
}
function reussir() {
  const id = S.vue.id; S.profil.ecole = Object.assign({}, S.profil.ecole, { [id]: new Date().toISOString() }); sauverProfil();
  S.vue.reussi = true; ECO.prets = null; render();
  if (nbEcole() === ECOLE.length) dire('Tu as tous tes premiers pas ! Montre ton permis à un adulte.');
}
function score(t) { const s = document.getElementById('ecole-score'); if (s) s.textContent = t; }
// Chaque jeu se branche après l'affichage (une seule fois par aire de jeu).
function ecoleApresRendu() {
  const aire = document.getElementById('ecole-aire'); if (!aire || aire.dataset.pret || S.vue.reussi) { if (!aire && ECO.minuterie) { clearInterval(ECO.minuterie); ECO.minuterie = null; } return; }
  aire.dataset.pret = '1'; const id = aire.dataset.jeu; clearInterval(ECO.minuterie); ECO.minuterie = null;
  if (id === 'clic') {
    let n = 0; const f = document.getElementById('eco-flocon');
    const placer = () => { const r = aire.getBoundingClientRect(); f.style.left = Math.random() * (r.width - 90) + 'px'; f.style.top = Math.random() * (r.height - 90) + 'px'; };
    placer(); ECO.minuterie = setInterval(placer, 2200); score('0 sur 10');
    f.addEventListener('click', (e) => { if (e.button !== 0) return; n++; score(n + ' sur 10'); f.classList.remove('pop'); void f.offsetWidth; f.classList.add('pop'); placer(); if (n >= 10) { clearInterval(ECO.minuterie); reussir(); } });
  } else if (id === 'double') {
    let n = 0; score('0 sur 5');
    aire.querySelectorAll('.cadeau').forEach((c) => {
      c.addEventListener('dblclick', () => { if (c.classList.contains('ouvert')) return; c.classList.add('ouvert'); c.textContent = c.dataset.dans; n++; score(n + ' sur 5'); if (n >= 5) setTimeout(reussir, 600); });
      c.addEventListener('click', (e) => { if (e.detail !== 1 || c.classList.contains('ouvert')) return; setTimeout(() => { if (!c.classList.contains('ouvert')) { c.classList.remove('secoue'); void c.offsetWidth; c.classList.add('secoue'); const a = document.getElementById('eco-aide'); if (a) a.textContent = 'Presque ! Il faut cliquer deux fois, très vite.'; } }, 420); });
    });
  } else if (id === 'glisser') {
    let n = 0; score('0 sur 6');
    aire.querySelectorAll('.objet').forEach((o) => {
      o.addEventListener('pointerdown', (e) => {
        if (o.classList.contains('range')) return; e.preventDefault(); o.setPointerCapture(e.pointerId); const r0 = o.getBoundingClientRect(); const dx = e.clientX - r0.left, dy = e.clientY - r0.top;
        o.classList.add('porte'); o.style.position = 'fixed'; o.style.left = r0.left + 'px'; o.style.top = r0.top + 'px';
        const bouger = (ev) => { o.style.left = ev.clientX - dx + 'px'; o.style.top = ev.clientY - dy + 'px'; };
        const lacher = (ev) => {
          o.removeEventListener('pointermove', bouger); o.removeEventListener('pointerup', lacher); o.style.pointerEvents = 'none';
          const sous = document.elementFromPoint(ev.clientX, ev.clientY); o.style.pointerEvents = ''; const b = sous && sous.closest('.boite');
          o.classList.remove('porte'); o.style.position = ''; o.style.left = ''; o.style.top = '';
          if (b && b.dataset.b === o.dataset.b) { b.querySelector('.dedans').appendChild(o); o.classList.add('range'); n++; score(n + ' sur 6'); if (n >= 6) setTimeout(reussir, 500); }
          else if (b) toast('Ce n’est pas la bonne boîte, essaie encore !');
        };
        o.addEventListener('pointermove', bouger); o.addEventListener('pointerup', lacher);
      });
    });
  } else if (id === 'droit') {
    const menu = document.getElementById('eco-menu'); const aide = document.getElementById('eco-aide');
    aire.querySelectorAll('.fichier').forEach((f) => {
      f.addEventListener('contextmenu', (e) => { e.preventDefault(); const r = aire.getBoundingClientRect(); menu.hidden = false; menu.style.left = e.clientX - r.left + 'px'; menu.style.top = e.clientY - r.top + 'px'; menu.dataset.f = f.dataset.f; });
      f.addEventListener('click', () => { aide.textContent = 'C’était le bouton de gauche. Essaie avec celui de droite !'; });
    });
    aire.addEventListener('click', (e) => { if (!e.target.closest('.menu-fictif') && !e.target.closest('.fichier')) menu.hidden = true; });
    menu.addEventListener('click', (e) => {
      const b = e.target.closest('[data-m]'); if (!b) return; menu.hidden = true;
      if (menu.dataset.f !== 'dessin') { aide.textContent = 'C’est le fichier « dessin » qu’il faut renommer.'; return; }
      if (b.dataset.m !== 'renommer') { aide.textContent = b.dataset.m === 'supprimer' ? 'Ouf, on ne supprime pas pour de vrai ici ! Choisis plutôt « Renommer ».' : 'Bien ouvert ! Mais la mission, c’est « Renommer ».'; return; }
      const nom = document.getElementById('eco-nom'); nom.innerHTML = '<input class="champ" id="eco-saisie" value="dessin" spellcheck="false">'; const s = document.getElementById('eco-saisie'); s.focus(); s.select();
      aide.textContent = 'Écris « mon chat », puis appuie sur Entrée.';
      s.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { if (s.value.trim().toLowerCase().replace(/\.png$/, '') === 'mon chat') reussir(); else aide.textContent = 'Il faut écrire exactement « mon chat ».'; } });
    });
  } else if (['prenom', 'accents', 'corriger', 'annuler', 'fenetres'].includes(id)) {
    const s = document.getElementById('eco-saisie'); const aide = document.getElementById('eco-aide'); if (id !== 'fenetres') s.focus();
    if (id === 'prenom') s.addEventListener('input', () => { const p = prenom(); const v = s.value.trim(); if (p && v === p) reussir(); else if (p && v.toLowerCase() === p.toLowerCase() && v.length === p.length) aide.textContent = 'Presque ! Il manque la majuscule au début (⇧ Maj + la lettre).'; else if (!p && v.length >= 2 && v[0] === v[0].toUpperCase() && v[0] !== v[0].toLowerCase()) reussir(); });
    if (id === 'accents') { const mots = ['été', 'très', 'garçon', 'là']; s.addEventListener('input', () => { const k = S.vue.mot || 0; if (s.value.trim() === mots[k]) { if (k >= 3) reussir(); else { S.vue.mot = k + 1; render(); } } else if (s.value.trim().length >= mots[k].length) aide.textContent = 'Regarde bien le clavier en dessous : la touche qui brille.'; }); }
    if (id === 'corriger') s.addEventListener('keydown', (e) => { if (e.key === 'Enter') { if (s.value.trim() === 'Le chat dort sur le canapé.') reussir(); else aide.textContent = 'Il reste une faute : compare bien avec la bonne phrase.'; } });
    if (id === 'annuler') {
      let efface = false;
      document.getElementById('eco-oups').addEventListener('click', () => { if (!s.value.trim()) { aide.textContent = 'Écris d’abord un mot !'; return; } s.focus(); s.select(); document.execCommand('delete'); efface = true; aide.textContent = 'Oh non, tout a disparu ! Appuie sur Ctrl + Z pour le faire revenir.'; });
      s.addEventListener('input', () => { if (efface && s.value.trim()) { efface = false; reussir(); } });
    }
    if (id === 'fenetres') s.addEventListener('keydown', (e) => { if (e.key === 'Enter') { if (s.value.trim() === '42') reussir(); else aide.textContent = 'Ce n’est pas ça : refais le calcul 12 + 30 dans la calculatrice.'; } });
  }
}
Object.assign(A, {
  ecoleJeu: (d) => { S.vue = { ref: 'ecole', id: d.id }; render(); },
  ecoleListe: () => { S.vue = { ref: 'ecole' }; render(); },
  ecoleRejouer: () => { S.vue = { ref: 'ecole', id: S.vue.id }; render(); },
  ecoleTresor: () => { if (S.vue.id === 'molette') reussir(); },
  ecoleCalculatrice: async () => {
    const li = document.querySelectorAll('.etapes-ecole li'); li.forEach((x, i) => x.classList.toggle('on', i === 1));
    const r = await F.lancer({ type: 'logiciel', ref: 'calculatrice' });
    if (r && r.ok === false) toast('La calculatrice ne s’ouvre pas ici. Fais le calcul de tête !');
  }
});
const fermerVueAvantEcole = A.fermerVue;
A.fermerVue = async (d) => { if (S.vue && S.vue.ref === 'ecole' && S.vue.id) { S.vue = { ref: 'ecole' }; render(); return; } fermerVueAvantEcole(d); };
