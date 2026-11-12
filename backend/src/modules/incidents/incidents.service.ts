import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EventsGateway } from '../events/events.gateway';
import { AuditService } from '../audit/audit.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import {
  IncidentStatus,
  IncidentSeverity,
  NotificationType,
  RoleName,
} from '@prisma/client';

@Injectable()
export class IncidentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly eventsGateway: EventsGateway,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Retrieves all major incidents
   */
  async findAll(status?: IncidentStatus) {
    const where: any = {};
    if (status) where.status = status;

    return this.prisma.incident.findMany({
      where,
      include: {
        reporter: { select: { id: true, firstName: true, lastName: true, email: true } },
        commander: { select: { id: true, firstName: true, lastName: true, email: true } },
        _count: {
          select: { updates: true, linkedTickets: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Retrieves the currently active major incident for the global outage banner
   */
  async getActiveOutage() {
    return this.prisma.incident.findFirst({
      where: {
        status: {
          in: [
            IncidentStatus.DECLARED,
            IncidentStatus.INVESTIGATING,
            IncidentStatus.MITIGATED,
            IncidentStatus.MONITORING,
          ],
        },
        severity: {
          in: [IncidentSeverity.CRITICAL_P1, IncidentSeverity.HIGH_P2],
        },
      },
      include: {
        commander: { select: { firstName: true, lastName: true } },
        updates: {
          orderBy: { createdAt: 'desc' },
          take: 3,
          select: {
            id: true,
            message: true,
            createdAt: true,
          },
        },
        _count: { select: { linkedTickets: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Retrieves single incident details by UUID or Incident Number (e.g. INC-208)
   */
  async findByIdOrNumber(identifier: string) {
    const incident = await this.prisma.incident.findFirst({
      where: {
        OR: [{ id: identifier }, { incidentNumber: identifier }],
      },
      include: {
        reporter: { select: { id: true, firstName: true, lastName: true, email: true } },
        commander: { select: { id: true, firstName: true, lastName: true, email: true } },
        updates: {
          include: {
            author: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        linkedTickets: {
          select: {
            id: true,
            ticketNumber: true,
            title: true,
            status: true,
            priority: true,
            requester: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!incident) {
      throw new NotFoundException(`Incident '${identifier}' not found`);
    }

    return incident;
  }

  /**
   * Declares a new Major Incident
   */
  async create(dto: CreateIncidentDto, reporterId: string) {
    const existingIncidents = await this.prisma.incident.findMany({
      select: { incidentNumber: true },
    });
    const maxNum = existingIncidents.reduce((max, inc) => {
      const parsed = parseInt(inc.incidentNumber.replace('INC-', ''), 10);
      return Number.isFinite(parsed) && parsed > max ? parsed : max;
    }, 207);
    const incidentNumber = `INC-${maxNum + 1}`;

    const incident = await this.prisma.incident.create({
      data: {
        incidentNumber,
        title: dto.title,
        description: dto.description,
        severity: dto.severity,
        status: IncidentStatus.INVESTIGATING,
        impactScope: dto.impactScope || 'Organization-wide',
        reporterId,
        commanderId: dto.commanderId || reporterId,
        updates: {
          create: {
            authorId: reporterId,
            message: `Declared incident ${incidentNumber}: ${dto.title}. Initial investigation initiated.`,
          },
        },
      },
      include: {
        reporter: { select: { firstName: true, lastName: true } },
        commander: { select: { firstName: true, lastName: true } },
        updates: true,
      },
    });

    void this.notificationsService.notifyRoles(
      [RoleName.IT_SUPPORT_AGENT, RoleName.IT_MANAGER, RoleName.SYSTEM_ADMINISTRATOR],
      {
        actorId: reporterId,
        type: NotificationType.INCIDENT_DECLARED,
        title: `Major Incident Declared: ${incident.incidentNumber}`,
        message: `${incident.title} (${incident.severity}) — Scope: ${incident.impactScope || 'Organization-wide'}.`,
        entityType: 'INCIDENT',
        entityId: incident.id,
        linkUrl: `/dashboard?incident=${incident.id}`,
      },
    );

    this.eventsGateway.emitToAuthenticated('outage:updated', { incidentId: incident.id });
    this.eventsGateway.emitToRoles(
      [RoleName.IT_SUPPORT_AGENT, RoleName.IT_MANAGER, RoleName.SYSTEM_ADMINISTRATOR],
      'incident:updated',
      { incidentId: incident.id, incidentNumber: incident.incidentNumber },
    );

    void this.auditService.record({
      actorId: reporterId,
      action: 'incident.create',
      module: 'incidents',
      resourceType: 'Incident',
      resourceId: incident.incidentNumber,
      afterState: { title: incident.title, severity: incident.severity, status: incident.status },
    });

    return incident;
  }

  /**
   * Updates incident status, commander, or root cause
   */
  async update(id: string, dto: UpdateIncidentDto, user: any) {
    const incident = await this.prisma.incident.findUnique({ where: { id } });
    if (!incident) throw new NotFoundException(`Incident '${id}' not found`);

    const data: any = { ...dto };
    if (dto.status === IncidentStatus.RESOLVED && !incident.resolvedAt) {
      data.resolvedAt = new Date();
    }

    // Auto-generate timeline entry for status changes
    let updateMessage: string | null = null;
    if (dto.status && dto.status !== incident.status) {
      updateMessage = `Incident state transitioned from ${incident.status} to ${dto.status}`;
    }
    if (dto.commanderId && dto.commanderId !== incident.commanderId) {
      const newCommander = await this.prisma.user.findUnique({ where: { id: dto.commanderId } });
      const commanderName = newCommander ? `${newCommander.firstName} ${newCommander.lastName}` : dto.commanderId;
      updateMessage = `Incident Commander transferred to ${commanderName}`;
    }

    const updated = await this.prisma.incident.update({
      where: { id },
      data: {
        ...data,
        updates: updateMessage
          ? {
              create: {
                authorId: user.id,
                message: updateMessage,
              },
            }
          : undefined,
      },
      include: {
        reporter: { select: { firstName: true, lastName: true } },
        commander: { select: { firstName: true, lastName: true } },
        updates: true,
      },
    });

    if (dto.status || dto.commanderId) {
      void this.notificationsService.notifyRoles([RoleName.IT_MANAGER], {
        extraRecipientIds: updated.commanderId ? [updated.commanderId] : [],
        actorId: user.id,
        type: NotificationType.INCIDENT_UPDATED,
        title: `${updated.incidentNumber} updated (${updated.status})`,
        message: updateMessage || `${updated.title} was updated.`,
        entityType: 'INCIDENT',
        entityId: updated.id,
        linkUrl: `/dashboard?incident=${updated.id}`,
      });
    }

    this.eventsGateway.emitToAuthenticated('outage:updated', { incidentId: updated.id });
    this.eventsGateway.emitToRoom(`incident:${id}`, 'incident:updated', { incidentId: id });
    this.eventsGateway.emitToRoles(
      [RoleName.IT_SUPPORT_AGENT, RoleName.IT_MANAGER, RoleName.SYSTEM_ADMINISTRATOR],
      'incident:updated',
      { incidentId: id },
    );

    return updated;
  }

  /**
   * Adds an investigation finding or war-room operational milestone
   */
  async addUpdate(id: string, message: string, authorId: string) {
    const incident = await this.prisma.incident.findUnique({ where: { id } });
    if (!incident) throw new NotFoundException(`Incident '${id}' not found`);

    const entry = await this.prisma.incidentUpdate.create({
      data: {
        incidentId: id,
        authorId,
        message,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    this.eventsGateway.emitToAuthenticated('outage:updated', { incidentId: id });
    this.eventsGateway.emitToRoom(`incident:${id}`, 'incident:updated', { incidentId: id });
    this.eventsGateway.emitToRoles(
      [RoleName.IT_SUPPORT_AGENT, RoleName.IT_MANAGER, RoleName.SYSTEM_ADMINISTRATOR],
      'incident:updated',
      { incidentId: id },
    );

    return entry;
  }

  /**
   * Links a service ticket to a parent incident
   */
  async linkTicket(incidentId: string, ticketIdentifier: string, user: any) {
    const incident = await this.prisma.incident.findUnique({ where: { id: incidentId } });
    if (!incident) throw new NotFoundException(`Incident '${incidentId}' not found`);

    const ticket = await this.prisma.ticket.findFirst({
      where: {
        OR: [{ id: ticketIdentifier }, { ticketNumber: ticketIdentifier }],
      },
    });

    if (!ticket) throw new NotFoundException(`Ticket '${ticketIdentifier}' not found`);

    // Bind ticket to incident
    await this.prisma.ticket.update({
      where: { id: ticket.id },
      data: { incidentId },
    });

    // Record timeline milestone in incident
    await this.addUpdate(
      incidentId,
      `Linked service request ${ticket.ticketNumber} (${ticket.title}) to this incident.`,
      user.id,
    );

    return {
      message: `Ticket ${ticket.ticketNumber} linked to ${incident.incidentNumber} successfully`,
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
    };
  }
}

