# MangaList 📚

Seu catálogo pessoal de mangás e webtoons — PWA com React + Vite + Firebase.

🔗 **App no ar:** https://organizador-de-obras-d695d.web.app

## Funcionalidades

- ✅ Cole a URL do capítulo → título e capítulo extraídos automaticamente
- ✅ Capa buscada automaticamente na API do MangaDex (funciona até para obras de outros sites)
- ✅ Suporte a Sakura Mangás, Kitsune Yako e MangaDex
- ✅ Botão +1 / −1 para avançar ou voltar capítulos rapidamente
- ✅ Status: Lendo / Pausado / Concluído / Dropado
- ✅ Filtro por status + busca por título
- ✅ Tema escuro/claro (lembrado entre sessões)
- ✅ PWA — instale na tela inicial do celular
- ✅ Share Target — compartilhe a URL direto do Chrome para o app
- ✅ Login com Google **ou** e-mail/senha (com cadastro e recuperação) + sincronização via Firestore
- ✅ **Modo local** — roda sem Firebase, com dados em memória (começa vazio)

## Modos de execução

O app detecta automaticamente se há credenciais Firebase:

| Modo | Quando | Comportamento |
|---|---|---|
| **Firebase** | `.env.local` preenchido | Login Google + dados persistidos no Firestore, sincronizados em tempo real |
| **Local** | sem `.env.local` | Sem login, dados em memória que começam vazios (duram até recarregar) — ideal para testar a interface |

## Setup

### 1. Clone e instale

```bash
git clone https://github.com/<seu-usuario>/Organizador-de-Obras.git
cd Organizador-de-Obras
npm install
```

### 2. (Opcional) Configure o Firebase

Sem este passo o app roda em **modo local**. Para persistir dados:

1. Crie um projeto em [console.firebase.google.com](https://console.firebase.google.com)
2. Em **Authentication > Sign-in method**, ative os provedores **Google** e **E-mail/senha**
3. Crie um banco em **Firestore Database** (modo produção)
4. Copie `.env.example` para `.env.local` e preencha com as credenciais do app web

### 3. Regras e índices do Firestore

As regras (`firestore.rules`) e o índice composto (`firestore.indexes.json`) já estão no repositório. As regras garantem que cada usuário só acesse as próprias obras; o índice é necessário para a consulta `userId + ordenação por data`. Publique via CLI:

```bash
npm install -g firebase-tools
firebase login
firebase use --add            # selecione seu projeto
firebase deploy --only firestore:rules,firestore:indexes
```

> Sem o índice, a lista aparece vazia e o console mostra um erro com um link para criá-lo (alternativa ao deploy acima).

### 4. Rode localmente

```bash
npm run dev
```

### 5. Deploy (Firebase Hosting)

O `firebase.json` já configura o hosting (SPA) apontando para `dist/`:

```bash
npm run build
firebase deploy               # publica hosting + regras + índices
```

## Busca de capa (proxy CORS)

A capa é buscada na **API pública do MangaDex**. Em produção há um detalhe: a API
do MangaDex só libera CORS para origens `localhost`, então o navegador bloqueia as
chamadas a partir do domínio publicado. A solução é um proxy CORS leve.

- `src/lib/cover.js` tenta a API direta e, quando o CORS bloqueia, cai no proxy.
- Defina `VITE_COVER_PROXY` no `.env.local` com a URL de um **Cloudflare Worker**
  (grátis, sem cartão). O código do Worker e o passo a passo estão em
  [`cloudflare-worker/`](cloudflare-worker/). Sem essa variável, é usado um proxy
  público de reserva (mais lento e instável).

> As **imagens** de capa carregam direto do CDN do MangaDex (não precisam de proxy).

## Estrutura do projeto

```
src/
  components/         ← componentes de UI, cada um com seu .module.css
    Header.jsx
    SearchBar.jsx
    FilterTabs.jsx
    ObraCard.jsx
    ObraModal.jsx     ← formulário + parser de URL + busca de capa
    EmptyState.jsx
    Login.jsx
    ErrorBoundary.jsx ← evita tela branca em erros de render
  hooks/
    useAuth.js        ← autenticação (Google / e-mail-senha / local)
    useObras.js       ← obras + CRUD, com fallback local automático
    useTheme.js       ← tema claro/escuro persistido
    useShareTarget.js ← lê a URL recebida via compartilhamento
  lib/
    urlParser.js      ← parser de URLs dos 3 sites
    cover.js          ← busca de capa no MangaDex (tradução + proxy)
    firebase.js       ← inicialização condicional do Firebase
    db.js             ← operações no Firestore
    constants.js      ← status, tipos e helpers
  styles/
    theme.css         ← tokens de tema (CSS variables) claro/escuro
    global.css        ← reset e estilos globais
  App.jsx             ← orquestra hooks + componentes
  main.jsx            ← entry point

cloudflare-worker/    ← proxy CORS para a busca de capa (opcional)
firestore.rules       ← regras de segurança (lista privada por usuário)
firestore.indexes.json← índice composto userId + atualizadoEm
firebase.json         ← hosting (SPA) + firestore
```

## URL Parser — sites suportados

| Site | Tipo | Exemplo de URL |
|---|---|---|
| Sakura Mangás | Mangá | `/obras/chainsaw-man/97/` |
| Kitsune Yako | Webtoon | `/necromante-o-rei-da-calamidade-capitulo-273/` |
| MangaDex | Mangá (EN) | `/title/uuid/dungeon-meshi` (ou `/chapter/uuid`, que pede o título) |

> O parser também aceita variações como `/manga/<slug>/capitulo-<n>` e `/serie/<slug>/<n>`.
