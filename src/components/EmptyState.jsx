import styles from './EmptyState.module.css';

export default function EmptyState({ icon = '📚', children = 'Nenhuma obra encontrada.' }) {
  return (
    <div className={styles.empty}>
      <div className={styles.icon}>{icon}</div>
      <p className={styles.text}>{children}</p>
    </div>
  );
}
