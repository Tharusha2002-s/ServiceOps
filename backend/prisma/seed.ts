import {
  PrismaClient,
  RoleName,
  UserStatus,
  TicketPriority,
  TicketStatus,
  Impact,
  Urgency,
  CommentType,
  TicketType,
  SlaStatus,
} from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('--- [ServiceOps Seed] Starting Master Database Seeding ---');

  // 1. Seed Roles
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

  // 2. Seed Granular Permissions
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
  console.log(`Permissions established: ${permissionsData.length} records`);

  // 3. Map Role Permissions
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

  // 4. Seed Standard Default Users
  const defaultPassword = 'Password@123';
  const passwordHash = await argon2.hash(defaultPassword, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 1,
  });

  const seedUsers = [
    {
      email: 'admin@serviceops.local',
      firstName: 'Sarah',
      lastName: 'Chen',
      department: 'IT Infrastructure',
      jobTitle: 'Principal Systems Administrator',
      role: RoleName.SYSTEM_ADMINISTRATOR,
    },
    {
      email: 'manager@serviceops.local',
      firstName: 'Marcus',
      lastName: 'Vance',
      department: 'IT Service Delivery',
      jobTitle: 'IT Service Desk Manager',
      role: RoleName.IT_MANAGER,
    },
    {
      email: 'agent@serviceops.local',
      firstName: 'Elena',
      lastName: 'Chen',
      department: 'Tier-2 Technical Support',
      jobTitle: 'Senior Support Specialist (R. Chen)',
      role: RoleName.IT_SUPPORT_AGENT,
    },
    {
      email: 'employee@serviceops.local',
      firstName: 'Amina',
      lastName: 'Perera',
      department: 'Finance & Accounts',
      jobTitle: 'Senior Financial Analyst',
      role: RoleName.EMPLOYEE,
    },
  ];

  const userMap = new Map<string, any>();
  for (const u of seedUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        firstName: u.firstName,
        lastName: u.lastName,
        department: u.department,
        jobTitle: u.jobTitle,
        status: UserStatus.ACTIVE,
      },
      create: {
        email: u.email,
        passwordHash,
        firstName: u.firstName,
        lastName: u.lastName,
        department: u.department,
        jobTitle: u.jobTitle,
        status: UserStatus.ACTIVE,
      },
    });

    const roleId = rolesMap.get(u.role)!;
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId } },
      update: {},
      create: { userId: user.id, roleId },
    });
    userMap.set(u.email, user);
  }
  console.log('Seeded users established: Amina (Employee), Elena (Agent), Marcus (Manager), Sarah (Admin)');

  // 5. Seed Module 2 Service Categories
  const categoriesData = [
    { name: 'Hardware', code: 'HW', icon: '💻', description: 'Laptops, docks, screens, peripherals' },
    { name: 'Access', code: 'ACC', icon: '🔑', description: 'Accounts, mail, VPN, domain access' },
    { name: 'Software', code: 'SW', icon: '📦', description: 'Enterprise installs, licenses, cloud apps' },
    { name: 'Network', code: 'NET', icon: '🌐', description: 'Office Wi-Fi, Ethernet, connectivity' },
    { name: 'Workplace', code: 'WRK', icon: '🏢', description: 'Printers, AV rooms, phones, physical hub' },
    { name: 'Security', code: 'SEC', icon: '🔒', description: 'Phishing reports, security badges, MFA tokens' },
  ];

  const categoryMap = new Map<string, string>();
  for (const c of categoriesData) {
    const cat = await prisma.category.upsert({
      where: { code: c.code },
      update: { name: c.name, icon: c.icon, description: c.description },
      create: { name: c.name, code: c.code, icon: c.icon, description: c.description },
    });
    categoryMap.set(c.code, cat.id);
  }
  console.log('Categories established: 6 IT service categories');

  // 6. Seed Module 3 SLA Policies
  const slaPoliciesData = [
    {
      name: 'P1 - Critical Priority 24x7 Emergency Policy',
      priority: TicketPriority.CRITICAL_P1,
      description: 'Catastrophic organization-wide impediment. Uninterrupted 24x7 coverage.',
      responseTargetMinutes: 15,
      resolutionTargetMinutes: 120, // 2h
      businessHoursOnly: false,
      warningThresholdPct: 75,
    },
    {
      name: 'P2 - High Priority Business Hours Policy',
      priority: TicketPriority.HIGH_P2,
      description: 'Major operational impediment with no workaround. Core business hours coverage.',
      responseTargetMinutes: 60, // 1h
      resolutionTargetMinutes: 480, // 8h
      businessHoursOnly: true,
      warningThresholdPct: 75,
    },
    {
      name: 'P3 - Standard Service Request Policy',
      priority: TicketPriority.MEDIUM_P3,
      description: 'Standard business service requests and localized issues with workarounds.',
      responseTargetMinutes: 240, // 4h
      resolutionTargetMinutes: 1440, // 24h
      businessHoursOnly: true,
      warningThresholdPct: 75,
    },
    {
      name: 'P4 - General Inquiries & Scheduled Changes Policy',
      priority: TicketPriority.LOW_P4,
      description: 'Low-priority inquiries, general assistance, and planned changes.',
      responseTargetMinutes: 480, // 8h
      resolutionTargetMinutes: 4320, // 72h
      businessHoursOnly: true,
      warningThresholdPct: 75,
    },
  ];

  const slaPolicyMap = new Map<TicketPriority, any>();
  for (const p of slaPoliciesData) {
    const policy = await prisma.slaPolicy.upsert({
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
    slaPolicyMap.set(p.priority, policy);
  }
  console.log('SLA Policies established: 4 priority policy tiers (P1-P4)');

  // 7. Seed Sample Tickets with SLA Snapshots
  const amina = userMap.get('employee@serviceops.local')!;
  const elena = userMap.get('agent@serviceops.local')!;

  const sampleTickets = [
    {
      ticketNumber: 'TKT-1042',
      title: 'Laptop dock not charging',
      description: 'The USB-C dock on Desk 42 stopped charging my Lenovo ThinkPad after the power surge yesterday. Displays work, but battery percentage drains steadily.',
      type: TicketType.SERVICE_REQUEST,
      status: TicketStatus.IN_PROGRESS,
      priority: TicketPriority.HIGH_P2,
      impact: Impact.USER,
      urgency: Urgency.HIGH,
      categoryCode: 'HW',
      requesterId: amina.id,
      assigneeId: elena.id,
      responseDueAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
      resolutionDueAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
      firstResponseAt: new Date(Date.now() - 30 * 60 * 1000),
      slaStatus: SlaStatus.ON_TRACK,
      isResponseMet: true,
      isResolutionMet: null,
      comments: [
        {
          authorId: elena.id,
          type: CommentType.PUBLIC,
          content: 'Hi Amina, I am taking a look at this dock. I will bring a replacement 135W Lenovo power adapter by 2 PM to test if the power brick failed.',
        },
        {
          authorId: elena.id,
          type: CommentType.INTERNAL_NOTE,
          content: 'Internal note: Batch #2024-C docks have known PD firmware handshake issues. If power brick does not resolve, swap unit with spare CalDigit dock from IT cage.',
        },
      ],
    },
    {
      ticketNumber: 'TKT-1031',
      title: 'New starter email access',
      description: 'Need mailbox and distribution list access for the new financial analyst starting Monday next week.',
      type: TicketType.SERVICE_REQUEST,
      status: TicketStatus.PENDING_CUSTOMER,
      priority: TicketPriority.MEDIUM_P3,
      impact: Impact.USER,
      urgency: Urgency.MEDIUM,
      categoryCode: 'ACC',
      requesterId: amina.id,
      assigneeId: elena.id,
      responseDueAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
      resolutionDueAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      firstResponseAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      slaStatus: SlaStatus.PAUSED,
      isResponseMet: true,
      isResolutionMet: null,
      comments: [
        {
          authorId: elena.id,
          type: CommentType.PUBLIC,
          content: 'Please provide the hiring manager approval email and the employee ID to proceed with directory provisioning.',
        },
      ],
    },
    {
      ticketNumber: 'TKT-1022',
      title: 'Printer jam, 3rd floor',
      description: 'HP LaserJet on 3rd floor west wing shows error 13.02 paper jam.',
      type: TicketType.INCIDENT,
      status: TicketStatus.RESOLVED,
      priority: TicketPriority.LOW_P4,
      impact: Impact.DEPARTMENT,
      urgency: Urgency.LOW,
      categoryCode: 'HW',
      requesterId: amina.id,
      assigneeId: elena.id,
      responseDueAt: new Date(Date.now() + 5 * 60 * 60 * 1000),
      resolutionDueAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
      resolutionSummary: 'Agent R. Chen cleared sensor B and tested 5 sample test prints successfully.',
      resolvedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      firstResponseAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      slaStatus: SlaStatus.MET,
      isResponseMet: true,
      isResolutionMet: true,
      comments: [
        {
          authorId: elena.id,
          type: CommentType.PUBLIC,
          content: 'Cleared sensor B obstruction. 5 sample duplex test sheets passed without issues. Marking resolved for customer confirmation.',
        },
      ],
    },
    {
      ticketNumber: 'TKT-1038',
      title: 'VPN drops on floor 4',
      description: 'Multiple staff reporting GlobalProtect VPN timeout when connecting via 4th floor AP-04 access point.',
      type: TicketType.INCIDENT,
      status: TicketStatus.NEW,
      priority: TicketPriority.CRITICAL_P1,
      impact: Impact.ORGANIZATION,
      urgency: Urgency.CRITICAL,
      categoryCode: 'NET',
      requesterId: amina.id,
      assigneeId: null,
      responseDueAt: new Date(Date.now() - 26 * 60 * 1000), // Breached 26m ago
      resolutionDueAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
      firstResponseAt: null,
      slaStatus: SlaStatus.BREACHED,
      isResponseMet: false,
      isResolutionMet: null,
      comments: [],
    },
  ];

  for (const t of sampleTickets) {
    const categoryId = categoryMap.get(t.categoryCode)!;
    const policy = slaPolicyMap.get(t.priority)!;

    const ticket = await prisma.ticket.upsert({
      where: { ticketNumber: t.ticketNumber },
      update: {
        title: t.title,
        description: t.description,
        type: t.type,
        status: t.status,
        priority: t.priority,
        impact: t.impact,
        urgency: t.urgency,
        categoryId,
        requesterId: t.requesterId,
        assigneeId: t.assigneeId,
        responseDueAt: t.responseDueAt,
        resolutionDueAt: t.resolutionDueAt,
        firstResponseAt: t.firstResponseAt,
        resolvedAt: t.resolvedAt,
        resolutionSummary: t.resolutionSummary,
      },
      create: {
        ticketNumber: t.ticketNumber,
        title: t.title,
        description: t.description,
        type: t.type,
        status: t.status,
        priority: t.priority,
        impact: t.impact,
        urgency: t.urgency,
        categoryId,
        requesterId: t.requesterId,
        assigneeId: t.assigneeId,
        responseDueAt: t.responseDueAt,
        resolutionDueAt: t.resolutionDueAt,
        firstResponseAt: t.firstResponseAt,
        resolvedAt: t.resolvedAt,
        resolutionSummary: t.resolutionSummary,
      },
    });

    // Create or update immutable SLA Snapshot (ADR-007)
    await prisma.ticketSlaSnapshot.upsert({
      where: { ticketId: ticket.id },
      update: {
        policyId: policy.id,
        responseTargetMinutes: policy.responseTargetMinutes,
        resolutionTargetMinutes: policy.resolutionTargetMinutes,
        responseDueAt: t.responseDueAt,
        resolutionDueAt: t.resolutionDueAt || new Date(Date.now() + policy.resolutionTargetMinutes * 60 * 1000),
        firstResponseAt: t.firstResponseAt,
        resolvedAt: t.resolvedAt,
        isResponseMet: t.isResponseMet,
        isResolutionMet: t.isResolutionMet,
        status: t.slaStatus,
      },
      create: {
        ticketId: ticket.id,
        policyId: policy.id,
        responseTargetMinutes: policy.responseTargetMinutes,
        resolutionTargetMinutes: policy.resolutionTargetMinutes,
        responseDueAt: t.responseDueAt,
        resolutionDueAt: t.resolutionDueAt || new Date(Date.now() + policy.resolutionTargetMinutes * 60 * 1000),
        firstResponseAt: t.firstResponseAt,
        resolvedAt: t.resolvedAt,
        isResponseMet: t.isResponseMet,
        isResolutionMet: t.isResolutionMet,
        status: t.slaStatus,
      },
    });

    // Re-seed comments
    for (const c of t.comments) {
      await prisma.ticketComment.create({
        data: {
          ticketId: ticket.id,
          authorId: c.authorId,
          type: c.type,
          content: c.content,
        },
      });
    }

    console.log(`Ticket with SLA Snapshot established: ${t.ticketNumber} [SLA: ${t.slaStatus}]`);
  }

  // Seed Major Incident INC-208
  const managerUser = await prisma.user.findUnique({ where: { email: 'manager@serviceops.local' } });
  const agentUser = await prisma.user.findUnique({ where: { email: 'agent@serviceops.local' } });

  if (managerUser && agentUser) {
    const inc208 = await prisma.incident.upsert({
      where: { incidentNumber: 'INC-208' },
      update: {
        title: 'Organization-wide login failures',
        description: 'People can open ServiceOps and mail, then get rejected at the directory. Started 13:12 Colombo time.',
        severity: 'CRITICAL_P1',
        status: 'INVESTIGATING',
        impactScope: 'All office locations (Colombo HQ, Level 2, 3, 4)',
        reporterId: agentUser.id,
        commanderId: managerUser.id,
      },
      create: {
        incidentNumber: 'INC-208',
        title: 'Organization-wide login failures',
        description: 'People can open ServiceOps and mail, then get rejected at the directory. Started 13:12 Colombo time.',
        severity: 'CRITICAL_P1',
        status: 'INVESTIGATING',
        impactScope: 'All office locations (Colombo HQ, Level 2, 3, 4)',
        reporterId: agentUser.id,
        commanderId: managerUser.id,
      },
    });

    const updates = [
      { authorId: agentUser.id, message: 'Declared by Elena Chen. Directory timeouts on two primary domain controllers.' },
      { authorId: managerUser.id, message: 'Incident Commander set to Marcus Vance. Escalated from service desk triage.' },
      { authorId: managerUser.id, message: 'Traffic rerouted to secondary controller. Authentication pointed at replica. New sign-ins succeeding.' },
    ];

    for (const u of updates) {
      const exists = await prisma.incidentUpdate.findFirst({
        where: { incidentId: inc208.id, message: u.message },
      });
      if (!exists) {
        await prisma.incidentUpdate.create({
          data: {
            incidentId: inc208.id,
            authorId: u.authorId,
            message: u.message,
          },
        });
      }
    }

    await prisma.ticket.updateMany({
      where: { ticketNumber: 'TKT-1038' },
      data: { incidentId: inc208.id },
    });

    console.log('Incident INC-208 established with investigation timeline.');
  }

  console.log('--- [ServiceOps Seed] Master Seed with SLA Engine Complete! ---');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
