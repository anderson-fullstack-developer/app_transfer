# app-transfer

Plataforma web para **estudantes são-tomenses em Marrocos** receberem apoio
financeiro das suas famílias de forma simples, rastreável e segura.

> **Modo `SIMULATION`.** Nesta versão nenhuma transferência representa dinheiro
> real. Toda a movimentação passa por um `MockPaymentProvider`. A arquitetura
> está preparada para integrar futuramente um parceiro financeiro autorizado
> (Wise / Nium / Thunes) **sem alterar o domínio**.

## Objetivo

Cada estudante cria conta e escolhe um `@username`. Um familiar pesquisa esse
`@username`, confirma a pessoa, escolhe um valor em EUR, vê a cotação EUR → MAD
(taxa + valor final), confirma e acompanha o estado. Ambos consultam o histórico.

## Arquitetura

**Modular Monolith** (não microserviços) com fronteiras claras para permitir
separar serviços no futuro. Princípios: Clean Architecture onde faz sentido,
SOLID, separation of concerns, dependency inversion, repository/service/provider
patterns, idempotência e auditabilidade.

```text
/apps
  /web    Next.js (App Router) + Tailwind + shadcn/ui + React Hook Form + Zod + TanStack Query
  /api    NestJS + REST + Swagger + Prisma + PostgreSQL

/packages
  /database          schema Prisma, migrations, seed, cliente
  /shared            domínio partilhado: enums, erros, money-safe math, @username, state machine
  /config            validação e tipagem de variáveis de ambiente (Zod)
  /ui                componentes React partilhados (shadcn/ui) + tema
  /eslint-config     configuração ESLint partilhada (flat config)
  /typescript-config tsconfig base para Node, NestJS e Next.js
```

Detalhe em [`docs/architecture.md`](docs/architecture.md).

## Stack

| Camada      | Tecnologias                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| Frontend    | Next.js 15, React 19, TypeScript strict, Tailwind CSS, shadcn/ui, React Hook Form, Zod, TanStack Query |
| Backend     | Node.js, NestJS 11, TypeScript strict, REST, Swagger/OpenAPI, Prisma 6, PostgreSQL 16                  |
| Infra local | Docker Compose (PostgreSQL + Redis)                                                                    |
| Monorepo    | pnpm workspaces + Turborepo                                                                            |
| Testes      | Vitest (pacotes/web), Jest (API: unitários + integração/E2E com Supertest)                             |
| Qualidade   | ESLint 9, Prettier, TypeScript strict, CI (GitHub Actions)                                             |

## Pré-requisitos

- Node.js >= 20 (recomendado 22 — ver `.nvmrc`)
- pnpm >= 9 (`npm i -g pnpm`)
- Uma base de dados PostgreSQL — **[Neon](https://neon.tech)** (cloud, grátis) ou
  Docker local (`docker compose up -d`)

## Instalação

```bash
pnpm install
cp .env.example .env    # depois edita DATABASE_URL / DIRECT_URL (ver abaixo)
pnpm db:migrate         # cria as tabelas
pnpm db:seed            # cria as contas de exemplo
pnpm dev                # web + api em paralelo
```

### Base de dados

- **Neon:** cria um projeto, copia a connection string para `DATABASE_URL`
  (a _pooled_) e para `DIRECT_URL` a ligação direta (o mesmo host sem `-pooler`).
- **Docker:** `docker compose up -d` e usa
  `postgresql://app:app@localhost:5432/app_transfer` nas duas variáveis.

> No Windows, pára o `pnpm dev` antes de correr `pnpm db:migrate` / `db:generate`
> — o processo da API mantém o motor do Prisma aberto e o `generate` falha com `EPERM`.

### Testes

```bash
pnpm test          # unitários (packages/shared, packages/config) + Jest (apps/api)
pnpm test:e2e       # integração/E2E (apps/api/test/*.e2e-spec.ts), contra uma BD REAL
```

Os testes de integração fazem pedidos HTTP reais (Supertest) contra a app NestJS
completa — guards, pipes e tudo — e apagam a base de dados toda antes de cada
ficheiro (`TRUNCATE ... CASCADE`). Por isso **precisam de uma BD dedicada**,
nunca a de desenvolvimento:

```env
# .env — um branch Neon a parte (Create Branch → "Branch schema only" →
# Auto-delete "Never"), ou outra BD Docker/Postgres local.
TEST_DATABASE_URL=postgresql://...
```

Depois de criar essa BD, aplica as migrations lá (uma vez, ou sempre que o
schema mudar):

```bash
DATABASE_URL=<TEST_DATABASE_URL> DIRECT_URL=<ligacao direta ao mesmo branch> \
  pnpm --filter @app/database exec prisma migrate deploy
```

Sem `TEST_DATABASE_URL` definida, `pnpm test:e2e` recusa-se a arrancar (em vez
de correr contra `DATABASE_URL` por engano).

### Contas de exemplo (só desenvolvimento)

| Email                  | Password        | Papel                          |
| ---------------------- | --------------- | ------------------------------ |
| `admin@example.test`   | `Admin!12345`   | ADMIN                          |
| `sender@example.test`  | `Sender!12345`  | SENDER (Maria)                 |
| `student@example.test` | `Student!12345` | STUDENT · `@carlos` (Rabat)    |
| `joao@example.test`    | `Student!12345` | STUDENT · `@joao` (Casablanca) |

- Web: <http://localhost:3000>
- API: <http://localhost:4000/api/v1>
- Swagger: <http://localhost:4000/docs>
- Health: <http://localhost:4000/api/v1/health>

## Comandos

| Comando                               | Descrição                                  |
| ------------------------------------- | ------------------------------------------ |
| `pnpm dev`                            | Arranca `web` + `api` em modo watch        |
| `pnpm build`                          | Build de todos os pacotes/apps (Turborepo) |
| `pnpm lint`                           | ESLint em todo o monorepo                  |
| `pnpm typecheck`                      | `tsc --noEmit` em todo o monorepo          |
| `pnpm test`                           | Testes unitários                                                  |
| `pnpm test:e2e`                       | Integração/E2E da API (precisa de `TEST_DATABASE_URL`, ver acima) |
| `pnpm format`                         | Formata com Prettier                       |
| `pnpm db:migrate`                     | `prisma migrate dev`                       |
| `pnpm db:seed`                        | Popula a base de dados de desenvolvimento  |
| `pnpm db:studio`                      | Abre o Prisma Studio                       |
| `pnpm docker:up` / `pnpm docker:down` | Sobe / pára a infra local                  |

## Estrutura do projeto

Ver [`docs/architecture.md`](docs/architecture.md) para o mapa completo de
módulos e as regras de dependência entre camadas.

## Documentação

| Documento                                      | Conteúdo                                                       |
| ---------------------------------------------- | -------------------------------------------------------------- |
| [`docs/architecture.md`](docs/architecture.md) | Camadas, módulos, regras de dependência                        |
| [`docs/domain.md`](docs/domain.md)             | Entidades, invariantes de negócio, enums                       |
| [`docs/transfers.md`](docs/transfers.md)       | Ciclo de vida da transferência, state machine, idempotência    |
| [`docs/providers.md`](docs/providers.md)       | Abstração de provider e como trocar Mock → Wise/Nium/Thunes    |
| [`docs/security.md`](docs/security.md)         | Autenticação, RBAC, rate limiting, IDOR, decisões de segurança |
| [`docs/privacy.md`](docs/privacy.md)           | Data minimization, dados pessoais, notas GDPR                  |
| [`docs/api.md`](docs/api.md)                   | Endpoints, formato de erro, exemplos                           |
| [`docs/deployment.md`](docs/deployment.md)     | Deploy: Vercel (web) + Railway (api) + Neon (BD)               |

## Estado de implementação

| Fase  | Descrição                                                            | Estado |
| ----- | -------------------------------------------------------------------- | ------ |
| 1     | Monorepo + configuração + base partilhada                            | ✅     |
| 2     | Prisma schema + migrations + seeds                                   | ✅     |
| 3     | Auth + roles + segurança base (login com Google: opcional, pendente) | ✅     |
| 4     | Onboarding do estudante + `@username`                                | ✅     |
| 5     | Pesquisa de estudante pelo remetente + onboarding do sender          | ✅     |
| 6     | Cotação (Quote) + abstração de PaymentProvider + MockPaymentProvider | ✅     |
| 7     | Transfer + state machine + idempotência                              | ✅     |
| 8     | Beneficiários favoritos                                              | ✅     |
| 9     | Notificações in-app                                                  | ✅     |
| 10    | Admin (dashboard, utilizadores, transferências, filtros)             | ✅     |
| 11    | Testes de integração/E2E (register→login→quote→transfer→DELIVERED, IDOR, idempotência, RBAC) | ✅     |
| 12–13 | Revisão de segurança, docs/CI                                        | ⏳     |

Ordem detalhada em `documentatio.md` (secções 41–42).
