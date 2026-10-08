@AGENTS.md

# ecoponto-mobile — Contexto técnico

> Contexto de negócio (atores, RN01–RN11, RB01–RB12, C4, DER) está em `../CLAUDE.md`.
> Este arquivo cobre o app: arquitetura, convenções, glossário, contrato da API, estado atual.

## Stack

Expo SDK 57 (Managed) · React Native 0.86 · React 19 · Expo Router (typed routes, `src/app/`)
· NativeWind 4 / Tailwind 3 · TanStack Query (servidor) + Zustand (estado local) · Zod 4
· React Hook Form · react-native-maps + expo-location · Firebase Auth (SDK JS) · expo-notifications
· TypeScript `strict` · alias `@/` → `src/`.

Comandos: `npm start` · `npm run android|ios|web` · `npm run lint` / `lint:fix` ·
`npm run format` / `format:check` · `npm run typecheck` · `npm run validate` (os três).
Sem script `test` nem config do Jest ainda.

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
- Contornos de tipagem: `src/types/css.d.ts` (import de `.css`) e `paths` `@firebase/auth` →
  tipagem RN no `tsconfig.json` (bug do `exports` do firebase que esconde
  `getReactNativePersistence`).

## Idioma (regra do projeto — decidida em 2026-09-18)

- **Tudo em inglês**: pastas, arquivos, identificadores, comentários, chaves JSON da API,
  rotas HTTP, rotas do app, valores de enum/slug, chaves de storage/cache.
- **Só em pt-BR**: strings que são frases exibidas ao usuário (textos JSX, títulos, mensagens
  de `AppError`, labels) e mensagens de log. Locale `'pt-BR'` em `toLocaleString` fica.
- Documentação (README, CLAUDE.md) em pt-BR.

## Arquitetura (Clean Architecture — dependências apontam para dentro)

```
src/
├── app/             Expo Router: _layout.tsx (Stack) + (tabs)/{index,education,ranking,profile}.tsx
├── presentation/    components/ui, features/points, hooks (React Query), stores (Zustand),
│                    providers (ContainerProvider, QueryProvider), theme/tokens.ts
├── application/     ports/ (interfaces de gateways) + use-cases/ (1 classe por ação)
├── domain/          entities, value-objects, repositories (interfaces), services/gamification.ts
├── infrastructure/  http, dto (Zod), mappers, repositories/{http,in-memory}, gateways (Expo),
│                    auth (firebase / in-memory), storage, seed/demo-data.ts, di/container.ts
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
  auth local). Firebase só é usado se houver API **e** chaves Firebase (`core/env.ts`).

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
`getRanking`, `listEducationalContent`, `suggestPlaces`, `resolvePlace`, `geocodeAddress`.
Gateways: `location`, `navigation`, `notification`, `auth`, `places`, `geocoding`.

## Contrato da API REST (em inglês — o backend deve seguir; diverge dos nomes do DER)

Fonte da verdade: `src/infrastructure/dto/api.schemas.ts`.

| Método   | Rota                                                                                            | Obs.                                                   |
| -------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| GET      | `/collection-points?categories=&city=&latitude=&longitude=&radiusKm=&search=&onlyOpen=&status=` | lista                                                  |
| GET      | `/collection-points/:id`                                                                        | detalhe                                                |
| POST     | `/collection-points`                                                                            | auth, coletor; nasce `pending`                         |
| GET      | `/collectors/:id/collection-points`                                                             | auth                                                   |
| GET/POST | `/collection-points/:id/reviews`                                                                | POST auth, body `{rating, comment}`                    |
| POST     | `/disposals`                                                                                    | auth, body `{collectionPointId, categoryId, weightKg}` |
| GET      | `/citizens/:id/disposals` · `/citizens/:id/disposals/count?windowDays=30`                       | auth                                                   |
| GET      | `/ranking?city=&limit=`                                                                         | público                                                |
| GET      | `/educational-contents?category=` · `/educational-contents/:id`                                 | público                                                |
| POST     | `/users` · GET `/users/me`                                                                      | Firebase JWT (`Authorization: Bearer`)                 |

| GET | `/places/autocomplete?input=&sessionToken=&latitude=&longitude=` → `[{placeId, title, subtitle}]` | público; proxy do Google Places (New) |
| GET | `/places/:placeId?sessionToken=` → `{label, latitude, longitude, viewport?}` | público; `viewport` = `{southWest, northEast}` |

Places: a chave do Google fica **só no backend** (FieldMask `location,viewport,formattedAddress`,
região `br`, `pt-BR`, rate limit). O app não tem chave de Places/Geocoding. CEP/endereço livre usa
`expo-location` `geocodeAsync` (nativo, grátis; Android pede permissão; não roda na web).

Erros: 400/422 → `ValidationError` (lê `{message}` ou `{error}`), 401, 403, 404, 408, 5xx.
IDs aceitos como int ou string; `decimal` como número ou string; `TIME` `HH:mm:ss` é normalizado.

## Modo demo

Contas (senha `ecoponto123`): `ana@ecoponto.dev` (citizen), `collector@ecoponto.dev`,
`admin@ecoponto.dev`. Seed: 8 pontos em Manhuaçu (ponto 5 com >60 dias → RB06; ponto 8
`pending` → RB03). Storage keys: `ecoponto.session`, `ecoponto.token`, `ecoponto.lgpd.consent`.

## Estado atual (2026-09-18)

Feito:

- Arquitetura completa das camadas; telas: Mapa (`index`), Educação, Ranking, Perfil.
- Refatoração total para inglês (ver "Idioma"), incluindo contrato da API e rotas.
  Backup do `src/` pré-tradução ficou só no scratchpad da sessão (temporário).
- Husky + lint-staged + ESLint + Prettier + commitlint configurados e testados;
  `@expo/vector-icons` instalado; `tsc` e lint zerados.

Pendências conhecidas:

- **Telas placeholder** (só `EmptyState` + `TODO` no JSDoc): `point/[id]` (ficha do ponto),
  `sign-in`, `sign-up`. Existem para as typed routes compilarem; falta implementar.
- Typed routes: o `tsc` usa `.expo/types/router.d.ts`, gerado pelo `npx expo start` (modo
  watch). Criou rota nova → suba o Metro uma vez antes do commit, senão o typecheck falha.
- Jest sem config/script (o pre-commit ainda não roda testes).
- Google Maps (guia `Google Maps no EcoPonto`, out/2026): feitos `app.config.ts` (pacote
  `br.edu.unifacig.ecoponto`, chave Android via `GOOGLE_MAPS_ANDROID_API_KEY`), `.env.example`,
  portas `PlacesGateway`/`GeocodingGateway` + casos de uso. Faltam: campo de busca (debounce
  250 ms, mín. 3 chars, session token, descarte de resposta atrasada), "Buscar nesta área",
  agrupamento com `supercluster`, e as rotas `/places/*` no ecoponto-api.
- `app.json`/ícones/splash ainda do template; `LICENSE` do template Expo.
