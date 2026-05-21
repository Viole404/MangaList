import { useState, useEffect } from 'react';

/**
 * Lê a URL compartilhada via Web Share Target (manifesto: params `url`/`title`).
 * Quando o app é aberto por "Compartilhar" do Chrome mobile, o capítulo chega
 * como `?url=...`. Lemos uma vez, limpamos a query e devolvemos o valor.
 */
export function useShareTarget() {
  const [sharedUrl, setSharedUrl] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // Alguns navegadores entregam o link em `text` em vez de `url`.
    const shared = params.get('url') || params.get('text') || params.get('title');
    if (shared) {
      setSharedUrl(shared);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Permite que o consumidor "consuma" o valor após abrir o modal.
  const clearShared = () => setSharedUrl(null);

  return { sharedUrl, clearShared };
}
