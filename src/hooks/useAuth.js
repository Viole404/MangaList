import { useState, useEffect, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword,
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

// Mapeia códigos de erro do Firebase Auth para CHAVES de tradução. A mensagem
// final é resolvida na UI via t(key), pra respeitar o idioma escolhido.
const AUTH_ERROR_KEYS = {
  'auth/invalid-email': 'autherr_invalid_email',
  'auth/user-disabled': 'autherr_user_disabled',
  'auth/user-not-found': 'autherr_user_not_found',
  'auth/wrong-password': 'autherr_wrong_password',
  'auth/invalid-credential': 'autherr_invalid_credential',
  'auth/email-already-in-use': 'autherr_email_in_use',
  'auth/weak-password': 'autherr_weak_password',
  'auth/missing-password': 'autherr_missing_password',
  'auth/popup-closed-by-user': 'autherr_popup_closed',
  'auth/popup-blocked': 'autherr_popup_blocked',
  'auth/too-many-requests': 'autherr_too_many',
  'auth/network-request-failed': 'autherr_network',
  'auth/operation-not-allowed': 'autherr_not_allowed',
};

function friendlyError(e) {
  return AUTH_ERROR_KEYS[e?.code] || 'autherr_generic';
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
  // O objeto User do Firebase é mutado in-place por updateProfile; este tick
  // força um re-render pra UI refletir o nome novo.
  const [, bumpProfile] = useState(0);

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

  // Atualiza o apelido (displayName). Reflete em todo o app, inclusive no nome
  // mostrado na lista compartilhada.
  const updateDisplayName = useCallback(async (name) => {
    const clean = (name || '').trim();
    setError(null);
    if (!isFirebaseConfigured) {
      setUser((u) => ({ ...(u || LOCAL_USER), displayName: clean || null }));
      return true;
    }
    try {
      await updateProfile(auth.currentUser, { displayName: clean });
      bumpProfile((n) => n + 1);
      return true;
    } catch (e) {
      setError(friendlyError(e));
      return false;
    }
  }, []);

  // Troca a senha. Pode exigir login recente (reauth) — sinalizamos isso pra
  // a UI oferecer o fluxo de redefinição por e-mail.
  const changePassword = useCallback(async (newPassword) => {
    setError(null);
    if (!isFirebaseConfigured) return { ok: true };
    try {
      await updatePassword(auth.currentUser, newPassword);
      return { ok: true };
    } catch (e) {
      if (e?.code === 'auth/requires-recent-login') return { ok: false, reauth: true };
      const key = friendlyError(e);
      setError(key);
      return { ok: false, messageKey: key };
    }
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
    updateDisplayName,
    changePassword,
    logout,
    isLocal: !isFirebaseConfigured,
  };
}
