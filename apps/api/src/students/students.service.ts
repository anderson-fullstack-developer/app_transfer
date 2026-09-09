import { Injectable } from '@nestjs/common';
import {
  AppError,
  ErrorCode,
  formatUsername,
  normalizeUsername,
  type StudentProfileInput,
  type StudentProfileUpdateInput,
  type StudentProfileView,
  type UsernameAvailability,
  validateUsername,
} from '@app/shared';
import { Prisma } from '@app/database';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';

interface Ctx {
  ip?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class StudentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // --- Disponibilidade de username ------------------------------------

  async checkUsernameAvailability(raw: string): Promise<UsernameAvailability> {
    const normalized = normalizeUsername(raw);
    const format = validateUsername(normalized);
    if (!format.valid) {
      return { username: formatUsername(normalized), available: false, reason: format.reason };
    }
    const taken = await this.prisma.studentProfile.findUnique({
      where: { usernameNormalized: normalized },
      select: { id: true },
    });
    return {
      username: formatUsername(normalized),
      available: !taken,
      reason: taken ? 'Esse username ja esta em uso.' : undefined,
    };
  }

  // --- Perfil do proprio estudante ----------------------------------

  async getMyProfile(userId: string): Promise<StudentProfileView> {
    const profile = await this.prisma.studentProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new AppError(ErrorCode.STUDENT_NOT_FOUND, 'Ainda nao completaste o teu perfil.');
    }
    return this.toView(profile);
  }

  async createMyProfile(
    userId: string,
    input: StudentProfileInput,
    ctx: Ctx,
  ): Promise<StudentProfileView> {
    const existing = await this.prisma.studentProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (existing) {
      throw new AppError(ErrorCode.CONFLICT, 'O teu perfil ja esta criado.');
    }

    const normalized = normalizeUsername(input.username);
    validateUsername(normalized, { throwOnError: true });

    let profile;
    try {
      profile = await this.prisma.studentProfile.create({
        data: {
          userId,
          username: normalized,
          usernameNormalized: normalized,
          displayName: input.fullName,
          dateOfBirth: new Date(input.dateOfBirth),
          country: input.country,
          city: input.city,
          university: input.university,
          phone: input.phone,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppError(ErrorCode.USERNAME_TAKEN, 'Esse username ja esta em uso.');
      }
      throw error;
    }

    await this.audit.record({
      actorId: userId,
      action: 'STUDENT_PROFILE_CREATED',
      entityType: 'StudentProfile',
      entityId: profile.id,
      metadata: { username: normalized },
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });

    return this.toView(profile);
  }

  async updateMyProfile(
    userId: string,
    input: StudentProfileUpdateInput,
    ctx: Ctx,
  ): Promise<StudentProfileView> {
    const current = await this.prisma.studentProfile.findUnique({ where: { userId } });
    if (!current) {
      throw new AppError(ErrorCode.STUDENT_NOT_FOUND, 'Ainda nao completaste o teu perfil.');
    }

    const data: Prisma.StudentProfileUpdateInput = {};
    if (input.fullName !== undefined) data.displayName = input.fullName;
    if (input.dateOfBirth !== undefined) data.dateOfBirth = new Date(input.dateOfBirth);
    if (input.country !== undefined) data.country = input.country;
    if (input.city !== undefined) data.city = input.city;
    if (input.university !== undefined) data.university = input.university;
    if (input.phone !== undefined) data.phone = input.phone;

    let usernameChanged: string | null = null;
    if (input.username !== undefined) {
      const normalized = normalizeUsername(input.username);
      validateUsername(normalized, { throwOnError: true });
      if (normalized !== current.usernameNormalized) {
        data.username = normalized;
        data.usernameNormalized = normalized;
        usernameChanged = normalized;
      }
    }

    let updated;
    try {
      updated = await this.prisma.studentProfile.update({ where: { userId }, data });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppError(ErrorCode.USERNAME_TAKEN, 'Esse username ja esta em uso.');
      }
      throw error;
    }

    if (usernameChanged) {
      await this.audit.record({
        actorId: userId,
        action: 'USERNAME_CHANGED',
        entityType: 'StudentProfile',
        entityId: updated.id,
        metadata: { from: current.usernameNormalized, to: usernameChanged },
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
    }

    return this.toView(updated);
  }

  // --- Helpers ---------------------------------------------------------------

  private toView(p: {
    id: string;
    username: string;
    displayName: string;
    country: string;
    city: string;
    university: string;
    phone: string;
    dateOfBirth: Date;
    kycStatus: 'NOT_STARTED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  }): StudentProfileView {
    return {
      id: p.id,
      username: formatUsername(p.username),
      displayName: p.displayName,
      country: p.country,
      city: p.city,
      university: p.university,
      phone: p.phone,
      dateOfBirth: p.dateOfBirth.toISOString().slice(0, 10),
      kycStatus: p.kycStatus,
      verified: p.kycStatus === 'VERIFIED',
    };
  }
}
