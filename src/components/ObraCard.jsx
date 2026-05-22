import { memo, useState, useEffect, useRef } from 'react';
import { STATUS_CONFIG, getSiteColor, getInitials } from '../lib/constants';
import { useI18n } from '../i18n/I18nContext';
import styles from './ObraCard.module.css';

function ObraCard({ obra, onEdit = () => {}, onUpdateCap = () => {}, style, readOnly = false }) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [capInput, setCapInput] = useState(obra.capituloAtual);
  const [pulse, setPulse] = useState(false);
  const inputRef = useRef(null);
  const prevCapRef = useRef(obra.capituloAtual);

  const statusKey = STATUS_CONFIG[obra.status] ? obra.status : 'lendo';
  const status = STATUS_CONFIG[statusKey];
  const statusLabel = t(`status.${statusKey}`);
  const siteColor = getSiteColor(obra.siteKey);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  useEffect(() => {
    setCapInput(obra.capituloAtual);
    // Dispara o pulse quando o capítulo muda de verdade (não no primeiro render).
    if (prevCapRef.current !== obra.capituloAtual) {
      prevCapRef.current = obra.capituloAtual;
      setPulse(true);
    }
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
        viewTransitionName: `obra-${obra.id}`,
        ...style,
      }}
    >
      {/* Capa */}
      <div className={styles.coverWrap}>
        {obra.capa ? (
          <img
            className={styles.coverImg}
            src={obra.capa}
            alt={obra.titulo}
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className={styles.coverPlaceholder}>
            <span className={styles.coverInitials}>{getInitials(obra.titulo)}</span>
          </div>
        )}

        {/* Gradiente escurecendo a parte inferior da capa */}
        <div className={styles.coverGradient} />

        {/* Badge de status — canto superior esquerdo */}
        <span className={styles.statusBadge}>{statusLabel.toUpperCase()}</span>

        {/* Botão de edição — canto superior direito (oculto na lista pública) */}
        {!readOnly && (
          <button
            className={styles.editBtn}
            onClick={() => onEdit(obra)}
            title={t('card_edit')}
            aria-label={t('card_edit')}
          >
            ⋮
          </button>
        )}
      </div>

      {/* Informações abaixo da capa */}
      <div className={styles.info}>
        <p className={styles.titulo}>{obra.titulo}</p>

        {readOnly ? (
          <div className={styles.capRow}>
            <span className={styles.capStatic}>{t('cap_short')} {obra.capituloAtual}</span>
          </div>
        ) : (
        <div className={styles.capRow}>
          <button
            className={styles.navBtn}
            onClick={() => onUpdateCap(obra.id, String(Math.max(1, cap - 1)))}
            title={t('card_prev')}
            disabled={!Number.isFinite(cap)}
            aria-label={t('card_prev')}
          >
            −
          </button>

          {editing ? (
            <input
              ref={inputRef}
              className={styles.capInput}
              value={capInput}
              onChange={(e) => setCapInput(e.target.value)}
              onBlur={handleCapSave}
              onKeyDown={(e) => e.key === 'Enter' && handleCapSave()}
              aria-label={t('card_chapter_aria')}
            />
          ) : (
            <button
              className={`${styles.capValue} ${pulse ? styles.pulse : ''}`}
              onClick={() => setEditing(true)}
              onAnimationEnd={() => setPulse(false)}
              title={t('card_edit_chapter')}
            >
              {obra.capituloAtual}
            </button>
          )}

          <button
            className={`${styles.navBtn} ${styles.navBtnNext}`}
            onClick={() => onUpdateCap(obra.id, String((Number.isFinite(cap) ? cap : 0) + 1))}
            title={t('card_next')}
            aria-label={t('card_next')}
          >
            +
          </button>
        </div>
        )}
      </div>
    </div>
  );
}

export default memo(ObraCard);