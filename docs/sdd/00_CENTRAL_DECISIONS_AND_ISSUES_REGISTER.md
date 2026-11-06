# ServiceOps — Central Design Decisions & Unresolved Issues Register

> **Document Status:** Active Living Register  
> **Maintained By:** Principal Software Architect & Lead Systems Analyst  
> **Last Updated:** 2026-11-06  
> **Governing Standards:** IEEE 1016-2009 (Software Design Descriptions), Architecture Decision Records (ADR / MADR 3.0.0), OWASP ASVS v4.0.3

---

## Part I: Central Architectural Decision Records (ADR)

This register documents all fundamental architectural decisions, evaluating their context, options considered, trade-offs, and downstream impacts on frontend, backend, database, and operations.

```
ADR Index:
├── ADR-001: Modular Monolith Backend Architecture over Microservices
├── ADR-002: Next.js App Router Architecture with Strict Server/Client Component Boundaries
├── ADR-003: Dual-Token Authentication Lifecycle with Refresh Token Rotation & Invalidation
├── ADR-004: Server-Side Role-Based & Permission-Based Authorization Enforcement
├── ADR-005: Relational System of Record with PostgreSQL 16 & Prisma ORM
├── ADR-006: Asynchronous Task Processing & Queue Decoupling via Redis 7 & BullMQ
├── ADR-007: Immutable SLA Policy Snapshotting on Ticket Creation
├── ADR-008: Real-Time State Synchronization via Authenticated WebSocket Gateway
├── ADR-009: Strict Internal Notes Privacy Separation at Database & API Layer
└── ADR-010: Tamper-Evident Append-Only Audit Logging with JSON Metadata
```

---

### ADR-001: Modular Monolith Backend Architecture over Microservices
* **Status:** `APPROVED (Baseline Proposed)`
* **Context:** The system requirements specify an initial 3-month delivery roadmap for an internal enterprise ITSM platform serving support teams and employees. Operational simplicity, atomic transaction guarantees, and developer velocity are critical.
* **Decision:** Implement a modular monolith using NestJS 10+. Each functional domain (Auth, Users, Tickets, Incidents, SLA, Notifications, Assets, Knowledge, Audit, Reports) shall be encapsulated in a distinct NestJS module with explicit public service interfaces and DTOs. Direct database table access across domain boundaries is prohibited.
* **Consequences:**
  - *Positive:* Enables local in-memory transaction management (`$transaction`); eliminates distributed transaction complexity (Saga / 2PC); simplifies CI/CD to a single deployable container; provides sub-millisecond inter-module communication.
  - *Negative:* All modules share CPU and memory resources; an unhandled exception or memory leak in one module could impact the process if not properly isolated.
* **Mitigation:** Enforce strict architectural boundaries via ESLint dependency rules; isolate long-running background tasks (emails, SLA calculations) to BullMQ worker threads.

---

### ADR-002: Next.js App Router Architecture with Strict Server/Client Component Boundaries
* **Status:** `APPROVED (Baseline Proposed)`
* **Context:** The frontend must provide snappy, accessible, responsive dashboards across 4 distinct roles (Employee, IT Support Agent, IT Manager, System Administrator) with real-time updates and low initial page-load latency.
* **Decision:** Utilize Next.js 14+ with App Router. Layouts, static content, and initial role-based access checks will execute on the server (React Server Components). Interactive widgets, forms, search inputs, real-time ticket tables, and WebSocket listeners will be designated as Client Components (`"use client"`).
* **Consequences:**
  - *Positive:* Minimizes client-side JavaScript bundle sizes; enables secure server-side fetching of preliminary data; seamless integration with shadcn/ui and Tailwind CSS.
  - *Negative:* Requires strict hydration awareness and clean separation between server-fetched initial state and client-managed reactive state.

---

### ADR-003: Dual-Token Authentication Lifecycle with Refresh Token Rotation & Invalidation
* **Status:** `APPROVED (Baseline Proposed)`
* **Context:** Conforming to SRS `FR-AUTH-001` through `FR-AUTH-008`, `NFR-SEC-001`, and OWASP ASVS session security standards. Storing persistent JWTs in client `localStorage` is vulnerable to XSS.
* **Decision:**
  1. Passwords hashed using **Argon2id** (memory cost: 64MB, iterations: 3, parallelism: 1).
  2. Access Tokens: Short-lived (15 minutes), signed RS256/HS256 JWTs held exclusively in client memory / state.
  3. Refresh Tokens: Long-lived (7 days), cryptographically random 256-bit entropy tokens stored as SHA-256 hashes in PostgreSQL (`refresh_tokens` table) and issued to the browser in an `HttpOnly`, `Secure`, `SameSite=Strict` cookie path-restricted to `/api/v1/auth/refresh`.
  4. Token Rotation: Every refresh request invalidates the consumed refresh token and issues a new pair. If an already-invalidated refresh token is presented, the system detects a potential token theft and revokes all active sessions for that user family immediately.
* **Consequences:**
  - *Positive:* Highest tier of XSS and CSRF defense; instant session revocation capability; fully compliant with enterprise security standards.
  - *Negative:* Slightly higher database write load on token refresh cycles (one write every 15 minutes per active user).

---

### ADR-004: Server-Side Role-Based & Permission-Based Authorization Enforcement
* **Status:** `APPROVED (Baseline Proposed)`
* **Context:** Conforming to SRS `FR-RBAC-001` through `FR-RBAC-006` and Business Rule `BR-011`. Frontend UI hiding is purely for user experience; absolute security must be enforced by the API.
* **Decision:** Implement a two-tiered authorization system in NestJS:
  1. Role Guards (`@Roles('Employee', 'Agent', 'Manager', 'Administrator')`): Restricts endpoint access at the macro level.
  2. Permission Guards (`@Permissions('ticket:assign', 'incident:declare', 'user:lock')`): Fine-grained permission checks verified against the authenticated user's active permissions.
  3. Row-Level Ownership / Scoping Interceptors: Even with permission, a user may only access resources within their authorized scope (e.g., Employees can only view tickets where `requester_id == user.id`; Agents can only view tickets within their assigned scope).
* **Consequences:**
  - *Positive:* Zero risk of broken object-level authorization (BOLA / IDOR); complete defense-in-depth.
  - *Negative:* Requires explicit context parameters passed to service layers for ownership validation.

---

### ADR-005: Relational System of Record with PostgreSQL 16 & Prisma ORM
* **Status:** `APPROVED (Baseline Proposed)`
* **Context:** ITSM systems require strict referential integrity, ACID transactional consistency, rich querying (filtering, pagination, sorting), and audit compliance.
* **Decision:** Deploy PostgreSQL 16 as the sole system of record. Utilize Prisma ORM for type-safe schema modeling, database migrations, and client query generation. All schema modifications must occur via explicit version-controlled Prisma migrations (`prisma migrate dev`).
* **Consequences:**
  - *Positive:* Complete type safety from database column to frontend TypeScript types; guaranteed relational integrity; declarative migration management.
  - *Negative:* Prisma does not natively support some advanced PostgreSQL features (e.g., custom trigger-based partition management) without raw SQL escape hatches.

---

### ADR-006: Asynchronous Task Processing & Queue Decoupling via Redis 7 & BullMQ
* **Status:** `APPROVED (Baseline Proposed)`
* **Context:** Operations such as email dispatch, SLA deadline evaluation, breach warnings, and webhook distribution must not block synchronous HTTP request cycles (target: API response < 500ms under `NFR-PERF-001`).
* **Decision:** Utilize Redis 7 as an in-memory queue broker managed by **BullMQ** within the NestJS runtime. Dedicated queue processors (`email-queue`, `sla-queue`, `notification-queue`) execute background work with exponential backoff retry policies (3 attempts) and dead-letter queues (DLQ).
* **Consequences:**
  - *Positive:* Eliminates HTTP request latency spikes; guarantees retryability of failed external network calls (SMTP delivery); insulates core API from external service downtimes.
  - *Negative:* Introduces an operational dependency on Redis persistence (RDB/AOF) to ensure queued jobs survive container restarts.

---

### ADR-007: Immutable SLA Policy Snapshotting on Ticket Creation
* **Status:** `APPROVED (Baseline Proposed)`
* **Context:** Conforming to SRS `FR-SLA-003`, `FR-SLA-004`, and Business Rule `BR-008`. In enterprise ITSM, modifying an organizational SLA policy must never retroactively modify or invalidate deadlines for tickets filed under previous policies.
* **Decision:** When a ticket is created, the system resolves the applicable SLA policy, calculates the exact target timestamps (`response_due_at`, `resolution_due_at`) according to the active business calendar, and writes an immutable snapshot into `sla_tracking`. Future modifications to the SLA policy table produce new version records (`version 2.0`) and leave running tickets unaffected.
* **Consequences:**
  - *Positive:* Total audit integrity and historical reporting accuracy; immune to retroactive compliance disputes.
  - *Negative:* Requires careful handling if a manager explicitly executes an authorized ticket priority upgrade or reclassification.

---

### ADR-008: Real-Time State Synchronization via Authenticated WebSocket Gateway
* **Status:** `APPROVED (Baseline Proposed)`
* **Context:** Support agents, managers, and employees require live updates when ticket statuses change, new comments are posted, or SLA warnings fire (SRS `FR-NOT-005`, `NFR-USE-001`).
* **Decision:** Deploy a Socket.io / NestJS WebSocket Gateway. Clients authenticate upon connection using their ephemeral JWT. The gateway joins clients to secure rooms:
  1. User Personal Room: `user:{userId}` (receives personal alerts, assignment notices).
  2. Ticket Conversation Room: `ticket:{ticketId}` (requester and assigned agents receive live comments).
  3. Operations Room: `team:operations` (managers receive incident broadcasts and unassigned queue surges).
* **Consequences:**
  - *Positive:* Sub-100ms UI updates; eliminates wasteful client-side polling loops; enhances collaboration.
  - *Negative:* Requires WebSocket state tracking in Redis adapter if multi-instance horizontal scaling is introduced in future releases.

---

### ADR-009: Strict Internal Notes Privacy Separation at Database & API Layer
* **Status:** `APPROVED (Baseline Proposed)`
* **Context:** Conforming to SRS `FR-TKT-011` and Business Rule `BR-006`: *"Internal notes must never be exposed to employees."*
* **Decision:**
  1. In the database, `ticket_comments` contains an explicit enum column `visibility` (`PUBLIC`, `INTERNAL`).
  2. In the API layer, the Prisma query in `TicketsService.getComments()` conditionally filters out `INTERNAL` comments unless the authenticated user holds the `comment:read_internal` permission.
  3. Response serialization DTOs strip internal note structures entirely before serialization to employee clients.
  4. WebSocket broadcasts for internal notes are only emitted to private staff rooms (`ticket:{ticketId}:staff`), never to the public ticket room.
* **Consequences:**
  - *Positive:* 100% leak-proof privacy boundary enforced at the database query, API serializer, and WebSocket dispatch layers.
  - *Negative:* Support agents must be trained to check the "Internal Note" toggle when drafting private diagnostic discussions.

---

### ADR-010: Tamper-Evident Append-Only Audit Logging with JSON Metadata
* **Status:** `APPROVED (Baseline Proposed)`
* **Context:** Conforming to SRS `FR-AUD-001` through `FR-AUD-004` and Business Rule `BR-010`: Privileged actions (role grants, ticket reassignments, account locks, policy edits) must be permanently auditable and protected against ordinary modification or deletion.
* **Decision:** Deploy an append-only `audit_logs` table in PostgreSQL.
  - Columns: `id (UUID)`, `actor_id (UUID)`, `actor_role (String)`, `action (String)`, `resource_type (String)`, `resource_id (String)`, `ip_address (Inet)`, `user_agent (Text)`, `changes (JSONB: {old, new})`, `created_at (Timestamp)`.
  - Database Constraints: Database user permissions granted to the NestJS application allow `INSERT` and `SELECT` on `audit_logs`. `UPDATE` and `DELETE` grants are revoked on `audit_logs` at the database user role level.
* **Consequences:**
  - *Positive:* Guarantees non-repudiation and regulatory compliance; impossible for compromised application code to overwrite audit history.
  - *Negative:* Table grows continuously; requires documented cold storage partitioning and retention policies after 24 months.

---

## Part II: Central Unresolved Issues & Technical Risk Register

This register identifies open architectural decisions, technical ambiguities, and risk mitigations requiring alignment during development.

| Issue ID | Category | Summary & Architectural Dilemma | Options Evaluated | Proposed Recommendation | Impact & Owner | Status |
| :---: | :---: | :--- | :--- | :--- | :---: | :---: |
| **ISSUE-001** | Multi-Tenancy | **Organization Partitioning Strategy:** Single-tenant initial release vs future multi-tenant database partitioning. | **A:** Completely isolated databases per org.<br>**B:** Shared database with `organization_id` foreign key on all core tables.<br>**C:** Single-org schema without org_id column. | **Option B (Recommended):** Include `organization_id` column in all core models now, default to single organization (`Northwind Internal IT`), but enforce tenant scoping in queries. Prevents massive database refactoring later. | Database Architect / Lead Dev | **PROPOSED** |
| **ISSUE-002** | File Storage | **Attachment Storage Architecture:** Local persistent Docker volumes vs S3-Compatible Object Storage (MinIO / AWS S3). | **A:** Local filesystem directory mounted via Docker volume.<br>**B:** S3-compatible API using MinIO locally and S3 in cloud.<br>**C:** Database BLOB storage. | **Option B (Recommended):** Build an `IStorageService` interface with an S3-compatible client (using MinIO locally and S3/VPS bucket in production). Avoids volume backup desynchronization and enables direct pre-signed download URLs. | Systems Architect / DevOps | **PROPOSED** |
| **ISSUE-003** | Network Topology | **Reverse Proxy & Domain Mapping:** Unified origin (`app.domain.com/api`) vs Split subdomains (`app.domain.com` and `api.domain.com`). | **A:** Unified domain with Nginx path routing (`/` &rarr; Next.js, `/api` &rarr; NestJS).<br>**B:** Split subdomains with cross-origin CORS configuration. | **Option A (Recommended):** Unified domain routing eliminates cross-site cookie restrictions, simplifies `SameSite=Strict` cookies, and removes CORS preflight overhead. | Network Architect / DevOps | **PROPOSED** |
| **ISSUE-004** | SLA Engine | **Holiday & Non-Working Day Engine:** Handling corporate holidays and weekend pause states in SLA calculations. | **A:** Fixed Monday–Friday 08:00–18:00 calculation only.<br>**B:** Dynamic business calendar table storing corporate holiday dates and custom operating schedules. | **Option B (Recommended):** Implement `business_calendars` and `calendar_holidays` entities in DB. SLA engine queries holiday table when computing target timestamps. | Backend Lead / BA | **PROPOSED** |
| **ISSUE-005** | Incident Mgmt | **Major Incident to Ticket Cardinality:** 1:N vs N:M ticket-to-incident associations. | **A:** Strict 1:N (A ticket belongs to at most one incident via `ticket.incident_id`).<br>**B:** N:M junction table (`incident_tickets`). | **Option A (Recommended for MVP):** A service request represents one specific user issue and should link to at most one root outage in the initial release. A junction table can be introduced in Phase 2 if complex multi-root correlations are mandated. | Lead Architect / BA | **PROPOSED** |
| **ISSUE-006** | Audit Retention | **Audit Trail Archival & Storage Growth:** Long-term capacity planning for high-volume audit logs. | **A:** Retain in primary database indefinitely.<br>**B:** Partition table by year (`audit_logs_2026`) and archive past years to cold storage compressed JSON after 24 months. | **Option B (Recommended):** Retain 24 months in primary PostgreSQL; schedule an automated yearly archival job to export older records to cold storage. | Database Architect / DBA | **PROPOSED** |

