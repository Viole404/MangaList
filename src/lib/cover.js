/**
 * Busca de capa via API pública do MangaDex (CORS liberado, sem backend).
 *
 * Estratégia: mesmo para obras do Sakura/Kitsune, pesquisamos o título no
 * MangaDex — a maioria das obras populares está catalogada lá. Quando temos o
 * UUID da obra (URLs /title/uuid), buscamos por id, que é mais preciso.
 */

const API = 'https://api.mangadex.org';
const COVERS = 'https://uploads.mangadex.org/covers';
const ALL_RATINGS = ['safe', 'suggestive', 'erotica', 'pornographic'];

// Em produção a API do MangaDex bloqueia CORS (só libera origens localhost).
// Quando a chamada direta falha, reroteamos por um proxy CORS e passamos a
// usá-lo nas chamadas seguintes desta sessão.
// Defina VITE_COVER_PROXY com o seu Cloudflare Worker (rápido e confiável);
// sem isso, cai no allorigins público (lento e instável) como último recurso.
const CORS_PROXY = import.meta.env.VITE_COVER_PROXY || 'https://api.allorigins.win/raw?url=';
let useProxy = false;

async function mdFetch(url) {
  if (!useProxy) {
    try {
      return await fetch(url);
    } catch {
      useProxy = true; // CORS bloqueado (produção) → usa proxy daqui pra frente
    }
  }
  // O proxy público é instável: tenta algumas vezes antes de desistir.
  let last = null;
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(CORS_PROXY + encodeURIComponent(url));
      if (res.ok) return res;
      last = res;
    } catch {
      /* tenta de novo */
    }
  }
  if (last) return last;
  throw new Error('Proxy CORS indisponível');
}

// Escolhe um título legível dentre os idiomas disponíveis.
function pickTitle(manga) {
  const t = manga?.attributes?.title || {};
  return t.en || t['ja-ro'] || t.ja || Object.values(t)[0] || null;
}

// Monta a URL do thumbnail 512px a partir do cover_art incluído na resposta.
function buildCoverUrl(mangaId, manga) {
  const rel = manga?.relationships?.find((r) => r.type === 'cover_art');
  const fileName = rel?.attributes?.fileName;
  return fileName ? `${COVERS}/${mangaId}/${fileName}.512.jpg` : null;
}

async function coverByMangaId(mangaId) {
  const res = await mdFetch(`${API}/manga/${mangaId}?includes[]=cover_art`);
  if (!res.ok) return null;
  const { data } = await res.json();
  if (!data) return null;
  const url = buildCoverUrl(data.id, data);
  return url ? { url, matchedTitle: pickTitle(data) } : null;
}

async function coverByTitle(title) {
  const params = new URLSearchParams();
  params.set('title', title);
  params.set('limit', '1');
  params.append('includes[]', 'cover_art');
  params.append('order[relevance]', 'desc');
  for (const r of ALL_RATINGS) params.append('contentRating[]', r);

  const res = await mdFetch(`${API}/manga?${params.toString()}`);
  if (!res.ok) return null;
  const { data } = await res.json();
  const manga = data?.[0];
  if (!manga) return null;
  const url = buildCoverUrl(manga.id, manga);
  return url ? { url, matchedTitle: pickTitle(manga) } : null;
}

// Palavras ignoradas ao reduzir um título a palavras-chave. Inclui artigos
// PT/EN e adjetivos de "nível/classe" que costumam atrapalhar a busca.
const STOPWORDS = new Set([
  // PT
  'a', 'o', 'as', 'os', 'de', 'da', 'do', 'das', 'dos', 'e', 'em', 'no', 'na', 'nos', 'nas',
  'um', 'uma', 'que', 'com', 'para', 'por', 'ao', 'aos', 'seu', 'sua',
  // EN
  'the', 'of', 'an', 'and', 'in', 'on', 'to', 'for', 'is', 'at', 'by', 'with', 'his', 'her', 'my', 'i',
  // adjetivos de nível/classe
  'level', 'class', 'rank', 'tier', 'grade',
]);

function toKeywords(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove acentos
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !STOPWORDS.has(w));
}

/**
 * Traduz PT→EN via MyMemory (grátis, com CORS). Falha em silêncio (null).
 */
async function translateToEnglish(text) {
  if (!text || !text.trim()) return null;
  try {
    const url =
      'https://api.mymemory.translated.net/get?q=' +
      encodeURIComponent(text.trim()) +
      '&langpair=pt|en';
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    const t = json?.responseData?.translatedText;
    return t && t.trim() ? t.trim() : null;
  } catch {
    return null;
  }
}

// Uma única chamada de busca ao MangaDex.
async function searchOnce(query, limit) {
  const params = new URLSearchParams();
  params.set('title', query);
  params.set('limit', String(limit));
  params.append('includes[]', 'cover_art');
  params.append('order[relevance]', 'desc');
  for (const r of ALL_RATINGS) params.append('contentRating[]', r);

  const res = await mdFetch(`${API}/manga?${params.toString()}`);
  if (!res.ok) return [];
  const { data } = await res.json();
  return (data || [])
    .map((m) => ({
      id: m.id,
      title: pickTitle(m),
      year: m.attributes?.year || null,
      coverUrl: buildCoverUrl(m.id, m),
    }))
    .filter((m) => m.coverUrl);
}

/**
 * Busca resultados no MangaDex para o usuário escolher.
 * Cadeia: título original → tradução PT→EN → palavras-chave da tradução
 * (aparando da frente, pois o "miolo" do nome costuma ficar no fim) →
 * palavras-chave do original. Para na primeira tentativa com resultados.
 * @returns {Promise<{ results: Array, usedQuery: string }>}
 */
export async function searchManga(query, limit = 8) {
  const q = (query || '').trim();
  if (!q) return { results: [], usedQuery: '' };

  try {
    // 1) Como veio (PT ou já em inglês)
    let results = await searchOnce(q, limit);
    if (results.length) return { results, usedQuery: q };

    // 2/3) Traduz e tenta a frase, depois palavras-chave aparando da frente
    const candidates = [];
    const en = await translateToEnglish(q);
    if (en && en.toLowerCase() !== q.toLowerCase()) {
      candidates.push(en);
      const kw = toKeywords(en);
      for (let i = 0; i < Math.max(0, kw.length - 1); i++) {
        candidates.push(kw.slice(i).join(' '));
      }
    }
    // 4) Último recurso: palavras-chave do título original
    const kwPt = toKeywords(q);
    if (kwPt.length) candidates.push(kwPt.join(' '));

    for (const c of candidates) {
      if (!c || !c.trim()) continue;
      results = await searchOnce(c, limit);
      if (results.length) return { results, usedQuery: c };
    }

    return { results: [], usedQuery: q };
  } catch {
    return { results: [], usedQuery: q };
  }
}

/**
 * Tenta achar a capa no MangaDex.
 * @returns {Promise<{url: string, matchedTitle: string|null} | null>}
 */
export async function fetchCover({ title, mangaId } = {}) {
  try {
    if (mangaId) {
      const byId = await coverByMangaId(mangaId);
      if (byId) return byId;
    }
    if (title && title.trim()) {
      return await coverByTitle(title.trim());
    }
    return null;
  } catch {
    return null;
  }
}
