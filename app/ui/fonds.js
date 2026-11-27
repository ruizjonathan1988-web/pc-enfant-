'use strict';
// Fonds d'écran : dégradés flous avec un léger grain, générés en SVG (aucune image à télécharger).

(function () {
  function hasard(graine) { let s = graine; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

  function mur(id, base, taches, extra) {
    const c = taches.map(([x, y, r, col, o]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${col}" opacity="${o}"/>`).join('');
    return `<svg viewBox="0 0 1280 800" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><defs><filter id="f${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="110"/></filter><filter id="g${id}"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><filter id="h${id}" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="30"/></filter></defs><rect width="1280" height="800" fill="${base}"/><g filter="url(#f${id})">${c}</g>${extra || ''}<rect width="1280" height="800" filter="url(#g${id})" opacity="0.07"/></svg>`;
  }

  function points(col, n, rmin, rmax, op, graine) {
    const h = hasard(graine);
    let s = `<g fill="${col}">`;
    for (let i = 0; i < n; i++) s += `<circle cx="${Math.round(h() * 1280)}" cy="${Math.round(h() * 800)}" r="${(rmin + h() * (rmax - rmin)).toFixed(1)}" opacity="${(op * (0.5 + h() / 2)).toFixed(2)}"/>`;
    return s + '</g>';
  }

  function feuilles(col, n, graine) {
    const h = hasard(graine);
    let s = `<g fill="${col}">`;
    for (let i = 0; i < n; i++) { const x = Math.round(h() * 1280), y = Math.round(h() * 800), a = Math.round(h() * 180); s += `<ellipse cx="${x}" cy="${y}" rx="${6 + Math.round(h() * 4)}" ry="${3 + Math.round(h() * 2)}" transform="rotate(${a} ${x} ${y})" opacity="${(0.3 + h() * 0.35).toFixed(2)}"/>`; }
    return s + '</g>';
  }

  const THEMES = [
    { id: 'aurore', nom: 'Aurore', accent: '#E0457B', clair: true, apercu: ['#FF9A6B', '#FFC94D', '#7FD3A8', '#8FB8FF'],
      svg: () => mur('A', '#FCE3D2', [[180, 140, 330, '#FF9A6B', .85], [1080, 120, 300, '#FFC94D', .8], [1100, 700, 360, '#7FD3A8', .7], [260, 760, 320, '#8FB8FF', .7], [660, 420, 220, '#FFB3C7', .5]]) },
    { id: 'lagon', nom: 'Lagon', accent: '#13A39F', apercu: ['#13C2C2', '#3A7BFF', '#0B4F7A', '#7FE3F2'],
      svg: () => mur('B', '#0B4F7A', [[160, 120, 360, '#13C2C2', .75], [1120, 180, 340, '#3A7BFF', .75], [980, 760, 380, '#7FE3F2', .45], [240, 720, 320, '#0A2F5A', .9]]) },
    { id: 'cosmos', nom: 'Cosmos', accent: '#7C5CFA', apercu: ['#6B3FD6', '#0F0B2E', '#FF4FA3', '#2A5BD7'],
      svg: () => mur('C', '#0F0B2E', [[300, 200, 320, '#6B3FD6', .75], [1050, 620, 360, '#2A5BD7', .6], [1000, 120, 220, '#FF4FA3', .45], [220, 700, 260, '#0B6E8A', .5]], points('#fff', 40, 0.8, 1.8, 0.9, 7)) },
    { id: 'foret', nom: 'Forêt', accent: '#2FA36B', apercu: ['#2F7A55', '#0D2419', '#9BDB8A', '#1F5A3A'],
      svg: () => mur('D', '#0D2419', [[220, 160, 340, '#2F7A55', .8], [1080, 240, 300, '#9BDB8A', .35], [900, 760, 380, '#1F5A3A', .9], [200, 720, 260, '#C8D86A', .25]]) },
    { id: 'banquise', nom: 'Banquise', accent: '#2B7BD6', clair: true, apercu: ['#BFE9FF', '#8FC8FF', '#7FF2D0', '#F4FBFF'],
      svg: () => mur('E', '#DDF1FF', [[200, 140, 340, '#BFE9FF', .9], [1100, 160, 320, '#8FC8FF', .8], [1040, 720, 360, '#E6F7FF', .9], [220, 740, 300, '#6FB6E8', .6], [660, 380, 220, '#D9CCFF', .45]],
        '<g opacity="0.35" filter="url(#hE)"><path d="M0 170 C 300 90, 600 230, 900 130 S 1200 90, 1280 150" stroke="#7FF2D0" stroke-width="60" fill="none"/></g><path d="M0 640 L180 600 L300 625 L470 590 L620 618 L800 596 L960 622 L1120 600 L1280 615 V800 H0 Z" fill="#fff" opacity="0.75"/><path d="M0 700 L240 676 L520 694 L760 672 L1020 690 L1280 676 V800 H0 Z" fill="#F4FBFF" opacity="0.9"/>') },
    { id: 'neon', nom: 'Néon', accent: '#FF4FA3', apercu: ['#0E1022', '#FF4FA3', '#7C5CFA', '#4FE3FF'],
      svg: () => mur('F', '#0E1022', [[640, 430, 260, '#7C5CFA', .35], [200, 150, 260, '#FF4FA3', .25]], '<g stroke="#2B2F6B" stroke-width="1.5"><path d="M0 560 H1280 M0 610 H1280 M0 670 H1280 M0 740 H1280"/><path d="M640 520 L0 800 M640 520 L320 800 M640 520 L640 800 M640 520 L960 800 M640 520 L1280 800"/></g><circle cx="640" cy="430" r="150" fill="none" stroke="#FF4FA3" stroke-width="6"/><path d="M0 520 H1280" stroke="#4FE3FF" stroke-width="3"/>') },
    { id: 'sable', nom: 'Sable', accent: '#B06A00', clair: true, apercu: ['#EFEBE3', '#E2B49A', '#C9D3C0', '#F6E2CF'],
      svg: () => mur('G', '#EFEBE3', [[1040, 220, 300, '#E2B49A', .7], [220, 680, 340, '#C9D3C0', .8], [640, 400, 220, '#F6E2CF', .6]]) },
    { id: 'sorbet', nom: 'Sorbet', accent: '#D4537E', clair: true, apercu: ['#FF8FB1', '#FFD86B', '#AFA9EC', '#9FE1CB'],
      svg: () => mur('H', '#FFE6EF', [[200, 160, 320, '#FF8FB1', .75], [1100, 140, 300, '#FFD86B', .6], [1060, 700, 340, '#AFA9EC', .75], [260, 720, 300, '#9FE1CB', .7]]) },
    { id: 'saisons', nom: 'Au fil des saisons', accent: '#C8551F', apercu: ['#FFB7CF', '#FFC23D', '#C8551F', '#3E6BB8'], saisons: true }
  ];

  const SAISONS = {
    printemps: { nom: 'le printemps', accent: '#D4537E', clair: true, svg: () => mur('P', '#F3F7E6', [[220, 160, 320, '#FFB7CF', .8], [1060, 140, 300, '#C7EBA0', .85], [1040, 700, 340, '#FFE59A', .6], [240, 720, 320, '#9FD8C4', .7]], feuilles('#FF8FB1', 30, 3)) },
    ete: { nom: 'l’été', accent: '#E8892A', clair: true, svg: () => mur('S', '#FFE7B8', [[200, 140, 340, '#FFC23D', .85], [1080, 120, 300, '#FF8A5B', .7], [1060, 720, 360, '#2EC4C4', .7], [240, 740, 320, '#7FD3F2', .7]]) },
    automne: { nom: 'l’automne', accent: '#C8551F', svg: () => mur('U', '#3A1F1A', [[220, 160, 340, '#C8551F', .85], [1080, 180, 300, '#E8A33D', .7], [980, 740, 360, '#7A2F4A', .8], [240, 720, 300, '#5C3A1E', .9]], feuilles('#F2B35A', 22, 5)) },
    hiver: { nom: 'l’hiver', accent: '#3E6BB8', svg: () => mur('W', '#1B2A4A', [[240, 160, 340, '#3E6BB8', .8], [1060, 160, 300, '#8FB8E8', .55], [1000, 720, 360, '#24365E', .9], [260, 720, 300, '#6F8FC8', .5]], points('#fff', 70, 1.2, 3.2, 0.9, 11)) }
  };

  function saisonActuelle(d) {
    const m = (d || new Date()).getMonth();
    return m >= 2 && m <= 4 ? 'printemps' : m >= 5 && m <= 7 ? 'ete' : m >= 8 && m <= 10 ? 'automne' : 'hiver';
  }

  // Renvoie { svg, accent, clair } pour un thème (les saisons suivent la date).
  function resoudre(id) {
    const t = THEMES.find((x) => x.id === id) || THEMES[0];
    if (t.saisons) { const s = SAISONS[saisonActuelle()]; return { id: t.id, nom: t.nom, svg: s.svg(), accent: s.accent, clair: !!s.clair, saison: s.nom }; }
    return { id: t.id, nom: t.nom, svg: t.svg(), accent: t.accent, clair: !!t.clair };
  }

  function apercu(t) {
    const [a, b, c, d] = t.apercu;
    if (t.saisons) return `linear-gradient(90deg, ${a} 0 25%, ${b} 25% 50%, ${c} 50% 75%, ${d} 75%)`;
    return `radial-gradient(circle at 20% 25%, ${a}, transparent 60%), radial-gradient(circle at 85% 85%, ${b}, transparent 65%), radial-gradient(circle at 80% 15%, ${c}, transparent 55%), ${d}`;
  }

  window.FONDS = { THEMES, resoudre, apercu, saisonActuelle };
})();
