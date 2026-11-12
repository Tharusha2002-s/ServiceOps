import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TicketStatus } from '@prisma/client';

export class UpdateTicketStatusDto {
  @ApiProperty({ enum: TicketStatus, example: TicketStatus.RESOLVED })
  @IsEnum(TicketStatus)
  @IsNotEmpty()
  status: TicketStatus;

  @ApiPropertyOptional({ example: 'Cleared sensor B and tested 5 sample pages.', description: 'Resolution explanation (mandatory when transitioning to RESOLVED)' })
  @IsOptional()
  @IsString()
  resolutionSummary?: string;
}

