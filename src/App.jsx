import { useState, useMemo, useEffect, useCallback } from 'react';
import { useTheme } from './hooks/useTheme';
import { useAuth } from './hooks/useAuth';
import { useObras } from './hooks/useObras';
import { useShareTarget } from './hooks/useShareTarget';
import { useI18n } from './i18n/I18nContext';
import { STATUS_CONFIG, TIPO_CONFIG } from './lib/constants';
import { SITES } from './lib/urlParser';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import FilterTabs from './components/FilterTabs';
import ObraCard from './components/ObraCard';
import ObraCardSkeleton from './components/ObraCardSkeleton';
import ObraModal from './components/ObraModal';
import EmptyState from './components/EmptyState';
import Login from './components/Login';
import PublicList from './components/PublicList';
import UserArea from './components/UserArea';
import { getShareToken, enableShare, disableShare, syncShare } from './lib/share';
import styles from './App.module.css';

const STATUS_KEYS = Object.keys(STATUS_CONFIG);

// Detecta a rota da lista pública: /lista/{token}
function getSharePath() {
  const m = window.location.pathname.match(/^\/lista\/([^/]+)\/?$/);
  return m ? decodeURIComponent(m[1]) : null;
}

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
    updateDisplayName,
    changePassword,
    logout,
    isLocal,
  } = useAuth();
  const { obras, loading: obrasLoading, addObra, updateObra, updateCapitulo, deleteObra } =
    useObras(user?.uid);
  const { sharedUrl, clearShared } = useShareTarget();
  const { t } = useI18n();

  const [filterStatus, setFilterStatus] = useState('todos');
  const [filterTipo, setFilterTipo]     = useState('todos');
  const [filterSite, setFilterSite]     = useState('todos');
  const [filterOpen, setFilterOpen]     = useState(false);
  const [search, setSearch]             = useState('');
  const [modalOpen, setModalOpen]       = useState(false);
  const [modalClosing, setModalClosing] = useState(false);
  const [editingObra, setEditingObra]   = useState(null);
  const [initialUrl, setInitialUrl]     = useState('');

  // Compartilhamento de lista por link.
  const sharePath = useMemo(getSharePath, []);
  const [shareToken, setShareToken]     = useState(null);
  const [userAreaOpen, setUserAreaOpen] = useState(false);
  const [shareBusy, setShareBusy]       = useState(false);
  const shareLink = shareToken ? `${window.location.origin}/lista/${shareToken}` : '';

  const activeFilterCount =
    (filterStatus !== 'todos' ? 1 : 0) +
    (filterTipo   !== 'todos' ? 1 : 0) +
    (filterSite   !== 'todos' ? 1 : 0);

  // URL chegando via compartilhamento → abre o modal de adicionar já preenchido.
  useEffect(() => {
    if (sharedUrl) {
      setEditingObra(null);
      setInitialUrl(sharedUrl);
      setModalOpen(true);
      clearShared();
    }
  }, [sharedUrl, clearShared]);

  // Sem usuário (logout): fecha a área do usuário e qualquer modal. O App não
  // desmonta entre sessões, então sem isso a área reabriria por cima da lista
  // no próximo login.
  useEffect(() => {
    if (!user) {
      setUserAreaOpen(false);
      setModalOpen(false);
      setModalClosing(false);
    }
  }, [user]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return obras.filter((o) => {
      const matchStatus = filterStatus === 'todos' || o.status === filterStatus;
      const matchTipo   = filterTipo   === 'todos' || (o.tipo || 'manga') === filterTipo;
      const matchSite   = filterSite   === 'todos' || o.siteKey === filterSite;
      const matchSearch = o.titulo.toLowerCase().includes(q);
      return matchStatus && matchTipo && matchSite && matchSearch;
    });
  }, [obras, filterStatus, filterTipo, filterSite, search]);

  // Contagens por status (baseadas no total de obras, sem outros filtros).
  const statusItems = useMemo(() => {
    const counts = { todos: obras.length };
    for (const key of STATUS_KEYS) counts[key] = 0;
    for (const o of obras) {
      if (counts[o.status] !== undefined) counts[o.status]++;
    }
    return [
      { key: 'todos', label: t('all'), color: 'var(--accent)', count: counts.todos },
      ...STATUS_KEYS.map((k) => ({
        key: k,
        label: t(`status.${k}`),
        color: STATUS_CONFIG[k].color,
        count: counts[k],
      })),
    ];
  }, [obras, t]);

  // Contagens por tipo.
  const tipoItems = useMemo(() => {
    const counts = {};
    for (const o of obras) {
      const t = o.tipo || 'manga';
      counts[t] = (counts[t] || 0) + 1;
    }
    return [
      { key: 'todos', label: t('all'), color: 'var(--accent)', count: obras.length },
      ...Object.keys(TIPO_CONFIG).map((k) => ({
        key: k,
        label: t(`tipo.${k}`),
        color: TIPO_CONFIG[k].color,
        count: counts[k] || 0,
      })),
    ];
  }, [obras, t]);

  // Contagens por site.
  const siteItems = useMemo(() => {
    const counts = {};
    for (const o of obras) {
      if (o.siteKey) counts[o.siteKey] = (counts[o.siteKey] || 0) + 1;
    }
    return [
      { key: 'todos', label: t('all'), color: 'var(--accent)', count: obras.length },
      ...Object.entries(SITES).map(([k, s]) => ({
        key: k,
        label: s.name,
        color: s.color,
        count: counts[k] || 0,
      })),
    ];
  }, [obras, t]);

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
    const reset = () => {
      setModalOpen(false);
      setModalClosing(false);
      setEditingObra(null);
      setInitialUrl('');
    };
    // Mantém o modal montado durante a animação de saída; pula o atraso se o
    // usuário prefere menos animação.
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      reset();
      return;
    }
    setModalClosing(true);
    window.setTimeout(reset, 240);
  }, []);

  const handleSave = useCallback(
    (form) => {
      if (form.id) updateObra(form.id, form);
      else addObra(form);
    },
    [updateObra, addObra]
  );

  // Ao logar, descobre se o usuário já tem um link de compartilhamento ativo.
  useEffect(() => {
    if (isLocal || !user?.uid) {
      setShareToken(null);
      return undefined;
    }
    let alive = true;
    getShareToken(user.uid)
      .then((t) => alive && setShareToken(t))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [user?.uid, isLocal]);

  // Sincroniza a cópia pública ao vivo quando a lista muda (com debounce).
  // Só roda depois que as obras carregaram, pra não sobrescrever com lista vazia.
  useEffect(() => {
    if (isLocal || !shareToken || !user || obrasLoading) return undefined;
    const id = window.setTimeout(() => {
      syncShare(shareToken, user, obras).catch(() => {});
    }, 800);
    return () => window.clearTimeout(id);
  }, [obras, shareToken, user, isLocal, obrasLoading]);

  const handleEnableShare = useCallback(async () => {
    if (!user) return;
    setShareBusy(true);
    try {
      const token = await enableShare(user, obras);
      setShareToken(token);
    } finally {
      setShareBusy(false);
    }
  }, [user, obras]);

  const handleDisableShare = useCallback(async () => {
    if (!user || !shareToken) return;
    setShareBusy(true);
    try {
      await disableShare(user.uid, shareToken);
      setShareToken(null);
    } finally {
      setShareBusy(false);
    }
  }, [user, shareToken]);

  // Rota da lista pública: qualquer pessoa com o link, mesmo deslogada.
  if (sharePath) {
    return <PublicList token={sharePath} />;
  }

  // Aguardando o estado de autenticação (apenas no modo Firebase).
  if (authLoading) {
    return <div className={styles.centered}>{t('loading')}</div>;
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
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onAdd={openAdd}
        onOpenAccount={() => setUserAreaOpen(true)}
        user={user}
        isLocal={isLocal}
      />

      <main className={styles.main}>
        <SearchBar
          value={search}
          onChange={setSearch}
          filterOpen={filterOpen}
          onFilterToggle={() => setFilterOpen((v) => !v)}
          activeFilterCount={activeFilterCount}
        />

        {filterOpen && (
          <div className={styles.filterPanel}>
            <FilterTabs
              items={statusItems}
              active={filterStatus}
              onChange={setFilterStatus}
              groupLabel={t('filter_status')}
            />
            <FilterTabs
              items={tipoItems}
              active={filterTipo}
              onChange={setFilterTipo}
              groupLabel={t('filter_type')}
            />
            <FilterTabs
              items={siteItems}
              active={filterSite}
              onChange={setFilterSite}
              groupLabel={t('filter_site')}
            />
          </div>
        )}

        <div className={styles.list} key={`${filterStatus}-${filterTipo}-${filterSite}`}>
          {obrasLoading ? (
            Array.from({ length: 8 }).map((_, i) => <ObraCardSkeleton key={i} />)
          ) : filtered.length === 0 ? (
            <div className={styles.fullSpan}>
              <EmptyState>{t('empty_none')}</EmptyState>
            </div>
          ) : (
            filtered.map((obra, index) => (
              <ObraCard
                key={obra.id}
                obra={obra}
                onEdit={openEdit}
                onUpdateCap={updateCapitulo}
                style={{ '--i': Math.min(index, 12) }}
              />
            ))
          )}
        </div>
      </main>

      {modalOpen && (
        <ObraModal
          obra={editingObra}
          initialUrl={initialUrl}
          closing={modalClosing}
          onSave={handleSave}
          onDelete={deleteObra}
          onClose={closeModal}
        />
      )}

      {userAreaOpen && (
        <UserArea
          user={user}
          obrasCount={obras.length}
          isDark={isDark}
          onToggleTheme={toggleTheme}
          sharing={Boolean(shareToken)}
          shareLink={shareLink}
          shareBusy={shareBusy}
          onEnableShare={handleEnableShare}
          onDisableShare={handleDisableShare}
          onUpdateName={updateDisplayName}
          onChangePassword={changePassword}
          onResetPassword={resetPassword}
          onLogout={logout}
          onClose={() => setUserAreaOpen(false)}
        />
      )}
    </div>
  );
}