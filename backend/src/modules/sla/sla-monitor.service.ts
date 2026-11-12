import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PrismaService } from '@/database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EventsGateway } from '../events/events.gateway';
import {
  NotificationType,
  RoleName,
  SlaStatus,
  TicketStatus,
} from '@prisma/client';

@Injectable()
export class SlaMonitorService {
  private readonly logger = new Logger(SlaMonitorService.name);
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  /**
   * Periodic background sweep every 60 seconds checking active SLA deadlines (FR-SLA-009).
   */
  @Interval(60000)
  async handleScheduledSweep() {
    await this.evaluateAllActiveSlas();
  }

  /**
   * Evaluates all open tickets against their immutable SLA deadline snapshots,
   * triggering one-time warnings at thresholdPct and escalation alerts on breach.
   */
  async evaluateAllActiveSlas() {
    if (this.running) {
      return { skipped: true, scanned: 0, warningsTriggered: 0, breachesTriggered: 0 };
    }

    this.running = true;
    const now = new Date();
    const nowMs = now.getTime();
    let warningsTriggered = 0;
    let breachesTriggered = 0;

    try {
      const activeSnapshots = await this.prisma.ticketSlaSnapshot.findMany({
        where: {
          status: { notIn: [SlaStatus.MET, SlaStatus.PAUSED] },
          ticket: {
            status: {
              notIn: [
                TicketStatus.RESOLVED,
                TicketStatus.CLOSED,
                TicketStatus.CANCELLED,
                TicketStatus.PENDING_CUSTOMER,
              ],
            },
          },
        },
        include: {
          policy: { select: { warningThresholdPct: true } },
          ticket: {
            select: {
              id: true,
              ticketNumber: true,
              title: true,
              priority: true,
              status: true,
              assigneeId: true,
            },
          },
        },
      });

      for (const snap of activeSnapshots) {
        const responseBreached = !snap.firstResponseAt && nowMs > snap.responseDueAt.getTime();
        const resolutionBreached = nowMs > snap.resolutionDueAt.getTime();

        if (responseBreached || resolutionBreached) {
          const reason = resolutionBreached
            ? 'Resolution SLA deadline exceeded'
            : 'First response SLA deadline exceeded';

          const needsNotification = !snap.breachNotifiedAt;

          if (snap.status !== SlaStatus.BREACHED || needsNotification || (responseBreached && snap.isResponseMet === null)) {
            await this.prisma.ticketSlaSnapshot.update({
              where: { id: snap.id },
              data: {
                status: SlaStatus.BREACHED,
                ...(responseBreached && snap.isResponseMet === null ? { isResponseMet: false } : {}),
                ...(needsNotification ? { breachNotifiedAt: now } : {}),
              },
            });
          }

          if (needsNotification) {
            breachesTriggered++;
            await this.prisma.ticketActivityLog.create({
              data: {
                ticketId: snap.ticket.id,
                action: 'SLA_BREACHED',
                oldValue: snap.status,
                newValue: SlaStatus.BREACHED,
                details: reason,
              },
            });

            await this.notificationsService.notifyRoles([RoleName.IT_MANAGER], {
              extraRecipientIds: snap.ticket.assigneeId ? [snap.ticket.assigneeId] : [],
              type: NotificationType.SLA_BREACHED,
              title: `SLA Breached: ${snap.ticket.ticketNumber}`,
              message: `${snap.ticket.ticketNumber} "${snap.ticket.title}" — ${reason}. Manager escalation required.`,
              entityType: 'TICKET',
              entityId: snap.ticket.id,
              linkUrl: `/dashboard?ticket=${snap.ticket.id}`,
            });

            this.eventsGateway.emitToRoles(
              [RoleName.IT_SUPPORT_AGENT, RoleName.IT_MANAGER, RoleName.SYSTEM_ADMINISTRATOR],
              'sla:alert',
              {
                level: 'BREACHED',
                ticketId: snap.ticket.id,
                ticketNumber: snap.ticket.ticketNumber,
                reason,
              },
            );
          }

          continue;
        }

        // Check warning threshold against resolution or pending response window
        const thresholdFraction = (snap.policy?.warningThresholdPct ?? 75) / 100;
        const createdMs = snap.createdAt.getTime();
        const resolutionTotal = snap.resolutionDueAt.getTime() - createdMs;
        const responseTotal = snap.responseDueAt.getTime() - createdMs;
        const elapsedMs = nowMs - createdMs;

        const resolutionAtRisk =
          resolutionTotal > 0 && elapsedMs / resolutionTotal >= thresholdFraction;
        const responseAtRisk =
          !snap.firstResponseAt &&
          responseTotal > 0 &&
          elapsedMs / responseTotal >= thresholdFraction;

        if (resolutionAtRisk || responseAtRisk) {
          const needsWarning = !snap.warningNotifiedAt;

          if (snap.status !== SlaStatus.AT_RISK || needsWarning) {
            await this.prisma.ticketSlaSnapshot.update({
              where: { id: snap.id },
              data: {
                status: SlaStatus.AT_RISK,
                ...(needsWarning ? { warningNotifiedAt: now } : {}),
              },
            });
          }

          if (needsWarning) {
            warningsTriggered++;
            const warningDetail = responseAtRisk
              ? 'Approaching first-response SLA deadline'
              : 'Approaching resolution SLA deadline';

            await this.prisma.ticketActivityLog.create({
              data: {
                ticketId: snap.ticket.id,
                action: 'SLA_WARNING',
                oldValue: snap.status,
                newValue: SlaStatus.AT_RISK,
                details: warningDetail,
              },
            });

            await this.notificationsService.notifyRoles([RoleName.IT_MANAGER], {
              extraRecipientIds: snap.ticket.assigneeId ? [snap.ticket.assigneeId] : [],
              type: NotificationType.SLA_WARNING,
              title: `SLA Warning: ${snap.ticket.ticketNumber}`,
              message: `${snap.ticket.ticketNumber} "${snap.ticket.title}" — ${warningDetail}.`,
              entityType: 'TICKET',
              entityId: snap.ticket.id,
              linkUrl: `/dashboard?ticket=${snap.ticket.id}`,
            });

            this.eventsGateway.emitToRoles(
              [RoleName.IT_SUPPORT_AGENT, RoleName.IT_MANAGER, RoleName.SYSTEM_ADMINISTRATOR],
              'sla:alert',
              {
                level: 'AT_RISK',
                ticketId: snap.ticket.id,
                ticketNumber: snap.ticket.ticketNumber,
                reason: warningDetail,
              },
            );
          }
        }
      }

      if (warningsTriggered > 0 || breachesTriggered > 0) {
        this.logger.log(
          `SLA monitor sweep: scanned=${activeSnapshots.length}, warnings=${warningsTriggered}, breaches=${breachesTriggered}`,
        );
      }

      return {
        skipped: false,
        scanned: activeSnapshots.length,
        warningsTriggered,
        breachesTriggered,
      };
    } catch (error: any) {
      this.logger.error(`SLA monitor sweep failed: ${error?.message || error}`);
      throw error;
    } finally {
      this.running = false;
    }
  }
}

