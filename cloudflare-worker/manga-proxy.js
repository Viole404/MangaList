/**
 * Proxy CORS para a API do MangaDex — Cloudflare Worker.
 *
 * A API do MangaDex só libera CORS para origens localhost, então em produção
 * o navegador bloqueia as chamadas. Este Worker fica no meio: o app chama
 *   https://SEU-WORKER.workers.dev/?url=<URL-do-mangadex-encodada>
 * e ele responde com CORS liberado. Só aceita api.mangadex.org (não é um
 * proxy aberto).
 *
 * Como publicar: veja COMO_PUBLICAR.md nesta pasta.
 */

const ALLOWED_HOSTS = ['api.mangadex.org'];

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400',
};

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    const target = new URL(request.url).searchParams.get('url');
    if (!target) {
      return json({ error: 'Faltou o parâmetro ?url=' }, 400);
    }

    let dest;
    try {
      dest = new URL(target);
    } catch {
      return json({ error: 'URL inválida' }, 400);
    }

    if (!ALLOWED_HOSTS.includes(dest.hostname)) {
      return json({ error: 'Host não permitido' }, 403);
    }

    try {
      const upstream = await fetch(dest.toString(), {
        headers: { 'User-Agent': 'MangaList/1.0 (cover proxy)' },
        cf: { cacheTtl: 600, cacheEverything: true }, // cache de 10 min na borda
      });
      const body = await upstream.text();
      return new Response(body, {
        status: upstream.status,
        headers: {
          ...CORS,
          'Content-Type': upstream.headers.get('content-type') || 'application/json',
        },
      });
    } catch (e) {
      return json({ error: 'Falha ao buscar no MangaDex', detail: String(e) }, 502);
    }
  },
};

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
