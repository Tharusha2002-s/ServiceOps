import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { PrismaService } from '@/database/prisma.service';
import { PriorityMatrixService } from './services/priority-matrix.service';
import { SlaService } from '../sla/sla.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EventsGateway } from '../events/events.gateway';
import { AuditService } from '../audit/audit.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { AddCommentDto } from './dto/add-comment.dto';
import {
  RoleName,
  TicketStatus,
  CommentType,
  TicketPriority,
  TicketType,
  NotificationType,
} from '@prisma/client';

export interface UploadedTicketFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_ATTACHMENT_MAP: Record<string, string[]> = {
  '.png': ['image/png'],
  '.jpg': ['image/jpeg', 'image/jpg'],
  '.jpeg': ['image/jpeg', 'image/jpg'],
  '.pdf': ['application/pdf'],
  '.txt': ['text/plain', 'application/octet-stream'],
  '.log': ['text/plain', 'application/octet-stream'],
};

@Injectable()
export class TicketsService {
  private readonly uploadsRoot = path.resolve(process.cwd(), 'uploads');
  private readonly ticketUploadsDir = path.join(this.uploadsRoot, 'tickets');

  constructor(
    private readonly prisma: PrismaService,
    private readonly priorityMatrixService: PriorityMatrixService,
    private readonly slaService: SlaService,
    private readonly notificationsService: NotificationsService,
    private readonly eventsGateway: EventsGateway,
    private readonly auditService: AuditService,
  ) {}

  private isPureEmployee(user: any): boolean {
    return (
      user.roles.includes(RoleName.EMPLOYEE) &&
      !user.roles.includes(RoleName.IT_SUPPORT_AGENT) &&
      !user.roles.includes(RoleName.IT_MANAGER) &&
      !user.roles.includes(RoleName.SYSTEM_ADMINISTRATOR)
    );
  }

  private validateMagicBytes(buffer: Buffer, ext: string): void {
    if (!buffer || buffer.length === 0) {
      throw new BadRequestException('Uploaded file cannot be empty');
    }

    if (ext === '.png') {
      const sig = [0x89, 0x50, 0x4e, 0x47];
      if (!sig.every((b, idx) => buffer[idx] === b)) {
        throw new BadRequestException('File contents do not match PNG signature');
      }
    } else if (ext === '.jpg' || ext === '.jpeg') {
      if (buffer.length < 3 || buffer[0] !== 0xff || buffer[1] !== 0xd8 || buffer[2] !== 0xff) {
        throw new BadRequestException('File contents do not match JPEG signature');
      }
    } else if (ext === '.pdf') {
      if (buffer.subarray(0, 5).toString('ascii') !== '%PDF-') {
        throw new BadRequestException('File contents do not match PDF signature');
      }
    } else if (ext === '.txt' || ext === '.log') {
      const sample = buffer.subarray(0, Math.min(buffer.length, 2048));
      if (sample.includes(0x00)) {
        throw new BadRequestException('Binary content is not allowed in text/log attachments');
      }
    }
  }

  /**
   * Retrieves all available IT service categories
   */
  async getCategories() {
    return this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Creates a new ticket with deterministic ITIL priority and SLA snapshotting
   */
  async createTicket(dto: CreateTicketDto, requesterId: string) {
    const category = await this.prisma.category.findUnique({
      where: { code: dto.categoryCode },
    });

    if (!category) {
      throw new NotFoundException(`Category code '${dto.categoryCode}' not found`);
    }

    // Calculate priority from 3x3 ITIL matrix
    const priority = this.priorityMatrixService.calculatePriority(dto.impact, dto.urgency);
    const sla = this.priorityMatrixService.calculateSlaTargets(priority);

    // Generate unique monotonic sequential ticket number
    const existingTickets = await this.prisma.ticket.findMany({
      select: { ticketNumber: true },
    });
    const maxNum = existingTickets.reduce((max, t) => {
      const parsed = parseInt(t.ticketNumber.replace('TKT-', ''), 10);
      return Number.isFinite(parsed) && parsed > max ? parsed : max;
    }, 1042);
    const ticketNumber = `TKT-${maxNum + 1}`;

    const ticket = await this.prisma.ticket.create({
      data: {
        ticketNumber,
        title: dto.title,
        description: dto.description,
        type: dto.type || TicketType.SERVICE_REQUEST,
        status: TicketStatus.NEW,
        priority: sla.priority,
        impact: dto.impact,
        urgency: dto.urgency,
        categoryId: category.id,
        requesterId,
        assetId: dto.assetId || null,
        responseDueAt: sla.responseDueAt,
        resolutionDueAt: sla.resolutionDueAt,
        activityLogs: {
          create: {
            actorId: requesterId,
            action: 'CREATED',
            newValue: TicketStatus.NEW,
            details: `Ticket submitted with priority ${sla.priority}`,
          },
        },
      },
      include: {
        category: true,
        asset: {
          select: { id: true, assetTag: true, name: true, assetType: true, status: true, location: true },
        },
        requester: {
          select: { id: true, firstName: true, lastName: true, email: true, department: true },
        },
      },
    });

    // Create immutable SLA Policy Snapshot (ADR-007)
    await this.slaService.snapshotTicketSla(ticket.id, sla.priority, ticket.createdAt);

    // Notify requester (confirmation) & Managers (new triage arrival) asynchronously
    void this.notificationsService.dispatch({
      recipientIds: [requesterId],
      actorId: requesterId,
      notifyActor: true,
      type: NotificationType.TICKET_CREATED,
      title: `${ticket.ticketNumber} submitted`,
      message: `We received "${ticket.title}" (${sla.priority}). An IT support specialist will triage your request shortly.`,
      entityType: 'TICKET',
      entityId: ticket.id,
      linkUrl: `/dashboard?ticket=${ticket.id}`,
    });

    void this.notificationsService.notifyRoles([RoleName.IT_MANAGER], {
      actorId: requesterId,
      type: NotificationType.TICKET_CREATED,
      title: `New ticket ${ticket.ticketNumber} (${sla.priority})`,
      message: `${ticket.requester.firstName} ${ticket.requester.lastName} opened "${ticket.title}".`,
      entityType: 'TICKET',
      entityId: ticket.id,
      linkUrl: `/dashboard?ticket=${ticket.id}`,
    });

    this.eventsGateway.emitToRoles(
      [RoleName.IT_SUPPORT_AGENT, RoleName.IT_MANAGER, RoleName.SYSTEM_ADMINISTRATOR],
      'ticket:updated',
      { ticketId: ticket.id, ticketNumber: ticket.ticketNumber, action: 'CREATED' },
    );

    return ticket;
  }

  /**
   * Lists tickets with server-side ownership scoping (ADR-004)
   */
  async findAllTickets(
    user: any,
    filters?: {
      status?: TicketStatus;
      priority?: TicketPriority;
      categoryId?: string;
      assigneeId?: string;
      unassigned?: boolean;
    },
  ) {
    const isEmployeeOnly =
      user.roles.includes(RoleName.EMPLOYEE) &&
      !user.roles.includes(RoleName.IT_SUPPORT_AGENT) &&
      !user.roles.includes(RoleName.IT_MANAGER) &&
      !user.roles.includes(RoleName.SYSTEM_ADMINISTRATOR);

    const where: any = {};

    // Ownership barrier: Employees strictly see only their own requests
    if (isEmployeeOnly) {
      where.requesterId = user.id;
    }

    if (filters?.status) where.status = filters.status;
    if (filters?.priority) where.priority = filters.priority;
    if (filters?.categoryId) where.categoryId = filters.categoryId;
    if (filters?.assigneeId) where.assigneeId = filters.assigneeId;
    if (filters?.unassigned) where.assigneeId = null;

    return this.prisma.ticket.findMany({
      where,
      include: {
        category: true,
        asset: {
          select: { id: true, assetTag: true, name: true, assetType: true, status: true, location: true },
        },
        requester: {
          select: { id: true, firstName: true, lastName: true, email: true, department: true },
        },
        assignee: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        slaSnapshot: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Retrieves single ticket by ID or TicketNumber with internal notes privacy separation (ADR-009)
   */
  async findTicketById(identifier: string, user: any) {
    const isEmployeeOnly =
      user.roles.includes(RoleName.EMPLOYEE) &&
      !user.roles.includes(RoleName.IT_SUPPORT_AGENT) &&
      !user.roles.includes(RoleName.IT_MANAGER) &&
      !user.roles.includes(RoleName.SYSTEM_ADMINISTRATOR);

    const ticket = await this.prisma.ticket.findFirst({
      where: {
        OR: [{ id: identifier }, { ticketNumber: identifier }],
      },
      include: {
        category: true,
        asset: {
          select: { id: true, assetTag: true, name: true, assetType: true, status: true, location: true },
        },
        requester: {
          select: { id: true, firstName: true, lastName: true, email: true, department: true },
        },
        assignee: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        slaSnapshot: {
          include: { policy: true },
        },
        comments: {
          where: isEmployeeOnly ? { type: { not: CommentType.INTERNAL_NOTE } } : undefined,
          include: {
            author: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        activityLogs: {
          orderBy: { createdAt: 'desc' },
        },
        attachments: {
          include: {
            uploader: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket '${identifier}' not found`);
    }

    // Access check: Employees cannot view other employees' tickets
    if (isEmployeeOnly && ticket.requesterId !== user.id) {
      throw new ForbiddenException('Access denied: You are not authorized to view this service request.');
    }

    return ticket;
  }

  /**
   * Updates ticket status with ITIL state machine enforcement
   */
  async updateTicketStatus(id: string, dto: UpdateTicketStatusDto, user: any) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException(`Ticket '${id}' not found`);

    if (ticket.status === TicketStatus.CLOSED) {
      throw new BadRequestException('Closed tickets are immutable and cannot be updated');
    }

    if (this.isPureEmployee(user)) {
      if (ticket.requesterId !== user.id) {
        throw new ForbiddenException('You can only update your own tickets.');
      }
      const canConfirmClose =
        ticket.status === TicketStatus.RESOLVED && dto.status === TicketStatus.CLOSED;
      const canReopen =
        ticket.status === TicketStatus.RESOLVED && dto.status === TicketStatus.IN_PROGRESS;
      const canCancel =
        ticket.status === TicketStatus.NEW && dto.status === TicketStatus.CANCELLED;

      if (!canConfirmClose && !canReopen && !canCancel) {
        throw new ForbiddenException(
          'Requesters may only confirm/reopen a RESOLVED ticket or cancel a NEW ticket.',
        );
      }
    } else if (!user.permissions?.includes('ticket:update')) {
      throw new ForbiddenException('Missing ticket:update permission');
    }

    if (dto.status === TicketStatus.RESOLVED && !dto.resolutionSummary) {
      throw new BadRequestException('A resolution summary is mandatory when marking a ticket as RESOLVED');
    }

    const data: any = {
      status: dto.status,
    };

    if (dto.status === TicketStatus.RESOLVED) {
      data.resolvedAt = new Date();
      data.resolutionSummary = dto.resolutionSummary;
    } else if (dto.status === TicketStatus.CLOSED) {
      data.closedAt = new Date();
    }

    const updated = await this.prisma.ticket.update({
      where: { id },
      data: {
        ...data,
        activityLogs: {
          create: {
            actorId: user.id,
            action: 'STATUS_CHANGED',
            oldValue: ticket.status,
            newValue: dto.status,
            details: dto.resolutionSummary || `Status updated from ${ticket.status} to ${dto.status}`,
          },
        },
      },
      include: {
        category: true,
        asset: {
          select: { id: true, assetTag: true, name: true, assetType: true, status: true, location: true },
        },
        requester: { select: { id: true, firstName: true, lastName: true, email: true } },
        assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
        slaSnapshot: true,
      },
    });

    // Notify SLA Engine of state transition (handles pausing in PENDING_CUSTOMER & resolution check)
    await this.slaService.handleStatusTransition(id, ticket.status, dto.status);

    // Dispatch lifecycle notifications without blocking HTTP request
    if (dto.status === TicketStatus.RESOLVED) {
      void this.notificationsService.dispatch({
        recipientIds: [updated.requesterId],
        actorId: user.id,
        type: NotificationType.TICKET_RESOLVED,
        title: `Resolution waiting for you`,
        message: `${updated.ticketNumber} "${updated.title}" is resolved. Review the fix and confirm to close it.`,
        entityType: 'TICKET',
        entityId: updated.id,
        linkUrl: `/dashboard?ticket=${updated.id}`,
      });
    } else if (dto.status === TicketStatus.CLOSED && updated.assigneeId) {
      void this.notificationsService.dispatch({
        recipientIds: [updated.assigneeId],
        actorId: user.id,
        type: NotificationType.TICKET_CLOSED,
        title: `${updated.ticketNumber} confirmed & closed`,
        message: `${updated.requester.firstName} ${updated.requester.lastName} confirmed resolution on "${updated.title}".`,
        entityType: 'TICKET',
        entityId: updated.id,
        linkUrl: `/dashboard?ticket=${updated.id}`,
      });
    } else {
      const targetIds = [
        ...(user.id !== updated.requesterId ? [updated.requesterId] : []),
        ...(updated.assigneeId && user.id !== updated.assigneeId ? [updated.assigneeId] : []),
      ];
      if (targetIds.length > 0) {
        void this.notificationsService.dispatch({
          recipientIds: targetIds,
          actorId: user.id,
          type: NotificationType.TICKET_UPDATED,
          title: `${updated.ticketNumber} moved to ${dto.status.replace('_', ' ')}`,
          message: `"${updated.title}" was updated from ${ticket.status} to ${dto.status}.`,
          entityType: 'TICKET',
          entityId: updated.id,
          linkUrl: `/dashboard?ticket=${updated.id}`,
        });
      }
    }

    this.eventsGateway.emitToRoom(`ticket:${updated.id}`, 'ticket:updated', {
      ticketId: updated.id,
      ticketNumber: updated.ticketNumber,
      status: updated.status,
    });
    this.eventsGateway.emitToUser(updated.requesterId, 'ticket:updated', {
      ticketId: updated.id,
      status: updated.status,
    });
    this.eventsGateway.emitToRoles(
      [RoleName.IT_SUPPORT_AGENT, RoleName.IT_MANAGER],
      'ticket:updated',
      { ticketId: updated.id, status: updated.status },
    );

    void this.auditService.record({
      actorId: user?.id,
      actorEmail: user?.email,
      actorName: user ? `${user.firstName} ${user.lastName}` : undefined,
      action: 'ticket.status',
      module: 'tickets',
      resourceType: 'Ticket',
      resourceId: updated.ticketNumber,
      beforeState: { status: ticket.status },
      afterState: { status: updated.status },
    });

    return updated;
  }

  /**
   * Assigns ticket to an IT Support Agent
   */
  async assignTicket(id: string, assigneeId: string, user: any) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException(`Ticket '${id}' not found`);

    const assignee = await this.prisma.user.findUnique({ where: { id: assigneeId } });
    if (!assignee) throw new NotFoundException(`Agent '${assigneeId}' not found`);

    // Auto-advance from NEW to ASSIGNED
    const newStatus = ticket.status === TicketStatus.NEW ? TicketStatus.ASSIGNED : ticket.status;

    const updated = await this.prisma.ticket.update({
      where: { id },
      data: {
        assigneeId,
        status: newStatus,
        activityLogs: {
          create: {
            actorId: user.id,
            action: 'ASSIGNED',
            oldValue: ticket.assigneeId || 'Unassigned',
            newValue: `${assignee.firstName} ${assignee.lastName}`,
            details: `Assigned to ${assignee.firstName} ${assignee.lastName}`,
          },
        },
      },
      include: {
        category: true,
        asset: {
          select: { id: true, assetTag: true, name: true, assetType: true, status: true, location: true },
        },
        requester: { select: { id: true, firstName: true, lastName: true, email: true } },
        assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    const assignerName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'IT Manager';

    // Notify assigned agent
    void this.notificationsService.dispatch({
      recipientIds: [assigneeId],
      actorId: user.id,
      notifyActor: true,
      type: NotificationType.TICKET_ASSIGNED,
      title: `You were assigned ${updated.ticketNumber}`,
      message: `Assigned by ${assignerName}: "${updated.title}" (${updated.priority}).`,
      entityType: 'TICKET',
      entityId: updated.id,
      linkUrl: `/dashboard?ticket=${updated.id}`,
    });

    // Notify ticket requester
    if (updated.requesterId !== assigneeId) {
      void this.notificationsService.dispatch({
        recipientIds: [updated.requesterId],
        actorId: user.id,
        type: NotificationType.TICKET_UPDATED,
        title: `${updated.ticketNumber} assigned to support`,
        message: `Your request "${updated.title}" is now with ${assignee.firstName} ${assignee.lastName}.`,
        entityType: 'TICKET',
        entityId: updated.id,
        linkUrl: `/dashboard?ticket=${updated.id}`,
      });
    }

    this.eventsGateway.emitToRoom(`ticket:${updated.id}`, 'ticket:updated', {
      ticketId: updated.id,
      assigneeId,
      status: updated.status,
    });
    this.eventsGateway.emitToUser(assigneeId, 'ticket:updated', {
      ticketId: updated.id,
      assigneeId,
    });
    this.eventsGateway.emitToRoles(
      [RoleName.IT_SUPPORT_AGENT, RoleName.IT_MANAGER],
      'ticket:updated',
      { ticketId: updated.id, assigneeId },
    );

    void this.auditService.record({
      actorId: user?.id,
      actorEmail: user?.email,
      actorName: user ? `${user.firstName} ${user.lastName}` : undefined,
      action: 'ticket.assign',
      module: 'tickets',
      resourceType: 'Ticket',
      resourceId: updated.ticketNumber,
      beforeState: { assigneeId: ticket.assigneeId || null },
      afterState: { assigneeId, assigneeName: `${assignee.firstName} ${assignee.lastName}` },
    });

    return updated;
  }

  /**
   * Links or unlinks an IT CMDB asset on a ticket
   */
  async linkAsset(id: string, assetId: string | null, user: any) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException(`Ticket '${id}' not found`);

    if (this.isPureEmployee(user) && ticket.requesterId !== user.id) {
      throw new ForbiddenException('Access denied: You cannot modify another user’s ticket.');
    }

    if (assetId) {
      const asset = await this.prisma.asset.findUnique({ where: { id: assetId } });
      if (!asset) throw new NotFoundException(`Asset '${assetId}' not found`);
    }

    return this.prisma.ticket.update({
      where: { id },
      data: { assetId: assetId || null },
      include: {
        asset: { select: { id: true, assetTag: true, name: true, assetType: true, status: true } },
      },
    });
  }

  /**
   * Adds customer comment or agent internal note with privacy isolation
   */
  async addComment(ticketId: string, dto: AddCommentDto, user: any) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException(`Ticket '${ticketId}' not found`);

    const isEmployeeOnly = this.isPureEmployee(user);

    if (isEmployeeOnly && ticket.requesterId !== user.id) {
      throw new ForbiddenException('Access denied: You cannot comment on another employee’s ticket.');
    }

    // Employees can never author INTERNAL_NOTE
    if (dto.type === CommentType.INTERNAL_NOTE && isEmployeeOnly) {
      throw new ForbiddenException('Employees are not authorized to post internal support notes.');
    }

    const type = dto.type || CommentType.PUBLIC;

    // Check if this is the first agent response to satisfy SLA response metric
    const isFirstAgentResponse =
      !isEmployeeOnly &&
      !ticket.firstResponseAt &&
      type === CommentType.PUBLIC;

    const comment = await this.prisma.ticketComment.create({
      data: {
        ticketId,
        authorId: user.id,
        type,
        content: dto.content,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    if (isFirstAgentResponse) {
      await this.prisma.ticket.update({
        where: { id: ticketId },
        data: {
          firstResponseAt: new Date(),
          status: ticket.status === TicketStatus.ASSIGNED ? TicketStatus.IN_PROGRESS : ticket.status,
        },
      });
    }

    const authorName = `${comment.author.firstName} ${comment.author.lastName}`;
    if (type === CommentType.PUBLIC) {
      const targetIds =
        user.id === ticket.requesterId
          ? ticket.assigneeId
            ? [ticket.assigneeId]
            : []
          : [ticket.requesterId, ...(ticket.assigneeId ? [ticket.assigneeId] : [])];

      if (targetIds.length > 0) {
        void this.notificationsService.dispatch({
          recipientIds: targetIds,
          actorId: user.id,
          type: NotificationType.TICKET_COMMENTED,
          title: `${ticket.ticketNumber} was updated`,
          message: `${authorName} replied on "${ticket.title}".`,
          entityType: 'TICKET',
          entityId: ticket.id,
          linkUrl: `/dashboard?ticket=${ticket.id}`,
        });
      }

      this.eventsGateway.emitToRoom(`ticket:${ticket.id}`, 'ticket:updated', {
        ticketId: ticket.id,
        action: 'COMMENTED',
      });
      this.eventsGateway.emitToUser(ticket.requesterId, 'ticket:updated', {
        ticketId: ticket.id,
        action: 'COMMENTED',
      });
    } else if (ticket.assigneeId && ticket.assigneeId !== user.id) {
      void this.notificationsService.dispatch({
        recipientIds: [ticket.assigneeId],
        actorId: user.id,
        type: NotificationType.TICKET_COMMENTED,
        title: `Internal note on ${ticket.ticketNumber}`,
        message: `${authorName} added an internal note on "${ticket.title}".`,
        entityType: 'TICKET',
        entityId: ticket.id,
        linkUrl: `/dashboard?ticket=${ticket.id}`,
      });
    }

    return comment;
  }

  /**
   * Validates, stores, and records multipart ticket attachments with magic-byte verification (FR-TKT-012)
   */
  async addAttachments(ticketIdentifier: string, files: UploadedTicketFile[], user: any) {
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one attachment file is required');
    }

    const ticket = await this.prisma.ticket.findFirst({
      where: {
        OR: [{ id: ticketIdentifier }, { ticketNumber: ticketIdentifier }],
      },
    });
    if (!ticket) {
      throw new NotFoundException(`Ticket '${ticketIdentifier}' not found`);
    }

    if (this.isPureEmployee(user) && ticket.requesterId !== user.id) {
      throw new ForbiddenException('Access denied: You cannot upload attachments to this ticket.');
    }

    fs.mkdirSync(this.ticketUploadsDir, { recursive: true });

    const createdRecords: any[] = [];
    for (const file of files) {
      if (file.size > MAX_ATTACHMENT_SIZE) {
        throw new BadRequestException(`File '${file.originalname}' exceeds the 10 MB size limit.`);
      }

      const ext = path.extname(file.originalname || '').toLowerCase();
      const allowedMimes = ALLOWED_ATTACHMENT_MAP[ext];
      if (!allowedMimes || !allowedMimes.includes(file.mimetype)) {
        throw new BadRequestException(
          `Unsupported file format '${ext || file.mimetype}'. Allowed: PNG, JPG, PDF, TXT, LOG.`,
        );
      }

      this.validateMagicBytes(file.buffer, ext);

      const safeDisplayName = path.basename(file.originalname).replace(/[^\w.\- ()]/g, '_');
      const diskFilename = `${crypto.randomUUID()}${ext}`;
      const storageKey = path.posix.join('tickets', diskFilename);
      const targetPath = path.join(this.ticketUploadsDir, diskFilename);

      fs.writeFileSync(targetPath, file.buffer);

      const record = await this.prisma.ticketAttachment.create({
        data: {
          ticketId: ticket.id,
          uploaderId: user.id,
          fileName: safeDisplayName,
          fileSize: file.size,
          mimeType: file.mimetype,
          storageKey,
        },
        include: {
          uploader: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      });
      createdRecords.push(record);
    }

    await this.prisma.ticketActivityLog.create({
      data: {
        ticketId: ticket.id,
        actorId: user.id,
        action: 'ATTACHMENT_ADDED',
        newValue: createdRecords.map((r) => r.fileName).join(', '),
        details: `Uploaded ${createdRecords.length} attachment(s)`,
      },
    });

    return createdRecords;
  }

  /**
   * Authorizes and resolves an attachment path for secure download (FR-TKT-012 / BR-011)
   */
  async getAttachmentForDownload(ticketIdentifier: string, attachmentId: string, user: any) {
    const ticket = await this.prisma.ticket.findFirst({
      where: {
        OR: [{ id: ticketIdentifier }, { ticketNumber: ticketIdentifier }],
      },
    });
    if (!ticket) {
      throw new NotFoundException(`Ticket '${ticketIdentifier}' not found`);
    }

    if (this.isPureEmployee(user) && ticket.requesterId !== user.id) {
      throw new ForbiddenException('Access denied: You are not authorized to download this attachment.');
    }

    const attachment = await this.prisma.ticketAttachment.findFirst({
      where: { id: attachmentId, ticketId: ticket.id },
    });
    if (!attachment) {
      throw new NotFoundException(`Attachment '${attachmentId}' not found on ticket`);
    }

    const resolvedPath = path.resolve(this.uploadsRoot, attachment.storageKey);
    if (!resolvedPath.startsWith(this.uploadsRoot + path.sep) || !fs.existsSync(resolvedPath)) {
      throw new NotFoundException('Attachment file is missing from storage');
    }

    return {
      attachment,
      resolvedPath,
    };
  }
}

