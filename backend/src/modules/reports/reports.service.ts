import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { RoleName, SlaStatus, TicketStatus } from '@prisma/client';

export type ReportRange = '7d' | '30d' | 'month' | 'quarter';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private resolveRangeStart(range: ReportRange = '7d'): Date {
    const now = new Date();
    switch (range) {
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case 'quarter': {
        const qMonth = Math.floor(now.getMonth() / 3) * 3;
        return new Date(now.getFullYear(), qMonth, 1);
      }
      case '7d':
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  }

  private median(values: number[]): number | null {
    if (values.length === 0) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0
      ? Math.round(sorted[mid])
      : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  }

  private sanitizeCsvCell(value: unknown): string {
    let str = value == null ? '' : String(value);
    if (/^[=+\-@\t\r]/.test(str)) {
      str = `'${str}`;
    }
    const escaped = str.replace(/"/g, '""');
    return `"${escaped}"`;
  }

  async getSummary(range: ReportRange = '7d') {
    const fromDate = this.resolveRangeStart(range);

    const [tickets, categories, agents] = await Promise.all([
      this.prisma.ticket.findMany({
        where: { createdAt: { gte: fromDate } },
        include: {
          category: { select: { id: true, code: true, name: true } },
          assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
          slaSnapshot: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.category.findMany({
        orderBy: { name: 'asc' },
      }),
      this.prisma.user.findMany({
        where: {
          userRoles: {
            some: {
              role: { name: { in: [RoleName.IT_SUPPORT_AGENT, RoleName.IT_MANAGER] } },
            },
          },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          assignedTickets: {
            where: {
              status: {
                in: [
                  TicketStatus.NEW,
                  TicketStatus.ASSIGNED,
                  TicketStatus.IN_PROGRESS,
                  TicketStatus.PENDING_CUSTOMER,
                ],
              },
            },
            select: { id: true },
          },
        },
      }),
    ]);

    const ticketsOpened = tickets.length;
    const ticketsResolved = tickets.filter(
      (t) => t.status === TicketStatus.RESOLVED || t.status === TicketStatus.CLOSED,
    ).length;
    const openCount = tickets.filter(
      (t) =>
        t.status !== TicketStatus.RESOLVED &&
        t.status !== TicketStatus.CLOSED &&
        t.status !== TicketStatus.CANCELLED,
    ).length;

    const resolutionRatePct =
      ticketsOpened > 0 ? parseFloat(((ticketsResolved / ticketsOpened) * 100).toFixed(1)) : 100;

    const responseMinutesList = tickets
      .filter((t) => t.firstResponseAt)
      .map((t) => Math.max(1, Math.round((t.firstResponseAt!.getTime() - t.createdAt.getTime()) / 60000)));

    const medianResponseMinutes = this.median(responseMinutesList) ?? 0;
    const avgResponseMinutes =
      responseMinutesList.length > 0
        ? Math.round(responseMinutesList.reduce((a, b) => a + b, 0) / responseMinutesList.length)
        : 0;

    const snapshots = tickets.filter((t) => t.slaSnapshot);
    const breachedCount = snapshots.filter(
      (t) =>
        t.slaSnapshot!.status === SlaStatus.BREACHED ||
        (t.status !== TicketStatus.RESOLVED &&
          t.status !== TicketStatus.CLOSED &&
          t.slaSnapshot!.resolutionDueAt < new Date()),
    ).length;
    const responseMetCount = snapshots.filter((t) => t.slaSnapshot!.isResponseMet !== false).length;
    const slaCompliancePct =
      snapshots.length > 0
        ? parseFloat((((snapshots.length - breachedCount) / snapshots.length) * 100).toFixed(1))
        : 100;

    const byCategory = categories.map((cat) => {
      const catTickets = tickets.filter((t) => t.categoryId === cat.id);
      const catRespMins = catTickets
        .filter((t) => t.firstResponseAt)
        .map((t) => Math.max(1, Math.round((t.firstResponseAt!.getTime() - t.createdAt.getTime()) / 60000)));
      const catBreaches = catTickets.filter(
        (t) =>
          t.slaSnapshot?.status === SlaStatus.BREACHED ||
          (t.slaSnapshot &&
            t.status !== TicketStatus.RESOLVED &&
            t.status !== TicketStatus.CLOSED &&
            t.slaSnapshot.resolutionDueAt < new Date()),
      ).length;

      return {
        categoryId: cat.id,
        categoryCode: cat.code,
        categoryName: cat.name,
        opened: catTickets.length,
        resolved: catTickets.filter(
          (t) => t.status === TicketStatus.RESOLVED || t.status === TicketStatus.CLOSED,
        ).length,
        medianResponseMinutes: this.median(catRespMins),
        breaches: catBreaches,
      };
    });

    const agentScorecard = agents.map((agent) => {
      const handled = tickets.filter((t) => t.assigneeId === agent.id);
      const resolved = handled.filter(
        (t) => t.status === TicketStatus.RESOLVED || t.status === TicketStatus.CLOSED,
      );
      const respMins = handled
        .filter((t) => t.firstResponseAt)
        .map((t) => Math.max(1, Math.round((t.firstResponseAt!.getTime() - t.createdAt.getTime()) / 60000)));
      const avgResp =
        respMins.length > 0 ? Math.round(respMins.reduce((a, b) => a + b, 0) / respMins.length) : null;
      const withSla = handled.filter((t) => t.slaSnapshot);
      const nonBreached = withSla.filter((t) => t.slaSnapshot!.status !== SlaStatus.BREACHED).length;
      const slaMetPct =
        withSla.length > 0 ? parseFloat(((nonBreached / withSla.length) * 100).toFixed(1)) : 100;

      return {
        agentId: agent.id,
        name: `${agent.firstName} ${agent.lastName}`.trim(),
        email: agent.email,
        activeOpen: agent.assignedTickets.length,
        handledInPeriod: handled.length,
        resolvedInPeriod: resolved.length,
        avgResponseMinutes: avgResp,
        slaMetPct,
      };
    });

    return {
      range,
      fromDate: fromDate.toISOString(),
      toDate: new Date().toISOString(),
      kpis: {
        ticketsOpened,
        ticketsResolved,
        openCount,
        resolutionRatePct,
        medianResponseMinutes,
        avgResponseMinutes,
        slaCompliancePct,
        responseMetCount,
        breachedCount,
      },
      byCategory,
      agentScorecard,
    };
  }

  async getTrends(range: ReportRange = '7d') {
    const days = range === '30d' || range === 'month' ? 14 : range === 'quarter' ? 21 : 10;
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1));

    const tickets = await this.prisma.ticket.findMany({
      where: {
        OR: [{ createdAt: { gte: start } }, { resolvedAt: { gte: start } }],
      },
      select: { createdAt: true, resolvedAt: true },
    });

    const buckets: Array<{ date: string; label: string; opened: number; resolved: number }> = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
      const isoDay = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
      const opened = tickets.filter((t) => t.createdAt.toISOString().slice(0, 10) === isoDay).length;
      const resolved = tickets.filter(
        (t) => t.resolvedAt && t.resolvedAt.toISOString().slice(0, 10) === isoDay,
      ).length;
      buckets.push({ date: isoDay, label, opened, resolved });
    }

    return { range, days, series: buckets };
  }

  async exportCsv(range: ReportRange = '7d'): Promise<string> {
    const fromDate = this.resolveRangeStart(range);

    const tickets = await this.prisma.ticket.findMany({
      where: { createdAt: { gte: fromDate } },
      include: {
        category: { select: { name: true } },
        requester: { select: { firstName: true, lastName: true, email: true } },
        assignee: { select: { firstName: true, lastName: true, email: true } },
        slaSnapshot: { select: { status: true, responseDueAt: true, resolutionDueAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const header = [
      'Ticket Number',
      'Title',
      'Category',
      'Priority',
      'Status',
      'Requester',
      'Requester Email',
      'Assignee',
      'SLA Status',
      'Created At',
      'First Response At',
      'Resolved At',
    ];

    const rows = tickets.map((t) => [
      t.ticketNumber,
      t.title,
      t.category?.name || '',
      t.priority,
      t.status,
      `${t.requester.firstName} ${t.requester.lastName}`.trim(),
      t.requester.email,
      t.assignee ? `${t.assignee.firstName} ${t.assignee.lastName}`.trim() : 'Unassigned',
      t.slaSnapshot?.status || 'N/A',
      t.createdAt.toISOString(),
      t.firstResponseAt ? t.firstResponseAt.toISOString() : '',
      t.resolvedAt ? t.resolvedAt.toISOString() : '',
    ]);

    return [header, ...rows]
      .map((row) => row.map((cell) => this.sanitizeCsvCell(cell)).join(','))
      .join('\r\n');
  }
}
