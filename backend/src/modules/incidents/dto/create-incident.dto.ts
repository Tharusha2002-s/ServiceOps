import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IncidentSeverity } from '@prisma/client';

export class CreateIncidentDto {
  @ApiProperty({ description: 'Incident title', example: 'Organization-wide login failures' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Detailed impact and disruption summary' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: IncidentSeverity, example: IncidentSeverity.CRITICAL_P1 })
  @IsEnum(IncidentSeverity)
  severity: IncidentSeverity;

  @ApiPropertyOptional({ description: 'Scope of organizational impact', example: 'All office locations' })
  @IsString()
  @IsOptional()
  impactScope?: string;

  @ApiPropertyOptional({ description: 'Commander User ID' })
  @IsString()
  @IsOptional()
  commanderId?: string;
}

