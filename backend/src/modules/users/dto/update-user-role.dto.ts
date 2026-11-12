import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RoleName } from '@prisma/client';

export class UpdateUserRoleDto {
  @ApiProperty({ enum: RoleName, example: RoleName.IT_SUPPORT_AGENT })
  @IsEnum(RoleName)
  role: RoleName;
}

