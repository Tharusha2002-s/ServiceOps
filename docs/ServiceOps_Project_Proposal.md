# ServiceOps — Enterprise IT Service Management & Operations Platform
## Comprehensive Project Proposal & Business Architecture Blueprint

---

**Document Control:**
- **Document Title:** ServiceOps Enterprise Project Proposal
- **Version:** 1.0.0 (Production Master)
- **Classification:** Enterprise Confidential / Executive Technical Proposal
- **Author:** Lead Systems Architect & Engineering Team
- **Date:** November 2026
- **Status:** Approved & Implemented

---

## 1. Executive Summary

### 1.1 The Enterprise Problem Statement
Modern enterprise organizations face severe operational bottlenecks driven by fragmented IT service workflows. In typical mid-to-large enterprises:
- **Disparate Support Channels:** Requests arrive randomly across unmanaged email inboxes, chat channels, and verbal requests, creating black holes where critical issues go untracked.
- **SLA Non-Compliance:** Without an automated, policy-driven SLA engine, P1/P2 critical business impediments breach deadlines, causing severe commercial and compliance consequences.
- **Disconnected Hardware CMDB:** When an employee reports a hardware malfunction, IT agents have no immediate visibility into the asset’s model, serial number, location, or maintenance history.
- **Major Incident Chaos:** When major regional outages occur, coordination is lost in fragmented threads without designated commanders, unified status feeds, or post-incident review (PIR) root cause tracking.
- **Regulatory Non-Compliance & Tamper Vulnerabilities:** Traditional database audit logs are stored in plain SQL tables, making them vulnerable to rogue database administrators or compromised credentials retroactively rewriting history.

### 1.2 The Proposed Solution: ServiceOps
**ServiceOps** is an enterprise-grade, ITIL v4-aligned IT Service Management (ITSM) and Incident Command Platform built from the ground up to unify all internal IT operations into a single pane of glass.

```
+--------------------------------------------------------------------------------------------------+
|                                    SERVICEOPS UNIFIED DESK                                       |
+--------------------------------------------------------------------------------------------------+
|  [ Self-Service Portal ]  |  [ Agent Dispatch Queue ]  |  [ Incident War Room ]  |  [ CMDB CM ]  |
+--------------------------------------------------------------------------------------------------+
|                  CORE ENGINE: ITIL v4 State Machine & Business-Hours SLA Engine                  |
+--------------------------------------------------------------------------------------------------+
|             REAL-TIME LAYER: Authenticated WebSockets & Brevo Multi-Channel Dispatch             |
+--------------------------------------------------------------------------------------------------+
|        INTEGRITY & SECURITY: Argon2id + JWT HttpOnly + SHA-256 Cryptographic Audit Ledger        |
+--------------------------------------------------------------------------------------------------+
|                            POSTGRESQL 16 ENTERPRISE PERSISTENCE LAYER                            |
+--------------------------------------------------------------------------------------------------+
```

### 1.3 Key Measurable Business Outcomes
1. **45% Reduction in Mean Time to Resolution (MTTR):** Driven by automated priority classification and direct CMDB asset linkage.
2. **99.98% SLA Compliance:** Enforced by real-time business-hours deadline calculation and automated 75% warning thresholds.
3. **100% Tamper-Evident Auditability:** Built-in SHA-256 blockchain-style append-only ledger for all privileged configuration and role changes.
4. **Zero-Trust Role-Based Access Control:** Strict RBAC separating System Administrators, IT Managers, IT Support Agents, and Employees with an Administrator Approval Gate for all self-registered accounts.

---

## 2. Business Context & Problem Definition

### 2.1 Current State vs. Proposed Future State

| Operational Area | Current State (Legacy / Fragmented) | Proposed Future State (ServiceOps Platform) |
| :--- | :--- | :--- |
| **Request Intake** | Email inboxes, Slack DMs, spreadsheets | Standardized self-service portal with dynamic categorization |
| **Priority Assignment** | Subjective guesswork by individual agents | Objective 3x3 ITIL matrix (Impact vs. Urgency) |
| **SLA Tracking** | Static clock or no automated tracking | Dynamic business-hours engine with weekend & holiday exclusion |
| **Asset Management** | Disconnected spreadsheets, lost hardware data | Integrated CMDB with direct ticket linking and lifecycle tracking |
| **Major Incidents** | Ad-hoc email chains and chaotic chat rooms | Dedicated War Room dashboard with Incident Commander timeline |
| **Compliance Audit** | Unchecked SQL logs susceptible to deletion | Cryptographic SHA-256 chained hash ledger with tamper detection |
| **User Notifications** | Unreliable notifications, exposed tokens | Real-time WebSockets + Brevo transactional email with 6-digit OTP |

### 2.2 Stakeholder Personas & Value Delivery

```
                       +-------------------------------+
                       |      SYSTEM ADMINISTRATOR     |
                       |  - User Approval Gate         |
                       |  - Cryptographic Audit Ledger |
                       |  - System Health & DR Backups |
                       +---------------+---------------+
                                       |
        +------------------------------+------------------------------+
        |                              |                              |
+-------v-------+              +-------v-------+              +-------v-------+
|  IT MANAGER   |              | SUPPORT AGENT |              |   EMPLOYEE    |
| - SLA Monitor |              | - Live Queue  |              | - Self-Help   |
| - Team Triaging|             | - Private Note|              | - Request Desk|
| - War Room Cmd|              | - CMDB Context|              | - Status Feed |
+---------------+              +---------------+              +---------------+
```

---

## 3. Scope of Work (SOW)

### 3.1 In-Scope Capabilities
- **Module 1: Authentication & Access Control (RBAC):**
  - Self-registration with default `PENDING_APPROVAL` status.
  - System Administrator review & activation workflow.
  - Cryptographically secure 6-digit numeric OTP password reset with 30-minute validity.
  - Argon2id password hashing and rotating JWT access/refresh tokens in HttpOnly cookies.
- **Module 2: ITIL Service Desk & Ticket Lifecycle:**
  - Standardized ticket submission with dynamic Impact and Urgency selectors.
  - Multi-state lifecycle: `NEW` -> `ASSIGNED` -> `IN_PROGRESS` -> `RESOLVED` -> `CLOSED`.
  - Private agent internal notes (`INTERNAL_NOTE`) segregated from public employee replies (`PUBLIC`).
  - First-response tracking and formal resolution sign-off.
- **Module 3: SLA Engine & Breach Prevention:**
  - 4-Tier ITIL policies: P1 Critical (24x7 Emergency, 15m response, 2h resolution), P2 High, P3 Medium, P4 Low.
  - Business-hours calculation skipping weekends and non-operating hours.
  - Automated breach prediction alerting at 75% threshold.
- **Module 4: Hardware CMDB & Asset Inventory:**
  - Tracking of physical assets by enterprise tags (`AST-...`), serial numbers, and locations.
  - Custodian assignment and bidirectional service ticket correlation.
  - Asset lifecycle states: `IN_SERVICE`, `IN_REPAIR`, `FAILED`, `RETIRED`, `SPARE`.
- **Module 5: Major Incident War Room Command:**
  - Formal declaration of P1 Critical organizational impediments.
  - Incident Commander role designation.
  - Real-time broadcast timeline for technical updates and executive status briefings.
  - Post-Incident Review (PIR) with documented Root Cause Analysis (RCA).
- **Module 6: Cryptographic Audit Trail Ledger:**
  - Append-only SHA-256 hash chaining of all privileged events.
  - Automatic scrubbing of sensitive credentials and secrets (`[REDACTED]`).
  - Real-time verification algorithm to detect data tampering.
- **Module 7: Real-Time WebSockets & Notifications:**
  - Low-latency Socket.io event broadcasting (`ticket:join`, `incident:join`).
  - Brevo (Sendinblue) transactional email dispatch with dual REST API and SMTP relay fallback.

### 3.2 Out-of-Scope (Future Enhancements)
- External third-party customer billing and invoicing.
- Native mobile applications (iOS/Android) — responsive web layout fulfills initial mobile requirements.
- AI automated agent resolution without human sign-off (reserved for Version 2.0).

---

## 4. Technical Architecture & Technology Stack

### 4.1 System Architecture Diagram

```
+---------------------------------------------------------------------------------------------+
|                                    CLIENT APPLICATION LAYER                                 |
|                                                                                             |
|   Next.js 14 App Router | React 18 | Tailwind CSS | Socket.io Client | Lucide Enterprise   |
+----------------------------------------------+----------------------------------------------+
                                               |
                                     HTTPS / WSS (Port 4000)
                                               |
+----------------------------------------------v----------------------------------------------+
|                                  NESTJS 10 BACKEND ENGINE                                   |
|                                                                                             |
|  +-------------------+  +-------------------+  +-------------------+  +-------------------+ |
|  |    AuthModule     |  |   TicketsModule   |  |     SlaModule     |  |    AssetsModule   | |
|  | - Argon2id / JWT  |  | - State Machine   |  | - Business Hours  |  | - CMDB Lifecycle  | |
|  | - 6-Digit OTP     |  | - Priority Matrix |  | - Breach Monitor  |  | - Ticket Linking  | |
|  +-------------------+  +-------------------+  +-------------------+  +-------------------+ |
|  +-------------------+  +-------------------+  +-------------------+  +-------------------+ |
|  |  IncidentsModule  |  |    AuditModule    |  |   EventsGateway   |  |    MailService    | |
|  | - War Room Log    |  | - SHA-256 Ledger  |  | - Live WebSockets |  | - Brevo REST /    | |
|  | - RCA Recording   |  | - Tamper Check    |  | - Role Channels   |  |   SMTP Relay      | |
|  +-------------------+  +-------------------+  +-------------------+  +-------------------+ |
+----------------------------------------------+----------------------------------------------+
                                               |
                                        Prisma ORM 5.22
                                               |
+----------------------------------------------v----------------------------------------------+
|                                   DATA PERSISTENCE LAYER                                    |
|                                                                                             |
|                                PostgreSQL 16 Relational Engine                              |
|                Users | Roles | Tickets | Assets | Incidents | SlaPolicies | AuditLogs        |
+---------------------------------------------------------------------------------------------+
```

### 4.2 Technology Justification Matrix

| Component | Selected Technology | Technical & Business Justification |
| :--- | :--- | :--- |
| **Backend Framework** | **NestJS 10 (TypeScript)** | Enterprise modular architecture, built-in dependency injection, native validation decorators, and seamless Swagger OpenAPI generation. |
| **Database & ORM** | **PostgreSQL 16 + Prisma** | ACID transaction compliance, strict foreign key constraints, robust schema migrations, and high-performance relational queries. |
| **Frontend Framework** | **Next.js 14 (App Router)** | Server-side rendering, instant page transitions, strict TypeScript type safety, and optimized responsive layouts. |
| **Real-time Protocol** | **Socket.io 4.8** | Low-latency bi-directional communication with automated fallback, reconnect mechanisms, and room-based authorization. |
| **Security & Passwords** | **Argon2id** | Winner of the Password Hashing Competition (PHC); resistant to GPU-accelerated brute-force and side-channel attacks. |
| **Audit Verification** | **SHA-256 Hash Chain** | Immutable, blockchain-inspired append-only ledger providing verifiable proof that logs have not been tampered with. |
| **Email Delivery** | **Brevo (Sendinblue)** | High-deliverability transactional infrastructure supporting both REST API (`xkeysib-`) and SMTP Relay (`xsmtpsib-`). |

---

## 5. Work Breakdown Structure (WBS) & Implementation Roadmap

```
Phase 0: Architecture & Database Modeling     [DONE]
Phase 1: Environment & Engine Sanity          [DONE]
Phase 2: Authentication, RBAC & 6-Digit OTP   [DONE]
Phase 3: Core Tickets & SLA Compliance Engine [DONE]
Phase 4: Hardware CMDB & War Room Command     [DONE]
Phase 5: Real-Time Sockets & Cryptographic QA [DONE]
Phase 6: UI/UX Brand Integration & Sign-Off   [DONE]
```

### 5.1 Project Milestone Schedule

| Milestone | Deliverables | Verification Technique |
| :--- | :--- | :--- |
| **M1: Foundation** | Prisma Schema, PostgreSQL database container, NestJS base | Automated migration execution & seed validation |
| **M2: Identity & RBAC** | Argon2id auth, HttpOnly JWT cookies, registration approval gate | Penetration testing & access boundary test suites |
| **M3: Core ITSM** | ITIL ticket state machine, 3x3 priority matrix, SLA calculator | 100% unit & integration test coverage |
| **M4: CMDB & Incidents** | Hardware asset inventory, P1 War Room dashboard, timeline log | Asset-to-ticket linking & status lifecycle tests |
| **M5: Security & Audit** | SHA-256 chained audit logs, Brevo email dispatch with 6-digit OTP | Artificial tamper-injection & cryptographic audit |
| **M6: UI/UX & Deployment** | Responsive layout, isometric logo & favicon integration, full QA | End-to-end user journeys & zero-error build |

---

## 6. Financial Analysis, Resource Allocation & ROI

### 6.1 Return on Investment (ROI) Projections (Year 1)
- **Reduced Lost Productivity:** Automated P1/P2 dispatch and war rooms reduce high-priority organizational downtime by an estimated 18 hours annually ($144,000 saved based on 200-employee knowledge workforce).
- **Asset Loss Prevention:** CMDB custodian assignment eliminates ghost hardware and unrecovered equipment losses (estimated $32,000 annual hardware recovery).
- **Compliance Penalty Avoidance:** Verifiable SHA-256 cryptographic audit trail satisfies ISO 27001, SOC 2, and internal governance audits without manual log compilation.

---

## 7. Risk Management Matrix

| Risk Identified | Severity | Probability | Built-In Architectural Mitigation Strategy |
| :--- | :---: | :---: | :--- |
| **Third-Party Email Outage** | Medium | Medium | Dual-mode Brevo REST API / SMTP Relay with in-memory safe capture fallback. Zero server crashes on network failure. |
| **Database Log Tampering** | High | Low | SHA-256 cryptographic chain. Every block includes previous block's hash. Any modification breaks chain integrity. |
| **Rogue Employee Account Creation** | High | Medium | Default `PENDING_APPROVAL` status. Self-registered users cannot access the system until approved by a System Administrator. |
| **SLA Deadline Calculation Error** | High | Low | Unit-tested business hours calculator with automated holiday/weekend exclusion and 75% threshold warnings. |
| **Brute Force on Password Reset** | High | Low | Single-use 6-digit numeric verification code expiring in 30 minutes. Hash comparison prevents token enumeration. |

---

## 8. Executive Sign-Off & Approvals

This project proposal represents the complete technical, operational, and commercial architecture of the **ServiceOps** platform. All proposed modules have been implemented, verified, and certified ready for production operations.
