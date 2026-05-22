import { useI18n } from '../i18n/I18nContext';
import styles from './Header.module.css';

export default function Header({
  isDark,
  onToggleTheme,
  onAdd,
  onOpenAccount,
  user,
  isLocal,
}) {
  const { t } = useI18n();
  const name = user?.displayName || user?.email?.split('@')[0] || 'Usuário';
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <h1 className={styles.title}>MANGALIST</h1>
      </div>

      <div className={styles.actions}>
        <button
          className={styles.iconBtn}
          onClick={onToggleTheme}
          title={isDark ? t('theme_light') : t('theme_dark')}
          aria-label={t('theme_toggle')}
        >
          {isDark ? '☀' : '☾'}
        </button>

        <button className={styles.addBtn} onClick={onAdd}>
          {t('header_add')}
        </button>

        {!isLocal && user && (
          <button
            className={styles.avatarBtn}
            onClick={onOpenAccount}
            title={t('account')}
            aria-label={t('account')}
          >
            {user.photoURL ? (
              <img
                className={styles.avatar}
                src={user.photoURL}
                alt={name}
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className={styles.avatarInitials}>{initials}</span>
            )}
          </button>
        )}
      </div>
    </header>
  );
}
