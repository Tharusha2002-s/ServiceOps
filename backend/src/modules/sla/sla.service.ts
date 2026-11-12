import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BusinessHoursCalculator } from './business-hours.calculator';
import { CreateSlaPolicyDto } from './dto/create-sla-policy.dto';
import {
  TicketPriority,
  TicketStatus,
  SlaStatus,
} from '@prisma/client';

@Injectable()
export class SlaService {
  private readonly logger = new Logger(SlaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly businessHoursCalculator: BusinessHoursCalculator,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Lists all configured SLA policy tiers
   */
  async findAllPolicies() {
    return this.prisma.slaPolicy.findMany({
      orderBy: { responseTargetMinutes: 'asc' },
    });
  }

  /**
   * Creates or updates an organizational SLA policy tier
   */
  async upsertPolicy(dto: CreateSlaPolicyDto, actor?: any) {
    const before = await this.prisma.slaPolicy.findUnique({ where: { priority: dto.priority } });
    const policy = await this.prisma.slaPolicy.upsert({
      where: { priority: dto.priority },
      update: {
        name: dto.name,
        description: dto.description,
        responseTargetMinutes: dto.responseTargetMinutes,
        resolutionTargetMinutes: dto.resolutionTargetMinutes,
        businessHoursOnly: dto.businessHoursOnly ?? true,
        warningThresholdPct: dto.warningThresholdPct ?? 75,
      },
      create: {
        name: dto.name,
        priority: dto.priority,
        description: dto.description,
        responseTargetMinutes: dto.responseTargetMinutes,
        resolutionTargetMinutes: dto.resolutionTargetMinutes,
        businessHoursOnly: dto.businessHoursOnly ?? true,
        warningThresholdPct: dto.warningThresholdPct ?? 75,
      },
    });

    if (actor) {
      void this.auditService.record({
        actorId: actor.id,
        actorEmail: actor.email,
        actorName: `${actor.firstName} ${actor.lastName}`,
        action: 'sla.policy.update',
        module: 'sla',
        resourceType: 'SlaPolicy',
        resourceId: dto.priority,
        beforeState: before
          ? {
              responseTargetMinutes: before.responseTargetMinutes,
              resolutionTargetMinutes: before.resolutionTargetMinutes,
            }
          : null,
        afterState: {
          responseTargetMinutes: policy.responseTargetMinutes,
          resolutionTargetMinutes: policy.resolutionTargetMinutes,
        },
      });
    }

    return policy;
  }

  /**
   * Creates an immutable SLA Policy Snapshot on ticket creation (ADR-007 / BR-008).
   * Calculates realistic business hour deadlines.
   */
  async snapshotTicketSla(ticketId: string, priority: TicketPriority, startTime: Date = new Date()) {
    let policy = await this.prisma.slaPolicy.findUnique({ where: { priority } });

    if (!policy) {
      // Fallback defaults if not seeded
      policy = await this.upsertPolicy({
        name: `Default ${priority} Policy`,
        priority,
        responseTargetMinutes: priority === TicketPriority.CRITICAL_P1 ? 15 : 240,
        resolutionTargetMinutes: priority === TicketPriority.CRITICAL_P1 ? 120 : 1440,
        businessHoursOnly: priority !== TicketPriority.CRITICAL_P1,
        warningThresholdPct: 75,
      });
    }

    const responseDueAt = this.businessHoursCalculator.addBusinessMinutes(
      startTime,
      policy.responseTargetMinutes,
      policy.businessHoursOnly,
      policy.businessStartHour,
      policy.businessEndHour,
    );

    const resolutionDueAt = this.businessHoursCalculator.addBusinessMinutes(
      startTime,
      policy.resolutionTargetMinutes,
      policy.businessHoursOnly,
      policy.businessStartHour,
      policy.businessEndHour,
    );

    const snapshot = await this.prisma.ticketSlaSnapshot.upsert({
      where: { ticketId },
      update: {
        policyId: policy.id,
        responseTargetMinutes: policy.responseTargetMinutes,
        resolutionTargetMinutes: policy.resolutionTargetMinutes,
        responseDueAt,
        resolutionDueAt,
        status: SlaStatus.ON_TRACK,
      },
      create: {
        ticketId,
        policyId: policy.id,
        responseTargetMinutes: policy.responseTargetMinutes,
        resolutionTargetMinutes: policy.resolutionTargetMinutes,
        responseDueAt,
        resolutionDueAt,
        status: SlaStatus.ON_TRACK,
      },
    });

    return {
      snapshot,
      responseDueAt,
      resolutionDueAt,
    };
  }

  /**
   * Handles SLA clock state changes: Pauses during PENDING_CUSTOMER and resumes upon customer interaction (BR-007).
   */
  async handleStatusTransition(ticketId: string, oldStatus: TicketStatus, newStatus: TicketStatus) {
    const snapshot = await this.prisma.ticketSlaSnapshot.findUnique({ where: { ticketId } });
    if (!snapshot) return;

    const now = new Date();

    // 1. Entering PENDING_CUSTOMER -> PAUSE SLA CLOCK
    if (newStatus === TicketStatus.PENDING_CUSTOMER && oldStatus !== TicketStatus.PENDING_CUSTOMER) {
      await this.prisma.ticketSlaSnapshot.update({
        where: { ticketId },
        data: {
          pausedAt: now,
          status: SlaStatus.PAUSED,
        },
      });
      this.logger.log(`SLA Clock PAUSED for ticket ${ticketId} (Pending customer response)`);
      return;
    }

    // 2. Resuming from PENDING_CUSTOMER -> EXTEND DEADLINES BY PAUSED TIME
    if (oldStatus === TicketStatus.PENDING_CUSTOMER && newStatus !== TicketStatus.PENDING_CUSTOMER) {
      if (snapshot.pausedAt) {
        const pausedMs = now.getTime() - snapshot.pausedAt.getTime();
        const pausedMinutes = Math.max(1, Math.floor(pausedMs / (1000 * 60)));

        const newResponseDue = new Date(snapshot.responseDueAt.getTime() + pausedMs);
        const newResolutionDue = new Date(snapshot.resolutionDueAt.getTime() + pausedMs);

        await this.prisma.ticketSlaSnapshot.update({
          where: { ticketId },
          data: {
            pausedAt: null,
            totalPausedMinutes: snapshot.totalPausedMinutes + pausedMinutes,
            responseDueAt: newResponseDue,
            resolutionDueAt: newResolutionDue,
            status: SlaStatus.ON_TRACK,
          },
        });

        // Also update the core ticket deadlines
        await this.prisma.ticket.update({
          where: { id: ticketId },
          data: {
            responseDueAt: newResponseDue,
            resolutionDueAt: newResolutionDue,
          },
        });

        this.logger.log(`SLA Clock RESUMED for ticket ${ticketId}. Deadlines extended by ${pausedMinutes} minutes.`);
      }
      return;
    }

    // 3. Ticket RESOLVED -> Check Resolution Compliance
    if (newStatus === TicketStatus.RESOLVED && !snapshot.resolvedAt) {
      const isResolutionMet = now <= snapshot.resolutionDueAt;
      const isMetOverall = (snapshot.isResponseMet ?? true) && isResolutionMet;

      await this.prisma.ticketSlaSnapshot.update({
        where: { ticketId },
        data: {
          resolvedAt: now,
          isResolutionMet,
          status: isMetOverall ? SlaStatus.MET : SlaStatus.BREACHED,
        },
      });
    }
  }

  /**
   * Evaluates real-time SLA status (ON_TRACK, AT_RISK, BREACHED)
   */
  evaluateCurrentSlaStatus(snapshot: any, ticket: any): SlaStatus {
    if (ticket.status === TicketStatus.PENDING_CUSTOMER || snapshot.status === SlaStatus.PAUSED) {
      return SlaStatus.PAUSED;
    }

    if (ticket.status === TicketStatus.RESOLVED || ticket.status === TicketStatus.CLOSED) {
      if (snapshot.isResolutionMet && (snapshot.isResponseMet ?? true)) {
        return SlaStatus.MET;
      }
      return SlaStatus.BREACHED;
    }

    const now = Date.now();
    const deadline = snapshot.resolutionDueAt.getTime();
    const created = snapshot.createdAt.getTime();
    const totalDuration = deadline - created;
    const elapsed = now - created;

    if (now > deadline) {
      return SlaStatus.BREACHED;
    }

    if (totalDuration > 0 && elapsed / totalDuration >= 0.75) {
      return SlaStatus.AT_RISK;
    }

    return SlaStatus.ON_TRACK;
  }

  /**
   * Retrieves overall organizational SLA compliance metrics
   */
  async getComplianceMetrics() {
    const snapshots = await this.prisma.ticketSlaSnapshot.findMany({
      include: {
        ticket: { select: { ticketNumber: true, status: true, title: true, priority: true } },
      },
    });

    const total = snapshots.length;
    if (total === 0) {
      return {
        complianceRatePct: 100,
        totalEvaluated: 0,
        metCount: 0,
        breachedCount: 0,
        atRiskCount: 0,
        onTrackCount: 0,
        pausedCount: 0,
      };
    }

    let metCount = 0;
    let breachedCount = 0;
    let atRiskCount = 0;
    let onTrackCount = 0;
    let pausedCount = 0;

    for (const s of snapshots) {
      const status = this.evaluateCurrentSlaStatus(s, s.ticket);
      switch (status) {
        case SlaStatus.MET:
          metCount++;
          break;
        case SlaStatus.BREACHED:
          breachedCount++;
          break;
        case SlaStatus.AT_RISK:
          atRiskCount++;
          break;
        case SlaStatus.PAUSED:
          pausedCount++;
          break;
        case SlaStatus.ON_TRACK:
        default:
          onTrackCount++;
          break;
      }
    }

    const nonBreached = total - breachedCount;
    const complianceRatePct = parseFloat(((nonBreached / total) * 100).toFixed(1));

    return {
      complianceRatePct,
      totalEvaluated: total,
      metCount,
      breachedCount,
      atRiskCount,
      onTrackCount,
      pausedCount,
    };
  }

  /**
   * Retrieves breached tickets for management escalation
   */
  async getBreachedTickets() {
    return this.prisma.ticket.findMany({
      where: {
        OR: [
          { slaSnapshot: { status: SlaStatus.BREACHED } },
          {
            status: { notIn: [TicketStatus.RESOLVED, TicketStatus.CLOSED] },
            resolutionDueAt: { lt: new Date() },
          },
          {
            status: TicketStatus.NEW,
            firstResponseAt: null,
            responseDueAt: { lt: new Date() },
          },
        ],
      },
      include: {
        category: true,
        requester: { select: { firstName: true, lastName: true, email: true } },
        assignee: { select: { firstName: true, lastName: true, email: true } },
        slaSnapshot: true,
      },
      orderBy: { responseDueAt: 'asc' },
    });
  }
}

