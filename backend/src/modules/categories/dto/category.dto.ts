import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TicketPriority } from '@prisma/client';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Facilities & Badges' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name: string;

  @ApiProperty({ example: 'FAC' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z0-9_]{2,12}$/, {
    message: 'Category code must be 2-12 uppercase alphanumeric characters',
  })
  code: string;

  @ApiPropertyOptional({ example: 'Office access badges, meeting room AV, and floor power.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '🏢' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ enum: TicketPriority })
  @IsOptional()
  @IsEnum(TicketPriority)
  defaultPriority?: TicketPriority;

  @ApiPropertyOptional({ type: [String], example: ['Keycard Access', 'Conference AV'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subcategories?: string[];
}

export class UpdateCategoryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ enum: TicketPriority })
  @IsOptional()
  @IsEnum(TicketPriority)
  defaultPriority?: TicketPriority;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subcategories?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

