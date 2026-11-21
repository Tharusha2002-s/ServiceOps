import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'employee@serviceops.local' })
  @IsEmail({}, { message: 'Please provide a valid work email address' })
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Single-use cryptographic reset token or 6-digit verification code' })
  @IsString()
  @IsNotEmpty({ message: 'Reset code is required' })
  token: string;

  @ApiProperty({ example: 'NewSecurePass@123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  @MaxLength(128)
  newPassword: string;
}

export class VerifyResetCodeDto {
  @ApiProperty({ example: '749201', description: '6-digit verification code' })
  @IsString()
  @IsNotEmpty({ message: 'Verification code is required' })
  code: string;

  @ApiProperty({ example: 'employee@serviceops.local', required: false })
  email?: string;
}

