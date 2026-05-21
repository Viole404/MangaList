import { STATUS_CONFIG } from '../lib/constants';
import styles from './FilterTabs.module.css';

export default function FilterTabs({ counts, active, onChange }) {
  return (
    <div className={styles.tabs}>
      {Object.entries(counts).map(([key, count]) => {
        const isTodos = key === 'todos';
        const label = isTodos ? 'Todos' : STATUS_CONFIG[key]?.label || key;
        const color = isTodos ? 'var(--accent)' : STATUS_CONFIG[key]?.color || '#888';
        const isActive = active === key;
        return (
          <button
            key={key}
            className={`${styles.tab} ${isActive ? styles.active : ''}`}
            style={{ '--tab-color': color }}
            onClick={() => onChange(key)}
          >
            {label} <span className={styles.tabCount}>{count}</span>
          </button>
        );
      })}
    </div>
  );
}
