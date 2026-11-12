import { IsNotEmpty, IsString, MinLength, MaxLength, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Impact, Urgency, TicketType } from '@prisma/client';

export class CreateTicketDto {
  @ApiProperty({ example: 'Laptop dock not charging', description: 'Brief summary of the issue or request' })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(150)
  title: string;

  @ApiProperty({ example: 'The USB-C dock on Desk 42 stopped charging my laptop after the power surge.', description: 'Detailed problem description' })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  description: string;

  @ApiProperty({ example: 'HW', description: 'Category code (e.g. HW, ACC, SW, NET, WRK, SEC)' })
  @IsString()
  @IsNotEmpty()
  categoryCode: string;

  @ApiProperty({ enum: Urgency, example: Urgency.HIGH })
  @IsEnum(Urgency)
  urgency: Urgency;

  @ApiProperty({ enum: Impact, example: Impact.USER })
  @IsEnum(Impact)
  impact: Impact;

  @ApiPropertyOptional({ enum: TicketType, example: TicketType.SERVICE_REQUEST })
  @IsOptional()
  @IsEnum(TicketType)
  type?: TicketType;

  @ApiPropertyOptional({ description: 'Optional linked IT Asset ID from CMDB' })
  @IsOptional()
  @IsUUID()
  assetId?: string;
}

