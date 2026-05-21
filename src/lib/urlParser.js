/**
 * URL Parser — extrai título, capítulo e fonte a partir da URL
 * Suporta: Sakura Mangás, Kitsune Yako, MangaDex
 */

const SITES = {
  sakura: {
    name: 'Sakura Mangás',
    type: 'manga',
    color: '#e8547a',
    domains: ['sakuramangas.com', 'sakuramangas.org'],
    // ex: /obras/hatori-to-furuta-no-hinichijou-sahanji/12/
    // ex: /manga/chainsaw-man/capitulo-20
    patterns: [
      /\/(?:manga|ler|obras?|serie)\/([^/]+)\/(?:capitulo|cap|chapter)-?([\d]+(?:[._]\d+)?)/i,
      /\/(?:manga|ler|obras?|serie)\/([^/]+)\/([\d]+(?:[._]\d+)?)\/?$/i,
    ],
    slugToTitle: (slug) => slug.replace(/-/g, ' '),
  },

  kitsune: {
    name: 'Kitsune Yako',
    type: 'webtoon',
    color: '#f97316',
    domains: ['kitsuneyako.com', 'kitsuneyako.net', 'kitsuneyako.org'],
    // ex: /necromante-o-rei-da-calamidade-capitulo-273/
    // ex: /serie/titulo/12/
    patterns: [
      /\/(?:webtoon|serie|obras?|manga)\/([^/]+)\/(?:capitulo|cap|episode|ep|chapter)-?([\d]+(?:[._]\d+)?)/i,
      /\/(?:webtoon|serie|obras?|manga)\/([^/]+)\/([\d]+(?:[._]\d+)?)\/?$/i,
      /\/(.+?)-(?:capitulo|cap|episode|ep|chapter)-?([\d]+(?:[._]\d+)?)\/?$/i,
    ],
    slugToTitle: (slug) => slug.replace(/-/g, ' '),
  },

  mangadex: {
    name: 'MangaDex',
    type: 'manga',
    color: '#f87171',
    domains: ['mangadex.org'],
    // ex: /title/uuid/common-and-widespread  → extrai título do slug
    // ex: /chapter/uuid                      → só UUID, pede título manual
    patterns: [
      /\/title\/[a-f0-9-]+\/([^/?#]+)/i,
      /\/chapter\/([a-f0-9-]+)/i,
    ],
    slugToTitle: (slug) => {
      if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(slug)) return null;
      return slug.replace(/-/g, ' ');
    },
  },
};

/**
 * Normaliza número de capítulo: "20", "20.5", "20_5" → "20" ou "20.5"
 */
function normalizeChapter(raw) {
  if (!raw) return null;
  return raw.replace('_', '.').replace(/^0+(\d)/, '$1');
}

/**
 * Capitaliza primeira letra de cada palavra
 */
function toTitleCase(str) {
  return str
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Detecta o site a partir do hostname
 */
function detectSite(hostname) {
  for (const [key, site] of Object.entries(SITES)) {
    if (site.domains.some((d) => hostname.includes(d))) {
      return { key, ...site };
    }
  }
  return null;
}

/**
 * Função principal — recebe uma URL e retorna os dados extraídos
 */
export function parseUrl(rawUrl) {
  if (!rawUrl || !rawUrl.trim()) {
    return { success: false, error: 'URL vazia.' };
  }

  let url;
  try {
    const normalized = rawUrl.trim().startsWith('http')
      ? rawUrl.trim()
      : 'https://' + rawUrl.trim();
    url = new URL(normalized);
  } catch {
    return { success: false, error: 'URL inválida. Verifique e tente novamente.' };
  }

  const site = detectSite(url.hostname);
  if (!site) {
    return {
      success: false,
      error: `Site não reconhecido (${url.hostname}). Sites suportados: Sakura Mangás, Kitsune Yako, MangaDex.`,
    };
  }

  const pathname = url.pathname;
  let title = null;
  let chapter = null;
  let needsManualTitle = false;

  // Para o MangaDex, captura o UUID da obra (URLs /title/uuid) — permite buscar
  // a capa por id, mais preciso que por título.
  let mangaId = null;
  if (site.key === 'mangadex') {
    const idMatch = pathname.match(/\/title\/([0-9a-f-]{36})/i);
    if (idMatch) mangaId = idMatch[1];
  }

  for (const pattern of site.patterns) {
    const match = pathname.match(pattern);
    if (match) {
      const slug = match[1];
      const chapterRaw = match[2] || null;

      const resolvedTitle = site.slugToTitle(slug);
      if (resolvedTitle === null) {
        needsManualTitle = true;
        title = null;
      } else {
        title = toTitleCase(resolvedTitle);
      }

      chapter = normalizeChapter(chapterRaw);
      break;
    }
  }

  if (!title && !needsManualTitle) {
    return {
      success: false,
      error: `Não foi possível extrair o título desta URL do ${site.name}. Tente a URL do capítulo diretamente.`,
    };
  }

  return {
    success: true,
    site: site.name,
    siteKey: site.key,
    type: site.type,
    title,
    chapter,
    mangaId,
    needsManualTitle,
    error: null,
  };
}

export { SITES };
