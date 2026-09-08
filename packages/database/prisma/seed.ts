/**
 * Seed de desenvolvimento (doc, seccao 28).
 *
 * Cria contas de exemplo com passwords APENAS para desenvolvimento.
 * Estas credenciais NUNCA podem existir em producao — o script recusa
 * correr com NODE_ENV=production.
 *
 * Contas:
 *   admin@example.test    / Admin!12345      (ADMIN)
 *   sender@example.test   / Sender!12345     (SENDER)  -> "Maria"
 *   student@example.test  / Student!12345    (STUDENT) -> @carlos, Rabat
 *   joao@example.test     / Student!12345    (STUDENT) -> @joao, Casablanca
 */
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '@app/shared/password';
import { normalizeUsername } from '@app/shared';

const prisma = new PrismaClient();

const DEV_PASSWORDS = {
  admin: 'Admin!12345',
  sender: 'Sender!12345',
  student: 'Student!12345',
} as const;

async function upsertUser(params: {
  email: string;
  password: string;
  role: 'ADMIN' | 'SENDER' | 'STUDENT';
}): Promise<string> {
  const passwordHash = await hashPassword(params.password);
  const user = await prisma.user.upsert({
    where: { email: params.email },
    create: {
      email: params.email,
      passwordHash,
      role: params.role,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
    update: { passwordHash, emailVerified: true },
  });
  return user.id;
}

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('O seed nunca deve correr em producao.');
  }

  // --- ADMIN ---------------------------------------------------------------
  await upsertUser({ email: 'admin@example.test', password: DEV_PASSWORDS.admin, role: 'ADMIN' });

  // --- SENDER (Maria) ---------------------------------------------------
  const senderUserId = await upsertUser({
    email: 'sender@example.test',
    password: DEV_PASSWORDS.sender,
    role: 'SENDER',
  });
  await prisma.senderProfile.upsert({
    where: { userId: senderUserId },
    create: {
      userId: senderUserId,
      displayName: 'Maria dos Santos',
      country: 'Sao Tome and Principe',
      phone: '+2399912345',
    },
    update: {},
  });

  // --- STUDENT @carlos --------------------------------------------------
  const carlosUserId = await upsertUser({
    email: 'student@example.test',
    password: DEV_PASSWORDS.student,
    role: 'STUDENT',
  });
  await prisma.studentProfile.upsert({
    where: { userId: carlosUserId },
    create: {
      userId: carlosUserId,
      username: 'carlos',
      usernameNormalized: normalizeUsername('carlos'),
      displayName: 'Carlos Manuel',
      dateOfBirth: new Date('2002-04-15'),
      country: 'Morocco',
      city: 'Rabat',
      university: 'Universite Mohammed V',
      phone: '+212600112233',
      kycStatus: 'VERIFIED',
    },
    update: { kycStatus: 'VERIFIED' },
  });

  // --- STUDENT @joao --------------------------------------------------
  const joaoUserId = await upsertUser({
    email: 'joao@example.test',
    password: DEV_PASSWORDS.student,
    role: 'STUDENT',
  });
  await prisma.studentProfile.upsert({
    where: { userId: joaoUserId },
    create: {
      userId: joaoUserId,
      username: 'joao',
      usernameNormalized: normalizeUsername('joao'),
      displayName: 'Joao Silva',
      dateOfBirth: new Date('2001-11-03'),
      country: 'Morocco',
      city: 'Casablanca',
      university: 'Universite Hassan II',
      phone: '+212600445566',
      kycStatus: 'PENDING',
    },
    update: {},
  });

  // eslint-disable-next-line no-console
  console.log('[seed] concluido:');
  // eslint-disable-next-line no-console
  console.table([
    { email: 'admin@example.test', password: DEV_PASSWORDS.admin, role: 'ADMIN' },
    { email: 'sender@example.test', password: DEV_PASSWORDS.sender, role: 'SENDER' },
    { email: 'student@example.test', password: DEV_PASSWORDS.student, role: 'STUDENT (@carlos)' },
    { email: 'joao@example.test', password: DEV_PASSWORDS.student, role: 'STUDENT (@joao)' },
  ]);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
