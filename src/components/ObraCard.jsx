import { memo, useState, useEffect, useRef } from 'react';
import { STATUS_CONFIG, getSiteColor, getInitials } from '../lib/constants';
import styles from './ObraCard.module.css';

function ObraCard({ obra, onEdit, onUpdateCap }) {
  const [editing, setEditing] = useState(false);
  const [capInput, setCapInput] = useState(obra.capituloAtual);
  const inputRef = useRef(null);

  const status = STATUS_CONFIG[obra.status] || STATUS_CONFIG.lendo;
  const siteColor = getSiteColor(obra.siteKey);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  // Mantém o input sincronizado quando o capítulo muda por fora (botões +/-).
  useEffect(() => {
    setCapInput(obra.capituloAtual);
  }, [obra.capituloAtual]);

  function handleCapSave() {
    if (capInput && capInput !== obra.capituloAtual) {
      onUpdateCap(obra.id, capInput);
    }
    setEditing(false);
  }

  const cap = Number(obra.capituloAtual);

  return (
    <div
      className={styles.card}
      style={{
        '--site-color': siteColor,
        '--status-color': status.color,
        '--status-bg': status.bg,
      }}
    >
      <div className={styles.accent} />

      <div className={styles.cover}>
        {obra.capa ? (
          <img
            className={styles.coverImg}
            src={obra.capa}
            alt={obra.titulo}
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          getInitials(obra.titulo)
        )}
      </div>

      <div className={styles.info}>
        <div className={styles.titleRow}>
          <span className={styles.titulo}>{obra.titulo}</span>
          <span className={styles.statusBadge}>{status.label}</span>
        </div>

        <div className={styles.metaRow}>
          <span className={styles.siteBadge}>{obra.site}</span>
          {obra.nota != null && <span className={styles.nota}>★ {obra.nota}/10</span>}
        </div>

        {obra.generos?.length > 0 && (
          <div className={styles.generos}>
            {obra.generos.slice(0, 3).map((g) => (
              <span key={g} className={styles.genero}>
                {g}
              </span>
            ))}
          </div>
        )}

        {obra.notasLivres && <p className={styles.notas}>&quot;{obra.notasLivres}&quot;</p>}
      </div>

      <div className={styles.capCol}>
        <span className={styles.capLabel}>CAP.</span>
        {editing ? (
          <input
            ref={inputRef}
            className={styles.capInput}
            value={capInput}
            onChange={(e) => setCapInput(e.target.value)}
            onBlur={handleCapSave}
            onKeyDown={(e) => e.key === 'Enter' && handleCapSave()}
          />
        ) : (
          <button
            className={styles.capValue}
            onClick={() => setEditing(true)}
            title="Clique para editar o capítulo"
          >
            {obra.capituloAtual}
          </button>
        )}
        <div className={styles.capButtons}>
          <button
            className={styles.navBtn}
            onClick={() => onUpdateCap(obra.id, String(Math.max(1, cap - 1)))}
            title="Capítulo anterior"
            disabled={!Number.isFinite(cap)}
          >
            −
          </button>
          <button
            className={`${styles.navBtn} ${styles.navBtnNext}`}
            onClick={() => onUpdateCap(obra.id, String((Number.isFinite(cap) ? cap : 0) + 1))}
            title="Próximo capítulo"
          >
            +
          </button>
        </div>
      </div>

      <button className={styles.editBtn} onClick={() => onEdit(obra)} title="Editar obra">
        ✎
      </button>
    </div>
  );
}

export default memo(ObraCard);
