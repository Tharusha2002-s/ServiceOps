import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TicketPriority } from '@prisma/client';

export class CreateSlaPolicyDto {
  @ApiProperty({ example: 'P2 - High Priority Business Hours Policy' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: TicketPriority, example: TicketPriority.HIGH_P2 })
  @IsEnum(TicketPriority)
  @IsNotEmpty()
  priority: TicketPriority;

  @ApiPropertyOptional({ example: 'Covers high severity tickets during regular business operations.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 60, description: 'First response target in minutes' })
  @IsInt()
  @Min(1)
  responseTargetMinutes: number;

  @ApiProperty({ example: 480, description: 'Resolution target in minutes (8 business hours)' })
  @IsInt()
  @Min(1)
  resolutionTargetMinutes: number;

  @ApiPropertyOptional({ default: true, description: 'True if calculated only within 08:00-18:00 Mon-Fri' })
  @IsOptional()
  @IsBoolean()
  businessHoursOnly?: boolean;

  @ApiPropertyOptional({ default: 75, description: 'Percentage of SLA elapsed before triggering warning alert' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(99)
  warningThresholdPct?: number;
}

