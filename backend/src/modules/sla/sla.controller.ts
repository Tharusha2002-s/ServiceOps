import {
  Controller,
  Get,
  Post,
  Body,
  Request,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SlaService } from './sla.service';
import { SlaMonitorService } from './sla-monitor.service';
import { CreateSlaPolicyDto } from './dto/create-sla-policy.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Permissions } from '@/common/decorators/permissions.decorator';
import { RoleName } from '@prisma/client';

@ApiTags('SLA Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('api/v1/sla')
export class SlaController {
  constructor(
    private readonly slaService: SlaService,
    private readonly slaMonitorService: SlaMonitorService,
  ) {}

  @Get('policies')
  @Roles(RoleName.IT_MANAGER, RoleName.SYSTEM_ADMINISTRATOR, RoleName.IT_SUPPORT_AGENT)
  @ApiOperation({ summary: 'List organizational SLA policy tiers (P1-P4)' })
  async getPolicies() {
    const policies = await this.slaService.findAllPolicies();
    return {
      statusCode: HttpStatus.OK,
      data: policies,
    };
  }

  @Post('policies')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.IT_MANAGER, RoleName.SYSTEM_ADMINISTRATOR)
  @Permissions('sla:manage')
  @ApiOperation({ summary: 'Configure or update an SLA policy tier threshold' })
  async updatePolicy(@Body() dto: CreateSlaPolicyDto, @Request() req: any) {
    const policy = await this.slaService.upsertPolicy(dto, req.user);
    return {
      statusCode: HttpStatus.OK,
      message: `SLA Policy for ${dto.priority} updated successfully`,
      data: policy,
    };
  }

  @Get('metrics')
  @Roles(RoleName.IT_MANAGER, RoleName.SYSTEM_ADMINISTRATOR)
  @ApiOperation({ summary: 'Get live SLA compliance percentage and breach counts' })
  async getMetrics() {
    const metrics = await this.slaService.getComplianceMetrics();
    return {
      statusCode: HttpStatus.OK,
      data: metrics,
    };
  }

  @Get('breaches')
  @Roles(RoleName.IT_MANAGER, RoleName.SYSTEM_ADMINISTRATOR, RoleName.IT_SUPPORT_AGENT)
  @ApiOperation({ summary: 'List all currently breached tickets requiring manager escalation' })
  async getBreaches() {
    const breaches = await this.slaService.getBreachedTickets();
    return {
      statusCode: HttpStatus.OK,
      data: breaches,
    };
  }

  @Post('monitor/run')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.IT_MANAGER, RoleName.SYSTEM_ADMINISTRATOR)
  @ApiOperation({ summary: 'Trigger an immediate SLA threshold warning & breach scan' })
  async triggerMonitorSweep() {
    const result = await this.slaMonitorService.evaluateAllActiveSlas();
    return {
      statusCode: HttpStatus.OK,
      message: 'SLA monitor sweep completed',
      data: result,
    };
  }
}
