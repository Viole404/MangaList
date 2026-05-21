import { useState, useEffect, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../lib/firebase';

// Usuário fictício do modo local — logado automaticamente, sem login real.
const LOCAL_USER = {
  uid: 'local',
  displayName: 'Modo local',
  email: null,
  photoURL: null,
  isLocal: true,
};

// Traduz códigos de erro do Firebase Auth para mensagens em português.
const AUTH_ERRORS = {
  'auth/invalid-email': 'E-mail inválido.',
  'auth/user-disabled': 'Esta conta foi desativada.',
  'auth/user-not-found': 'Não existe conta com este e-mail.',
  'auth/wrong-password': 'Senha incorreta.',
  'auth/invalid-credential': 'E-mail ou senha incorretos.',
  'auth/email-already-in-use': 'Este e-mail já está cadastrado.',
  'auth/weak-password': 'A senha precisa de pelo menos 6 caracteres.',
  'auth/missing-password': 'Informe uma senha.',
  'auth/popup-closed-by-user': 'Login cancelado.',
  'auth/popup-blocked': 'O navegador bloqueou o pop-up de login.',
  'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
  'auth/network-request-failed': 'Falha de rede. Verifique sua conexão.',
  'auth/operation-not-allowed': 'Este método de login não está habilitado no Firebase.',
};

function friendlyError(e) {
  return AUTH_ERRORS[e?.code] || e?.message || 'Algo deu errado. Tente novamente.';
}

/**
 * Estado de autenticação. Com Firebase configurado, suporta login Google e
 * e-mail/senha (com cadastro e recuperação). Sem credenciais, devolve um
 * usuário local já "logado" para que o app rode sem backend.
 *
 * As ações retornam `true` em caso de sucesso e `false` em falha (com a
 * mensagem disponível em `error`), facilitando o controle de fluxo na UI.
 */
export function useAuth() {
  const [user, setUser] = useState(isFirebaseConfigured ? undefined : LOCAL_USER);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isFirebaseConfigured) return undefined;
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      setLoading(false);
    });
    return unsub;
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const loginGoogle = useCallback(async () => {
    setError(null);
    if (!isFirebaseConfigured) {
      setUser(LOCAL_USER);
      return true;
    }
    try {
      await signInWithPopup(auth, googleProvider);
      return true;
    } catch (e) {
      setError(friendlyError(e));
      return false;
    }
  }, []);

  const loginEmail = useCallback(async (email, password) => {
    setError(null);
    if (!isFirebaseConfigured) {
      setUser({ ...LOCAL_USER, email });
      return true;
    }
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      return true;
    } catch (e) {
      setError(friendlyError(e));
      return false;
    }
  }, []);

  const registerEmail = useCallback(async (email, password, displayName) => {
    setError(null);
    if (!isFirebaseConfigured) {
      setUser({ ...LOCAL_USER, email, displayName: displayName || email });
      return true;
    }
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (displayName) await updateProfile(cred.user, { displayName: displayName.trim() });
      return true;
    } catch (e) {
      setError(friendlyError(e));
      return false;
    }
  }, []);

  const resetPassword = useCallback(async (email) => {
    setError(null);
    if (!isFirebaseConfigured) return true;
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return true;
    } catch (e) {
      setError(friendlyError(e));
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    if (!isFirebaseConfigured) {
      setUser(null);
      return;
    }
    await signOut(auth);
  }, []);

  return {
    user,
    loading,
    error,
    clearError,
    loginGoogle,
    loginEmail,
    registerEmail,
    resetPassword,
    logout,
    isLocal: !isFirebaseConfigured,
  };
}
