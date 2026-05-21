import { Component } from 'react';

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
          <p style={{ margin: 0 }}>Algo deu errado ao carregar o app.</p>
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
            Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
