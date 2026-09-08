# Arquitetura

## Princípio

**Modular Monolith.** Uma única aplicação implantável, dividida em módulos com
fronteiras explícitas. Não usamos microserviços, mas o código é organizado para
que um módulo possa ser extraído para um serviço próprio no futuro sem reescrita.

Evitamos: lógica de negócio em componentes React, lógica financeira em
controllers, dependência direta de SDKs de provider, valores monetários em
`float`, componentes gigantes, APIs sem validação, secrets hardcoded.

## Camadas (backend)

```
HTTP (controllers, DTOs, guards)
        │  só traduz pedidos/respostas; não tem regras de negócio
        ▼
Application (services, casos de uso)
        │  orquestra o domínio; transações; idempotência
        ▼
Domain (entidades, value objects, regras, state machine)
        │  puro; sem framework; sem I/O
        ▼
Infrastructure (repositories Prisma, payment providers, email, redis)
           implementa interfaces definidas pelo domínio/aplicação
```

**Regra de dependência:** as setas apontam sempre para dentro. O domínio nunca
importa Prisma, NestJS, nem SDKs de provider. A infraestrutura implementa as
interfaces que o domínio declara (dependency inversion).

## Pacotes partilhados

| Pacote                                         | Responsabilidade                                                                                                                                       | Pode depender de                           |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------ |
| `@app/shared`                                  | Enums de domínio, `AppError` + códigos, matemática monetária (`Money`), regras de `@username`, state machine de transferências, gerador de referências | nada de framework (só `zod`, `decimal.js`) |
| `@app/config`                                  | Schema e validação de variáveis de ambiente                                                                                                            | `zod`                                      |
| `@app/database`                                | Schema Prisma, migrations, seed, `PrismaClient`                                                                                                        | `@prisma/client`                           |
| `@app/ui`                                      | Componentes React partilhados + tema                                                                                                                   | `react`, Tailwind                          |
| `@app/eslint-config`, `@app/typescript-config` | Tooling                                                                                                                                                | —                                          |

`apps/api` e `apps/web` dependem de `@app/shared`; nunca o contrário.

## Módulos de domínio (a implementar)

`auth` · `users` · `students` · `senders` · `quotes` · `transfers` ·
`payments` (abstração de provider) · `notifications` · `webhooks` · `admin` ·
`audit`.

Cada módulo NestJS expõe apenas o seu `*.service.ts` a outros módulos; os
repositórios e detalhes ficam privados ao módulo.

## Fluxo de uma transferência (resumo)

`Sender → pesquisa @student → confirma → insere EUR → cria Quote →
revê EUR/taxa/MAD → confirma → cria Transfer → MockPaymentProvider → tracking`

Detalhe em [`transfers.md`](transfers.md).
