import { useState, useEffect } from 'react';
import { getPublicList } from '../lib/share';
import { useI18n } from '../i18n/I18nContext';
import ObraCard from './ObraCard';
import EmptyState from './EmptyState';
import styles from './PublicList.module.css';

// Visão read-only de uma lista compartilhada. Lê `publicLists/{token}` sem
// exigir login (regra `get` pública). Renderiza os cards sem controles de
// edição. É a tela que qualquer pessoa com o link enxerga.
export default function PublicList({ token }) {
  const { t } = useI18n();
  const [state, setState] = useState({ loading: true, data: null });

  useEffect(() => {
    let alive = true;
    getPublicList(token)
      .then((data) => alive && setState({ loading: false, data }))
      .catch(() => alive && setState({ loading: false, data: null }));
    return () => {
      alive = false;
    };
  }, [token]);

  if (state.loading) {
    return <div className={styles.center}>{t('public_loading')}</div>;
  }

  if (!state.data) {
    return (
      <div className={styles.center}>
        <EmptyState icon="🔗">{t('public_notfound')}</EmptyState>
        <a className={styles.cta} href="/">{t('public_create_mine')}</a>
      </div>
    );
  }

  const { ownerName, obras = [] } = state.data;

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <span className={styles.brand}>MANGALIST</span>
        <h1 className={styles.title}>{t('public_list_of', { name: ownerName })}</h1>
        <p className={styles.count}>
          {obras.length === 1
            ? t('count_one', { n: obras.length })
            : t('count_many', { n: obras.length })}
        </p>
      </header>

      <main className={styles.main}>
        {obras.length === 0 ? (
          <EmptyState>{t('public_empty')}</EmptyState>
        ) : (
          <div className={styles.grid}>
            {obras.map((o, i) => (
              <ObraCard key={o.id || i} obra={o} readOnly style={{ '--i': Math.min(i, 12) }} />
            ))}
          </div>
        )}
      </main>

      <footer className={styles.foot}>
        <span>{t('public_shared_via')}</span>
        <a className={styles.cta} href="/">{t('public_create_short')}</a>
      </footer>
    </div>
  );
}
