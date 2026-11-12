import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
  HttpStatus,
  StreamableFile,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Permissions } from '@/common/decorators/permissions.decorator';
import { RoleName } from '@prisma/client';

@ApiTags('Audit Trail')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(RoleName.SYSTEM_ADMINISTRATOR, RoleName.IT_MANAGER)
@Permissions('audit:read')
@Controller('api/v1/audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'Inspect append-only system audit trail (Admin / Manager)' })
  @ApiQuery({ name: 'module', required: false })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('module') moduleName?: string,
    @Query('action') action?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.auditService.findAll({
      module: moduleName,
      action,
      search,
      limit: limit ? parseInt(limit, 10) : 100,
    });
    return {
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @Get('verify')
  @Roles(RoleName.SYSTEM_ADMINISTRATOR)
  @ApiOperation({ summary: 'Verify cryptographic SHA-256 hash chain across audit logs' })
  async verifyIntegrity() {
    const data = await this.auditService.verifyChain();
    return {
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @Get('export/csv')
  @Roles(RoleName.SYSTEM_ADMINISTRATOR)
  @ApiOperation({ summary: 'Export sanitized immutable audit trail as CSV' })
  async exportCsv(@Res({ passthrough: true }) res: Response) {
    const csv = await this.auditService.exportCsv();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="serviceops-audit-trail.csv"');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return new StreamableFile(Buffer.from(csv, 'utf-8'));
  }
}

