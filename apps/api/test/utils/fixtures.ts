import { type INestApplication } from '@nestjs/common';
import request from 'supertest';

const PASSWORD = 'TesteForte!123';

function rand(): string {
  return Math.random().toString(36).slice(2, 10);
}

export interface RegisteredUser {
  email: string;
  password: string;
  accessToken: string;
  userId: string;
}

export async function registerUser(
  app: INestApplication,
  accountType: 'STUDENT' | 'SENDER',
  email = `user-${rand()}@test.local`,
): Promise<RegisteredUser> {
  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/register')
    .send({ email, password: PASSWORD, accountType })
    .expect(201);

  return {
    email,
    password: PASSWORD,
    accessToken: res.body.accessToken as string,
    userId: res.body.user.id as string,
  };
}

export interface OnboardedStudent extends RegisteredUser {
  username: string;
}

/** Regista um STUDENT e completa logo o onboarding com um @username unico. */
export async function createStudent(
  app: INestApplication,
  username = `stu${rand()}`,
): Promise<OnboardedStudent> {
  const user = await registerUser(app, 'STUDENT');
  await request(app.getHttpServer())
    .post('/api/v1/students/me')
    .set('Authorization', `Bearer ${user.accessToken}`)
    .send({
      fullName: 'Estudante Teste',
      dateOfBirth: '2000-01-15',
      country: 'São Tomé e Príncipe',
      city: 'Rabat',
      university: 'Universidade Mohammed V',
      phone: '+212600112233',
      username,
    })
    .expect(201);
  return { ...user, username };
}

/** Regista um SENDER, cria uma quote para o `student` e devolve o id dela. */
export async function createQuoteFor(
  app: INestApplication,
  sender: RegisteredUser,
  studentUsername: string,
  amount = '50',
): Promise<{ id: string; body: Record<string, unknown> }> {
  const res = await request(app.getHttpServer())
    .post('/api/v1/quotes')
    .set('Authorization', `Bearer ${sender.accessToken}`)
    .send({ studentUsername, amount })
    .expect(201);
  return { id: res.body.id as string, body: res.body };
}
