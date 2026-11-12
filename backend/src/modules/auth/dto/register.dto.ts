import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'kasun.silva@serviceops.local', description: 'Corporate email address' })
  @IsEmail({}, { message: 'A valid corporate email address is required' })
  email: string;

  @ApiProperty({ example: 'StrongPass@123', description: 'Password (minimum 8 characters)' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128)
  password: string;

  @ApiProperty({ example: 'Kasun' })
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  @MaxLength(80)
  firstName: string;

  @ApiProperty({ example: 'Silva' })
  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  @MaxLength(80)
  lastName: string;

  @ApiPropertyOptional({ example: 'Engineering' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  department?: string;

  @ApiPropertyOptional({ example: 'Software Engineer' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  jobTitle?: string;
}

