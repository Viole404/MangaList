import { useI18n } from '../i18n/I18nContext';
import styles from './SearchBar.module.css';

export default function SearchBar({ value, onChange, filterOpen, onFilterToggle, activeFilterCount = 0 }) {
  const { t } = useI18n();
  return (
    <div className={styles.wrap}>
      <span className={styles.icon}>⌕</span>
      <input
        className={styles.input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('search_placeholder')}
        aria-label={t('search_aria')}
      />
      <button
        className={`${styles.filterBtn} ${filterOpen ? styles.filterBtnOpen : ''} ${activeFilterCount > 0 ? styles.filterBtnActive : ''}`}
        onClick={onFilterToggle}
        aria-label={t('filters')}
        title={t('filters')}
      >
        <span className={styles.filterLines} aria-hidden="true" />
        {activeFilterCount > 0 && (
          <span className={styles.filterBadge}>{activeFilterCount}</span>
        )}
      </button>
    </div>
  );
}