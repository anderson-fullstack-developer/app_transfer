import request from 'supertest';
import { createTestApp, closeTestApp, type TestApp } from './utils/test-app';
import { createStudent, registerUser } from './utils/fixtures';

describe('Students (e2e)', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  afterAll(async () => {
    await closeTestApp(testApp);
  });

  describe('GET /students/username/:username/availability', () => {
    it('diz disponivel para um username livre (exige sessao autenticada)', async () => {
      const user = await registerUser(testApp.app, 'STUDENT');
      const res = await request(testApp.app.getHttpServer())
        .get(`/api/v1/students/username/livre${Date.now()}/availability`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(200);
      expect(res.body.available).toBe(true);
    });

    it('diz indisponivel depois de um estudante o reclamar', async () => {
      const username = `reclamado${Date.now()}`;
      await createStudent(testApp.app, username);
      const user = await registerUser(testApp.app, 'STUDENT');

      const res = await request(testApp.app.getHttpServer())
        .get(`/api/v1/students/username/${username}/availability`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .expect(200);
      expect(res.body.available).toBe(false);
    });
  });

  describe('POST /students/me (onboarding)', () => {
    it('cria o perfil e reclama o @username', async () => {
      const user = await registerUser(testApp.app, 'STUDENT');
      const username = `novo${Date.now()}`;
      const res = await request(testApp.app.getHttpServer())
        .post('/api/v1/students/me')
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({
          fullName: 'Maria Estudante',
          dateOfBirth: '2001-05-20',
          country: 'São Tomé e Príncipe',
          city: 'Casablanca',
          university: 'Universidade Hassan II',
          phone: '+212611223344',
          username,
        })
        .expect(201);

      expect(res.body.username).toBe(`@${username}`);
      expect(res.body.displayName).toBe('Maria Estudante');
    });

    it('rejeita um @username ja usado por outro estudante (409)', async () => {
      const username = `ocupado${Date.now()}`;
      await createStudent(testApp.app, username);

      const other = await registerUser(testApp.app, 'STUDENT');
      const res = await request(testApp.app.getHttpServer())
        .post('/api/v1/students/me')
        .set('Authorization', `Bearer ${other.accessToken}`)
        .send({
          fullName: 'Outro Estudante',
          dateOfBirth: '2001-05-20',
          country: 'São Tomé e Príncipe',
          city: 'Rabat',
          university: 'Universidade Mohammed V',
          phone: '+212611223355',
          username,
        })
        .expect(409);
      expect(res.body.error.code).toBe('USERNAME_TAKEN');
    });

    it('RBAC: um SENDER nao pode aceder ao onboarding de estudante (403)', async () => {
      const sender = await registerUser(testApp.app, 'SENDER');
      await request(testApp.app.getHttpServer())
        .post('/api/v1/students/me')
        .set('Authorization', `Bearer ${sender.accessToken}`)
        .send({
          fullName: 'Nao Deveria',
          dateOfBirth: '2001-05-20',
          country: 'Marrocos',
          city: 'Rabat',
          university: 'X',
          phone: '+212600000000',
          username: `naodeveria${Date.now()}`,
        })
        .expect(403);
    });
  });

  describe('GET /students/by-username/:username (pesquisa, data minimization)', () => {
    it('exige sessao autenticada (401 sem token)', async () => {
      const username = `precisalogin${Date.now()}`;
      await createStudent(testApp.app, username);
      await request(testApp.app.getHttpServer())
        .get(`/api/v1/students/by-username/${username}`)
        .expect(401);
    });

    it('devolve APENAS os campos publicos, mesmo pedido por um SENDER', async () => {
      const username = `minimiza${Date.now()}`;
      await createStudent(testApp.app, username);
      const sender = await registerUser(testApp.app, 'SENDER');

      const res = await request(testApp.app.getHttpServer())
        .get(`/api/v1/students/by-username/${username}`)
        .set('Authorization', `Bearer ${sender.accessToken}`)
        .expect(200);

      expect(Object.keys(res.body).sort()).toEqual(
        ['city', 'country', 'displayName', 'username', 'verified'].sort(),
      );
      // Nunca devem sair email, telefone, data de nascimento ou kycStatus.
      expect(res.body).not.toHaveProperty('phone');
      expect(res.body).not.toHaveProperty('email');
      expect(res.body).not.toHaveProperty('dateOfBirth');
      expect(res.body).not.toHaveProperty('kycStatus');
    });

    it('devolve 404 para um @username que nao existe', async () => {
      const sender = await registerUser(testApp.app, 'SENDER');
      await request(testApp.app.getHttpServer())
        .get('/api/v1/students/by-username/naoexisteninguem')
        .set('Authorization', `Bearer ${sender.accessToken}`)
        .expect(404);
    });
  });
});
