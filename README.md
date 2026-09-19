# EcoPonto Digital — App Mobile

App mobile do **EcoPonto Digital**, sistema para mapear, credenciar e divulgar pontos de coleta
de resíduos recicláveis e eletrônicos na região de **Manhuaçu–MG**.

Projeto acadêmico do curso de ADS (6º período, 2026/2) do Centro Universitário UniFacig.
O contexto completo do sistema (atores, requisitos RN01–RN11, regras de negócio RB01–RB12,
arquitetura C4 e DER) está em [`../CLAUDE.md`](../CLAUDE.md).

## Stack

- **Expo SDK 57** (Managed Workflow) + **React Native 0.86** + **React 19**
- **Expo Router** (rotas por arquivo em `src/app/`, typed routes)
- **NativeWind 4** (Tailwind CSS 3) para estilo
- **TanStack Query** (dados do servidor) + **Zustand** (estado local)
- **React Hook Form** + **Zod** (formulários e validação)
- **react-native-maps** + **expo-location** (mapa e geolocalização)
- **Firebase Auth** (autenticação), **expo-notifications** (push)
- TypeScript em modo `strict`

> A API do Expo mudou bastante nas versões recentes. Antes de escrever código, consulte a
> documentação da versão usada: https://docs.expo.dev/versions/v57.0.0/

## Como rodar

Requisitos: Node.js LTS e o app **Expo Go** no celular (ou emulador Android / simulador iOS).

```bash
npm install
npm start          # abre o Expo Dev Server; leia o QR code com o Expo Go
```

Atalhos:

| Comando                | O que faz                                    |
| ---------------------- | -------------------------------------------- |
| `npm start`            | Inicia o servidor de desenvolvimento         |
| `npm run android`      | Abre no emulador/dispositivo Android         |
| `npm run ios`          | Abre no simulador iOS (macOS)                |
| `npm run web`          | Abre no navegador                            |
| `npm run lint`         | Roda o ESLint (`expo lint`)                  |
| `npm run lint:fix`     | Corrige automaticamente o que o ESLint puder |
| `npm run format`       | Formata todo o projeto com Prettier          |
| `npm run format:check` | Só verifica a formatação                     |
| `npm run typecheck`    | Checa os tipos (`tsc --noEmit`)              |
| `npm run validate`     | Typecheck + lint + format:check              |

### Antes de cada commit (automático)

O `npm install` ativa os git hooks do **Husky**. A cada `git commit`:

1. **pre-commit** — o `lint-staged` roda `eslint --fix` e `prettier --write` nos arquivos
   staged, e em seguida roda o `typecheck` do projeto todo. Qualquer erro bloqueia o commit.
2. **commit-msg** — o `commitlint` exige
   [Conventional Commits](https://www.conventionalcommits.org/): `feat: adiciona tela de login`
   passa; `arrumei coisas` é recusado.

Recomendado no VS Code: instalar as extensões sugeridas em `.vscode/extensions.json`
(Prettier, ESLint); o projeto já formata ao salvar.

### Rodando sem backend (modo demonstração)

**Nenhuma configuração é necessária para começar.** Sem variáveis de ambiente, o app usa
repositórios em memória com dados de exemplo de Manhuaçu
([`src/infrastructure/seed/demo-data.ts`](src/infrastructure/seed/demo-data.ts)) e uma
autenticação local. Os dados voltam ao estado inicial sempre que o app é recarregado.

Contas de demonstração (senha de todas: `ecoponto123`):

| Perfil  | E-mail                   |
| ------- | ------------------------ |
| Cidadão | `ana@ecoponto.dev`       |
| Coletor | `collector@ecoponto.dev` |
| Admin   | `admin@ecoponto.dev`     |

A autenticação local compara a senha em texto puro e serve só para desenvolvimento e
apresentação.

### Conectando à API e ao Firebase

Crie um arquivo `.env.local` na raiz do app:

```bash
# API REST (Node/Express). Com ela definida, o app passa a usar os repositórios HTTP.
EXPO_PUBLIC_API_URL=https://api.exemplo.com
EXPO_PUBLIC_API_TIMEOUT_MS=8000

# Google Maps
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=

# Firebase Auth (só é usado se EXPO_PUBLIC_API_URL também estiver definida)
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```

O que muda com cada variável ([`src/core/env.ts`](src/core/env.ts)):

| Configuração                   | Dados             | Autenticação  |
| ------------------------------ | ----------------- | ------------- |
| Nenhuma variável               | Em memória (seed) | Local (demo)  |
| Só `API_URL`                   | API REST          | Local (demo)  |
| `API_URL` + variáveis Firebase | API REST          | Firebase Auth |

O Firebase precisa da API porque o perfil do usuário (`tipoPerfil`, cidade, pontos) fica no
MySQL, não no Firebase.

> **Atenção:** variáveis `EXPO_PUBLIC_*` são embutidas no bundle e ficam **públicas**.
> Nunca coloque segredos de servidor nelas. O `.env.local` não deve ir para o Git.

Reinicie o servidor (`npm start -- --clear`) depois de alterar o `.env.local`.

## Telas

O app tem quatro abas ([`src/app/(tabs)/`](<src/app/(tabs)/>)):

| Aba          | Arquivo         | Conteúdo                                                     |
| ------------ | --------------- | ------------------------------------------------------------ |
| **Mapa**     | `index.tsx`     | Pontos de coleta no mapa, filtros, detalhes, rota e WhatsApp |
| **Educação** | `education.tsx` | Conteúdo educativo por categoria de resíduo                  |
| **Ranking**  | `ranking.tsx`   | Ranking, níveis e conquistas (gamificação)                   |
| **Perfil**   | `profile.tsx`   | Login, cadastro, descartes do usuário                        |

O mapa é **público** (RB01): não exige login. Ações como registrar descarte e avaliar pontos
exigem uma conta.

Na web, o `react-native-maps` não funciona. Por isso o Metro usa
[`points-map.web.tsx`](src/presentation/features/points/points-map.web.tsx), que mostra os
pontos em lista.

## Arquitetura

O código segue **Clean Architecture**. As dependências apontam sempre para dentro:
`presentation → application → domain`. A `infrastructure` implementa as interfaces
definidas nas camadas internas.

```
src/
├── app/              Rotas do Expo Router (telas e layouts)
├── presentation/     UI: componentes, features, hooks (React Query), stores (Zustand), tema
├── application/      Casos de uso e portas (interfaces de gateways externos)
├── domain/           Entidades, value objects, serviços e interfaces de repositório
├── infrastructure/   Implementações: HTTP, em memória, Firebase, Expo, mappers, DI
└── core/             Utilitários comuns: env, erros, Result, logger, id
```

- **`domain/`** é TypeScript puro, sem React nem Expo. É onde ficam as regras de negócio:
  validação de coordenadas (RB04), taxonomia de categorias (RB05), horários desatualizados
  após 60 dias (RB06) e cálculo de pontuação (RB09, em
  [`gamification.ts`](src/domain/services/gamification.ts)). Os comentários citam a regra
  (`RB0x`) correspondente do documento.
- **`application/use-cases/`** tem um caso de uso por ação do usuário
  (`list-nearby-points`, `register-disposal`, `plot-route`...).
- **`infrastructure/di/container.ts`** é o _composition root_: é o **único** arquivo que
  escolhe entre as implementações `Http*` e `InMemory*`. Telas e hooks recebem os casos de uso
  pelo `ContainerProvider` e não importam a infraestrutura diretamente.
- Erros de negócio são retornados como `Result` ([`src/core/result.ts`](src/core/result.ts)),
  e não lançados como exceção.
- DTOs da API são validados com Zod
  ([`api.schemas.ts`](src/infrastructure/dto/api.schemas.ts)) e convertidos em entidades
  pelos mappers. Os mappers rejeitam dados inválidos, como categorias desconhecidas.

### Adicionando uma funcionalidade

1. Regra ou entidade nova → `domain/`.
2. Caso de uso → `application/use-cases/` (acesso externo novo? crie a porta em
   `application/ports/`).
3. Implementação HTTP **e** em memória → `infrastructure/`, e registro no `container.ts`.
4. Hook em `presentation/hooks/` e tela/componente em `presentation/` ou `app/`.

## Convenções

- **Idioma:** todo o código fica em inglês — pastas, arquivos, identificadores, comentários,
  chaves do contrato da API e valores de enum (`CollectionPoint`, `WasteCategory`, `'citizen'`,
  `'approved'`...). Só ficam em pt-BR as strings com frases exibidas ao usuário (textos de
  tela, mensagens de erro, logs). A documentação (README) segue em pt-BR.
  Correspondência com o DER: `PONTO_COLETA` → `CollectionPoint`, `CATEGORIA_RESIDUO` →
  `WasteCategory`, `REGISTRO_DESCARTE` → `DisposalRecord`, `AVALIACAO` → `Review`,
  `HORARIO_FUNCIONAMENTO` → `OpeningHours`, `USUARIO` → `User` (perfis `citizen`,
  `collector`, `admin`).
- **Imports:** use o alias `@/` para `src/` (ex.: `@/domain/entities/collection-point`).
- **Arquivos:** `kebab-case`, com sufixo pelo papel (`*.use-case.ts`, `*.repository.ts`,
  `*.gateway.ts`, `*.mapper.ts`, `*.store.ts`).
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/)
  (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`...).
- **Estilo:** Prettier (`.prettierrc.json`, com `prettier-plugin-tailwindcss`) e ESLint
  (`eslint-config-expo` + `eslint-config-prettier`). Fim de linha LF (`.gitattributes`).

## Pendências de configuração

- **Testes:** Jest, `jest-expo` e Testing Library estão instalados, mas faltam o script
  `test` e a configuração do Jest.
- **`.env.example`:** referenciado em `src/core/env.ts`, mas ainda não existe. Use o bloco da
  seção [Conectando à API e ao Firebase](#conectando-à-api-e-ao-firebase) como base.
- **Identidade visual:** nome, ícones e splash em `app.json` ainda são os padrões do template.

## Licença

O `LICENSE` atual é o do template do Expo (MIT, 650 Industries) e precisa ser atualizado com os
autores do projeto.
