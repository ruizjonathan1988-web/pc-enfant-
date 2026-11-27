'use strict';
// Fait poser les verrous par le vrai gardien installé, sur la ruche d'un enfant déjà chargée dans HKU.
//   Flocon.exe (ELECTRON_RUN_AS_NODE=1) verrous.js <gardien.js> <SID> <niveau>
const [, , gardien, sid, niveau] = process.argv;
require(gardien).verrous(sid, { niveau: Number(niveau), sites: ['vikidia.org'] });
