import { flushSync } from 'react-dom';

// Respeita a preferência do sistema por menos animação (acessibilidade).
function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Aplica `update` dentro de uma View Transition — anima reordenação, entrada e
 * saída dos cards (cada um com seu `view-transition-name`).
 *
 * `flushSync` é obrigatório: a API captura o "antes" ao ser chamada e o "depois"
 * ao fim do callback, então o React precisa aplicar a mudança de DOM de forma
 * síncrona aqui dentro.
 *
 * Faz fallback para a atualização normal quando o navegador não suporta a API
 * (ex.: Firefox/Safari antigos) ou quando o usuário pediu menos animação.
 */
export function animateLayout(update) {
  if (
    typeof document === 'undefined' ||
    !document.startViewTransition ||
    prefersReducedMotion()
  ) {
    update();
    return;
  }
  document.startViewTransition(() => flushSync(update));
}