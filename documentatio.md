Quero que atuues como **Senior Full-Stack Engineer, Software Architect e Product Engineer** e construas comigo uma aplicação web production-ready, escalável e segura.

Não quero apenas um protótipo visual. Quero uma base de código profissional, organizada e preparada para crescer.

## 1. VISÃO DO PRODUTO

Estamos a construir uma plataforma web focada inicialmente em estudantes são-tomenses que estudam em Marrocos e recebem apoio financeiro das suas famílias.

Atualmente muitas famílias usam processos informais envolvendo MB WAY e intermediários para fazer o dinheiro chegar aos estudantes.

A aplicação deve tornar esse processo simples, rastreável e seguro.

O conceito central é:

- cada estudante cria uma conta;
- cada estudante recebe/escolhe um identificador único no formato `@username`;
- um familiar cria conta;
- pesquisa diretamente o `@username`;
- confirma que encontrou a pessoa certa;
- escolhe quanto pretende enviar em EUR;
- vê uma cotação EUR → MAD;
- vê taxa e valor final que o estudante receberá;
- confirma a operação;
- acompanha o estado da transferência;
- o estudante recebe uma notificação;
- ambos conseguem consultar o histórico.

IMPORTANTE:

Nesta primeira versão NÃO vamos movimentar dinheiro real.

Implementar inicialmente um `MockPaymentProvider`.

A arquitetura deve permitir futuramente integrar provedores como:

- Wise Platform;
- Nium;
- Thunes;
- outro provider financeiro autorizado.

A aplicação nunca deve depender diretamente de um provider específico.

Criar abstrações para que possamos trocar o provider sem alterar a lógica principal da aplicação.

---

# 2. PRINCÍPIO DE ARQUITETURA

Quero começar como um **Modular Monolith**, não microservices.

Mas o código deve possuir fronteiras claras para permitir separar serviços no futuro caso seja necessário.

Evitar:

- spaghetti code;
- lógica de negócio dentro de componentes React;
- lógica financeira diretamente nas controllers;
- dependência direta de Wise/Nium/etc;
- valores monetários usando `float`;
- duplicação;
- componentes gigantes;
- APIs sem validação;
- secrets hardcoded;
- arquitetura excessivamente complicada sem necessidade.

Aplicar princípios:

- Clean Architecture quando fizer sentido;
- SOLID;
- separation of concerns;
- dependency inversion;
- domain-driven module boundaries;
- repository/service/provider patterns;
- idempotency;
- auditabilidade.

---

# 3. STACK

Criar um monorepo utilizando:

- pnpm workspaces;
- Turborepo.

Estrutura inicial:

```text
/apps
  /web
  /api

/packages
  /database
  /shared
  /config
  /ui
  /eslint-config
  /typescript-config
```

## Frontend

Usar:

- Next.js;
- TypeScript em modo strict;
- App Router;
- React;
- Tailwind CSS;
- shadcn/ui;
- React Hook Form;
- Zod;
- TanStack Query quando fizer sentido.

Utilizar sempre versões stable e compatíveis das bibliotecas.

Não usar versões beta/canary.

## Backend

Usar:

- Node.js;
- NestJS;
- TypeScript strict;
- REST API;
- Swagger/OpenAPI;
- Zod ou class-validator para validação;
- Prisma ORM;
- PostgreSQL.

## Infra local

Usar Docker Compose para:

- PostgreSQL;
- Redis.

Redis será utilizado inicialmente para:

- rate limiting;
- cache quando necessário;
- estrutura futura para jobs.

Se precisarmos de jobs assíncronos, preparar arquitetura para BullMQ.

Não adicionar infraestrutura que ainda não tenha uso real.

---

# 4. AUTENTICAÇÃO

Precisamos de autenticação segura.

Roles:

```text
STUDENT
SENDER
ADMIN
```

Um utilizador comum não pode ser ADMIN através do frontend.

Criar:

- registo;
- login;
- logout;
- refresh/session;
- recuperação de password;
- verificação de email;
- proteção de rotas;
- RBAC no backend.

Passwords:

- nunca armazenar em texto;
- usar hashing seguro;
- proteger contra brute force.

Tokens/cookies devem seguir práticas seguras.

Quando possível usar:

- httpOnly;
- secure;
- sameSite adequado.

Não guardar access tokens sensíveis em `localStorage`.

---

# 5. ONBOARDING

No registo, perguntar:

```text
Como pretende utilizar a plataforma?

[ Sou estudante ]
[ Quero enviar dinheiro ]
```

## Student

Depois do registo:

```text
Nome completo
Data de nascimento
País
Cidade onde estuda
Universidade
Telefone
@username
```

O estudante deve escolher um username.

Exemplo:

```text
@carlos
@manuel.silva
@joao23
```

Regras:

- único;
- case insensitive;
- armazenar versão normalizada;
- entre aproximadamente 3 e 30 caracteres;
- permitir letras, números, `_` e `.`;
- não permitir espaços;
- não permitir usernames reservados.

Criar lista de usernames reservados como:

```text
admin
administrator
support
help
api
payments
transfer
transfers
settings
login
register
root
system
```

O backend deve ser a fonte definitiva para verificar disponibilidade.

Nunca confiar apenas na validação do frontend.

---

# 6. PESQUISA POR @USERNAME

Esta funcionalidade é central.

O familiar deve poder escrever:

```text
@carlos
```

A API procura o estudante pelo username normalizado.

Endpoint conceptual:

```text
GET /students/by-username/:username
```

Retornar apenas dados públicos necessários:

```json
{
  "username": "@carlos",
  "displayName": "Carlos Manuel",
  "city": "Rabat",
  "country": "Morocco",
  "verified": true
}
```

NUNCA retornar através desta API:

- email;
- telefone;
- documentos;
- data de nascimento;
- dados bancários;
- informações KYC;
- IDs internos sensíveis.

Por privacidade, não criar inicialmente uma listagem pública de todos os estudantes.

A pesquisa deve funcionar principalmente quando o familiar já sabe o `@username`.

Aplicar rate limiting para impedir enumeração massiva de contas.

---

# 7. PERFIL DO ESTUDANTE

Exemplo visual:

```text
Carlos Manuel

@carlos

Rabat, Marrocos

✓ Estudante verificado

[ Enviar dinheiro ]
```

No futuro teremos KYC real.

Agora criar estados:

```text
NOT_STARTED
PENDING
VERIFIED
REJECTED
```

Não construir KYC real agora.

Criar apenas a arquitetura/interface necessária.

Exemplo:

```typescript
interface KycProvider {
  startVerification(userId: string): Promise<KycSession>;
  getStatus(userId: string): Promise<KycStatus>;
}
```

Criar inicialmente:

```text
MockKycProvider
```

---

# 8. SISTEMA DE QUOTES

Antes de enviar dinheiro, criar uma Quote.

Exemplo:

```text
Quero enviar

100 EUR

Taxa
2 EUR

Taxa de câmbio
1 EUR = XX MAD

Estudante recebe
XXXX MAD
```

Criar entidade `Quote`.

Quote deve ter:

```text
id
senderId
studentId
sourceCurrency
destinationCurrency
sourceAmount
feeAmount
exchangeRate
destinationAmount
provider
expiresAt
createdAt
```

Valores monetários:

NUNCA usar JavaScript float para representar dinheiro.

Usar:

- minor units inteiros quando possível;
- ou Decimal para exchange rates.

Exemplo:

```text
100 EUR = 10000 cents
```

A quote deve expirar.

Exemplo:

```text
expiresAt = createdAt + 10 minutos
```

Não permitir criar transferência com quote expirada.

---

# 9. PAYMENT PROVIDER ABSTRACTION

Criar uma interface central.

Algo semelhante a:

```typescript
interface PaymentProvider {
  createQuote(input: CreateQuoteInput): Promise<ProviderQuote>;

  createTransfer(input: CreateTransferInput): Promise<ProviderTransfer>;

  getTransferStatus(providerTransferId: string): Promise<TransferStatus>;

  cancelTransfer?(providerTransferId: string): Promise<void>;
}
```

Criar:

```text
MockPaymentProvider
```

Neste momento, ele deve simular:

```text
EUR → MAD
```

Não utilizar uma API financeira real.

Configurar taxa simulada através de configuração/env.

Exemplo conceptual:

```env
MOCK_EUR_MAD_RATE=
MOCK_TRANSFER_FEE_PERCENT=
```

Não hardcodar regras financeiras espalhadas pelo código.

---

# 10. TRANSFERÊNCIA

Fluxo:

```text
Sender
   ↓
Pesquisa @student
   ↓
Confirma estudante
   ↓
Insere EUR
   ↓
Criar Quote
   ↓
Mostrar EUR / taxa / MAD
   ↓
Confirmar
   ↓
Create Transfer
   ↓
MockPaymentProvider
   ↓
Transfer criada
```

Transfer deve ter estado.

Utilizar uma state machine explícita.

Estados sugeridos:

```text
DRAFT
AWAITING_PAYMENT
PAYMENT_PROCESSING
PAID
PROCESSING
SENT_TO_PROVIDER
DELIVERED
FAILED
CANCELLED
REFUNDED
```

Não permitir transições arbitrárias.

Exemplo:

```text
DRAFT
  ↓
AWAITING_PAYMENT
  ↓
PAYMENT_PROCESSING
  ↓
PAID
  ↓
PROCESSING
  ↓
SENT_TO_PROVIDER
  ↓
DELIVERED
```

Falha:

```text
PAYMENT_PROCESSING
  ↓
FAILED
```

Criar serviço específico para controlar transições.

Exemplo:

```text
TransferStateService
```

---

# 11. IDEMPOTÊNCIA

Isso é extremamente importante.

Criar transferências deve suportar `Idempotency-Key`.

Exemplo:

```text
POST /transfers
Idempotency-Key: uuid
```

Se o cliente repetir a request por causa de timeout:

NÃO criar duas transferências.

Implementar estratégia persistente de idempotência.

---

# 12. MODELO DE DADOS

Começar com aproximadamente estas entidades:

```text
User
StudentProfile
SenderProfile
Quote
Transfer
TransferEvent
PaymentAttempt
FavoriteBeneficiary
KycVerification
Notification
AuditLog
IdempotencyKey
```

## User

```text
id UUID
email
passwordHash
role
emailVerified
status
createdAt
updatedAt
```

## StudentProfile

```text
id
userId
username
usernameNormalized
displayName
country
city
university
kycStatus
createdAt
updatedAt
```

Adicionar unique index para:

```text
usernameNormalized
```

## Transfer

```text
id
reference
senderId
studentId
quoteId
sourceCurrency
destinationCurrency
sourceAmountMinor
feeAmountMinor
destinationAmountMinor
exchangeRate
status
provider
providerTransferId nullable
createdAt
updatedAt
completedAt nullable
```

Criar referência pública amigável:

```text
TRF-XXXXXXXX
```

Não utilizar IDs incrementais publicamente.

## TransferEvent

Guardar histórico imutável:

```text
id
transferId
previousStatus
newStatus
eventType
metadata
createdAt
```

Nunca apagar eventos financeiros.

---

# 13. AUDIT LOG

Criar audit log para operações importantes.

Exemplos:

```text
USER_LOGIN
USER_REGISTERED
USERNAME_CHANGED
QUOTE_CREATED
TRANSFER_CREATED
TRANSFER_STATUS_CHANGED
ADMIN_USER_VIEWED
KYC_STATUS_CHANGED
```

Guardar:

```text
actorId
action
entityType
entityId
metadata
ip
userAgent
createdAt
```

Nunca guardar passwords, tokens ou documentos completos dentro de logs.

---

# 14. API

Criar API REST organizada e versionada.

Prefix:

```text
/api/v1
```

Endpoints iniciais:

## Auth

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/refresh
GET  /api/v1/auth/me
```

## Students

```text
GET   /api/v1/students/by-username/:username
GET   /api/v1/students/me
PATCH /api/v1/students/me
GET   /api/v1/students/username/:username/availability
```

## Quotes

```text
POST /api/v1/quotes
GET  /api/v1/quotes/:id
```

## Transfers

```text
POST /api/v1/transfers
GET  /api/v1/transfers
GET  /api/v1/transfers/:reference
```

## Favorites

```text
GET    /api/v1/favorites
POST   /api/v1/favorites
DELETE /api/v1/favorites/:id
```

## Notifications

```text
GET   /api/v1/notifications
PATCH /api/v1/notifications/:id/read
```

## Admin

```text
GET /api/v1/admin/users
GET /api/v1/admin/transfers
GET /api/v1/admin/transfers/:reference
GET /api/v1/admin/stats
```

ADMIN endpoints obrigatoriamente protegidos por RBAC backend.

---

# 15. WEBHOOKS

Preparar arquitetura de webhooks para providers futuros.

Endpoint:

```text
POST /api/v1/webhooks/payment/:provider
```

Criar:

```text
WebhookService
```

Cada provider deverá possuir:

```text
verifySignature()
parseEvent()
mapStatus()
```

Mesmo no Mock Provider, criar uma forma de simular eventos.

Por exemplo:

```text
POST /api/v1/dev/mock/transfers/:id/advance
```

Este endpoint só pode existir em desenvolvimento/teste.

NUNCA disponibilizá-lo em produção.

---

# 16. FRONTEND

Quero um design moderno de fintech.

Características:

- profissional;
- simples;
- mobile-first;
- responsivo;
- acessível;
- sem excesso de elementos;
- boas mensagens de erro;
- loading states;
- skeletons;
- empty states.

Idioma inicial:

```text
Português
```

Mas preparar estrutura para i18n futura:

```text
pt
en
fr
```

Não precisamos traduzir tudo agora, apenas evitar arquitetura que torne internacionalização difícil depois.

---

# 17. PÁGINAS

Criar:

```text
/
```

Landing page.

```text
/login
/register
/onboarding
```

Dashboard:

```text
/dashboard
```

Enviar:

```text
/send
```

Pesquisa:

```text
/send/@username
```

Quote:

```text
/send/@username/amount
```

Confirmação:

```text
/send/@username/review
```

Resultado:

```text
/transfers/:reference
```

Histórico:

```text
/transfers
```

Student:

```text
/profile
```

Settings:

```text
/settings
```

Admin:

```text
/admin
/admin/users
/admin/transfers
/admin/transfers/:reference
```

---

# 18. FLUXO PRINCIPAL DA UI

### Passo 1

```text
Para quem quer enviar dinheiro?

[ @username                       ]

[ Continuar ]
```

### Passo 2

```text
Encontrámos:

Carlos Manuel
@carlos

Rabat, Marrocos
✓ Verificado

[ Continuar ]
```

### Passo 3

```text
Quanto pretende enviar?

[ € 100,00 ]

Carlos receberá aproximadamente:

XXXX MAD

[ Continuar ]
```

### Passo 4

```text
Rever transferência

Para:
Carlos Manuel
@carlos

Envias:
100 EUR

Taxa:
2 EUR

Recebe:
XXXX MAD

[ Confirmar ]
```

### Passo 5

```text
Transferência criada

TRF-X8H29K

✓ Pedido criado
● Processando
○ Enviado
○ Recebido
```

---

# 19. DASHBOARD DO SENDER

Mostrar:

```text
Olá, Maria

[ Enviar dinheiro ]

Recentes

@carlos
100 EUR
Concluída

@joao
50 EUR
Processando
```

Adicionar:

```text
Beneficiários favoritos
Histórico
Notificações
```

---

# 20. DASHBOARD DO ESTUDANTE

Mostrar:

```text
Olá, Carlos

@carlos

Total recebido
XXXX MAD

Últimas transferências

Maria
100 EUR
XXXX MAD
Concluída
```

Não mostrar ao estudante informações financeiras privadas desnecessárias do remetente.

---

# 21. ADMIN DASHBOARD

Criar painel administrativo.

Cards:

```text
Utilizadores
Estudantes
Senders
Transferências
Volume EUR
Transferências pendentes
Falhadas
Concluídas
```

Tabela:

```text
Reference
Sender
Student
EUR
MAD
Provider
Status
Date
```

Filtros por:

```text
status
data
username
reference
```

Admin deve conseguir visualizar timeline:

```text
Transfer TRF-X8H29K

CREATED
↓
AWAITING_PAYMENT
↓
PAID
↓
PROCESSING
↓
DELIVERED
```

Não permitir que admin altere arbitrariamente valores financeiros através da UI.

---

# 22. NOTIFICAÇÕES

Criar arquitetura:

```text
NotificationService
```

Canais futuros:

```text
EMAIL
PUSH
SMS
WHATSAPP
```

Inicialmente implementar:

```text
IN_APP
EMAIL
```

Caso não configuremos email provider imediatamente, criar:

```text
ConsoleEmailProvider
```

Interface:

```typescript
interface EmailProvider {
  send(input: SendEmailInput): Promise<void>;
}
```

---

# 23. SEGURANÇA

Implementar desde o início:

- security headers;
- CORS configurado explicitamente;
- rate limiting;
- input validation;
- output sanitization quando necessário;
- proteção de autenticação;
- RBAC;
- secrets apenas em env;
- proteção contra mass assignment;
- UUIDs;
- logs seguros;
- timeout em serviços externos;
- retry apenas quando seguro;
- idempotência;
- validação de ownership.

Nunca confiar em:

```text
userId
senderId
role
studentId
amount
status
```

enviados pelo frontend sem verificação backend.

Evitar IDOR.

Exemplo:

Um utilizador só pode abrir:

```text
/transfers/:id
```

se for:

```text
sender da transferência
OU
student da transferência
OU
admin autorizado
```

---

# 24. PRIVACIDADE

Estamos a trabalhar com dados pessoais e futuramente financeiros.

Aplicar princípio de data minimization.

Nunca incluir informações sensíveis em respostas que não necessitam delas.

Preparar arquitetura pensando em GDPR.

Não implementar coisas juridicamente complexas sem necessidade, mas documentar em:

```text
docs/security.md
docs/privacy.md
```

as decisões tomadas.

---

# 25. ERROR HANDLING

Criar formato consistente:

```json
{
  "error": {
    "code": "USERNAME_NOT_FOUND",
    "message": "Não encontrámos nenhum estudante com esse username."
  }
}
```

Exemplos de códigos:

```text
USERNAME_TAKEN
USERNAME_NOT_FOUND
QUOTE_EXPIRED
INVALID_AMOUNT
TRANSFER_NOT_FOUND
INVALID_TRANSFER_STATE
UNAUTHORIZED
FORBIDDEN
RATE_LIMIT_EXCEEDED
PROVIDER_UNAVAILABLE
```

Não enviar stack traces para frontend em produção.

---

# 26. OBSERVABILIDADE

Criar logger estruturado.

Adicionar:

```text
requestId
userId quando aplicável
transferReference
provider
duration
```

Preparar arquitetura para futuramente adicionar:

- Sentry;
- OpenTelemetry;
- métricas.

Não colocar dados pessoais sensíveis nos logs.

---

# 27. TESTES

Quero testes reais.

Criar:

## Unit tests

Para:

```text
username normalization
money calculations
quote expiration
transfer state machine
provider abstraction
permissions
```

## Integration tests

Para:

```text
register
login
student search
quote creation
transfer creation
idempotency
RBAC
```

## E2E

Criar pelo menos o fluxo:

```text
student registration
↓
@student criado
↓
sender registration
↓
sender procura @student
↓
cria quote
↓
confirma transferência
↓
mock provider processa
↓
transfer chega a DELIVERED
```

Usar Playwright no frontend/E2E quando apropriado.

---

# 28. DATABASE

Criar migrations Prisma.

Adicionar:

- foreign keys;
- indexes;
- unique constraints;
- timestamps;
- soft delete apenas onde fizer realmente sentido.

Não utilizar soft delete automaticamente em entidades financeiras.

Transferências e eventos financeiros devem preservar histórico.

Criar seed.

Seed deve criar:

```text
admin@example.test
sender@example.test
student@example.test
```

E estudante:

```text
@carlos
```

Utilizar passwords apenas para ambiente de desenvolvimento e documentá-las.

Nunca permitir essas credenciais em produção.

---

# 29. DEV EXPERIENCE

Quero poder executar:

```bash
pnpm install
docker compose up -d
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Adicionar scripts apropriados.

Criar:

```text
.env.example
```

Nunca commitar `.env`.

---

# 30. DOCUMENTAÇÃO

Criar:

```text
README.md

docs/
  architecture.md
  domain.md
  transfers.md
  providers.md
  security.md
  privacy.md
  api.md
```

README deve explicar:

- objetivo;
- arquitetura;
- stack;
- instalação;
- ambiente;
- migrations;
- seeds;
- testes;
- comandos;
- estrutura do projeto.

`providers.md` deve explicar como substituir:

```text
MockPaymentProvider
```

por:

```text
WisePaymentProvider
NiumPaymentProvider
ThunesPaymentProvider
```

sem alterar o domínio.

---

# 31. FUTURO WISE / NIUM / THUNES

NÃO implementar integrações reais sem credenciais.

Mas preparar estrutura:

```text
/packages ou módulo providers

payment/
  payment-provider.interface.ts

  mock/
    mock-payment.provider.ts

  wise/
    wise-payment.provider.ts

  nium/
    nium-payment.provider.ts

  thunes/
    thunes-payment.provider.ts
```

Os providers reais podem inicialmente lançar:

```text
NotImplementedException
```

ou ficar apenas documentados.

O domínio nunca deve importar SDK de Wise diretamente.

A infraestrutura implementa a interface do domínio.

---

# 32. FEATURE FLAGS

Criar configuração para:

```text
PAYMENT_PROVIDER=mock
```

Futuramente:

```text
PAYMENT_PROVIDER=wise
PAYMENT_PROVIDER=nium
PAYMENT_PROVIDER=thunes
```

Não espalhar `if(provider === ...)` pela aplicação.

Usar factory/injection.

---

# 33. CI

Criar GitHub Actions.

Em PR/push executar:

```text
lint
typecheck
unit tests
integration tests
build
```

Não fazer deploy automaticamente sem configuração explícita.

---

# 34. CODE QUALITY

Configurar:

- ESLint;
- Prettier;
- TypeScript strict;
- Husky opcional apenas se trouxer valor;
- conventional commits opcional.

Não usar `any` sem justificação.

Não ignorar erros TypeScript.

Não resolver problemas usando:

```text
// @ts-ignore
```

salvo caso extremamente justificado e documentado.

---

# 35. ACCESSIBILITY

Implementar:

- labels;
- keyboard navigation;
- focus states;
- semantic HTML;
- aria quando necessário;
- contraste adequado.

---

# 36. RESPONSIVIDADE

A maior parte dos utilizadores provavelmente utilizará smartphone.

Construir mobile-first.

Testar:

```text
375px
768px
1024px+
```

A experiência de enviar dinheiro deve funcionar perfeitamente no telemóvel.

---

# 37. REGRAS IMPORTANTES DE NEGÓCIO

Implementar estas invariantes:

1. Username é único.
2. Sender não pode enviar dinheiro para estudante inexistente.
3. Quote tem validade limitada.
4. Quote expirada não cria transferência.
5. Valor mínimo e máximo devem vir de configuração.
6. Transfer não pode mudar arbitrariamente de status.
7. Transfer não pode ser duplicada por retry.
8. Valores financeiros nunca utilizam float.
9. Utilizador comum não consegue mudar o próprio role.
10. Provider não controla diretamente lógica do domínio.
11. Transfer events são append-only.
12. Dados privados do estudante nunca aparecem na pesquisa pública.
13. Admin actions relevantes devem ser auditadas.
14. Mock endpoints nunca ficam disponíveis em produção.

---

# 38. UX DE ERROS

Exemplos:

Username inexistente:

```text
Não encontrámos @joaosilva.

Confirma se o identificador está correto.
```

Quote expirada:

```text
Esta cotação expirou.

Atualizámos o valor para si.
```

Transfer falhou:

```text
Não foi possível concluir a transferência.

Nenhum novo envio foi criado automaticamente.
Tente novamente ou contacte o suporte.
```

Evitar mensagens técnicas para utilizadores.

---

# 39. NÃO FAZER AGORA

Não implementar:

- MB WAY real;
- Stripe para remessas;
- cartões diretamente;
- custódia de dinheiro;
- crypto;
- wallets internas com saldo real;
- Wise real;
- Nium real;
- Thunes real;
- microservices;
- Kubernetes;
- event sourcing completo;
- Kafka;
- blockchain.

Queremos uma arquitetura preparada para crescer sem overengineering.

---

# 40. PRIMEIRA RELEASE

A primeira release deve permitir:

### Student

```text
Register
↓
Escolher STUDENT
↓
Criar perfil
↓
Escolher @username
↓
Dashboard
```

### Sender

```text
Register
↓
Escolher SENDER
↓
Dashboard
↓
Enviar dinheiro
↓
Pesquisar @username
↓
Confirmar estudante
↓
Colocar EUR
↓
Criar quote simulada
↓
Confirmar
↓
Criar transferência
↓
Mock provider
↓
Tracking
```

### Student novamente

```text
Dashboard
↓
Ver transferência recebida
```

### Admin

```text
Login
↓
Dashboard
↓
Ver users
↓
Ver transfers
↓
Abrir timeline
```

---

# 41. FORMA DE TRABALHO

Antes de começar:

1. inspeciona o repositório atual;
2. não destruas código existente desnecessariamente;
3. identifica o que pode ser reutilizado;
4. cria um pequeno plano técnico;
5. depois começa a implementar.

Não fiques apenas a explicar o que faria.

QUERO QUE IMPLEMENTES.

Trabalha por fases pequenas e funcionais.

Depois de cada fase:

- correr lint;
- typecheck;
- testes relevantes;
- corrigir erros antes de continuar.

Não deixar dezenas de erros acumularem.

Se uma decisão menor estiver ambígua, escolhe uma solução profissional e documenta-a em vez de parar constantemente para perguntar.

Só pergunta quando existir um verdadeiro blocker que possa alterar significativamente o produto.

---

# 42. ORDEM DE IMPLEMENTAÇÃO

Seguir aproximadamente:

### Fase 1

Monorepo + configuração + Docker + PostgreSQL.

### Fase 2

Prisma schema + migrations + seeds.

### Fase 3

Auth + roles + security base.

### Fase 4

Student onboarding + `@username`.

### Fase 5

Sender onboarding + pesquisa de estudante.

### Fase 6

Quote domain + MockPaymentProvider.

### Fase 7

Transfer domain + state machine + idempotency.

### Fase 8

Dashboards.

### Fase 9

Notifications + transfer timeline.

### Fase 10

Admin.

### Fase 11

Tests.

### Fase 12

Security review.

### Fase 13

Documentation + Docker/CI polish.

---

# 43. CRITÉRIO DE QUALIDADE

Não considero a tarefa concluída apenas porque a UI funciona.

Quero:

```text
✓ TypeScript strict
✓ arquitetura modular
✓ database constraints
✓ validação backend
✓ auth
✓ RBAC
✓ idempotency
✓ money-safe calculations
✓ state machine
✓ audit logs
✓ testes
✓ tratamento de erros
✓ responsive
✓ documentação
✓ CI
✓ mock provider substituível
```

---

# 44. REGRA FINANCEIRA FUNDAMENTAL

Neste MVP nenhuma transferência representa dinheiro real.

Sempre deixar isso claro internamente.

Podemos usar:

```text
mode = SIMULATION
```

ou equivalente.

Nunca apresentar integrações simuladas como transferências bancárias reais.

A arquitetura deverá futuramente permitir:

```text
Family
   ↓
Our Platform
   ↓
Licensed Financial Provider
   ↓
EUR → MAD
   ↓
Student Bank Account
```

Nossa aplicação gere:

- experiência;
- identidade interna;
- @username;
- quote;
- transfer lifecycle;
- tracking;
- notificações;
- histórico.

O parceiro financeiro autorizado será responsável futuramente pelo movimento real dos fundos, KYC/AML aplicável, câmbio e payout.

---

Agora começa.

Primeiro:

1. inspeciona o estado atual do repositório;
2. mostra resumidamente a arquitetura que vais usar;
3. cria a estrutura inicial;
4. começa pela Fase 1;
5. continua implementando as fases de forma incremental;
6. não pares apenas depois de criar scaffolding se conseguires continuar;
7. deixa o projeto executável e documentado.
