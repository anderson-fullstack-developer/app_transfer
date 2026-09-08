import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

/** Tipo de conta escolhido no onboarding. ADMIN nunca e aceite aqui. */
export type RegisterAccountType = 'STUDENT' | 'SENDER';

export class RegisterDto {
  @ApiProperty({ example: 'maria@example.test' })
  @IsEmail()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;

  @ApiProperty({ example: 'S3nh@ForteMesmo', minLength: 8, maxLength: 128 })
  @IsString()
  @MinLength(8, { message: 'A password tem de ter pelo menos 8 caracteres.' })
  @MaxLength(128)
  password!: string;

  @ApiProperty({ enum: ['STUDENT', 'SENDER'], example: 'SENDER' })
  @IsIn(['STUDENT', 'SENDER'], { message: 'Escolhe "STUDENT" ou "SENDER".' })
  accountType!: RegisterAccountType;
}
