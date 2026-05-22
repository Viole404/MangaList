import { Component } from 'react';
import { translations } from '../i18n/translations';

/**
 * Captura erros de render para não deixar a tela em branco. Em vez disso,
 * mostra uma mensagem amigável com a opção de recarregar.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('[MangaList] Erro de render:', error, info);
  }

  render() {
    if (this.state.hasError) {
      let lang = 'en';
      try {
        const saved = localStorage.getItem('mangalist_lang');
        if (saved) lang = saved;
      } catch {
        /* ignore */
      }
      const d = translations[lang] || translations.en;
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            minHeight: '100vh',
            padding: 24,
            textAlign: 'center',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-body)',
          }}
        >
          <div style={{ fontSize: 40 }}>😵</div>
          <p style={{ margin: 0 }}>{d.error_generic}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 18px',
              fontWeight: 700,
              color: '#fff',
              background: 'var(--accent)',
              border: 'none',
              borderRadius: 12,
              cursor: 'pointer',
            }}
          >
            {d.reload}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
