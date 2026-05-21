import { useState, useEffect, useCallback } from 'react';
import { parseUrl, SITES } from '../lib/urlParser';
import { fetchCover, searchManga } from '../lib/cover';
import { STATUS_CONFIG, TIPOS, getSiteColor } from '../lib/constants';
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

export default function ObraModal({ obra, initialUrl = '', onSave, onDelete, onClose }) {
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
        setParseError(result.error);
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
    [runCoverFetch]
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
    if (window.confirm(`Excluir "${form.titulo}"? Esta ação não pode ser desfeita.`)) {
      onDelete(obra.id);
      onClose();
    }
  }

  const siteColor = getSiteColor(form.siteKey);

  return (
    <div
      className={styles.overlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={styles.sheet} style={{ '--site-color': siteColor }}>
        <div className={styles.head}>
          <h2 className={styles.headTitle}>{isEdit ? 'Editar obra' : 'Adicionar obra'}</h2>
          <button className={styles.close} onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </div>

        {!isEdit && (
          <div className={styles.parser}>
            <label className={styles.label}>Cole a URL do capítulo</label>
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
                placeholder="ex: sakuramangas.org/obras/chainsaw-man/97"
              />
              <button className={styles.parseBtn} onClick={() => applyParse(url)}>
                Extrair
              </button>
            </div>
            {parseError && <p className={styles.parseError}>{parseError}</p>}
            {parseResult && (
              <div className={styles.parseOk}>
                <span>✓ {parseResult.site}</span>
                {parseResult.title && <span>&quot;{parseResult.title}&quot;</span>}
                {parseResult.chapter && <span>Cap. {parseResult.chapter}</span>}
                {parseResult.needsManualTitle && <span>⚠ Informe o título manualmente</span>}
              </div>
            )}
            <div className={styles.divider} />
          </div>
        )}

        <div className={styles.fields}>
          <div>
            <label className={styles.label}>Título *</label>
            <input
              className={styles.input}
              value={form.titulo}
              onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
              placeholder="Nome da obra"
            />
          </div>

          <div className={styles.row}>
            <div className={styles.col}>
              <label className={styles.label}>Tipo</label>
              <select
                className={styles.input}
                value={form.tipo}
                onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
              >
                {TIPOS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.col}>
              <label className={styles.label}>Site</label>
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
              <label className={styles.label}>Capítulo atual</label>
              <input
                className={styles.input}
                value={form.capituloAtual}
                onChange={(e) => setForm((f) => ({ ...f, capituloAtual: e.target.value }))}
                placeholder="1"
              />
            </div>
            <div className={styles.col}>
              <label className={styles.label}>Status</label>
              <select
                className={styles.input}
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              >
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.colNota}>
              <label className={styles.label}>Nota</label>
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
            <label className={styles.label}>Gêneros (separados por vírgula)</label>
            <input
              className={styles.input}
              defaultValue={form.generos?.join(', ')}
              onChange={handleGeneros}
              placeholder="ação, fantasia, comédia"
            />
          </div>

          <div>
            <div className={styles.labelRow}>
              <label className={styles.label}>Capa (opcional)</label>
              <button
                type="button"
                className={styles.coverBtn}
                onClick={openPicker}
                disabled={coverStatus === 'loading'}
              >
                {coverStatus === 'loading' ? 'Buscando…' : '🔍 Buscar no MangaDex'}
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
                placeholder="https://... ou busque no MangaDex"
              />
            </div>

            {coverStatus === 'found' && (
              <p className={styles.coverFound}>✓ Capa: {coverMatch || 'definida'}</p>
            )}
            {coverStatus === 'notfound' && !pickerOpen && (
              <p className={styles.coverMuted}>
                Não achei automaticamente. Clique em “Buscar no MangaDex” — para webtoons,
                tente o nome em inglês.
              </p>
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
                    placeholder="Nome da obra (tente em inglês p/ webtoons)"
                  />
                  <button
                    type="button"
                    className={styles.parseBtn}
                    onClick={() => doSearch(coverQuery)}
                    disabled={searching || !coverQuery.trim()}
                  >
                    Buscar
                  </button>
                </div>

                {searching && <p className={styles.coverMuted}>Buscando…</p>}

                {!searching &&
                  coverResults.length > 0 &&
                  usedQuery &&
                  usedQuery.toLowerCase() !== coverQuery.trim().toLowerCase() && (
                    <p className={styles.coverMuted}>
                      Sem resultado para o título original — mostrando: <em>{usedQuery}</em>
                    </p>
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
                  <p className={styles.coverMuted}>
                    Nada encontrado para “{coverQuery}”. Tente o nome em inglês ou o título original.
                  </p>
                )}

                <button
                  type="button"
                  className={styles.linkBtn}
                  onClick={() => setPickerOpen(false)}
                >
                  Fechar busca
                </button>
              </div>
            )}
          </div>

          <div>
            <label className={styles.label}>Notas livres</label>
            <textarea
              className={`${styles.input} ${styles.textarea}`}
              value={form.notasLivres}
              onChange={(e) => setForm((f) => ({ ...f, notasLivres: e.target.value }))}
              placeholder="Qualquer anotação..."
              rows={3}
            />
          </div>

          <button className={styles.submit} onClick={handleSubmit} disabled={!form.titulo.trim()}>
            {isEdit ? 'Salvar alterações' : 'Adicionar obra'}
          </button>

          {isEdit && onDelete && (
            <button className={styles.deleteBtn} onClick={handleDelete}>
              Excluir obra
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
