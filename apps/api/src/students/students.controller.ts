import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { type Request } from 'express';
import {
  studentProfileSchema,
  studentProfileUpdateSchema,
  UserRole,
  type StudentProfileInput,
  type StudentProfileUpdateInput,
  type StudentProfileView,
  type UsernameAvailability,
} from '@app/shared';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { StudentsService } from './students.service';

function ctx(req: Request): { ip?: string | null; userAgent?: string | null } {
  return { ip: req.ip ?? null, userAgent: req.header('user-agent') ?? null };
}

@ApiTags('students')
@Controller({ path: 'students', version: '1' })
export class StudentsController {
  constructor(private readonly students: StudentsService) {}

  @Get('username/:username/availability')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Verificar se um @username esta disponivel (autoritativo)' })
  checkUsername(@Param('username') username: string): Promise<UsernameAvailability> {
    return this.students.checkUsernameAvailability(username);
  }

  @Get('me')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'O meu perfil de estudante' })
  getMe(@CurrentUser('id') userId: string): Promise<StudentProfileView> {
    return this.students.getMyProfile(userId);
  }

  @Post('me')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Completar o perfil de estudante (onboarding)' })
  createMe(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(studentProfileSchema)) dto: StudentProfileInput,
    @Req() req: Request,
  ): Promise<StudentProfileView> {
    return this.students.createMyProfile(userId, dto, ctx(req));
  }

  @Patch('me')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Atualizar o perfil de estudante' })
  updateMe(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(studentProfileUpdateSchema)) dto: StudentProfileUpdateInput,
    @Req() req: Request,
  ): Promise<StudentProfileView> {
    return this.students.updateMyProfile(userId, dto, ctx(req));
  }
}
