import { SITES } from './urlParser';

// Cor de cada status. As chaves batem com o campo `status` salvo no Firestore;
// os rótulos vêm do i18n (chave `status.<key>`).
export const STATUS_CONFIG = {
  lendo: { color: '#22c55e' },
  pausado: { color: '#f59e0b' },
  concluído: { color: '#6366f1' },
  dropado: { color: '#ef4444' },
};

// Cor de cada tipo (rótulos vêm do i18n: `tipo.<key>`). A ordem aqui define a
// ordem no seletor de tipo e nos filtros.
export const TIPO_CONFIG = {
  manga:   { color: '#818cf8' },
  webtoon: { color: '#f97316' },
  manhua:  { color: '#34d399' },
  manhwa:  { color: '#fbbf24' },
};

const FALLBACK_COLOR = '#888';

// A cor de cada site vem do próprio urlParser (fonte única da verdade).
export function getSiteColor(siteKey) {
  return SITES[siteKey]?.color || FALLBACK_COLOR;
}

// Iniciais usadas como capa-placeholder quando a obra não tem imagem.
export function getInitials(titulo) {
  return (titulo || '?')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}
