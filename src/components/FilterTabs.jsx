import styles from './FilterTabs.module.css';

/**
 * Grupo de filtros genérico.
 *
 * items: [{ key, label, color, count }]
 * Itens com count === 0 (exceto 'todos') são ocultados automaticamente.
 * groupLabel: rótulo opcional acima das tabs (ex: "Status", "Tipo").
 */
export default function FilterTabs({ items, active, onChange, groupLabel }) {
  const visible = items.filter((item) => item.key === 'todos' || item.count > 0);

  // Não renderiza o grupo se só tem o "Todos" (nada para filtrar).
  if (visible.length <= 1) return null;

  return (
    <div className={styles.group}>
      {groupLabel && <span className={styles.groupLabel}>{groupLabel}</span>}
      <div className={styles.tabs}>
        {visible.map(({ key, label, color, count }) => (
          <button
            key={key}
            className={`${styles.tab} ${active === key ? styles.active : ''}`}
            style={{ '--tab-color': color }}
            onClick={() => onChange(key)}
          >
            {label} <span className={styles.tabCount}>{count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}