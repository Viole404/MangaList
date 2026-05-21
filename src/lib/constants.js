import { SITES } from './urlParser';

// Configuração de cada status (label + cores). As chaves batem com o campo
// `status` salvo no Firestore.
export const STATUS_CONFIG = {
  lendo: { label: 'Lendo', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  pausado: { label: 'Pausado', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  concluído: { label: 'Concluído', color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
  dropado: { label: 'Dropado', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
};

// Tipos de obra disponíveis no formulário.
export const TIPOS = [
  { value: 'manga', label: 'Mangá' },
  { value: 'webtoon', label: 'Webtoon' },
  { value: 'manhua', label: 'Manhua' },
  { value: 'manhwa', label: 'Manhwa' },
];

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
