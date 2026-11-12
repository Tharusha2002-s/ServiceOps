import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssetStatus, AssetType } from '@prisma/client';

export class CreateAssetDto {
  @ApiProperty({ example: 'LAT-5440-22' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z0-9-]{3,30}$/, {
    message: 'Asset tag must be uppercase alphanumeric/hyphens (e.g. LAT-5440-22)',
  })
  assetTag: string;

  @ApiProperty({ example: 'Dell Latitude 5440' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ enum: AssetType })
  @IsOptional()
  @IsEnum(AssetType)
  assetType?: AssetType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  serialNumber?: string;

  @ApiPropertyOptional({ example: 'Colombo HQ · Level 4' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ enum: AssetStatus })
  @IsOptional()
  @IsEnum(AssetStatus)
  status?: AssetStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @ApiPropertyOptional({ example: '2027-08-31T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  warrantyUntil?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateAssetDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ enum: AssetType })
  @IsOptional()
  @IsEnum(AssetType)
  assetType?: AssetType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  serialNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ enum: AssetStatus })
  @IsOptional()
  @IsEnum(AssetStatus)
  status?: AssetStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedToId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  warrantyUntil?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

