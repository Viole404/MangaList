import { useState, useEffect, useMemo } from 'react';
import { fetchPopularCovers } from '../lib/cover';
import { useI18n } from '../i18n/I18nContext';
import { LANGS, LANG_LABELS } from '../i18n/translations';
import styles from './Login.module.css';

// ── Fundo: grade de capas ───────────────────────────────────────────────
// Enquanto as capas reais do MangaDex não chegam (ou se a busca falhar), cada
// célula mostra uma "capa" gerada por CSS — campo de cor + volume + forma
// abstrata. Quando a imagem real carrega, ela cobre o placeholder com fade.

const COVER_PALETTES = [
  { bg: 'linear-gradient(150deg, #2d1b4e, #6b46c1 70%, #4c1d95)', ink: '#ede9fe', accent: '#c4b5fd' },
  { bg: 'linear-gradient(150deg, #1a1a2e, #0f3460 70%, #16213e)', ink: '#dbeafe', accent: '#60a5fa' },
  { bg: 'linear-gradient(150deg, #4a0e0e, #7f1d1d 70%, #450a0a)', ink: '#fecaca', accent: '#f87171' },
  { bg: 'linear-gradient(150deg, #064e3b, #065f46 70%, #022c22)', ink: '#a7f3d0', accent: '#34d399' },
  { bg: 'linear-gradient(150deg, #422006, #78350f 70%, #451a03)', ink: '#fde68a', accent: '#fbbf24' },
  { bg: 'linear-gradient(150deg, #0c0a09, #292524 70%, #1c1917)', ink: '#e7e5e4', accent: '#a8a29e' },
  { bg: 'linear-gradient(150deg, #831843, #be185d 70%, #500724)', ink: '#fce7f3', accent: '#f472b6' },
  { bg: 'linear-gradient(150deg, #134e4a, #115e59 70%, #042f2e)', ink: '#99f6e4', accent: '#2dd4bf' },
  { bg: 'linear-gradient(150deg, #312e81, #4338ca 70%, #1e1b4b)', ink: '#c7d2fe', accent: '#818cf8' },
  { bg: 'linear-gradient(150deg, #18181b, #3f3f46 70%, #09090b)', ink: '#d4d4d8', accent: '#a1a1aa' },
  { bg: 'linear-gradient(150deg, #1e3a8a, #1d4ed8 70%, #172554)', ink: '#bfdbfe', accent: '#3b82f6' },
  { bg: 'linear-gradient(150deg, #581c87, #7e22ce 70%, #3b0764)', ink: '#e9d5ff', accent: '#a855f7' },
];

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
const GRID_COLS = 8;
const GRID_ROWS = 6;

// "Random" determinístico por índice — mantém a grade estável entre renders.
function hash(i, salt = 1) {
  const x = Math.sin(i * 9301 + salt * 49297) * 233280;
  return x - Math.floor(x);
}

function CoverCell({ index, url }) {
  const palette = COVER_PALETTES[index % COVER_PALETTES.length];
  const variant = Math.floor(hash(index, 2) * 5);
  const num = (index % 24) + 1;
  const vol = ROMAN[index % ROMAN.length];
  const [loaded, setLoaded] = useState(false);

  const transform = `rotate(${(hash(index, 3) - 0.5) * 4}deg) translateY(${(hash(index, 4) - 0.5) * 8}px)`;

  return (
    <div className={styles.cvCard} style={{ background: palette.bg, transform }}>
      <div className={styles.cvGrain} />
      {variant === 0 && <div className={styles.cvBand} style={{ background: palette.accent }} />}
      {variant === 1 && <div className={styles.cvCircle} style={{ borderColor: palette.accent }} />}
      {variant === 2 && <div className={styles.cvTriangle} style={{ borderBottomColor: palette.accent }} />}
      {variant === 3 && <div className={styles.cvStripes} style={{ '--s': palette.accent }} />}
      {variant === 4 && <div className={styles.cvArc} style={{ borderColor: palette.accent }} />}

      <div className={styles.cvTop}>
        <div className={styles.cvVol} style={{ color: palette.accent }}>
          VOL. {String(num).padStart(2, '0')}
        </div>
      </div>
      <div className={styles.cvBot}>
        <div className={styles.cvRoman} style={{ color: palette.ink }}>{vol}</div>
      </div>

      {url && (
        <img
          className={`${styles.cvImg} ${loaded ? styles.cvImgLoaded : ''}`}
          src={url}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onLoad={() => setLoaded(true)}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      )}
    </div>
  );
}

function CoverGrid({ covers }) {
  const cells = useMemo(
    () => Array.from({ length: GRID_COLS * GRID_ROWS }, (_, i) => i),
    []
  );
  return (
    <div className={styles.coverBgWrap} aria-hidden="true">
      <div className={styles.coverBg} style={{ gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)` }}>
        {cells.map((i) => (
          <CoverCell key={i} index={i} url={covers.length ? covers[i % covers.length] : null} />
        ))}
      </div>
      <div className={styles.coverVignette} />
      <div className={styles.coverFade} />
    </div>
  );
}

// ── Marca ────────────────────────────────────────────────────────────────

function Logo() {
  return (
    <div className={styles.logoLockup}>
      <div className={styles.logoMark}>
        <span className={`${styles.logoMarkLine} ${styles.l1}`} />
        <span className={`${styles.logoMarkLine} ${styles.l2}`} />
        <span className={`${styles.logoMarkLine} ${styles.l3}`} />
      </div>
      <div className={styles.logoWord}>MANGALIST</div>
    </div>
  );
}

function GoogleButton({ onClick, disabled }) {
  return (
    <button type="button" className={styles.btnGoogle} onClick={onClick} disabled={disabled}>
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
        <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.79 2.72v2.26h2.9c1.7-1.57 2.69-3.88 2.69-6.62z" />
        <path fill="#34A853" d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.9-2.26c-.81.54-1.83.86-3.06.86a5.34 5.34 0 0 1-5.02-3.71H.96v2.33A9 9 0 0 0 9 18z" />
        <path fill="#FBBC05" d="M3.98 10.71a5.41 5.41 0 0 1 0-3.42V4.96H.96a9 9 0 0 0 0 8.08l3.02-2.33z" />
        <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58A9 9 0 0 0 9 0 9 9 0 0 0 .96 4.96l3.02 2.33A5.34 5.34 0 0 1 9 3.58z" />
      </svg>
      <span>Continuar com Google</span>
    </button>
  );
}

function Field({ label, type, value, onChange, autoComplete, minLength, required, rightSlot }) {
  const [focused, setFocused] = useState(false);
  return (
    <label className={`${styles.field} ${focused ? styles.isFocused : ''} ${value ? styles.hasValue : ''}`}>
      <span className={styles.fieldLabel}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoComplete={autoComplete}
        minLength={minLength}
        required={required}
        spellCheck={false}
      />
      {rightSlot}
    </label>
  );
}

// ── Tela principal ─────────────────────────────────────────────────────────

export default function Login({
  onGoogle,
  onEmailLogin,
  onEmailRegister,
  onResetPassword,
  error,
  clearError,
}) {
  const { t, lang, setLang } = useI18n();
  const [covers, setCovers] = useState([]);
  const [mode, setMode] = useState('login');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchPopularCovers(GRID_COLS * GRID_ROWS).then((urls) => {
      if (alive) setCovers(urls);
    });
    return () => { alive = false; };
  }, []);

  function switchMode(next) {
    setMode(next);
    setInfo('');
    clearError();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email) return;
    setInfo('');
    setBusy(true);
    try {
      if (mode === 'login') {
        await onEmailLogin(email, senha);
      } else if (mode === 'register') {
        await onEmailRegister(email, senha, nome);
      } else {
        const ok = await onResetPassword(email);
        if (ok) setInfo(t('login_reset_info'));
      }
    } finally {
      setBusy(false);
    }
  }

  function cycleLang() {
    const i = LANGS.indexOf(lang);
    setLang(LANGS[(i + 1) % LANGS.length]);
  }

  const head = { h: t(`login_head_${mode}_h`), p: t(`login_head_${mode}_p`) };
  const showGoogle = mode !== 'reset';
  const showName = mode === 'register';
  const showPassword = mode !== 'reset';

  return (
    <div className={styles.page}>
      <CoverGrid covers={covers} />

      <div className={styles.stage}>
        <header className={styles.topBar}>
          <Logo />
          <nav className={styles.topNav}>
            <button
              type="button"
              className={`${styles.topLink} ${styles.topLang}`}
              onClick={cycleLang}
              aria-label={t('ua_language')}
              title={LANG_LABELS[lang].name}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
              </svg>
              {LANG_LABELS[lang].short}
            </button>
          </nav>
        </header>

        <main className={styles.hero}>
          <div className={styles.heroLeft}>
            <div className={styles.eyebrow}>
              <span className={styles.eyebrowDot} />
              {t('login_eyebrow')}
            </div>
            <h1 className={styles.heroTitle}>
              {t('login_title_pre')}<em>{t('login_title_em')}</em>{t('login_title_post')}
            </h1>
            <p className={styles.heroSub}>{t('login_sub')}</p>

            <ul className={styles.bullets}>
              <li>
                <span className={styles.bulletIco}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                </span>
                {t('login_bullet_1')}
              </li>
              <li>
                <span className={styles.bulletIco}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                </span>
                {t('login_bullet_2')}
              </li>
              <li>
                <span className={styles.bulletIco}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                </span>
                {t('login_bullet_3')}
              </li>
            </ul>
          </div>

          <div className={styles.heroRight}>
            <div className={styles.loginShell}>
              <div className={styles.loginHead}>
                <h2>{head.h}</h2>
                <p>{head.p}</p>
              </div>

              <form className={styles.loginCard} onSubmit={handleSubmit}>
                {showGoogle && (
                  <>
                    <GoogleButton onClick={onGoogle} disabled={busy} />
                    <div className={styles.divider}>
                      <span />
                      <em>{t('login_divider')}</em>
                      <span />
                    </div>
                  </>
                )}

                {showName && (
                  <Field
                    label={t('field_name')}
                    type="text"
                    value={nome}
                    onChange={setNome}
                    autoComplete="name"
                  />
                )}

                <Field
                  label={t('field_email')}
                  type="email"
                  value={email}
                  onChange={setEmail}
                  autoComplete="email"
                  required
                />

                {showPassword && (
                  <Field
                    label={t('field_password')}
                    type={showPwd ? 'text' : 'password'}
                    value={senha}
                    onChange={setSenha}
                    autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                    minLength={6}
                    required
                    rightSlot={
                      <button
                        type="button"
                        className={styles.fieldEye}
                        onClick={() => setShowPwd((s) => !s)}
                        aria-label={showPwd ? t('hide_password') : t('show_password')}
                      >
                        {showPwd ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /><path d="m4 4 16 16" /></svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>
                        )}
                      </button>
                    }
                  />
                )}

                {mode === 'login' && (
                  <div className={styles.loginRow}>
                    <button type="button" className={styles.link} onClick={() => switchMode('reset')}>
                      {t('forgot_password')}
                    </button>
                  </div>
                )}

                <button type="submit" className={`${styles.btnPrimary} ${busy ? styles.isLoading : ''}`} disabled={busy}>
                  <span>{busy ? t('please_wait') : t(`login_submit_${mode}`)}</span>
                  {!busy && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
                  )}
                </button>

                {error && <p className={styles.error}>{t(error)}</p>}
                {info && <p className={styles.info}>{info}</p>}

                <div className={styles.signupRow}>
                  {mode === 'login' && (
                    <>
                      <span>{t('no_account')}</span>
                      <button type="button" className={`${styles.link} ${styles.linkStrong}`} onClick={() => switchMode('register')}>
                        {t('create_account_free')}
                      </button>
                    </>
                  )}
                  {mode === 'register' && (
                    <>
                      <span>{t('have_account')}</span>
                      <button type="button" className={`${styles.link} ${styles.linkStrong}`} onClick={() => switchMode('login')}>
                        {t('sign_in')}
                      </button>
                    </>
                  )}
                  {mode === 'reset' && (
                    <button type="button" className={`${styles.link} ${styles.linkStrong}`} onClick={() => switchMode('login')}>
                      {t('back_to_login')}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </main>

        <footer className={styles.foot}>
          <span>© 2026 MangaList</span>
          <span className={styles.footSep}>·</span>
          <span>v 1.0.0</span>
        </footer>
      </div>
    </div>
  );
}