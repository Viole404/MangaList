import { useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { LANGS, LANG_LABELS } from '../i18n/translations';
import styles from './UserArea.module.css';

// Área do usuário em tela cheia (perfil + configurações). Reúne: dados
// pessoais (apelido), compartilhamento da lista, segurança (senha), idioma e
// aparência.
export default function UserArea({
  user,
  obrasCount,
  isDark,
  onToggleTheme,
  sharing,
  shareLink,
  shareBusy,
  onEnableShare,
  onDisableShare,
  onUpdateName,
  onChangePassword,
  onResetPassword,
  onLogout,
  onClose,
}) {
  const { t, lang, setLang } = useI18n();

  const fallbackName = user?.displayName || user?.email?.split('@')[0] || 'Usuário';
  const initials = fallbackName.slice(0, 2).toUpperCase();

  const isPasswordUser = !!user?.providerData?.some?.((p) => p.providerId === 'password');
  const isGoogleUser = !!user?.providerData?.some?.((p) => p.providerId === 'google.com');

  // ── Apelido ──────────────────────────────────────────────
  const [apelido, setApelido] = useState(user?.displayName || '');
  const [nameStatus, setNameStatus] = useState(''); // '' | 'saving' | 'saved'

  async function saveApelido() {
    if (!apelido.trim() || nameStatus === 'saving') return;
    setNameStatus('saving');
    const ok = await onUpdateName(apelido);
    setNameStatus(ok ? 'saved' : '');
    if (ok) setTimeout(() => setNameStatus(''), 2000);
  }

  // ── Compartilhar ─────────────────────────────────────────
  const [copied, setCopied] = useState(false);
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* sem clipboard: o usuário copia manualmente do campo */
    }
  }

  // ── Senha ────────────────────────────────────────────────
  const [novaSenha, setNovaSenha] = useState('');
  const [confirma, setConfirma] = useState('');
  const [pwdMsg, setPwdMsg] = useState(null); // { type: 'ok'|'err'|'reauth', text }
  const [pwdBusy, setPwdBusy] = useState(false);

  async function changePwd() {
    if (pwdBusy) return;
    if (novaSenha.length < 6) {
      setPwdMsg({ type: 'err', text: t('ua_pwd_min6_err') });
      return;
    }
    if (novaSenha !== confirma) {
      setPwdMsg({ type: 'err', text: t('ua_pwd_mismatch') });
      return;
    }
    setPwdBusy(true);
    setPwdMsg(null);
    const res = await onChangePassword(novaSenha);
    setPwdBusy(false);
    if (res?.ok) {
      setPwdMsg({ type: 'ok', text: t('ua_pwd_ok') });
      setNovaSenha('');
      setConfirma('');
    } else if (res?.reauth) {
      setPwdMsg({ type: 'reauth', text: t('ua_pwd_reauth') });
    } else {
      setPwdMsg({ type: 'err', text: res?.messageKey ? t(res.messageKey) : t('ua_pwd_fail') });
    }
  }

  async function sendResetEmail() {
    const ok = await onResetPassword(user.email);
    setPwdMsg({ type: ok ? 'ok' : 'err', text: ok ? t('ua_reset_sent') : t('ua_reset_fail') });
  }

  return (
    <div className={styles.screen}>
      {/* Barra superior */}
      <div className={styles.topbar}>
        <button className={styles.back} onClick={onClose} aria-label={t('ua_back')}>
          ← <span>{t('ua_back')}</span>
        </button>
        <span className={styles.brand}>MANGALIST</span>
      </div>

      {/* Perfil */}
      <div className={styles.profile}>
        {user?.photoURL ? (
          <img className={styles.avatar} src={user.photoURL} alt={fallbackName} referrerPolicy="no-referrer" />
        ) : (
          <div className={styles.avatarFallback}>{initials}</div>
        )}
        <h1 className={styles.name}>{fallbackName}</h1>
        {user?.email && <p className={styles.email}>{user.email}</p>}
        <div className={styles.stat}>
          {obrasCount === 1
            ? t('ua_stat_one', { n: obrasCount })
            : t('ua_stat_many', { n: obrasCount })}
        </div>
      </div>

      <div className={styles.body}>
        {/* Dados Pessoais */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('ua_personal_data')}</h2>
          <label className={styles.label}>{t('ua_nickname_label')}</label>
          <div className={styles.row}>
            <input
              className={styles.input}
              value={apelido}
              onChange={(e) => setApelido(e.target.value)}
              placeholder={t('ua_nickname_placeholder')}
              maxLength={40}
            />
            <button
              className={styles.primaryBtn}
              onClick={saveApelido}
              disabled={nameStatus === 'saving' || !apelido.trim()}
            >
              {nameStatus === 'saving' ? '…' : nameStatus === 'saved' ? '✓' : t('save')}
            </button>
          </div>
          <p className={styles.hint}>{t('ua_nickname_hint')}</p>
        </section>

        {/* Compartilhamento */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('ua_share_title')}</h2>
          {sharing ? (
            <>
              <p className={styles.text}>{t('ua_share_active')}</p>
              <div className={styles.row}>
                <input
                  className={styles.input}
                  value={shareLink}
                  readOnly
                  onFocus={(e) => e.target.select()}
                />
                <button className={styles.primaryBtn} onClick={copyLink}>
                  {copied ? t('copied') : t('copy')}
                </button>
              </div>
              <button className={styles.dangerBtn} onClick={onDisableShare} disabled={shareBusy}>
                {shareBusy ? t('please_wait') : t('ua_stop_sharing')}
              </button>
            </>
          ) : (
            <button className={styles.primaryBtnWide} onClick={onEnableShare} disabled={shareBusy}>
              {shareBusy ? t('ua_generating') : t('ua_generate_link')}
            </button>
          )}
        </section>

        {/* Segurança */}
        {isPasswordUser && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{t('ua_security')}</h2>
            <label className={styles.label}>{t('ua_new_password')}</label>
            <input
              className={styles.input}
              type="password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              placeholder={t('ua_min6')}
              autoComplete="new-password"
            />
            <label className={styles.label}>{t('ua_confirm_password')}</label>
            <input
              className={styles.input}
              type="password"
              value={confirma}
              onChange={(e) => setConfirma(e.target.value)}
              placeholder={t('ua_repeat_password')}
              autoComplete="new-password"
            />
            <button className={styles.outlineBtn} onClick={changePwd} disabled={pwdBusy}>
              {pwdBusy ? t('ua_changing') : t('ua_change_password')}
            </button>
            {pwdMsg && (
              <div className={pwdMsg.type === 'err' ? styles.msgErr : styles.msgOk}>
                {pwdMsg.text}
                {pwdMsg.type === 'reauth' && (
                  <button className={styles.linkBtn} onClick={sendResetEmail}>
                    {t('ua_send_reset')}
                  </button>
                )}
              </div>
            )}
          </section>
        )}

        {isGoogleUser && !isPasswordUser && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>{t('ua_security')}</h2>
            <p className={styles.text}>{t('ua_google_security')}</p>
          </section>
        )}

        {/* Idioma */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('ua_language')}</h2>
          <div className={styles.langRow}>
            {LANGS.map((l) => (
              <button
                key={l}
                type="button"
                className={`${styles.langBtn} ${lang === l ? styles.langActive : ''}`}
                onClick={() => setLang(l)}
              >
                {LANG_LABELS[l].name}
              </button>
            ))}
          </div>
        </section>

        {/* Aparência */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('ua_appearance')}</h2>
          <div className={styles.rowBetween}>
            <span className={styles.text}>{isDark ? t('ua_theme_dark_on') : t('ua_theme_light_on')}</span>
            <button className={styles.outlineBtn} onClick={onToggleTheme}>
              {isDark ? t('ua_switch_light') : t('ua_switch_dark')}
            </button>
          </div>
        </section>

        {/* Sair */}
        <button className={styles.logoutBtn} onClick={onLogout}>
          {t('ua_logout')}
        </button>
      </div>
    </div>
  );
}
