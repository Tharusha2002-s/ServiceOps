import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IncidentSeverity, IncidentStatus } from '@prisma/client';

export class UpdateIncidentDto {
  @ApiPropertyOptional({ enum: IncidentStatus })
  @IsEnum(IncidentStatus)
  @IsOptional()
  status?: IncidentStatus;

  @ApiPropertyOptional({ enum: IncidentSeverity })
  @IsEnum(IncidentSeverity)
  @IsOptional()
  severity?: IncidentSeverity;

  @ApiPropertyOptional({ description: 'Incident commander user ID' })
  @IsString()
  @IsOptional()
  commanderId?: string;

  @ApiPropertyOptional({ description: 'Identified root cause analysis' })
  @IsString()
  @IsOptional()
  rootCause?: string;

  @ApiPropertyOptional({ description: 'Applied temporary workaround' })
  @IsString()
  @IsOptional()
  workaround?: string;
}

