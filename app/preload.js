'use strict';
const { contextBridge, ipcRenderer } = require('electron');

const appel = (canal) => (...a) => ipcRenderer.invoke(canal, ...a);
const canaux = ['init', 'etat', 'demande', 'parent', 'profil', 'mode', 'reduire', 'lancer', 'urlAutorisee', 'jeuxSteam', 'lireDoc', 'ecrireDoc', 'listerDocs', 'ouvrirDossier', 'photos', 'musique', 'livresAudio', 'creations', 'films', 'seance', 'fermer', 'documentExpose', 'imprimer', 'importerPhotos', 'casque', 'copierCasque', 'choisirFond', 'finir'];
const api = {};
canaux.forEach((c) => { api[c] = appel(c); });
api.surFenetreQuittee = (fn) => ipcRenderer.on('fenetre-quittee', () => fn());
api.surSiteRefuse = (fn) => ipcRenderer.on('site-refuse', (_e, url) => fn(url));
contextBridge.exposeInMainWorld('flocon', api);
