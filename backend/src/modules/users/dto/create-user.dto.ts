import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'jane.doe@serviceops.local' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecureP@ssw0rd2026' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'Jane' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiPropertyOptional({ example: 'Engineering' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ example: 'Senior DevOps Specialist' })
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiProperty({ enum: RoleName, example: RoleName.IT_SUPPORT_AGENT })
  @IsEnum(RoleName)
  role: RoleName;
}

