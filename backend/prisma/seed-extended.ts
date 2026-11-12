import { PrismaClient, AssetStatus, AssetType, KnowledgeStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const agent = await prisma.user.findUnique({ where: { email: 'agent@serviceops.local' } });
  const employee = await prisma.user.findUnique({ where: { email: 'employee@serviceops.local' } });
  const manager = await prisma.user.findUnique({ where: { email: 'manager@serviceops.local' } });

  const cats = await prisma.category.findMany();
  const catByCode = new Map(cats.map((c) => [c.code, c.id]));

  if (agent) {
    const articles = [
      {
        slug: 'reset-forgotten-corporate-password',
        title: 'Reset a forgotten Windows or SSO password',
        summary: 'Self-service recovery via the ServiceOps Sign-in screen before opening an Access ticket.',
        content:
          '1. On the ServiceOps sign-in screen, click "Reset password" and enter your work email.\n2. Open the verification token issued to your recovery mailbox within 30 minutes.\n3. Choose at least 12 characters with mixed symbols. Active lockouts clear automatically once reset completes.',
        categoryId: catByCode.get('ACC') || null,
        status: KnowledgeStatus.PUBLISHED,
        readMinutes: 4,
        helpfulCount: 18,
        tags: ['password', 'reset', 'sso', 'login', 'locked'],
        publishedAt: new Date(),
      },
      {
        slug: 'connect-office-globalprotect-vpn',
        title: 'Connect to the corporate GlobalProtect VPN',
        summary: 'Configure portal vpn.northwind.internal and diagnose split-tunnel DNS drops.',
        content:
          '1. Open GlobalProtect from the system tray and enter portal vpn.northwind.internal.\n2. Approve the MFA prompt on your mobile authenticator.\n3. If home broadband drops UDP packets, switch Transport Mode to IPSec over SSL inside Settings -> Connection.',
        categoryId: catByCode.get('NET') || null,
        status: KnowledgeStatus.PUBLISHED,
        readMinutes: 3,
        helpfulCount: 14,
        tags: ['vpn', 'network', 'wifi', 'globalprotect', 'dns'],
        publishedAt: new Date(),
      },
      {
        slug: 'clear-printer-jam-floor-3',
        title: 'Clear a paper jam on the 3rd floor HP Laser',
        summary: 'Safe Tray 2 & Fuser door inspection checklist for PRN-3F-02.',
        content:
          '1. Open Front Door A and pull Tray 2 out halfway.\n2. Gently pull jammed A4 sheets straight forward along the rollers.\n3. Close doors firmly until the status LED turns steady green. Log a Hardware ticket if Tray 2 rollers slip repeatedly.',
        categoryId: catByCode.get('HW') || null,
        status: KnowledgeStatus.PUBLISHED,
        readMinutes: 2,
        helpfulCount: 9,
        tags: ['printer', 'hardware', 'jam', 'dock'],
        publishedAt: new Date(),
      },
      {
        slug: 'request-software-license-install',
        title: 'Request a managed software license (Figma, JetBrains, Adobe)',
        summary: 'Approval workflow and department cost-center codes for paid licenses.',
        content:
          'Software requests require manager cost-center approval prior to automated Intune deployment within 4 business hours.',
        categoryId: catByCode.get('SW') || null,
        status: KnowledgeStatus.DRAFT,
        readMinutes: 2,
        helpfulCount: 0,
        tags: ['software', 'license', 'install'],
        publishedAt: null,
      },
    ];

    for (const art of articles) {
      await prisma.knowledgeArticle.upsert({
        where: { slug: art.slug },
        update: {},
        create: { ...art, authorId: agent.id },
      });
    }
    console.log('Seeded Knowledge Base articles (idempotent).');
  }

  const assets = [
    {
      assetTag: 'LAT-5440-18',
      name: 'Dell Latitude 5440',
      assetType: AssetType.LAPTOP,
      serialNumber: 'DL-5440-9811A',
      location: 'Colombo HQ · Desk 42',
      status: AssetStatus.IN_REPAIR,
      assignedToId: employee?.id || null,
      warrantyUntil: new Date('2027-08-31T00:00:00.000Z'),
      notes: 'Primary workstation issued to Amina Perera.',
    },
    {
      assetTag: 'DOCK-04-12',
      name: 'Dell WD22TB4 USB-C Dock',
      assetType: AssetType.DOCK,
      serialNumber: 'WD22-44021',
      location: 'Colombo HQ · Desk 42',
      status: AssetStatus.FAILED,
      assignedToId: employee?.id || null,
      warrantyUntil: new Date('2026-06-30T00:00:00.000Z'),
      notes: 'Reported no 65W PD output in TKT-1042.',
    },
    {
      assetTag: 'PRN-3F-02',
      name: 'HP LaserJet Enterprise M507',
      assetType: AssetType.PRINTER,
      serialNumber: 'HP-M507-3F02',
      location: 'Colombo HQ · Level 3 Print Bay',
      status: AssetStatus.IN_SERVICE,
      assignedToId: null,
      warrantyUntil: new Date('2028-03-31T00:00:00.000Z'),
      notes: 'Shared floor laser printer.',
    },
    {
      assetTag: 'MBP-14-07',
      name: 'MacBook Pro 14" M3 Pro',
      assetType: AssetType.LAPTOP,
      serialNumber: 'C02YM409MD6R',
      location: 'Colombo HQ · Level 4',
      status: AssetStatus.IN_SERVICE,
      assignedToId: manager?.id || null,
      warrantyUntil: new Date('2028-01-15T00:00:00.000Z'),
      notes: 'IT Operations commander laptop.',
    },
  ];

  let dockId: string | null = null;
  for (const a of assets) {
    const rec = await prisma.asset.upsert({
      where: { assetTag: a.assetTag },
      update: {},
      create: a,
    });
    if (a.assetTag === 'DOCK-04-12') dockId = rec.id;
  }

  if (dockId) {
    await prisma.ticket.updateMany({
      where: { ticketNumber: 'TKT-1042', assetId: null },
      data: { assetId: dockId },
    });
  }
  console.log('Seeded IT Assets CMDB inventory (idempotent).');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

