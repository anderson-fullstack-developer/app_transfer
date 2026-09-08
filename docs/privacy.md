# Privacidade

Trabalhamos com dados pessoais e, no futuro, financeiros. Princípio central:
**data minimization**.

## Pesquisa pública de estudante

`GET /api/v1/students/by-username/:username` devolve **apenas**:

```json
{
  "username": "@carlos",
  "displayName": "Carlos Manuel",
  "city": "Rabat",
  "country": "Morocco",
  "verified": true
}
```

**Nunca** através desta API: email, telefone, documentos, data de nascimento,
dados bancários, informação KYC, IDs internos.

Não existe listagem pública de todos os estudantes. A pesquisa funciona quando o
familiar já sabe o `@username`. Rate limiting impede enumeração massiva.

## Dados recolhidos no onboarding

- Estudante: nome completo, data de nascimento, país, cidade, universidade,
  telefone, `@username`.
- Sender: nome (mínimo necessário para operar).

O estudante não vê dados financeiros privados desnecessários do remetente e
vice-versa.

## GDPR (preparação, sem implementar já)

- Base legal por finalidade a documentar quando houver processamento real.
- Estrutura pensada para permitir export e eliminação de dados de um utilizador
  — exceto registos financeiros, que têm de ser preservados por obrigação legal
  (retenção contabilística); nesses casos anonimiza-se em vez de apagar.
- Retenção: `TransferEvent` e `AuditLog` são append-only.

## Logs

Sem dados pessoais sensíveis nos logs (ver [`security.md`](security.md)).
