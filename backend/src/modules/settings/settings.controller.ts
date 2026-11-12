import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Request,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { RoleName } from '@prisma/client';

@ApiTags('Platform Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.SYSTEM_ADMINISTRATOR)
@Controller('api/v1/settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Retrieve global organization settings (Admin only, secrets masked)' })
  async getSettings() {
    const data = await this.settingsService.getAll();
    return {
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @Patch()
  @ApiOperation({ summary: 'Update global platform policy & configuration settings (Admin only)' })
  async updateSettings(@Body() dto: UpdateSettingsDto, @Request() req: any) {
    const data = await this.settingsService.update(dto, req.user);
    return {
      statusCode: HttpStatus.OK,
      message: 'Platform settings saved successfully',
      data,
    };
  }

  @Post('backup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger an immediate PostgreSQL verification & metadata backup snapshot' })
  async triggerBackup(@Request() req: any) {
    const data = await this.settingsService.triggerBackupSnapshot(req.user);
    return {
      statusCode: HttpStatus.OK,
      message: 'Backup verification snapshot completed',
      data,
    };
  }
}

