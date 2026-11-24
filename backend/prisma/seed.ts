import {
  PrismaClient,
  RoleName,
  UserStatus,
  TicketPriority,
} from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('--- [ServiceOps Clean Database Setup] Starting Real Production Base Seeding ---');

  // 1. Purge all dummy operational records & mock users
  console.log('Purging mock operational records from database...');
  await prisma.notificationDelivery.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.incidentUpdate.deleteMany();
  await prisma.ticketAttachment.deleteMany();
  await prisma.ticketComment.deleteMany();
  await prisma.ticketActivityLog.deleteMany();
  await prisma.ticketSlaSnapshot.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.knowledgeArticle.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.passwordResetToken.deleteMany();

  // Delete non-admin users and user-role relations
  await prisma.userRole.deleteMany({
    where: {
      user: {
        email: { not: 'admin@serviceops.local' },
      },
    },
  });
  await prisma.user.deleteMany({
    where: {
      email: { not: 'admin@serviceops.local' },
    },
  });
  console.log('Cleaned all mock tickets, incidents, comments, assets, KB articles, and dummy users.');

  // 2. Seed Essential Roles
  const rolesData = [
    { name: RoleName.SYSTEM_ADMINISTRATOR, displayName: 'System Administrator', description: 'Full administrative access to platform configuration, users, and audit logs.' },
    { name: RoleName.IT_MANAGER, displayName: 'IT Manager', description: 'Supervises ticket queues, SLA compliance, escalations, reporting, and agent allocations.' },
    { name: RoleName.IT_SUPPORT_AGENT, displayName: 'IT Support Agent', description: 'Handles assigned service tickets, manages incidents, and collaborates internally.' },
    { name: RoleName.EMPLOYEE, displayName: 'Employee / Requester', description: 'Submits service requests, tracks status, and views self-service knowledge articles.' },
  ];

  const rolesMap = new Map<RoleName, string>();
  for (const r of rolesData) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: { displayName: r.displayName, description: r.description },
      create: { name: r.name, displayName: r.displayName, description: r.description, isSystem: true },
    });
    rolesMap.set(r.name, role.id);
  }
  console.log('Roles established: 4 enterprise roles');

  // 3. Seed Granular Permissions & Mappings
  const permissionsData = [
    { name: 'ticket:create', module: 'tickets', description: 'Create new service requests and incidents' },
    { name: 'ticket:read_own', module: 'tickets', description: 'View own submitted tickets' },
    { name: 'ticket:read_assigned', module: 'tickets', description: 'View tickets assigned to current agent or team' },
    { name: 'ticket:read_all', module: 'tickets', description: 'View all tickets in the system' },
    { name: 'ticket:update', module: 'tickets', description: 'Update status, priority, and metadata of tickets' },
    { name: 'ticket:assign', module: 'tickets', description: 'Assign or reassign tickets to agents' },
    { name: 'ticket:internal_note', module: 'tickets', description: 'Create and view agent-only internal notes' },
    { name: 'ticket:delete', module: 'tickets', description: 'Soft delete tickets' },
    { name: 'incident:declare', module: 'incidents', description: 'Declare major incidents (P1/P2)' },
    { name: 'incident:read', module: 'incidents', description: 'View incident registry and timeline' },
    { name: 'incident:update', module: 'incidents', description: 'Update incident status and war room' },
    { name: 'sla:view', module: 'sla', description: 'View SLA policies and compliance metrics' },
    { name: 'sla:manage', module: 'sla', description: 'Configure SLA thresholds, escalation tiers, and business hours' },
    { name: 'kb:read', module: 'knowledge', description: 'Browse and search public knowledge articles' },
    { name: 'kb:manage', module: 'knowledge', description: 'Author, publish, and archive knowledge articles' },
    { name: 'asset:read', module: 'assets', description: 'View IT asset inventory' },
    { name: 'asset:manage', module: 'assets', description: 'Create, update, and link IT assets' },
    { name: 'user:manage', module: 'admin', description: 'Create, edit, lock, and assign roles to users' },
    { name: 'audit:read', module: 'admin', description: 'Inspect tamper-evident system audit trail' },
    { name: 'reports:view', module: 'reports', description: 'Generate and export ITSM analytics and reports' },
  ];

  const permMap = new Map<string, string>();
  for (const p of permissionsData) {
    const perm = await prisma.permission.upsert({
      where: { name: p.name },
      update: { description: p.description, module: p.module },
      create: { name: p.name, description: p.description, module: p.module },
    });
    permMap.set(p.name, perm.id);
  }

  const rolePermissionAssignments: Record<RoleName, string[]> = {
    [RoleName.SYSTEM_ADMINISTRATOR]: permissionsData.map((p) => p.name),
    [RoleName.IT_MANAGER]: [
      'ticket:create', 'ticket:read_all', 'ticket:update', 'ticket:assign', 'ticket:internal_note',
      'incident:declare', 'incident:read', 'incident:update',
      'sla:view', 'sla:manage',
      'kb:read', 'kb:manage',
      'asset:read', 'asset:manage',
      'reports:view', 'audit:read',
    ],
    [RoleName.IT_SUPPORT_AGENT]: [
      'ticket:create', 'ticket:read_own', 'ticket:read_assigned', 'ticket:read_all', 'ticket:update', 'ticket:assign', 'ticket:internal_note',
      'incident:declare', 'incident:read', 'incident:update',
      'sla:view',
      'kb:read', 'kb:manage',
      'asset:read',
    ],
    [RoleName.EMPLOYEE]: [
      'ticket:create', 'ticket:read_own',
      'kb:read',
    ],
  };

  for (const [roleName, permList] of Object.entries(rolePermissionAssignments)) {
    const roleId = rolesMap.get(roleName as RoleName)!;
    for (const pName of permList) {
      const permissionId = permMap.get(pName)!;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId } },
        update: {},
        create: { roleId, permissionId },
      });
    }
  }
  console.log('Role permissions established');

  // 4. Seed ONLY Single System Administrator User
  const defaultPassword = 'Password@123';
  const passwordHash = await argon2.hash(defaultPassword, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 1,
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@serviceops.local' },
    update: {
      firstName: 'System',
      lastName: 'Administrator',
      department: 'IT Administration',
      jobTitle: 'Principal Systems Administrator',
      status: UserStatus.ACTIVE,
    },
    create: {
      email: 'admin@serviceops.local',
      passwordHash,
      firstName: 'System',
      lastName: 'Administrator',
      department: 'IT Administration',
      jobTitle: 'Principal Systems Administrator',
      status: UserStatus.ACTIVE,
    },
  });

  const adminRoleId = rolesMap.get(RoleName.SYSTEM_ADMINISTRATOR)!;
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: adminRoleId } },
    update: {},
    create: { userId: adminUser.id, roleId: adminRoleId },
  });
  console.log('Single System Administrator user established: admin@serviceops.local');

  // Also establish admin@serviceops.com for production access
  const comPasswordHash = await argon2.hash('Admin@123', {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 1,
  });
  const comAdminUser = await prisma.user.upsert({
    where: { email: 'admin@serviceops.com' },
    update: { passwordHash: comPasswordHash, status: UserStatus.ACTIVE },
    create: {
      email: 'admin@serviceops.com',
      passwordHash: comPasswordHash,
      firstName: 'System',
      lastName: 'Administrator',
      department: 'IT Administration',
      jobTitle: 'Principal Systems Administrator',
      status: UserStatus.ACTIVE,
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: comAdminUser.id, roleId: adminRoleId } },
    update: {},
    create: { userId: comAdminUser.id, roleId: adminRoleId },
  });
  console.log('Production System Administrator user established: admin@serviceops.com');

  // 5. Seed Core Categories (Hardware, Access, Software, Network, Workplace, Security)
  const categoriesData = [
    { name: 'Hardware', code: 'HW', icon: '💻', description: 'Laptops, docks, screens, peripherals' },
    { name: 'Access', code: 'ACC', icon: '🔑', description: 'Accounts, mail, VPN, domain access' },
    { name: 'Software', code: 'SW', icon: '📦', description: 'Enterprise installs, licenses, cloud apps' },
    { name: 'Network', code: 'NET', icon: '🌐', description: 'Office Wi-Fi, Ethernet, connectivity' },
    { name: 'Workplace', code: 'WRK', icon: '🏢', description: 'Printers, AV rooms, phones, physical hub' },
    { name: 'Security', code: 'SEC', icon: '🔒', description: 'Phishing reports, security badges, MFA tokens' },
  ];

  for (const c of categoriesData) {
    await prisma.category.upsert({
      where: { code: c.code },
      update: { name: c.name, icon: c.icon, description: c.description },
      create: { name: c.name, code: c.code, icon: c.icon, description: c.description },
    });
  }
  console.log('Categories established: 6 IT service categories');

  // 6. Seed SLA Policies (P1-P4)
  const slaPoliciesData = [
    {
      name: 'P1 - Critical Priority 24x7 Emergency Policy',
      priority: TicketPriority.CRITICAL_P1,
      description: 'Catastrophic organization-wide impediment. Uninterrupted 24x7 coverage.',
      responseTargetMinutes: 15,
      resolutionTargetMinutes: 120,
      businessHoursOnly: false,
      warningThresholdPct: 75,
    },
    {
      name: 'P2 - High Priority Business Hours Policy',
      priority: TicketPriority.HIGH_P2,
      description: 'Major operational impediment with no workaround. Core business hours coverage.',
      responseTargetMinutes: 60,
      resolutionTargetMinutes: 480,
      businessHoursOnly: true,
      warningThresholdPct: 75,
    },
    {
      name: 'P3 - Standard Service Request Policy',
      priority: TicketPriority.MEDIUM_P3,
      description: 'Standard business service requests and localized issues with workarounds.',
      responseTargetMinutes: 240,
      resolutionTargetMinutes: 1440,
      businessHoursOnly: true,
      warningThresholdPct: 75,
    },
    {
      name: 'P4 - General Inquiries & Scheduled Changes Policy',
      priority: TicketPriority.LOW_P4,
      description: 'Low-priority inquiries, general assistance, and planned changes.',
      responseTargetMinutes: 480,
      resolutionTargetMinutes: 4320,
      businessHoursOnly: true,
      warningThresholdPct: 75,
    },
  ];

  for (const p of slaPoliciesData) {
    await prisma.slaPolicy.upsert({
      where: { priority: p.priority },
      update: {
        name: p.name,
        description: p.description,
        responseTargetMinutes: p.responseTargetMinutes,
        resolutionTargetMinutes: p.resolutionTargetMinutes,
        businessHoursOnly: p.businessHoursOnly,
        warningThresholdPct: p.warningThresholdPct,
      },
      create: {
        name: p.name,
        priority: p.priority,
        description: p.description,
        responseTargetMinutes: p.responseTargetMinutes,
        resolutionTargetMinutes: p.resolutionTargetMinutes,
        businessHoursOnly: p.businessHoursOnly,
        warningThresholdPct: p.warningThresholdPct,
      },
    });
  }
  console.log('SLA Policies established: 4 priority policy tiers (P1-P4)');

  // 7. Seed Default Platform Settings
  const defaultSettings = [
    { key: 'organization_name', category: 'general', value: 'Northwind Internal IT' },
    { key: 'timezone', category: 'general', value: 'Asia/Colombo' },
    { key: 'business_hours', category: 'general', value: 'Mon-Fri 08:00-18:00' },
    { key: 'ticket_retention_months', category: 'policy', value: '24' },
  ];

  for (const s of defaultSettings) {
    await prisma.platformSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, category: s.category },
      create: { key: s.key, value: s.value, category: s.category },
    });
  }
  console.log('Platform settings established');

  console.log('--- [ServiceOps Clean Setup] Database Initialized with ONLY System Administrator ---');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
