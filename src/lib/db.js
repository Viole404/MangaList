import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION = 'obras';

// Converte "9", 9, "" → 9 | null. Garante que `nota` seja sempre número ou null.
function normalizeNota(value) {
  if (value === '' || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

// Monta o payload de uma obra com defaults consistentes (sem timestamps).
export function buildObraPayload(data) {
  return {
    titulo: data.titulo,
    tipo: data.tipo, // 'manga' | 'webtoon' | 'manhua' | 'manhwa'
    site: data.site, // 'Sakura Mangás' | 'Kitsune Yako' | 'MangaDex'
    siteKey: data.siteKey,
    capituloAtual: String(data.capituloAtual || '1'),
    status: data.status || 'lendo', // 'lendo' | 'pausado' | 'concluído' | 'dropado'
    nota: normalizeNota(data.nota), // 1–10 ou null
    generos: data.generos || [],
    capa: data.capa || null, // URL da imagem
    notasLivres: data.notasLivres || '',
    urlOrigem: data.urlOrigem || '',
  };
}

/**
 * Retorna a função de unsubscribe — chame ao desmontar o componente.
 * `onError` recebe falhas do listener (ex.: índice composto ausente).
 */
export function subscribeToObras(userId, callback, onError) {
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId),
    orderBy('atualizadoEm', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const obras = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(obras);
    },
    (err) => {
      if (onError) onError(err);
    }
  );
}

export async function addObra(userId, data) {
  return addDoc(collection(db, COLLECTION), {
    userId,
    ...buildObraPayload(data),
    criadoEm: serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  });
}

export async function updateObra(obraId, data) {
  const ref = doc(db, COLLECTION, obraId);
  const { titulo, tipo, site, siteKey, capituloAtual, status, nota, generos, capa, notasLivres, urlOrigem } =
    buildObraPayload(data);
  return updateDoc(ref, {
    titulo,
    tipo,
    site,
    siteKey,
    capituloAtual,
    status,
    nota,
    generos,
    capa,
    notasLivres,
    urlOrigem,
    atualizadoEm: serverTimestamp(),
  });
}

export async function updateCapitulo(obraId, capitulo) {
  const ref = doc(db, COLLECTION, obraId);
  return updateDoc(ref, {
    capituloAtual: String(capitulo),
    atualizadoEm: serverTimestamp(),
  });
}

export async function deleteObra(obraId) {
  return deleteDoc(doc(db, COLLECTION, obraId));
}
