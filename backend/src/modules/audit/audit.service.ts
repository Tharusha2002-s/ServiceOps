import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '@/database/prisma.service';

export interface RecordAuditParams {
  actorId?: string | null;
  actorEmail?: string;
  actorName?: string;
  action: string;
  module: string;
  resourceType: string;
  resourceId?: string | null;
  ipAddress?: string | null;
  beforeState?: unknown;
  afterState?: unknown;
  metadata?: unknown;
}

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'refreshtoken',
  'accesstoken',
  'token',
  'tokenhash',
  'secret',
  'twofactorsecret',
  'smtppass',
  'pass',
]);

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(private readonly prisma: PrismaService) {}

  private sanitizePayload(val: unknown): unknown {
    if (val === null || val === undefined) return undefined;
    if (val instanceof Date) return val.toISOString();
    if (Array.isArray(val)) return val.map((item) => this.sanitizePayload(item));
    if (typeof val === 'object') {
      const cleaned: Record<string, unknown> = {};
      for (const k of Object.keys(val as Record<string, unknown>).sort()) {
        const rawVal = (val as Record<string, unknown>)[k];
        if (rawVal === undefined) continue;
        if (SENSITIVE_KEYS.has(k.toLowerCase())) {
          cleaned[k] = '[REDACTED]';
        } else {
          const nested = this.sanitizePayload(rawVal);
          if (nested !== undefined) {
            cleaned[k] = nested;
          }
        }
      }
      return cleaned;
    }
    return val;
  }

  private canonicalStringify(val: unknown): string {
    if (val === null || val === undefined) return 'null';
    if (Array.isArray(val)) {
      return `[${val.map((v) => this.canonicalStringify(v)).join(',')}]`;
    }
    if (typeof val === 'object') {
      const obj = val as Record<string, unknown>;
      const entries = Object.keys(obj)
        .sort()
        .filter((k) => obj[k] !== undefined)
        .map((k) => `${JSON.stringify(k)}:${this.canonicalStringify(obj[k])}`);
      return `{${entries.join(',')}}`;
    }
    return JSON.stringify(val);
  }

  private computeChecksum(
    prevChecksum: string,
    payload: {
      actorEmail: string;
      action: string;
      module: string;
      resourceType: string;
      resourceId?: string | null;
      beforeState?: unknown;
      afterState?: unknown;
    },
  ): string {
    return crypto
      .createHash('sha256')
      .update(this.canonicalStringify({ prevChecksum, ...payload }))
      .digest('hex');
  }

  /**
   * Append-only audit entry writer with scrubbed secrets & serialized SHA-256 chain checksum.
   */
  async record(params: RecordAuditParams) {
    const task = async () => {
      try {
        const latest = await this.prisma.auditLog.findFirst({
          orderBy: { createdAt: 'desc' },
          select: { checksum: true, createdAt: true },
        });

        const prevChecksum = latest?.checksum || 'GENESIS';
        const now = new Date();
        const createdAt =
          latest?.createdAt && now.getTime() <= latest.createdAt.getTime()
            ? new Date(latest.createdAt.getTime() + 1)
            : now;
        const beforeState = this.sanitizePayload(params.beforeState);
        const afterState = this.sanitizePayload(params.afterState);
        const metadata = this.sanitizePayload(params.metadata);
        const actorEmail = params.actorEmail || 'system@serviceops.local';
        const actorName = params.actorName || 'System';

        const checksum = this.computeChecksum(prevChecksum, {
          actorEmail,
          action: params.action,
          module: params.module,
          resourceType: params.resourceType,
          resourceId: params.resourceId ?? null,
          beforeState: beforeState ?? null,
          afterState: afterState ?? null,
        });

        return await this.prisma.auditLog.create({
          data: {
            actorId: params.actorId || null,
            actorEmail,
            actorName,
            action: params.action,
            module: params.module,
            resourceType: params.resourceType,
            resourceId: params.resourceId || null,
            ipAddress: params.ipAddress || null,
            beforeState: beforeState as any,
            afterState: afterState as any,
            metadata: metadata as any,
            checksum,
            createdAt,
          },
        });
      } catch (error: any) {
        this.logger.warn(`Failed to write audit log (${params.action}): ${error?.message}`);
        return null;
      }
    };

    const next = this.writeQueue.then(task);
    this.writeQueue = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  }

  async findAll(filters?: {
    module?: string;
    action?: string;
    search?: string;
    limit?: number;
  }) {
    const where: any = {};
    if (filters?.module && filters.module !== 'all') {
      where.module = filters.module;
    }
    if (filters?.action) {
      where.action = { contains: filters.action, mode: 'insensitive' };
    }
    if (filters?.search) {
      where.OR = [
        { action: { contains: filters.search, mode: 'insensitive' } },
        { actorEmail: { contains: filters.search, mode: 'insensitive' } },
        { actorName: { contains: filters.search, mode: 'insensitive' } },
        { resourceType: { contains: filters.search, mode: 'insensitive' } },
        { resourceId: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [logs, totalCount, groupedModules] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Math.min(Math.max(filters?.limit ?? 100, 1), 250),
      }),
      this.prisma.auditLog.count(),
      this.prisma.auditLog.groupBy({
        by: ['module'],
        _count: { _all: true },
      }),
    ]);

    return {
      logs,
      totalCount,
      moduleCounts: groupedModules.reduce<Record<string, number>>((acc, row) => {
        acc[row.module] = row._count._all;
        return acc;
      }, {}),
    };
  }

  async verifyChain(limit = 200) {
    const logs = await this.prisma.auditLog.findMany({
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: limit,
    });

    let prev = 'GENESIS';
    let verified = 0;

    for (const row of logs) {
      const expected = this.computeChecksum(prev, {
        actorEmail: row.actorEmail,
        action: row.action,
        module: row.module,
        resourceType: row.resourceType,
        resourceId: row.resourceId ?? null,
        beforeState: row.beforeState ?? null,
        afterState: row.afterState ?? null,
      });

      if (expected !== row.checksum) {
        return {
          intact: false,
          checked: verified + 1,
          brokenId: row.id,
        };
      }
      prev = row.checksum;
      verified++;
    }

    return {
      intact: true,
      checked: verified,
      latestChecksum: prev,
    };
  }

  private sanitizeCsv(value: unknown): string {
    let str = value == null ? '' : String(value);
    if (/^[=+\-@\t\r]/.test(str)) {
      str = `'${str}`;
    }
    return `"${str.replace(/"/g, '""')}"`;
  }

  async exportCsv(): Promise<string> {
    const logs = await this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    const header = [
      'Timestamp',
      'Actor Name',
      'Actor Email',
      'Module',
      'Action',
      'Resource Type',
      'Resource ID',
      'IP Address',
      'Checksum',
    ];

    const rows = logs.map((l) => [
      l.createdAt.toISOString(),
      l.actorName,
      l.actorEmail,
      l.module,
      l.action,
      l.resourceType,
      l.resourceId || '',
      l.ipAddress || '',
      l.checksum,
    ]);

    return [header, ...rows]
      .map((row) => row.map((c) => this.sanitizeCsv(c)).join(','))
      .join('\r\n');
  }
}

