import { useState } from 'react';
import styles from './Login.module.css';

const MODES = {
  login: {
    title: 'Entre na sua conta',
    submit: 'Entrar',
    showName: false,
    showPassword: true,
  },
  register: {
    title: 'Crie sua conta',
    submit: 'Criar conta',
    showName: true,
    showPassword: true,
  },
  reset: {
    title: 'Recuperar senha',
    submit: 'Enviar link de recuperação',
    showName: false,
    showPassword: false,
  },
};

export default function Login({
  onGoogle,
  onEmailLogin,
  onEmailRegister,
  onResetPassword,
  error,
  clearError,
}) {
  const [mode, setMode] = useState('login');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const cfg = MODES[mode];

  function switchMode(next) {
    setMode(next);
    setInfo('');
    clearError();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setInfo('');
    setBusy(true);
    try {
      if (mode === 'login') {
        await onEmailLogin(email, senha);
      } else if (mode === 'register') {
        await onEmailRegister(email, senha, nome);
      } else {
        const ok = await onResetPassword(email);
        if (ok) setInfo('Se houver uma conta com este e-mail, o link de recuperação foi enviado.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.screen}>
      <h1 className={styles.title}>MANGALIST</h1>
      <p className={styles.tagline}>
        Seu catálogo pessoal de mangás e webtoons. {cfg.title}.
      </p>

      <div className={styles.card}>
        <button className={styles.googleBtn} onClick={onGoogle} type="button" disabled={busy}>
          <span aria-hidden>🔑</span> Continuar com Google
        </button>

        <div className={styles.divider}>ou</div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {cfg.showName && (
            <input
              className={styles.input}
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome"
              autoComplete="name"
            />
          )}
          <input
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail"
            type="email"
            autoComplete="email"
            required
          />
          {cfg.showPassword && (
            <input
              className={styles.input}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Senha"
              type="password"
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              minLength={6}
              required
            />
          )}

          <button className={styles.submit} type="submit" disabled={busy}>
            {busy ? 'Aguarde…' : cfg.submit}
          </button>
        </form>

        {error && <p className={styles.error}>{error}</p>}
        {info && <p className={styles.info}>{info}</p>}

        <div className={styles.links}>
          {mode === 'login' && (
            <>
              <span>
                Não tem conta?{' '}
                <button className={styles.linkBtn} type="button" onClick={() => switchMode('register')}>
                  Criar conta
                </button>
              </span>
              <button className={styles.linkBtn} type="button" onClick={() => switchMode('reset')}>
                Esqueci minha senha
              </button>
            </>
          )}
          {mode === 'register' && (
            <span>
              Já tem conta?{' '}
              <button className={styles.linkBtn} type="button" onClick={() => switchMode('login')}>
                Entrar
              </button>
            </span>
          )}
          {mode === 'reset' && (
            <button className={styles.linkBtn} type="button" onClick={() => switchMode('login')}>
              ← Voltar ao login
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
