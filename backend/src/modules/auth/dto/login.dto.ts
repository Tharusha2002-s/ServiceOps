import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@serviceops.local', description: 'Enterprise user email address' })
  @IsEmail({}, { message: 'A valid corporate email address is required' })
  email: string;

  @ApiProperty({ example: 'Password@123', description: 'User account password' })
  @IsString()
  @IsNotEmpty({ message: 'Password cannot be empty' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;
}

