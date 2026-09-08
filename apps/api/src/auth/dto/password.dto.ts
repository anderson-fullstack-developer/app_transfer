import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class VerifyEmailDto {
  @ApiProperty()
  @IsString()
  @MaxLength(256)
  token!: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'maria@example.test' })
  @IsEmail()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  @MaxLength(256)
  token!: string;

  @ApiProperty({ minLength: 8, maxLength: 128 })
  @IsString()
  @MinLength(8, { message: 'A password tem de ter pelo menos 8 caracteres.' })
  @MaxLength(128)
  password!: string;
}
