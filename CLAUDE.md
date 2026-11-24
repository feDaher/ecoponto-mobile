@AGENTS.md

# ecoponto-mobile — Contexto técnico

> Contexto de negócio (atores, RN01–RN11, RB01–RB12, C4, DER) está em `../CLAUDE.md`.
> Este arquivo cobre o app: arquitetura, convenções, glossário, contrato da API, estado atual.

## Stack

Expo SDK 57 (Managed) · React Native 0.86 · React 19 · Expo Router (typed routes, `src/app/`)
· NativeWind 4 / Tailwind 3 · TanStack Query (servidor) + Zustand (estado local) · Zod 4
· React Hook Form · react-native-maps + expo-location · login via API (Firebase só no backend) · expo-notifications
· TypeScript `strict` · alias `@/` → `src/`.

Comandos: `npm start` (abre no development build, por causa do `expo-dev-client`) ·
`npm run start:go` (Expo Go) · `npm run android|ios|web` · `npm run lint` / `lint:fix` ·
`npm run format` / `format:check` · `npm run typecheck` · `npm run validate` (os três).
`npm test` (Jest, `jest-expo`).

## Qualidade e git hooks (configurado em 2026-09-18)

- **Husky** (`.husky/`, ativado pelo script `prepare` no `npm install`):
  - `pre-commit`: `npx lint-staged` (arquivos staged: `eslint --fix` + `prettier --write`
    em js/ts/tsx; `prettier --write` em json/md/css/yml) **e** `npm run typecheck` (projeto todo).
  - `commit-msg`: commitlint com Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`,
    `test:`, `chore:`, `style:`...). Mensagem fora do padrão bloqueia o commit.
- **Prettier** (`.prettierrc.json`): 100 colunas, aspas simples, trailing comma, LF,
  `prettier-plugin-tailwindcss` (ordena classes). Ignorados em `.prettierignore`.
- **ESLint** (`eslint.config.js`): `eslint-config-expo/flat` + `eslint-config-prettier/flat`
  (por último). Erros bloqueiam o commit; warnings não.
- LF forçado: `.gitattributes`, `.editorconfig`, `.vscode/settings.json` (format on save).
- Estado verificado: `tsc` 0 erros, lint 0 problemas, todo o código já formatado.
- Não use `--no-verify` para pular hooks; corrija o erro apontado.
- Contorno de tipagem: `src/types/css.d.ts` (import de `.css`).

## Idioma (regra do projeto — decidida em 2026-09-18)

- **Tudo em inglês**: pastas, arquivos, identificadores, comentários, chaves JSON da API,
  rotas HTTP, rotas do app, valores de enum/slug, chaves de storage/cache.
- **Só em pt-BR**: strings que são frases exibidas ao usuário (textos JSX, títulos, mensagens
  de `AppError`, labels) e mensagens de log. Locale `'pt-BR'` em `toLocaleString` fica.
- Documentação (README, CLAUDE.md) em pt-BR.

## Arquitetura (Clean Architecture — dependências apontam para dentro)

```
src/
├── app/             Expo Router: _layout.tsx (Stack) + index.tsx (splash) + (tabs)/{home,education,ranking,profile}.tsx
├── presentation/    components/ui, features/points, hooks (React Query), stores (Zustand),
│                    providers (ContainerProvider, QueryProvider), theme/tokens.ts
├── application/     ports/ (interfaces de gateways) + use-cases/ (1 classe por ação)
├── domain/          entities, value-objects, repositories (interfaces), services/gamification.ts
├── infrastructure/  http, dto (Zod), mappers, repositories/{http,in-memory}, gateways (Expo),
│                    auth (http / in-memory), storage, seed/demo-data.ts, di/container.ts
└── core/            env, errors (AppError), result (Result<T,E>), logger, id
```

Regras:

- `domain/` é TS puro (sem React/Expo). Regras de negócio citam `RB0x` em comentário.
- Use-cases e entidades **não lançam**: retornam `Result` (`ok`/`err`). `throw` só p/ bug.
- `infrastructure/di/container.ts` é o **único** lugar que escolhe `Http*` vs `InMemory*`.
  Telas/hooks acessam casos de uso via `useUseCases()` / `useContainer()`.
- Hooks convertem `Result` → exceção com `unwrap()` (`presentation/hooks/result.ts`)
  para o React Query; UI mostra `getErrorMessage(error)`.
- Entidades imutáveis (`Object.freeze`, `create()` estático, `with()` para cópia).
- DTOs validados com Zod; mappers convertem DTO → entidade e descartam itens inválidos com log.
- Sem `EXPO_PUBLIC_API_URL` → modo demo (repositórios em memória, latência simulada 180ms,
  auth local). Com a API, dados **e** login vêm dela (`core/env.ts`); o app não tem Firebase.

Nova funcionalidade: domain → use-case (+ port se houver acesso externo) → impl HTTP **e**
in-memory → registrar no container → hook → tela.

## Glossário DER → código

| DER / domínio (pt)         | Código                                                                                                                                                                                                                            |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PONTO_COLETA / PontoColeta | `CollectionPoint` (`name`, `address`, `city`, `coordinate`, `categories`, `openingHours`, `status`, `updatedAt`, `accreditedAt`, `description`, `whatsAppContact`, `showWhatsApp`, `averageRating`, `reviewCount`, `collectorId`) |
| statusAprovacao            | `ApprovalStatus`: `pending` \| `approved` \| `rejected` \| `suspended`                                                                                                                                                            |
| HORARIO_FUNCIONAMENTO      | `OpeningHours` (`weekday` 0=dom…6=sáb, `opensAt`, `closesAt` "HH:mm")                                                                                                                                                             |
| CATEGORIA_RESIDUO          | `WasteCategory` / `WasteCategoryId` / `WASTE_CATEGORIES`                                                                                                                                                                          |
| REGISTRO_DESCARTE          | `DisposalRecord` (`citizenId`, `collectionPointId`, `category`, `weightKg`, `pointsEarned`, `disposedAt`)                                                                                                                         |
| AVALIACAO                  | `Review` (`rating` 1–5, `comment`, `status`: `published`\|`under_moderation`\|`removed`)                                                                                                                                          |
| USUARIO / tipoPerfil       | `User` (`name`, `email`, `phone`, `city`, `role`, `points`) · `UserRole`: `citizen`\|`collector`\|`admin`                                                                                                                         |
| CONQUISTA                  | `Achievement` · níveis `Level`: `beginner`,`bronze`,`silver`,`gold`,`guardian`                                                                                                                                                    |
| Coordenada / Telefone      | `Coordinate` · `Phone` (dígitos, `forWhatsApp`, `formatted`)                                                                                                                                                                      |
| Descarte / Ranking         | `DisposalRepository`, `RankingEntry`                                                                                                                                                                                              |
| Conteúdo educativo         | `EducationalContent` (`title`, `summary`, `howToDispose`, `whyRecycle`, `environmentalImpact`)                                                                                                                                    |

Slugs de categoria (RB05): `plastic`, `paper`, `metals`, `glass`, `cooking-oil`,
`general-electronics`, `batteries`, `cell-phones`, `computers`, `printers`, `televisions`.

Permissões (RB02, `domain/value-objects/user-role.ts`): `point:view` (pública), `point:register`,
`point:edit-own`, `point:approve`, `pickup:request`, `pickup:receive`, `disposal:register`,
`review:publish`, `review:moderate`, `content:publish`, `user:manage`, `gamification:participate`.

Casos de uso (container `useCases`): `listNearbyPoints`, `getPointDetails`,
`registerCollectionPoint`, `registerDisposal`, `listMyDisposals`, `reviewPoint`, `plotRoute`,
`contactWhatsApp`, `authenticateUser`, `registerUser`, `restoreSession`, `endSession`,
`getRanking`, `listEducationalContent`, `suggestPlaces`, `resolvePlace`, `geocodeAddress`,
`registerPushToken`, `unregisterPushToken`.
Gateways: `location`, `navigation`, `notification`, `auth`, `places`, `geocoding`.

## Contrato da API REST (em inglês — o backend deve seguir; diverge dos nomes do DER)

Fonte da verdade: `src/infrastructure/dto/api.schemas.ts` — os schemas `api*` validam o
payload real do ecoponto-api e o traduzem para os DTOs canônicos usados pelos mappers e pelo
modo demo. Categorias: o app usa slug (`cell-phones`), a API usa código (`CELL_PHONES`) e UUID;
`HttpWasteCategoryCatalog` (`GET /waste-categories`, cacheado) faz a ponte slug ↔ UUID.

Autenticação (`HttpAuthGateway`): `POST /auth/login` devolve `idToken` (Firebase, 1 h),
`refreshToken` e `user`; o `idToken` vai como `Authorization: Bearer`. `getToken` renova
via `POST /auth/refresh` 60 s antes de expirar (uma renovação compartilhada); refresh recusado
(401/403) encerra a sessão. Cadastro: `POST /auth/register` (sem sessão) e depois login.
Sessão salva em `ecoponto.token` + `ecoponto.session` (secure store); `GET /auth/me` restaura
o perfil. Pontos do usuário = `GET /disposals/me/summary` (só descartes CONFIRMED).

Descartes (RB09): `POST /disposals` nasce `pending` com 0 ponto — os pontos só entram quando o
coletor confirma (`DisposalRecord.status`: `pending`/`confirmed`/`cancelled`; no modo demo
nasce `confirmed`). A tela mostra a estimativa e "aguardando confirmação". A regra de pontos
do backend (10/kg) ainda é provisória e difere da do app (`gamification.ts`).

Ranking: `GET /ranking` é público e sem ids (LGPD: primeiro nome, cidade, pontos; empate divide
a posição); `GET /ranking/me` dá a posição do cidadão logado, usada para o destaque.

Busca de pontos (BE-07): o app envia só `city`, `wasteType` (slugs → `PLASTIC`, `COOKING_OIL`,
`ELECTRONICS`… via `dto/api-enums.ts`), `latitude`/`longitude`, `radius` (km; só com origem) e `limit`
(200). A resposta do backend (`status`, `wasteCategories`, `operatingHours` com `MONDAY`…, `INACTIVE`)
é traduzida para o DTO canônico por `apiCollectionPointDtoSchema`; `updatedAt` vem de
`hoursConfirmedAt` (RB06). `neighborhood`, `onlyOpen` e texto livre não existem na API: o
`ListNearbyPointsUseCase` e o repositório HTTP refinam no cliente. Só a leitura (`list`, `getById`)
fala o formato do backend; `register` e `listByCollector` ainda usam o contrato antigo (o backend
expõe `POST /collection-points` com `wasteCategories`/`operatingHours` e `GET /collection-points/mine`).
Atualizado em nov/2026: `register` e `listByCollector` já falam o formato do backend.

| Método   | Rota                                                                      | Obs.                                                                                      |
| -------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| GET      | `/collection-points?city=&wasteType=&latitude=&longitude=&radius=&limit=` | lista (BE-07); `wasteType` aceita vários separados por vírgula (OR)                       |
| GET      | `/collection-points/:id`                                                  | detalhe; horários em `hours` (só os `isActive`)                                           |
| POST     | `/collection-points`                                                      | coletor; `wasteCategories` (códigos) + `operatingHours`; nasce `PENDING`                  |
| GET      | `/collection-points/mine`                                                 | coletor; os próprios pontos, qualquer status                                              |
| GET/POST | `/collection-points/:id/reviews`                                          | GET público (`authorName` = primeiro nome); POST cidadão, 1 por ponto (reenviar atualiza) |
| POST     | `/disposals`                                                              | cidadão; `{collectionPointId, categoryId (UUID), weightKg}`; nasce `PENDING`              |
| GET      | `/disposals/me?from=&pageSize=` · `/disposals/me/summary`                 | cidadão; histórico paginado · `totalPoints` (CONFIRMED)                                   |
| GET      | `/ranking?city=&limit=` · `/ranking/me`                                   | público, sem ids · cidadão                                                                |
| GET      | `/educational-content?categoryId=` · `/educational-content/:id`           | público; `content` em Markdown (`## Como descartar` etc.)                                 |
| GET      | `/waste-categories`                                                       | público; catálogo código ↔ UUID                                                           |
| POST     | `/auth/login` · `/auth/register` · `/auth/refresh` · GET `/auth/me`       | login devolve tokens do Firebase; me exige `Bearer`                                       |

| GET | `/places/autocomplete?input=&sessionToken=&latitude=&longitude=` → `[{placeId, title, subtitle}]` | público; proxy do Google Places (New) |
| GET | `/places/:placeId?sessionToken=` → `{label, latitude, longitude, viewport?}` | público; `viewport` = `{southWest, northEast}` |

Places: a chave do Google fica **só no backend** (FieldMask `location,viewport,formattedAddress`,
região `br`, `pt-BR`, rate limit). O app não tem chave de Places/Geocoding. CEP/endereço livre usa
`expo-location` `geocodeAsync` (nativo, grátis; Android pede permissão; não roda na web).

Push (FE-12; rotas propostas para uma task de backend, **ainda não existem** — o 404 é
tolerado e logado): `POST /users/me/push-tokens` body `{token, platform}` e
`DELETE /users/me/push-tokens/:token`, ambos autenticados. Payload que o backend envia à
Expo Push API: `{to, title, body, channelId: "default", data: {type: "pickup"|"promotion"|"news",
url?: "/point/12", pointId?}}` — `title`/`body` obrigatórios (Android com app fechado não
exibe mensagem só com `data`). O app só abre rotas da allowlist em
`presentation/features/notifications/notification-route.ts`; `/` e o que estiver fora dela
abrem o Mapa (`/home`), já que `/` é a splash.

Erros: 400/422 → `ValidationError` (lê `{message}` ou `{error}`), 401, 403, 404, 408, 5xx.
IDs aceitos como int ou string; `decimal` como número ou string; `TIME` `HH:mm:ss` é normalizado.

## Modo demo

Contas (senha `ecoponto123`): `ana@ecoponto.dev` (citizen), `collector@ecoponto.dev`,
`admin@ecoponto.dev`. Com a API, as contas são as do seed do backend: `cidadao@`, `coletor@` e
`admin@ecoponto.dev`, senha `Ecoponto@123` (o seed também cria os mesmos 8 pontos). Seed: 8 pontos em Manhuaçu (ponto 5 com >60 dias → RB06; ponto 8
`pending` → RB03). Storage keys: `ecoponto.session`, `ecoponto.token`, `ecoponto.lgpd.consent`.

## Estado atual (2026-11-19)

Feito:

- Arquitetura completa das camadas; telas: Mapa (`index`), Educação, Ranking, Perfil,
  Login/Cadastro (`sign-in`, `sign-up`), ficha do ponto (`point/[id]`) e registro de
  descarte (`disposal/[pointId]`).
- Refatoração total para inglês (ver "Idioma"), incluindo contrato da API e rotas.
- Husky + lint-staged + ESLint + Prettier + commitlint configurados e testados;
  Jest configurado (`jest-expo`, alias `@/`, `npm test`); `tsc` e lint zerados.
- Ficha do ponto (FE-05 + FE-08): distância, rótulo de funcionamento
  (`openingStatusLabel`), aviso RB06, rota (RB11), WhatsApp (RB08), materiais aceitos,
  horários por dia, mini-mapa (`point-map-preview`, com `.web.tsx` que não renderiza),
  avaliações (RB12) e entrada para o descarte (RB09).
- Home (FE-14): cabeçalho com menu lateral, busca com debounce de 250 ms (no
  `useNearbyPoints`, via `useDebouncedValue`), filtros rápidos de eletrônicos, filtros
  ativos removíveis, mapa e carrossel de pontos. Os filtros completos ficam só no painel
  inferior (o layout inline para telas ≥ 768px foi retirado).
- **Tab bar flutuante** (`position: 'absolute'`): as telas não encolhem para dar espaço a
  ela. Toda aba precisa terminar o conteúdo rolável com `useTabBarInset()`
  (`presentation/hooks/use-tab-bar-inset.ts`), senão os últimos itens ficam escondidos.
- Toast + push (FE-12): `components/ui/toast` (Zustand;
  `useToast().show({type, title?, message, onPress?})` ou `useToastStore.getState().show`
  fora de componente; tipos
  `success`/`warning`/`danger`/`info`, máx. 3, 4 s). `usePushNotifications` (no
  `_layout.tsx`): registra o token após login, remove no logout, toast em foreground e toque
  → tela (background via listener, app fechado via `consumeLaunchNotification`).
  `app.config.ts` lê `EAS_PROJECT_ID` e `GOOGLE_SERVICES_JSON`; push remoto só em development
  build em aparelho físico.
- **Integração com o ecoponto-api (nov/2026)**: login/cadastro/sessão pela API
  (`HttpAuthGateway`, sem Firebase no app — o pacote `firebase` foi removido), pontos (horários
  lidos de `hours`; antes vinha vazio e todo ponto real era descartado), fluxo do coletor,
  descartes com status, saldo pelo `/summary`, ranking com posição própria, avaliações e
  conteúdo educativo (Markdown → seções em `parseGuideContent`). Validado de ponta a ponta
  contra a API real (mapa, guias, login, renovação de token, avaliação, descarte, ranking).

Pendências conhecidas:

- Typed routes: o `tsc` usa `.expo/types/router.d.ts`, gerado pelo `npx expo start` (modo
  watch). Criou rota nova → suba o Metro uma vez antes do commit, senão o typecheck falha.
- Jest com poucos testes (busca de pontos, contrato `api*`, `parseGuideContent`, push). O
  `fetch` do ambiente `jest-expo` é um polyfill sem I/O: testes de HTTP mockam `fetch`.
  `tsconfig.json` declara `types: ["jest", "node"]` — sem isso o `tsc` não enxerga `describe/it`.
  O pre-commit não roda testes.
- Integração com a API: sessão expirada no meio do uso (refresh recusado) limpa os tokens, mas a
  tela só percebe na próxima ação (401 → "entre na sua conta"); falta um aviso de sessão
  encerrada. Push tokens (`/users/me/push-tokens`) ainda não existem no backend (404 tolerado).
  O backend aceita peso até 1000 kg e a partir de 0,001 kg; o app valida 0,1–500 kg, e
  registros fora disso vindos do painel são descartados do histórico (com log).
- `react-hooks/purity` (React Compiler) barra `Date.now()` em render. Contagem por janela
  de tempo é derivada na camada de aplicação (ex.: `DisposalSummary.disposalsLast30Days`).
- Google Maps (guia `Google Maps no EcoPonto`, out/2026): feitos `app.config.ts` (pacote
  `br.edu.unifacig.ecoponto`, chaves `GOOGLE_MAPS_ANDROID_API_KEY`/`GOOGLE_MAPS_IOS_API_KEY`,
  flags em `extra.googleMaps`), `map-provider.ts` (Google no Android; no iOS só com chave e
  fora do Expo Go), scripts `android:native`/`ios:native`, `.env.example`,
  portas `PlacesGateway`/`GeocodingGateway` + casos de uso. Faltam: campo de busca (debounce
  250 ms, mín. 3 chars, session token, descarte de resposta atrasada), "Buscar nesta área",
  agrupamento com `supercluster`, e as rotas `/places/*` no ecoponto-api.
- `app.json`/ícones/splash ainda do template; `LICENSE` do template Expo. O ícone de
  notificação Android usa `android-icon-monochrome.png` (template) até haver o do EcoPonto.
- FE-12 pendente fora do app: conta Expo (`eas init` → `EAS_PROJECT_ID`), Firebase
  (`google-services.json`, ignorado pelo Git; no EAS Build envie como variável de arquivo)
  e chave FCM V1 no EAS, APNs (conta Apple paga) e a task de backend (tokens, envio, gatilhos).
