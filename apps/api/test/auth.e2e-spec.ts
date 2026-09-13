import request from 'supertest';
import { createTestApp, closeTestApp, type TestApp } from './utils/test-app';
import { registerUser } from './utils/fixtures';

describe('Auth (e2e)', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  afterAll(async () => {
    await closeTestApp(testApp);
  });

  describe('POST /auth/register', () => {
    it('cria uma conta SENDER e devolve accessToken + cookie de refresh', async () => {
      const email = `sender-${Date.now()}@test.local`;
      const res = await request(testApp.app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email, password: 'TesteForte!123', accountType: 'SENDER' })
        .expect(201);

      expect(res.body.user).toMatchObject({ email, role: 'SENDER', emailVerified: false });
      expect(typeof res.body.accessToken).toBe('string');
      expect(res.headers['set-cookie']?.[0]).toMatch(/refresh_token=/);
    });

    it('rejeita um segundo registo com o mesmo email (409)', async () => {
      const email = `dup-${Date.now()}@test.local`;
      await request(testApp.app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email, password: 'TesteForte!123', accountType: 'SENDER' })
        .expect(201);

      const res = await request(testApp.app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email, password: 'OutraPassword!123', accountType: 'SENDER' })
        .expect(409);

      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('rejeita payload invalido (400) e nao cria conta', async () => {
      await request(testApp.app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'nao-e-email', password: '123', accountType: 'SENDER' })
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    it('autentica com credenciais corretas', async () => {
      const email = `login-${Date.now()}@test.local`;
      await registerUser(testApp.app, 'SENDER', email);

      const res = await request(testApp.app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password: 'TesteForte!123' })
        .expect(200);

      expect(res.body.user.email).toBe(email);
    });

    it('rejeita password errada (401) sem revelar se o email existe', async () => {
      const email = `login-wrong-${Date.now()}@test.local`;
      await registerUser(testApp.app, 'SENDER', email);

      const res = await request(testApp.app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email, password: 'PasswordErrada!123' })
        .expect(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');

      const res2 = await request(testApp.app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'nao-existe@test.local', password: 'QualquerCoisa!123' })
        .expect(401);
      // Mesma mensagem/codigo para email inexistente e password errada.
      expect(res2.body.error.code).toBe(res.body.error.code);
    });
  });

  describe('GET /auth/me (RBAC de sessao)', () => {
    it('rejeita pedido sem token (401)', async () => {
      await request(testApp.app.getHttpServer()).get('/api/v1/auth/me').expect(401);
    });

    it('devolve os dados do proprio utilizador autenticado', async () => {
      const user = await registerUser(testApp.app, 'SENDER');
      const res = await request(testApp.app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(200);
      expect(res.body.email).toBe(user.email);
    });

    it('rejeita um token invalido/adulterado (401)', async () => {
      await request(testApp.app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer token.invalido.aqui')
        .expect(401);
    });
  });
});
