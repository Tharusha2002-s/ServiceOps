# ServiceOps — SaaS Multi-Tenant Architecture & Commercialization Guide
## Transforming an Enterprise Monolith into a Scalable B2B SaaS Platform on AWS

---

**Document Control:**
- **Project:** ServiceOps Enterprise ITSM Platform
- **Target Model:** Proprietary Multi-Tenant Cloud SaaS on AWS
- **Author:** DevOps & Cloud Solutions Architecture Team
- **Version:** 2.0.0 (AWS Cloud Edition)
- **Classification:** Strategic & Technical Architecture Roadmap

---

## 1. Executive Summary: The ITSM SaaS Opportunity

The Global IT Service Management (ITSM) market exceeds **$12 Billion**, currently dominated by complex, cost-prohibitive enterprise vendors:
- **ServiceNow:** Starts at $100+/agent/month with mandatory six-figure implementation contracts.
- **Jira Service Management:** $20–$55/agent/month with complex plugin ecosystems.
- **Freshservice:** $19–$119/agent/month.

### The Pure-Play Enterprise Cloud SaaS Model on AWS
ServiceOps operates as a proprietary, centrally managed, multi-tenant B2B SaaS platform hosted entirely on Amazon Web Services (AWS). Rather than distributing downloadable software, ServiceOps delivers a fully managed cloud service with instant customer onboarding, automated multi-AZ scalability, zero customer maintenance, and tiered monthly subscriptions billed via Stripe.

```
                      +------------------------------------------+
                      |         SERVICEOPS AWS CLOUD SAAS        |
                      |            (*.serviceops.io)             |
                      +------------------------------------------+
                                     /            \
                                    /              \
                                   v                v
            +---------------------------+   +---------------------------+
            |    Standard SaaS Cloud    |   |  Enterprise Virtual Cloud |
            |      (Shared Multi-AZ)    |   |     (Dedicated Amazon)    |
            |   • Subdomain Workspaces  |   |   • Dedicated RDS Cluster |
            |   • Logical Tenant RLS    |   |   • Custom Domain & SAML  |
            |   • Stripe Seat Billing   |   |   • Strict Data Residency |
            |   • AWS ECS Fargate Autos |   |   • 99.98% SLA Guarantee  |
            +---------------------------+   +---------------------------+
```

---

## 2. Multi-Tenancy Architecture Options & Trade-Offs

When evolving a single-tenant relational system into SaaS, three architectural patterns exist:

| Architectural Pattern | Isolation Level | Infrastructure Cost | Operational Complexity | Recommendation |
| :--- | :---: | :---: | :---: | :--- |
| **Model A: Shared Database + Discriminator Column** | Logical (Row-Level) | **Lowest** (1 DB cluster for thousands of tenants) | **Low** (Single schema migrations) | 🟢 **Recommended for Free & Pro Tiers** |
| **Model B: Schema-per-Tenant** | Namespace Isolation | Moderate | Moderate (Run migrations across N schemas) | 🟡 Good for mid-market |
| **Model C: Database-per-Tenant** | Physical Isolation | High | High (Dynamic connection pooling) | 🟢 **Reserved for Enterprise (\$10k+/yr)** |

### Recommended Hybrid SaaS Architecture
- **Tier 1 (Free & Pro):** High-density shared PostgreSQL cluster using **Model A** with Prisma Client Row-Level Security extensions.
- **Tier 2 (High-Compliance Enterprise):** Virtual Private SaaS using **Model C** running dedicated PostgreSQL and Redis instances provisioned dynamically.

---

## 3. Database Schema Evolution for Multi-Tenancy

To enable multi-tenancy in Prisma, an `Organization` model is introduced, and an `organizationId` foreign key is attached to all tenant-scoped entities.

### 3.1 Organization & Membership Schema Additions
```prisma
// ==========================================
// Multi-Tenant SaaS Extension Models
// ==========================================

enum SubscriptionPlan {
  FREE
  PRO
  ENTERPRISE
}

enum SubscriptionStatus {
  TRIALING
  ACTIVE
  PAST_DUE
  CANCELED
}

model Organization {
  id                   String             @id @default(uuid())
  name                 String             // e.g., "Acme Corporation"
  slug                 String             @unique // e.g., "acme" -> acme.serviceops.io
  customDomain         String?            @unique // e.g., "support.acme.com"
  plan                 SubscriptionPlan   @default(FREE)
  subscriptionStatus   SubscriptionStatus @default(TRIALING)
  stripeCustomerId     String?            @unique
  stripeSubscriptionId String?            @unique
  maxSeats             Int                @default(3)
  maxAssets            Int                @default(25)
  trialEndsAt          DateTime?
  createdAt            DateTime           @default(now())
  updatedAt            DateTime           @updatedAt

  // Relationships
  memberships          OrganizationMember[]
  tickets              Ticket[]
  assets               Asset[]
  slaPolicies          SlaPolicy[]
  incidents            Incident[]
  categories           Category[]
  auditLogs            AuditLog[]

  @@index([slug])
  @@index([customDomain])
}

model OrganizationMember {
  id             String       @id @default(uuid())
  organizationId String
  userId         String
  role           RoleType     @default(EMPLOYEE)
  createdAt      DateTime     @default(now())

  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([organizationId, userId])
  @@index([organizationId])
  @@index([userId])
}
```

### 3.2 Updating Core Models with `organizationId`
Every business entity receives:
```prisma
model Ticket {
  id             String       @id @default(uuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  // ... existing fields ...

  @@index([organizationId])
  @@index([organizationId, status])
  @@index([organizationId, priority])
}
```

---

## 4. Bulletproof Tenant Isolation in NestJS

To prevent data leakage between organizations, isolation must be enforced automatically at the application layer.

### 4.1 Subdomain & Header Extraction Middleware
```typescript
// src/common/middleware/tenant.middleware.ts
import { Injectable, NestMiddleware, NotFoundException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '@/prisma/prisma.service';
import { AsyncLocalStorage } from 'async_hooks';

export const tenantStorage = new AsyncLocalStorage<{ organizationId: string; slug: string }>();

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const host = req.headers.host || '';
    // Extract subdomain: e.g. 'acme.serviceops.io' -> 'acme'
    const parts = host.split('.');
    let slug = parts.length > 2 ? parts[0] : null;

    // Support local dev or API client header override
    if (!slug || slug === 'localhost' || slug === 'app') {
      slug = (req.headers['x-tenant-slug'] as string) || null;
    }

    if (!slug) {
      return next(); // Public / root landing page routes
    }

    const org = await this.prisma.organization.findUnique({
      where: { slug },
      select: { id: true, slug: true, subscriptionStatus: true },
    });

    if (!org) {
      throw new NotFoundException(`Organization workspace '${slug}' not found.`);
    }

    // Attach to AsyncLocalStorage for context propagation
    tenantStorage.run({ organizationId: org.id, slug: org.slug }, () => {
      req['organization'] = org;
      next();
    });
  }
}
```

### 4.2 Automated Query Scoping via Prisma Client Extension
Instead of manually typing `where: { organizationId }` in hundreds of service calls, use Prisma Client Extensions to inject tenant filtering into every query automatically:

```typescript
// src/prisma/prisma.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { tenantStorage } from '@/common/middleware/tenant.middleware';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  readonly extendedClient = this.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const tenant = tenantStorage.getStore();
          // Models that are tenant-scoped
          const tenantModels = ['Ticket', 'Asset', 'SlaPolicy', 'Incident', 'Category', 'AuditLog'];

          if (tenant && tenantModels.includes(model)) {
            if (['findMany', 'findFirst', 'count'].includes(operation)) {
              args.where = { ...args.where, organizationId: tenant.organizationId };
            }
            if (operation === 'create') {
              args.data = { ...args.data, organizationId: tenant.organizationId };
            }
          }
          return query(args);
        },
      },
    },
  });

  async onModuleInit() {
    await this.$connect();
  }
}
```

---

## 5. Subdomain Routing & Wildcard Cloud Ingress

### 5.1 DNS Architecture
Configure wildcard DNS in Cloudflare, AWS Route 53, or your registrar:
- `A` record: `serviceops.io` &rarr; Ingress Load Balancer IP
- `CNAME` record: `*.serviceops.io` &rarr; `serviceops.io`

### 5.2 Nginx Wildcard Ingress Configuration
```nginx
server {
    listen 80;
    listen 443 ssl http2;
    server_name serviceops.io *.serviceops.io;

    ssl_certificate /etc/letsencrypt/live/serviceops.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/serviceops.io/privkey.pem;

    # Pass entire host header so NestJS TenantMiddleware can read the tenant slug
    location / {
        proxy_pass http://frontend:3000;
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        proxy_pass http://backend:4000/api/;
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 6. Commercial Subscription Tiers & Stripe Billing

### 6.1 Packaging & Pricing Strategy

```
+---------------------------------------------------------------------------------------+
|                               SERVICEOPS SUBSCRIPTION TIERS                           |
+---------------------------------------------------------------------------------------+
|  Tier               | Price             | Target Audience      | Included Limits      |
+---------------------+-------------------+----------------------+----------------------+
|  Starter (Community)| $0 (Forever Free) | Startups / Homelabs  | 1 Agent, 50 Tickets  |
|  Professional       | $19 / seat / mo   | Growing SMB Teams    | Unlimited Tickets,   |
|                     |                   |                      | CMDB Assets, Brevo   |
|  Enterprise         | $49 / seat / mo   | Mid-Market & Scale   | War Rooms, SHA-256   |
|                     |                   |                      | Audit, Custom Domain |
+---------------------------------------------------------------------------------------+
```

### 6.2 Stripe Webhook Lifecycle Handler
Create a dedicated `BillingModule` in NestJS:
```typescript
// src/billing/billing.service.ts
@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}

  async handleWebhook(event: Stripe.Event) {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orgId = session.metadata.organizationId;
        await this.prisma.organization.update({
          where: { id: orgId },
          data: {
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
            subscriptionStatus: 'ACTIVE',
            plan: session.metadata.plan as SubscriptionPlan,
          },
        });
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await this.prisma.organization.update({
          where: { stripeSubscriptionId: sub.id },
          data: { subscriptionStatus: 'CANCELED', plan: 'FREE' },
        });
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await this.prisma.organization.update({
          where: { stripeCustomerId: invoice.customer as string },
          data: { subscriptionStatus: 'PAST_DUE' },
        });
        break;
      }
    }
  }
}
```

### 6.3 Feature Gating & Quota Guard
Enforce plan restrictions cleanly using custom NestJS decorators:
```typescript
// Example: Restricting War Room creation to Enterprise tier
@Post('incidents')
@RequirePlan(SubscriptionPlan.ENTERPRISE)
@UseGuards(JwtAuthGuard, PlanGuard)
async declareMajorIncident(@Body() dto: CreateIncidentDto) {
  return this.incidentsService.declare(dto);
}
```

---

## 7. Self-Service Tenant Onboarding Flow

```
+---------------------------------------------------------------------------------------------+
|                            SAAS SELF-SERVICE ONBOARDING FLOW                                |
+---------------------------------------------------------------------------------------------+
|                                                                                             |
|   1. User visits https://serviceops.io/signup                                               |
|      - Enters Email, Password, Company Name ("Acme Corp")                                    |
|      - System automatically checks slug availability: "acme.serviceops.io"                  |
|                                                                                             |
|   2. Workspace Provisioning API:                                                            |
|      - Creates Organization record (`name: "Acme Corp"`, `slug: "acme"`, `plan: "PRO"`)     |
|      - Seeds default SLA Policies (P1 24x7, P2-P4 Business Hours) for Acme                   |
|      - Seeds default ITIL Categories (Hardware, Software, Access)                           |
|      - Binds user as `SYSTEM_ADMINISTRATOR` for the Acme organization                       |
|                                                                                             |
|   3. Redirect to Tenant Workspace:                                                          |
|      - Redirects to https://acme.serviceops.io/login                                        |
|      - Initiates 14-day free trial with interactive setup wizard                            |
+---------------------------------------------------------------------------------------------+
```

---

## 8. SaaS Super-Admin Control Plane

To operate a multi-tenant business, the SaaS provider needs a central Control Plane (e.g., `admin.serviceops.io`):
1. **Financial Metrics:** Real-time Monthly Recurring Revenue (MRR), Annual Run Rate (ARR), Churn Rate, and Active Trials.
2. **Tenant Operations:**
   - View all organizations, plan distributions, and agent seat counts.
   - Inspect database storage and API traffic per tenant.
   - One-click "Impersonate Workspace" to assist enterprise customers with technical support.
   - Emergency "Suspend Workspace" toggle for non-payment or acceptable-use violations.

---

## 9. Phased Implementation Roadmap

```
Phase 1: Multi-Tenant Core (Sprint 1)
├── Create Organization & OrganizationMember models in Prisma
├── Add organizationId across Ticket, Asset, SLA, Incident, AuditLog
└── Implement TenantMiddleware & Prisma Client auto-scoping extension

Phase 2: Subdomain Routing & Ingress (Sprint 2)
├── Configure Wildcard DNS (*.serviceops.io) & Let's Encrypt Wildcard SSL
├── Update Next.js App Router for dynamic tenant subdomain context
└── Deploy tenant registration wizard (/signup -> workspace creation)

Phase 3: Stripe Monetization & Quota Engine (Sprint 3)
├── Setup Stripe Checkout Sessions & Customer Portal integration
├── Implement Webhook listeners (Subscription Created/Updated/Canceled)
└── Implement @RequirePlan & @QuotaGuard decorators across NestJS routes

Phase 4: SaaS Operations & Control Plane (Sprint 4)
├── Launch Super-Admin Deck (MRR, Tenant Health, Impersonation)
├── Automated Welcome & Onboarding Email Sequence via Brevo
└── Launch Public Pricing Page & Documentation Portal
```

---

## 10. Conclusion

ServiceOps is exceptionally well-positioned to make this transition. The system's existing modular monolith architecture, strict separation of concerns, cryptographic audit ledger, and clean REST/WebSocket boundaries ensure that transitioning to multi-tenancy can be achieved smoothly without rewriting core business engines. By offering both self-hosted Docker downloads and a managed cloud SaaS platform, ServiceOps can capture both security-conscious on-prem enterprises and fast-moving cloud teams.
