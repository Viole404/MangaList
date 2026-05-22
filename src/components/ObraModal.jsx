import { useState, useEffect, useCallback } from 'react';
import { parseUrl, SITES } from '../lib/urlParser';
import { fetchCover, searchManga } from '../lib/cover';
import { STATUS_CONFIG, TIPO_CONFIG, getSiteColor } from '../lib/constants';
import { useI18n } from '../i18n/I18nContext';
import styles from './ObraModal.module.css';

const EMPTY_FORM = {
  titulo: '',
  tipo: 'manga',
  site: 'Sakura Mangás',
  siteKey: 'sakura',
  capituloAtual: '1',
  status: 'lendo',
  nota: '',
  generos: [],
  capa: '',
  notasLivres: '',
  urlOrigem: '',
};

export default function ObraModal({ obra, initialUrl = '', closing = false, onSave, onDelete, onClose }) {
  const { t } = useI18n();
  const isEdit = Boolean(obra?.id);
  const [url, setUrl] = useState(initialUrl);
  const [parseResult, setParseResult] = useState(null);
  const [parseError, setParseError] = useState('');
  const [form, setForm] = useState(isEdit ? { ...EMPTY_FORM, ...obra } : EMPTY_FORM);
  const [coverStatus, setCoverStatus] = useState(''); // '' | 'loading' | 'found' | 'notfound'
  const [coverMatch, setCoverMatch] = useState('');
  // Seletor manual de capa
  const [pickerOpen, setPickerOpen] = useState(false);
  const [coverQuery, setCoverQuery] = useState('');
  const [coverResults, setCoverResults] = useState([]);
  const [usedQuery, setUsedQuery] = useState('');
  const [searching, setSearching] = useState(false);

  // Busca automática (melhor resultado) — usada ao extrair a URL.
  const runCoverFetch = useCallback(async (title, mangaId) => {
    if (!title?.trim() && !mangaId) return;
    setCoverStatus('loading');
    setCoverMatch('');
    const result = await fetchCover({ title, mangaId });
    if (result?.url) {
      setForm((f) => ({ ...f, capa: result.url }));
      setCoverMatch(result.matchedTitle || '');
      setCoverStatus('found');
    } else {
      setCoverStatus('notfound');
    }
  }, []);

  // Busca manual com lista de resultados para escolher (traduz/keywords se preciso).
  const doSearch = useCallback(async (query) => {
    if (!query?.trim()) return;
    setSearching(true);
    setCoverResults([]);
    setUsedQuery('');
    const { results, usedQuery: used } = await searchManga(query);
    setCoverResults(results);
    setUsedQuery(used);
    setSearching(false);
  }, []);

  function openPicker() {
    const initial = form.titulo || '';
    setCoverQuery(initial);
    setPickerOpen(true);
    setCoverResults([]);
    if (initial.trim()) doSearch(initial);
  }

  function pickCover(result) {
    setForm((f) => ({ ...f, capa: result.coverUrl }));
    setCoverMatch(result.title || '');
    setCoverStatus('found');
    setPickerOpen(false);
  }

  const applyParse = useCallback(
    (rawUrl) => {
      const result = parseUrl(rawUrl);
      if (!result.success) {
        setParseError(result.errorKey ? t(result.errorKey, result.errorParams) : '');
        setParseResult(null);
        return;
      }
      setParseError('');
      setParseResult(result);
      setForm((f) => ({
        ...f,
        titulo: result.title || f.titulo,
        tipo: result.type,
        site: result.site,
        siteKey: result.siteKey,
        capituloAtual: result.chapter || f.capituloAtual,
        urlOrigem: rawUrl,
      }));
      // Tenta a capa automaticamente assim que extrai os dados.
      runCoverFetch(result.title, result.mangaId);
    },
    [runCoverFetch, t]
  );

  // URL vinda do compartilhamento (share_target): pré-preenche e já tenta extrair.
  useEffect(() => {
    if (initialUrl && !isEdit) applyParse(initialUrl);
  }, [initialUrl, isEdit, applyParse]);

  function handleGeneros(e) {
    const val = e.target.value
      .split(',')
      .map((g) => g.trim())
      .filter(Boolean);
    setForm((f) => ({ ...f, generos: val }));
  }

  function handleSubmit() {
    if (!form.titulo.trim()) return;
    onSave(form);
    onClose();
  }

  function handleDelete() {
    if (window.confirm(t('delete_confirm', { titulo: form.titulo }))) {
      onDelete(obra.id);
      onClose();
    }
  }

  const siteColor = getSiteColor(form.siteKey);

  return (
    <div
      className={`${styles.overlay} ${closing ? styles.overlayClosing : ''}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`${styles.sheet} ${closing ? styles.sheetClosing : ''}`}
        style={{ '--site-color': siteColor }}
      >
        <div className={styles.head}>
          <h2 className={styles.headTitle}>{isEdit ? t('modal_edit_title') : t('modal_add_title')}</h2>
          <button className={styles.close} onClick={onClose} aria-label={t('close')}>
            ×
          </button>
        </div>

        {!isEdit && (
          <div className={styles.parser}>
            <label className={styles.label}>{t('paste_url_label')}</label>
            <div className={styles.parserRow}>
              <input
                className={`${styles.input} ${styles.urlInput}`}
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setParseError('');
                  setParseResult(null);
                }}
                onKeyDown={(e) => e.key === 'Enter' && applyParse(url)}
                placeholder={t('url_placeholder')}
              />
              <button className={styles.parseBtn} onClick={() => applyParse(url)}>
                {t('extract')}
              </button>
            </div>
            {parseError && <p className={styles.parseError}>{parseError}</p>}
            {parseResult && (
              <div className={styles.parseOk}>
                <span>✓ {parseResult.site}</span>
                {parseResult.title && <span>&quot;{parseResult.title}&quot;</span>}
                {parseResult.chapter && <span>{t('cap_short')} {parseResult.chapter}</span>}
                {parseResult.needsManualTitle && <span>{t('manual_title_warn')}</span>}
              </div>
            )}
            <div className={styles.divider} />
          </div>
        )}

        <div className={styles.fields}>
          <div>
            <label className={styles.label}>{t('field_title')}</label>
            <input
              className={styles.input}
              value={form.titulo}
              onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
              placeholder={t('title_placeholder')}
            />
          </div>

          <div className={styles.row}>
            <div className={styles.col}>
              <label className={styles.label}>{t('field_type')}</label>
              <select
                className={styles.input}
                value={form.tipo}
                onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
              >
                {Object.keys(TIPO_CONFIG).map((k) => (
                  <option key={k} value={k}>
                    {t(`tipo.${k}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.col}>
              <label className={styles.label}>{t('field_site')}</label>
              <select
                className={styles.input}
                value={form.siteKey}
                onChange={(e) => {
                  const key = e.target.value;
                  setForm((f) => ({ ...f, siteKey: key, site: SITES[key]?.name || key }));
                }}
              >
                {Object.entries(SITES).map(([key, s]) => (
                  <option key={key} value={key}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.col}>
              <label className={styles.label}>{t('field_chapter')}</label>
              <input
                className={styles.input}
                value={form.capituloAtual}
                onChange={(e) => setForm((f) => ({ ...f, capituloAtual: e.target.value }))}
                placeholder="1"
              />
            </div>
            <div className={styles.col}>
              <label className={styles.label}>{t('field_status')}</label>
              <select
                className={styles.input}
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              >
                {Object.keys(STATUS_CONFIG).map((k) => (
                  <option key={k} value={k}>
                    {t(`status.${k}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.colNota}>
              <label className={styles.label}>{t('field_rating')}</label>
              <input
                className={styles.input}
                value={form.nota ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, nota: e.target.value }))}
                placeholder="—"
                type="number"
                min="1"
                max="10"
              />
            </div>
          </div>

          <div>
            <label className={styles.label}>{t('field_genres')}</label>
            <input
              className={styles.input}
              defaultValue={form.generos?.join(', ')}
              onChange={handleGeneros}
              placeholder={t('genres_placeholder')}
            />
          </div>

          <div>
            <div className={styles.labelRow}>
              <label className={styles.label}>{t('field_cover')}</label>
              <button
                type="button"
                className={styles.coverBtn}
                onClick={openPicker}
                disabled={coverStatus === 'loading'}
              >
                {coverStatus === 'loading' ? t('cover_searching') : t('cover_search_md')}
              </button>
            </div>
            <div className={styles.coverRow}>
              {form.capa && (
                <img
                  className={styles.coverPreview}
                  src={form.capa}
                  alt=""
                  referrerPolicy="no-referrer"
                />
              )}
              <input
                className={styles.input}
                value={form.capa || ''}
                onChange={(e) => setForm((f) => ({ ...f, capa: e.target.value }))}
                placeholder={t('cover_input_placeholder')}
              />
            </div>

            {coverStatus === 'found' && (
              <p className={styles.coverFound}>{t('cover_found', { name: coverMatch || t('cover_set') })}</p>
            )}
            {coverStatus === 'notfound' && !pickerOpen && (
              <p className={styles.coverMuted}>{t('cover_notfound')}</p>
            )}

            {pickerOpen && (
              <div className={styles.picker}>
                <div className={styles.parserRow}>
                  <input
                    className={`${styles.input} ${styles.urlInput}`}
                    value={coverQuery}
                    onChange={(e) => setCoverQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        doSearch(coverQuery);
                      }
                    }}
                    placeholder={t('cover_query_placeholder')}
                  />
                  <button
                    type="button"
                    className={styles.parseBtn}
                    onClick={() => doSearch(coverQuery)}
                    disabled={searching || !coverQuery.trim()}
                  >
                    {t('search_btn')}
                  </button>
                </div>

                {searching && <p className={styles.coverMuted}>{t('cover_searching')}</p>}

                {!searching &&
                  coverResults.length > 0 &&
                  usedQuery &&
                  usedQuery.toLowerCase() !== coverQuery.trim().toLowerCase() && (
                    <p className={styles.coverMuted}>{t('cover_no_orig', { q: usedQuery })}</p>
                  )}

                {!searching && coverResults.length > 0 && (
                  <div className={styles.results}>
                    {coverResults.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        className={styles.result}
                        onClick={() => pickCover(r)}
                        title={r.title}
                      >
                        <img
                          className={styles.resultImg}
                          src={r.coverUrl}
                          alt=""
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                        <span className={styles.resultTitle}>
                          {r.title}
                          {r.year ? ` (${r.year})` : ''}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {!searching && coverResults.length === 0 && coverQuery.trim() && (
                  <p className={styles.coverMuted}>{t('cover_none_for', { q: coverQuery })}</p>
                )}

                <button
                  type="button"
                  className={styles.linkBtn}
                  onClick={() => setPickerOpen(false)}
                >
                  {t('close_search')}
                </button>
              </div>
            )}
          </div>

          <div>
            <label className={styles.label}>{t('field_notes')}</label>
            <textarea
              className={`${styles.input} ${styles.textarea}`}
              value={form.notasLivres}
              onChange={(e) => setForm((f) => ({ ...f, notasLivres: e.target.value }))}
              placeholder={t('notes_placeholder')}
              rows={3}
            />
          </div>

          <button className={styles.submit} onClick={handleSubmit} disabled={!form.titulo.trim()}>
            {isEdit ? t('save_changes') : t('add_obra')}
          </button>

          {isEdit && onDelete && (
            <button className={styles.deleteBtn} onClick={handleDelete}>
              {t('delete_obra')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
