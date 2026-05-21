# MangaList — Contexto do Projeto

## O que é
PWA para catalogar mangás e webtoons lidos em diferentes sites, salvando título e capítulo atual. O problema principal: sites de mangá somem da internet e você perde o progresso salvo neles.

## Stack
- React + Vite + Firebase Firestore
- `vite-plugin-pwa` (manifesto com share_target e ícone SVG)
- Estilos via CSS Modules + tokens de tema em CSS variables
- Deploy pretendido: Firebase Hosting ou Vercel

## Sites suportados
| Site | Tipo | Formato da URL |
|---|---|---|
| Sakura Mangás | Mangá | `/obras/titulo-slug/12/` (também aceita `/manga/.../capitulo-12`) |
| Kitsune Yako | Webtoon | `/titulo-slug-capitulo-273/` |
| MangaDex | Mangá (EN) | `/chapter/uuid` (pede título manual) ou `/title/uuid/titulo-slug` |

## Funcionalidade principal
Usuário cola a URL do capítulo → `src/lib/urlParser.js` extrai título, capítulo e site automaticamente → salva no Firestore (ou em memória, no modo local).

## Modos de execução
- **Firebase** (`.env.local` preenchido): login Google ou e-mail/senha + Firestore em tempo real. Cada usuário vê só as próprias obras (regras em `firestore.rules`).
- **Local** (sem credenciais): usuário fictício já logado + dados em memória, começando vazio (duram até recarregar). Detectado por `isFirebaseConfigured` em `src/lib/firebase.js`.

## Arquitetura
```
src/
  components/   UI em CSS Modules: Header, SearchBar, FilterTabs,
                ObraCard, ObraModal, EmptyState, Login
  hooks/        useAuth, useObras, useTheme, useShareTarget
  lib/          urlParser, firebase (init condicional), db, constants
  styles/       theme.css (tokens claro/escuro) + global.css (reset)
  App.jsx       orquestra hooks + componentes
```

## O que já está pronto
- Parser de URLs dos 3 sites (`lib/urlParser.js`)
- Firebase com inicialização condicional + fallback local (`lib/firebase.js`)
- CRUD no Firestore com `nota` normalizada para número (`lib/db.js`)
- Hooks: auth (Google + e-mail/senha / local), obras (Firestore/memória), tema persistido, share target
- Segurança/deploy: `firestore.rules`, `firestore.indexes.json` (índice composto) e `firebase.json` (hosting SPA)
- UI quebrada em componentes com CSS Modules e tema claro/escuro
- App.jsx conectado: login → lista em tempo real → adicionar/editar/excluir
- Share Target tratado: `?url=` abre o modal de adicionar já preenchido
- Capa automática via API do MangaDex (`lib/cover.js`): busca por UUID ou por título, funciona até para obras de outros sites
- Ícone PWA (`public/icon.svg`) + manifesto corrigido

## O que falta fazer (próximos passos)
1. **Deploy** — Firebase Hosting ou Vercel
2. **Gerar PNGs do ícone** (opcional) — alguns alvos preferem PNG 192/512 além do SVG
3. **Testes** — adicionar testes do `urlParser`, `cover` e dos hooks

## Campos de cada obra no Firestore
```js
{
  userId, titulo, tipo, site, siteKey,
  capituloAtual, status,  // lendo | pausado | concluído | dropado
  nota,                   // número 1–10 ou null
  generos: [],
  capa,                   // URL da imagem
  notasLivres,
  urlOrigem,
  criadoEm, atualizadoEm // serverTimestamp
}
```

## Variáveis de ambiente
Copiar `.env.example` para `.env.local` e preencher com credenciais do Firebase Console. Sem isso, o app roda em modo local.

## Como rodar
```bash
npm install
npm run dev
```
