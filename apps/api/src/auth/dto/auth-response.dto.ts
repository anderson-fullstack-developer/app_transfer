import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@app/shared';

export class AuthUserDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'maria@example.test' })
  email!: string;

  @ApiProperty({ enum: Object.values(UserRole) })
  role!: UserRole;

  @ApiProperty()
  emailVerified!: boolean;

  @ApiProperty({ description: 'O utilizador ja completou o onboarding (perfil criado)?' })
  onboardingComplete!: boolean;
}

export class AuthResultDto {
  @ApiProperty({ type: AuthUserDto })
  user!: AuthUserDto;

  @ApiProperty({ description: 'Access token (JWT). Guardar em memoria, nunca em localStorage.' })
  accessToken!: string;

  @ApiProperty({ description: 'Validade do access token, em segundos.' })
  expiresIn!: number;
}
