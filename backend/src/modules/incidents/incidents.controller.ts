import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { IncidentsService } from './incidents.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { AddIncidentUpdateDto, LinkTicketDto } from './dto/add-incident-update.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { Permissions } from '@/common/decorators/permissions.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { RoleName, IncidentStatus } from '@prisma/client';

@ApiTags('Major Incident Management & War-Rooms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('api/v1/incidents')
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Get('active-outage')
  @Public()
  @ApiOperation({ summary: 'Get active major incident for global outage banner broadcast' })
  async getActiveOutage() {
    const outage = await this.incidentsService.getActiveOutage();
    return {
      statusCode: HttpStatus.OK,
      data: outage,
    };
  }

  @Get()
  @Roles(RoleName.IT_SUPPORT_AGENT, RoleName.IT_MANAGER, RoleName.SYSTEM_ADMINISTRATOR)
  @ApiOperation({ summary: 'List all major incidents' })
  async findAll(@Query('status') status?: IncidentStatus) {
    const incidents = await this.incidentsService.findAll(status);
    return {
      statusCode: HttpStatus.OK,
      data: incidents,
    };
  }

  @Get(':id')
  @Roles(RoleName.IT_SUPPORT_AGENT, RoleName.IT_MANAGER, RoleName.SYSTEM_ADMINISTRATOR)
  @ApiOperation({ summary: 'Get incident details with investigation timeline and linked tickets' })
  async findOne(@Param('id') id: string) {
    const incident = await this.incidentsService.findByIdOrNumber(id);
    return {
      statusCode: HttpStatus.OK,
      data: incident,
    };
  }

  @Post()
  @Roles(RoleName.IT_SUPPORT_AGENT, RoleName.IT_MANAGER, RoleName.SYSTEM_ADMINISTRATOR)
  @Permissions('incident:declare')
  @ApiOperation({ summary: 'Declare a new Major Incident' })
  @ApiResponse({ status: 201, description: 'Incident declared successfully' })
  async create(@Body() dto: CreateIncidentDto, @CurrentUser('id') userId: string) {
    const incident = await this.incidentsService.create(dto, userId);
    return {
      statusCode: HttpStatus.CREATED,
      message: `Major Incident ${incident.incidentNumber} declared successfully`,
      data: incident,
    };
  }

  @Patch(':id')
  @Roles(RoleName.IT_MANAGER, RoleName.SYSTEM_ADMINISTRATOR)
  @Permissions('incident:update')
  @ApiOperation({ summary: 'Update incident status, commander, or root cause' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateIncidentDto,
    @CurrentUser() user: any,
  ) {
    const updated = await this.incidentsService.update(id, dto, user);
    return {
      statusCode: HttpStatus.OK,
      message: 'Incident updated successfully',
      data: updated,
    };
  }

  @Post(':id/updates')
  @Roles(RoleName.IT_SUPPORT_AGENT, RoleName.IT_MANAGER, RoleName.SYSTEM_ADMINISTRATOR)
  @ApiOperation({ summary: 'Post an operational finding or milestone to the incident war-room' })
  async addUpdate(
    @Param('id') id: string,
    @Body() dto: AddIncidentUpdateDto,
    @CurrentUser('id') userId: string,
  ) {
    const update = await this.incidentsService.addUpdate(id, dto.message, userId);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Timeline update posted successfully',
      data: update,
    };
  }

  @Post(':id/link-ticket')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.IT_SUPPORT_AGENT, RoleName.IT_MANAGER, RoleName.SYSTEM_ADMINISTRATOR)
  @ApiOperation({ summary: 'Link an impacted service request to this major incident' })
  async linkTicket(
    @Param('id') id: string,
    @Body() dto: LinkTicketDto,
    @CurrentUser() user: any,
  ) {
    const result = await this.incidentsService.linkTicket(id, dto.ticketIdentifier, user);
    return {
      statusCode: HttpStatus.OK,
      ...result,
    };
  }
}

