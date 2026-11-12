import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'employee@serviceops.local' })
  @IsEmail({}, { message: 'Please provide a valid work email address' })
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Single-use cryptographic reset token issued via forgot-password flow' })
  @IsString()
  @IsNotEmpty({ message: 'Reset token is required' })
  token: string;

  @ApiProperty({ example: 'NewSecurePass@123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  @MaxLength(128)
  newPassword: string;
}

