import { PrismaClient, RoleName, UserStatus } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('--- [ServiceOps Seed] Starting IAM & RBAC Database Seeding ---');

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
    console.log(`Role established: ${r.name}`);
  }

  // 2. Seed Granular Permissions
  const permissionsData = [
    // Tickets
    { name: 'ticket:create', module: 'tickets', description: 'Create new service requests and incidents' },
    { name: 'ticket:read_own', module: 'tickets', description: 'View own submitted tickets' },
    { name: 'ticket:read_assigned', module: 'tickets', description: 'View tickets assigned to current agent or team' },
    { name: 'ticket:read_all', module: 'tickets', description: 'View all tickets in the system' },
    { name: 'ticket:update', module: 'tickets', description: 'Update status, priority, and metadata of tickets' },
    { name: 'ticket:assign', module: 'tickets', description: 'Assign or reassign tickets to agents' },
    { name: 'ticket:internal_note', module: 'tickets', description: 'Create and view agent-only internal notes' },
    { name: 'ticket:delete', module: 'tickets', description: 'Soft delete tickets' },
    // Incidents
    { name: 'incident:declare', module: 'incidents', description: 'Declare major incidents (P1/P2)' },
    { name: 'incident:read', module: 'incidents', description: 'View incident registry and timeline' },
    { name: 'incident:update', module: 'incidents', description: 'Update incident status and war room' },
    // SLA
    { name: 'sla:view', module: 'sla', description: 'View SLA policies and compliance metrics' },
    { name: 'sla:manage', module: 'sla', description: 'Configure SLA thresholds, escalation tiers, and business hours' },
    // Knowledge Base
    { name: 'kb:read', module: 'knowledge', description: 'Browse and search public knowledge articles' },
    { name: 'kb:manage', module: 'knowledge', description: 'Author, publish, and archive knowledge articles' },
    // Assets
    { name: 'asset:read', module: 'assets', description: 'View IT asset inventory' },
    { name: 'asset:manage', module: 'assets', description: 'Create, update, and link IT assets' },
    // Administration & Users
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
  console.log('Role-Permission bindings mapped successfully');

  // 4. Seed Standard Default Users for each role
  const defaultPassword = 'Password@123';
  const passwordHash = await argon2.hash(defaultPassword, {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB
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
      lastName: 'Rostova',
      department: 'Tier-2 Technical Support',
      jobTitle: 'Senior Support Specialist',
      role: RoleName.IT_SUPPORT_AGENT,
    },
    {
      email: 'employee@serviceops.local',
      firstName: 'Alex',
      lastName: 'Morgan',
      department: 'Marketing & Growth',
      jobTitle: 'Product Marketing Manager',
      role: RoleName.EMPLOYEE,
    },
  ];

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
    console.log(`Seeded user: ${u.email} -> Role: ${u.role}`);
  }

  console.log('--- [ServiceOps Seed] Completed Successfully! Default Password: Password@123 ---');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

