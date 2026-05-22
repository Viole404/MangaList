// Compartilhamento de lista por link.
//
// Modelo: a lista pública é uma CÓPIA reduzida das obras, gravada em
// `publicLists/{token}`. As obras originais continuam privadas. O token é
// aleatório (link só funciona pra quem o tem) e fica salvo no perfil do dono
// em `users/{uid}.shareToken`. Desligar = apagar o documento público.

import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

const PUBLIC = 'publicLists';
const USERS = 'users';

// Token aleatório de 32 chars hex — inviável de adivinhar, sem dependências.
function genToken() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

// Reduz a obra ao "básico" exibido na lista pública (sem nota, gêneros,
// anotações ou URL de origem — só o necessário pro card).
function toPublicObra(o) {
  return {
    id: o.id,
    titulo: o.titulo,
    tipo: o.tipo || 'manga',
    site: o.site || '',
    siteKey: o.siteKey || '',
    capituloAtual: String(o.capituloAtual ?? ''),
    status: o.status || 'lendo',
    capa: o.capa || null,
  };
}

function buildPublicObras(obras) {
  return (obras || []).map(toPublicObra);
}

function snapshot(user, obras) {
  return {
    ownerId: user.uid,
    ownerName: user.displayName || 'Lista de mangás',
    obras: buildPublicObras(obras),
    updatedAt: serverTimestamp(),
  };
}

// Token de compartilhamento atual do usuário (ou null se não compartilha).
export async function getShareToken(uid) {
  if (!db) return null;
  const snap = await getDoc(doc(db, USERS, uid));
  return snap.exists() ? snap.data().shareToken || null : null;
}

// Liga o compartilhamento: gera token, grava a cópia pública e salva o token.
export async function enableShare(user, obras) {
  const token = genToken();
  await setDoc(doc(db, PUBLIC, token), snapshot(user, obras));
  await setDoc(doc(db, USERS, user.uid), { shareToken: token }, { merge: true });
  return token;
}

// Atualiza a cópia pública (chamado ao vivo quando a lista muda).
export async function syncShare(token, user, obras) {
  await setDoc(doc(db, PUBLIC, token), snapshot(user, obras), { merge: true });
}

// Desliga: apaga a cópia pública e limpa o token do perfil.
export async function disableShare(uid, token) {
  if (token) await deleteDoc(doc(db, PUBLIC, token));
  await setDoc(doc(db, USERS, uid), { shareToken: null }, { merge: true });
}

// Lê uma lista pública pelo token (sem login).
export async function getPublicList(token) {
  if (!db) return null;
  const snap = await getDoc(doc(db, PUBLIC, token));
  return snap.exists() ? snap.data() : null;
}
