import request from 'supertest';
import { createTestApp, closeTestApp, type TestApp } from './utils/test-app';
import { createStudent, registerUser } from './utils/fixtures';

describe('Quotes (e2e)', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  afterAll(async () => {
    await closeTestApp(testApp);
  });

  it('calcula a cotacao EUR->MAD com a mesma formula do dominio partilhado', async () => {
    const student = await createStudent(testApp.app);
    const sender = await registerUser(testApp.app, 'SENDER');

    const res = await request(testApp.app.getHttpServer())
      .post('/api/v1/quotes')
      .set('Authorization', `Bearer ${sender.accessToken}`)
      .send({ studentUsername: student.username, amount: '50' })
      .expect(201);

    // .env de testes: MOCK_EUR_MAD_RATE=10.85, fee=2%, fee fixa=0.
    expect(res.body.sourceAmountMinor).toBe('5000');
    expect(res.body.feeAmountMinor).toBe('100');
    expect(res.body.totalChargedMinor).toBe('5100');
    expect(res.body.destinationAmountMinor).toBe('54250');
    expect(res.body.exchangeRate).toBe('10.85');
    expect(res.body.status).toBe('ACTIVE');
    expect(res.body.student.username).toBe(`@${student.username}`);
  });

  it('RBAC: um STUDENT nao pode criar cotacoes (403)', async () => {
    const student = await createStudent(testApp.app);
    await request(testApp.app.getHttpServer())
      .post('/api/v1/quotes')
      .set('Authorization', `Bearer ${student.accessToken}`)
      .send({ studentUsername: student.username, amount: '50' })
      .expect(403);
  });

  it('devolve 404 quando o @username nao existe', async () => {
    const sender = await registerUser(testApp.app, 'SENDER');
    await request(testApp.app.getHttpServer())
      .post('/api/v1/quotes')
      .set('Authorization', `Bearer ${sender.accessToken}`)
      .send({ studentUsername: 'naoexisteninguem', amount: '50' })
      .expect(404);
  });

  it('rejeita um valor fora do intervalo permitido (422)', async () => {
    const student = await createStudent(testApp.app);
    const sender = await registerUser(testApp.app, 'SENDER');
    await request(testApp.app.getHttpServer())
      .post('/api/v1/quotes')
      .set('Authorization', `Bearer ${sender.accessToken}`)
      .send({ studentUsername: student.username, amount: '999999' })
      .expect(422);
  });

  it('IDOR: outro SENDER nao consegue ler a cotacao de alguem (404, nao 403)', async () => {
    const student = await createStudent(testApp.app);
    const owner = await registerUser(testApp.app, 'SENDER');
    const intruder = await registerUser(testApp.app, 'SENDER');

    const created = await request(testApp.app.getHttpServer())
      .post('/api/v1/quotes')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ studentUsername: student.username, amount: '50' })
      .expect(201);

    await request(testApp.app.getHttpServer())
      .get(`/api/v1/quotes/${created.body.id}`)
      .set('Authorization', `Bearer ${intruder.accessToken}`)
      .expect(404);

    // O dono continua a conseguir.
    await request(testApp.app.getHttpServer())
      .get(`/api/v1/quotes/${created.body.id}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
  });
});
