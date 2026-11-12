import { AuditService } from './audit.service';

describe('AuditService (Append-Only Hash Chain & Secret Scrubbing)', () => {
  it('redacts sensitive credential fields regardless of nesting and creates deterministic chain', async () => {
    const rows: any[] = [];
    const mockPrisma: any = {
      auditLog: {
        findFirst: jest.fn(async () => (rows.length > 0 ? rows[rows.length - 1] : null)),
        findMany: jest.fn(async () => [...rows]),
        create: jest.fn(async ({ data }: any) => {
          const rec = { id: `id-${rows.length + 1}`, ...data };
          rows.push(rec);
          return rec;
        }),
      },
    };

    const service = new AuditService(mockPrisma);

    const first = await service.record({
      actorId: 'u1',
      actorEmail: 'admin@serviceops.local',
      actorName: 'Admin',
      action: 'settings.update',
      module: 'settings',
      resourceType: 'PlatformSetting',
      resourceId: 'global',
      afterState: {
        timezone: 'Asia/Colombo',
        smtpPass: 'SuperSecret123!',
        nested: { passwordHash: 'argon2id-raw', token: 'abc' },
      },
    });

    const state = first?.afterState as Record<string, any>;
    expect(state.smtpPass).toBe('[REDACTED]');
    expect(state.nested.passwordHash).toBe('[REDACTED]');
    expect(state.nested.token).toBe('[REDACTED]');
    expect(state.timezone).toBe('Asia/Colombo');

    await service.record({
      actorId: 'u1',
      actorEmail: 'admin@serviceops.local',
      actorName: 'Admin',
      action: 'role.grant',
      module: 'users',
      resourceType: 'User',
      resourceId: 'agent@serviceops.local',
      beforeState: { roles: ['EMPLOYEE'] },
      afterState: { roles: ['IT_SUPPORT_AGENT'] },
    });

    const verified = await service.verifyChain();
    expect(verified.intact).toBe(true);
    expect(verified.checked).toBe(2);

    // Simulate tampering on row 1 and verify detection
    rows[0].afterState.timezone = 'UTC';
    const tamperedCheck = await service.verifyChain();
    expect(tamperedCheck.intact).toBe(false);
    expect(tamperedCheck.brokenId).toBe('id-1');
  });
});
