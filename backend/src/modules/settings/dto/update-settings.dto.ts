import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  orgName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  retentionPolicy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(8)
  @Max(64)
  minPasswordLength?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(3)
  @Max(20)
  maxFailedLogins?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  refreshRotation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  smtpHost?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  smtpFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  smtpEncryption?: string;
}

