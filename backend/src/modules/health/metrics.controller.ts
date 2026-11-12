import { Controller, Get, Header } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '@/common/decorators/public.decorator';
import { PrismaService } from '@/database/prisma.service';

@ApiTags('Observability & Metrics')
@Controller()
export class MetricsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('metrics')
  @Public()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  @ApiOperation({ summary: 'Prometheus Metrics Exposition Endpoint' })
  async getMetrics(): Promise<string> {
    return this.buildPrometheusPayload();
  }

  @Get('api/v1/metrics')
  @Public()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  @ApiOperation({ summary: 'Versioned Prometheus Metrics Endpoint' })
  async getVersionedMetrics(): Promise<string> {
    return this.buildPrometheusPayload();
  }

  private async buildPrometheusPayload(): Promise<string> {
    let dbUp = 1;
    let totalTickets = 0;
    let openTickets = 0;
    let breachedSla = 0;
    let activeIncidents = 0;
    let auditLogs = 0;
    let publishedKb = 0;
    let totalAssets = 0;

    try {
      const [tickets, open, breached, incidents, audits, kb, assets] = await Promise.all([
        this.prisma.ticket.count(),
        this.prisma.ticket.count({
          where: { status: { in: ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'PENDING_CUSTOMER'] } },
        }),
        this.prisma.ticketSlaSnapshot.count({
          where: { OR: [{ status: 'BREACHED' }, { isResponseMet: false }, { isResolutionMet: false }] },
        }),
        this.prisma.incident.count({
          where: { status: { in: ['DECLARED', 'INVESTIGATING', 'MITIGATED', 'MONITORING'] } },
        }),
        this.prisma.auditLog.count(),
        this.prisma.knowledgeArticle.count({ where: { status: 'PUBLISHED' } }),
        this.prisma.asset.count(),
      ]);
      totalTickets = tickets;
      openTickets = open;
      breachedSla = breached;
      activeIncidents = incidents;
      auditLogs = audits;
      publishedKb = kb;
      totalAssets = assets;
    } catch {
      dbUp = 0;
    }

    const mem = process.memoryUsage();
    const uptimeSec = Math.floor(process.uptime());

    return [
      '# HELP serviceops_up ServiceOps application and database availability (1 = UP, 0 = DEGRADED)',
      '# TYPE serviceops_up gauge',
      `serviceops_up ${dbUp}`,
      '# HELP serviceops_uptime_seconds Process uptime in seconds',
      '# TYPE serviceops_uptime_seconds counter',
      `serviceops_uptime_seconds ${uptimeSec}`,
      '# HELP serviceops_process_resident_memory_bytes Resident set size memory in bytes',
      '# TYPE serviceops_process_resident_memory_bytes gauge',
      `serviceops_process_resident_memory_bytes ${mem.rss}`,
      '# HELP serviceops_nodejs_heap_used_bytes Node.js V8 heap used in bytes',
      '# TYPE serviceops_nodejs_heap_used_bytes gauge',
      `serviceops_nodejs_heap_used_bytes ${mem.heapUsed}`,
      '# HELP serviceops_tickets_total Total tickets recorded in ServiceOps',
      '# TYPE serviceops_tickets_total gauge',
      `serviceops_tickets_total ${totalTickets}`,
      '# HELP serviceops_tickets_open Currently active/open tickets',
      '# TYPE serviceops_tickets_open gauge',
      `serviceops_tickets_open ${openTickets}`,
      '# HELP serviceops_tickets_breached_sla Tickets with SLA response or resolution breach',
      '# TYPE serviceops_tickets_breached_sla gauge',
      `serviceops_tickets_breached_sla ${breachedSla}`,
      '# HELP serviceops_incidents_active Active non-closed operational incidents',
      '# TYPE serviceops_incidents_active gauge',
      `serviceops_incidents_active ${activeIncidents}`,
      '# HELP serviceops_audit_logs_total Immutable hash-chained audit records count',
      '# TYPE serviceops_audit_logs_total counter',
      `serviceops_audit_logs_total ${auditLogs}`,
      '# HELP serviceops_kb_articles_published Published Knowledge Base articles',
      '# TYPE serviceops_kb_articles_published gauge',
      `serviceops_kb_articles_published ${publishedKb}`,
      '# HELP serviceops_assets_total Registered CMDB IT assets',
      '# TYPE serviceops_assets_total gauge',
      `serviceops_assets_total ${totalAssets}`,
      '',
    ].join('\n');
  }
}
