import styles from './ObraCardSkeleton.module.css';

// Card-fantasma exibido enquanto as obras carregam do Firestore. Mantém a mesma
// forma do ObraCard (capa 2/3 + título + linha de capítulo) pra não "pular"
// layout quando os dados chegam.
export default function ObraCardSkeleton() {
  return (
    <div className={styles.card} aria-hidden="true">
      <div className={`${styles.cover} ${styles.skel}`} />
      <div className={styles.info}>
        <div className={`${styles.lineTitle} ${styles.skel}`} />
        <div className={`${styles.lineCap} ${styles.skel}`} />
      </div>
    </div>
  );
}