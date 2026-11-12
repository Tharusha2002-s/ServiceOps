import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

export interface PlatformSettingsState {
  orgName: string;
  timezone: string;
  retentionPolicy: string;
  minPasswordLength: number;
  maxFailedLogins: number;
  refreshRotation: string;
  smtpHost: string;
  smtpFrom: string;
  smtpEncryption: string;
  lastBackupAt: string | null;
  lastBackupSummary: string | null;
}

const DEFAULT_SETTINGS: PlatformSettingsState = {
  orgName: 'Northwind Internal IT',
  timezone: 'Asia/Colombo',
  retentionPolicy: 'Keep active for 24 months, then archive to cold storage',
  minPasswordLength: 8,
  maxFailedLogins: 5,
  refreshRotation: 'Enabled (Detect reuse and revoke session)',
  smtpHost: 'smtp.serviceops.local',
  smtpFrom: 'no-reply@serviceops.local',
  smtpEncryption: 'STARTTLS (Port 587)',
  lastBackupAt: null,
  lastBackupSummary: null,
};

const KEY_CATEGORY: Record<string, string> = {
  orgName: 'general',
  timezone: 'general',
  retentionPolicy: 'general',
  minPasswordLength: 'security',
  maxFailedLogins: 'security',
  refreshRotation: 'security',
  smtpHost: 'email',
  smtpFrom: 'email',
  smtpEncryption: 'email',
  lastBackupAt: 'backups',
  lastBackupSummary: 'backups',
};

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getAll(): Promise<PlatformSettingsState> {
    const rows = await this.prisma.platformSetting.findMany();
    const state: any = { ...DEFAULT_SETTINGS };

    for (const row of rows) {
      if (row.key === 'minPasswordLength' || row.key === 'maxFailedLogins') {
        state[row.key] = parseInt(row.value, 10) || (DEFAULT_SETTINGS as any)[row.key];
      } else {
        state[row.key] = row.value;
      }
    }

    return state;
  }

  async update(dto: UpdateSettingsDto, actor: any): Promise<PlatformSettingsState> {
    const before = await this.getAll();
    const entries = Object.entries(dto).filter(([, v]) => v !== undefined);

    for (const [key, val] of entries) {
      await this.prisma.platformSetting.upsert({
        where: { key },
        update: {
          value: String(val),
          category: KEY_CATEGORY[key] || 'general',
          updatedById: actor?.id || null,
        },
        create: {
          key,
          value: String(val),
          category: KEY_CATEGORY[key] || 'general',
          updatedById: actor?.id || null,
        },
      });
    }

    const after = await this.getAll();

    await this.auditService.record({
      actorId: actor?.id,
      actorEmail: actor?.email,
      actorName: actor ? `${actor.firstName} ${actor.lastName}` : undefined,
      action: 'settings.update',
      module: 'settings',
      resourceType: 'PlatformSetting',
      resourceId: 'global',
      beforeState: before,
      afterState: after,
    });

    return after;
  }

  async triggerBackupSnapshot(actor: any) {
    const [users, tickets, incidents, auditLogs] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.ticket.count(),
      this.prisma.incident.count(),
      this.prisma.auditLog.count(),
    ]);

    const now = new Date().toISOString();
    const summary = `PostgreSQL logical snapshot verified: ${users} users, ${tickets} tickets, ${incidents} incidents, ${auditLogs} audit rows`;

    await Promise.all([
      this.prisma.platformSetting.upsert({
        where: { key: 'lastBackupAt' },
        update: { value: now, category: 'backups', updatedById: actor?.id || null },
        create: { key: 'lastBackupAt', value: now, category: 'backups', updatedById: actor?.id || null },
      }),
      this.prisma.platformSetting.upsert({
        where: { key: 'lastBackupSummary' },
        update: { value: summary, category: 'backups', updatedById: actor?.id || null },
        create: { key: 'lastBackupSummary', value: summary, category: 'backups', updatedById: actor?.id || null },
      }),
    ]);

    await this.auditService.record({
      actorId: actor?.id,
      actorEmail: actor?.email,
      actorName: actor ? `${actor.firstName} ${actor.lastName}` : undefined,
      action: 'backup.snapshot',
      module: 'settings',
      resourceType: 'DatabaseSnapshot',
      resourceId: now,
      afterState: { summary },
    });

    return this.getAll();
  }
}

