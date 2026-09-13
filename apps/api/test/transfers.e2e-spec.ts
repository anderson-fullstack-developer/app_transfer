import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { createTestApp, closeTestApp, type TestApp } from './utils/test-app';
import { createStudent, createQuoteFor, registerUser } from './utils/fixtures';

describe('Transfers (e2e)', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  afterAll(async () => {
    await closeTestApp(testApp);
  });

  it('exige o header Idempotency-Key (422)', async () => {
    const student = await createStudent(testApp.app);
    const sender = await registerUser(testApp.app, 'SENDER');
    const quote = await createQuoteFor(testApp.app, sender, student.username);

    await request(testApp.app.getHttpServer())
      .post('/api/v1/transfers')
      .set('Authorization', `Bearer ${sender.accessToken}`)
      .send({ quoteId: quote.id })
      .expect(422);
  });

  it('cria a transferencia e avanca sozinha ate SENT_TO_PROVIDER (modo SIMULATION)', async () => {
    const student = await createStudent(testApp.app);
    const sender = await registerUser(testApp.app, 'SENDER');
    const quote = await createQuoteFor(testApp.app, sender, student.username);

    const res = await request(testApp.app.getHttpServer())
      .post('/api/v1/transfers')
      .set('Authorization', `Bearer ${sender.accessToken}`)
      .set('Idempotency-Key', randomUUID())
      .send({ quoteId: quote.id })
      .expect(201);

    expect(res.body.status).toBe('SENT_TO_PROVIDER');
    expect(res.body.reference).toMatch(/^TRF-/);
    // Historico completo: CREATED + as transicoes ate SENT_TO_PROVIDER.
    expect(res.body.events.length).toBeGreaterThanOrEqual(5);
    expect(res.body.events[0].eventType).toBe('CREATED');
  });

  it('idempotencia: repetir a mesma Idempotency-Key devolve a MESMA transferencia (sem duplicar)', async () => {
    const student = await createStudent(testApp.app);
    const sender = await registerUser(testApp.app, 'SENDER');
    const quote = await createQuoteFor(testApp.app, sender, student.username);
    const key = randomUUID();

    const first = await request(testApp.app.getHttpServer())
      .post('/api/v1/transfers')
      .set('Authorization', `Bearer ${sender.accessToken}`)
      .set('Idempotency-Key', key)
      .send({ quoteId: quote.id })
      .expect(201);

    const second = await request(testApp.app.getHttpServer())
      .post('/api/v1/transfers')
      .set('Authorization', `Bearer ${sender.accessToken}`)
      .set('Idempotency-Key', key)
      .send({ quoteId: quote.id })
      .expect(201);

    expect(second.body.reference).toBe(first.body.reference);

    const list = await request(testApp.app.getHttpServer())
      .get('/api/v1/transfers')
      .set('Authorization', `Bearer ${sender.accessToken}`)
      .expect(200);
    expect(list.body).toHaveLength(1);
  });

  it('idempotencia: a mesma key com um pedido DIFERENTE e 409 (conflito)', async () => {
    const student = await createStudent(testApp.app);
    const sender = await registerUser(testApp.app, 'SENDER');
    const quoteA = await createQuoteFor(testApp.app, sender, student.username, '50');
    const quoteB = await createQuoteFor(testApp.app, sender, student.username, '60');
    const key = randomUUID();

    await request(testApp.app.getHttpServer())
      .post('/api/v1/transfers')
      .set('Authorization', `Bearer ${sender.accessToken}`)
      .set('Idempotency-Key', key)
      .send({ quoteId: quoteA.id })
      .expect(201);

    const res = await request(testApp.app.getHttpServer())
      .post('/api/v1/transfers')
      .set('Authorization', `Bearer ${sender.accessToken}`)
      .set('Idempotency-Key', key)
      .send({ quoteId: quoteB.id })
      .expect(409);
    expect(res.body.error.code).toBe('IDEMPOTENCY_KEY_CONFLICT');
  });

  it('RBAC: um STUDENT nao pode criar transferencias (403)', async () => {
    const student = await createStudent(testApp.app);
    await request(testApp.app.getHttpServer())
      .post('/api/v1/transfers')
      .set('Authorization', `Bearer ${student.accessToken}`)
      .set('Idempotency-Key', randomUUID())
      .send({ quoteId: '00000000-0000-0000-0000-000000000000' })
      .expect(403);
  });

  it('IDOR: outro utilizador nao consegue ver a transferencia por referencia (404)', async () => {
    const student = await createStudent(testApp.app);
    const sender = await registerUser(testApp.app, 'SENDER');
    const intruder = await registerUser(testApp.app, 'SENDER');
    const quote = await createQuoteFor(testApp.app, sender, student.username);

    const created = await request(testApp.app.getHttpServer())
      .post('/api/v1/transfers')
      .set('Authorization', `Bearer ${sender.accessToken}`)
      .set('Idempotency-Key', randomUUID())
      .send({ quoteId: quote.id })
      .expect(201);

    await request(testApp.app.getHttpServer())
      .get(`/api/v1/transfers/${created.body.reference}`)
      .set('Authorization', `Bearer ${intruder.accessToken}`)
      .expect(404);

    // O estudante destinatario (a outra parte legitima) consegue ver.
    await request(testApp.app.getHttpServer())
      .get(`/api/v1/transfers/${created.body.reference}`)
      .set('Authorization', `Bearer ${student.accessToken}`)
      .expect(200);
  });

  it('fluxo E2E completo: registo -> quote -> transferencia -> DELIVERED', async () => {
    // student registration
    const student = await createStudent(testApp.app);
    // sender registration
    const sender = await registerUser(testApp.app, 'SENDER');
    // sender procura @student (pesquisa publica autenticada)
    const search = await request(testApp.app.getHttpServer())
      .get(`/api/v1/students/by-username/${student.username}`)
      .set('Authorization', `Bearer ${sender.accessToken}`)
      .expect(200);
    expect(search.body.username).toBe(`@${student.username}`);

    // cria quote
    const quote = await createQuoteFor(testApp.app, sender, student.username, '100');

    // confirma transferencia
    const transfer = await request(testApp.app.getHttpServer())
      .post('/api/v1/transfers')
      .set('Authorization', `Bearer ${sender.accessToken}`)
      .set('Idempotency-Key', randomUUID())
      .send({ quoteId: quote.id })
      .expect(201);
    expect(transfer.body.status).toBe('SENT_TO_PROVIDER');

    // mock provider processa (avanco manual, so existe em dev/teste)
    const advanced = await request(testApp.app.getHttpServer())
      .post(`/api/v1/dev/mock/transfers/${transfer.body.reference}/advance`)
      .set('Authorization', `Bearer ${sender.accessToken}`)
      .expect(201);

    // transfer chega a DELIVERED
    expect(advanced.body.status).toBe('DELIVERED');
    expect(advanced.body.completedAt).not.toBeNull();

    const finalState = await request(testApp.app.getHttpServer())
      .get(`/api/v1/transfers/${transfer.body.reference}`)
      .set('Authorization', `Bearer ${student.accessToken}`)
      .expect(200);
    expect(finalState.body.status).toBe('DELIVERED');
  });
});
