import styles from './Header.module.css';

export default function Header({
  obrasCount,
  isDark,
  onToggleTheme,
  onAdd,
  user,
  isLocal,
  onLogout,
}) {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <h1 className={styles.title}>MANGALIST</h1>
        <span className={styles.count}>{obrasCount} obras</span>
      </div>

      <div className={styles.actions}>
        <button
          className={styles.iconBtn}
          onClick={onToggleTheme}
          title={isDark ? 'Tema claro' : 'Tema escuro'}
          aria-label="Alternar tema"
        >
          {isDark ? '☀' : '☾'}
        </button>

        <button className={styles.addBtn} onClick={onAdd}>
          + Adicionar
        </button>

        {!isLocal && user && (
          <button
            className={styles.iconBtn}
            onClick={onLogout}
            title={`Sair (${user.displayName || user.email || 'conta'})`}
            aria-label="Sair"
          >
            {user.photoURL ? (
              <img className={styles.avatar} src={user.photoURL} alt="" />
            ) : (
              '⎋'
            )}
          </button>
        )}
      </div>
    </header>
  );
}
