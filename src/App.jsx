import { useState, useMemo, useEffect, useCallback } from 'react';
import { useTheme } from './hooks/useTheme';
import { useAuth } from './hooks/useAuth';
import { useObras } from './hooks/useObras';
import { useShareTarget } from './hooks/useShareTarget';
import { STATUS_CONFIG } from './lib/constants';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import FilterTabs from './components/FilterTabs';
import ObraCard from './components/ObraCard';
import ObraModal from './components/ObraModal';
import EmptyState from './components/EmptyState';
import Login from './components/Login';
import styles from './App.module.css';

const STATUS_KEYS = Object.keys(STATUS_CONFIG);

export default function App() {
  const { isDark, toggleTheme } = useTheme();
  const {
    user,
    loading: authLoading,
    error: authError,
    clearError,
    loginGoogle,
    loginEmail,
    registerEmail,
    resetPassword,
    logout,
    isLocal,
  } = useAuth();
  const { obras, loading: obrasLoading, addObra, updateObra, updateCapitulo, deleteObra } =
    useObras(user?.uid);
  const { sharedUrl, clearShared } = useShareTarget();

  const [filter, setFilter] = useState('todos');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingObra, setEditingObra] = useState(null);
  const [initialUrl, setInitialUrl] = useState('');

  // URL chegando via compartilhamento → abre o modal de adicionar já preenchido.
  useEffect(() => {
    if (sharedUrl) {
      setEditingObra(null);
      setInitialUrl(sharedUrl);
      setModalOpen(true);
      clearShared();
    }
  }, [sharedUrl, clearShared]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return obras.filter((o) => {
      const matchStatus = filter === 'todos' || o.status === filter;
      const matchSearch = o.titulo.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [obras, filter, search]);

  const counts = useMemo(() => {
    const base = { todos: obras.length };
    for (const key of STATUS_KEYS) base[key] = 0;
    for (const o of obras) {
      if (base[o.status] !== undefined) base[o.status] += 1;
    }
    return base;
  }, [obras]);

  const openAdd = useCallback(() => {
    setEditingObra(null);
    setInitialUrl('');
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((obra) => {
    setEditingObra(obra);
    setInitialUrl('');
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingObra(null);
    setInitialUrl('');
  }, []);

  const handleSave = useCallback(
    (form) => {
      if (form.id) updateObra(form.id, form);
      else addObra(form);
    },
    [updateObra, addObra]
  );

  // Aguardando o estado de autenticação (apenas no modo Firebase).
  if (authLoading) {
    return <div className={styles.centered}>Carregando…</div>;
  }

  // Modo Firebase sem usuário logado → tela de login.
  if (!isLocal && !user) {
    return (
      <Login
        onGoogle={loginGoogle}
        onEmailLogin={loginEmail}
        onEmailRegister={registerEmail}
        onResetPassword={resetPassword}
        error={authError}
        clearError={clearError}
      />
    );
  }

  return (
    <div className={styles.app}>
      <Header
        obrasCount={obras.length}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onAdd={openAdd}
        user={user}
        isLocal={isLocal}
        onLogout={logout}
      />

      <main className={styles.main}>
        <SearchBar value={search} onChange={setSearch} />
        <FilterTabs counts={counts} active={filter} onChange={setFilter} />

        <div className={styles.list}>
          {obrasLoading ? (
            <EmptyState icon="⏳">Carregando suas obras…</EmptyState>
          ) : filtered.length === 0 ? (
            <EmptyState>Nenhuma obra encontrada.</EmptyState>
          ) : (
            filtered.map((obra) => (
              <ObraCard
                key={obra.id}
                obra={obra}
                onEdit={openEdit}
                onUpdateCap={updateCapitulo}
              />
            ))
          )}
        </div>
      </main>

      {modalOpen && (
        <ObraModal
          obra={editingObra}
          initialUrl={initialUrl}
          onSave={handleSave}
          onDelete={deleteObra}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
