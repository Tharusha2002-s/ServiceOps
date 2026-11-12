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
import { ReportsService, ReportRange } from './reports.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Permissions } from '@/common/decorators/permissions.decorator';
import { RoleName } from '@prisma/client';

@ApiTags('Analytics & Reporting')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(RoleName.IT_MANAGER, RoleName.SYSTEM_ADMINISTRATOR)
@Permissions('reports:view')
@Controller('api/v1/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  private normalizeRange(range?: string): ReportRange {
    if (range === '30d' || range === 'month' || range === 'quarter') return range;
    return '7d';
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get aggregated KPI metrics, category breakdown, and agent scorecard' })
  @ApiQuery({ name: 'range', required: false, enum: ['7d', '30d', 'month', 'quarter'] })
  async getSummary(@Query('range') range?: string) {
    const data = await this.reportsService.getSummary(this.normalizeRange(range));
    return {
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @Get('trends')
  @ApiOperation({ summary: 'Get daily opened vs resolved ticket trend time-series' })
  @ApiQuery({ name: 'range', required: false, enum: ['7d', '30d', 'month', 'quarter'] })
  async getTrends(@Query('range') range?: string) {
    const data = await this.reportsService.getTrends(this.normalizeRange(range));
    return {
      statusCode: HttpStatus.OK,
      data,
    };
  }

  @Get('export/csv')
  @ApiOperation({ summary: 'Download sanitized CSV performance report for date window' })
  @ApiQuery({ name: 'range', required: false, enum: ['7d', '30d', 'month', 'quarter'] })
  async exportCsv(
    @Query('range') range: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const normalized = this.normalizeRange(range);
    const csv = await this.reportsService.exportCsv(normalized);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="serviceops-report-${normalized}.csv"`,
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return new StreamableFile(Buffer.from(csv, 'utf-8'));
  }
}

