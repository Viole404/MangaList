import { useState, useEffect, useCallback } from 'react';
import { isFirebaseConfigured } from '../lib/firebase';
import { animateLayout } from '../lib/viewTransition';
import * as dbApi from '../lib/db';

/**
 * Fonte das obras com fallback automático:
 * - Firebase configurado → assina o Firestore em tempo real e persiste o CRUD lá.
 * - Sem credenciais → estado em memória (começa vazio; os dados duram até recarregar).
 *
 * As funções de CRUD têm a mesma assinatura nos dois modos (sempre Promises),
 * então o componente que as consome não precisa saber qual está ativo.
 */
export function useObras(userId) {
  const [obras, setObras] = useState([]);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured || !userId) return undefined;
    setLoading(true);
    const unsub = dbApi.subscribeToObras(
      userId,
      (data) => {
        // Anima a reordenação quando o Firestore empurra mudanças (ex.: bater
        // capítulo move o card para o topo, ordenado por `atualizadoEm`).
        animateLayout(() => {
          setObras(data);
          setLoading(false);
        });
      },
      (err) => {
        console.error('[MangaList] Falha ao ler obras do Firestore:', err);
        setLoading(false);
      }
    );
    return unsub;
  }, [userId]);

  const addObra = useCallback(
    async (data) => {
      if (isFirebaseConfigured) {
        return dbApi.addObra(userId, data);
      }
      animateLayout(() =>
        setObras((prev) => [
          { ...dbApi.buildObraPayload(data), id: `local-${Date.now()}` },
          ...prev,
        ])
      );
      return undefined;
    },
    [userId]
  );

  const updateObra = useCallback(async (id, data) => {
    if (isFirebaseConfigured) {
      return dbApi.updateObra(id, data);
    }
    animateLayout(() =>
      setObras((prev) =>
        prev.map((o) => (o.id === id ? { ...o, ...dbApi.buildObraPayload(data) } : o))
      )
    );
    return undefined;
  }, []);

  const updateCapitulo = useCallback(async (id, capitulo) => {
    if (isFirebaseConfigured) {
      return dbApi.updateCapitulo(id, capitulo);
    }
    animateLayout(() =>
      setObras((prev) =>
        prev.map((o) => (o.id === id ? { ...o, capituloAtual: String(capitulo) } : o))
      )
    );
    return undefined;
  }, []);

  const deleteObra = useCallback(async (id) => {
    if (isFirebaseConfigured) {
      return dbApi.deleteObra(id);
    }
    animateLayout(() => setObras((prev) => prev.filter((o) => o.id !== id)));
    return undefined;
  }, []);

  return { obras, loading, addObra, updateObra, updateCapitulo, deleteObra };
}
