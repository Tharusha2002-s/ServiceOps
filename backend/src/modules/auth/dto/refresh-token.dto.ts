import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiPropertyOptional({ description: 'Cryptographic refresh token string (optional if sent via HttpOnly cookie)' })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
