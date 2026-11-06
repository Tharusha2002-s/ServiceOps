# ServiceOps — Software Design Document (SDD)
## Phase 02: Comprehensive Requirement Analysis & Specification Catalogue

> **Document Identifier:** `SO-SDD-02-REQ-ANALYSIS`  
> **Document Version:** 2.0.0 (Comprehensive Baseline Extraction)  
> **Classification:** Engineering Specification — Technical Single Source of Truth  
> **Primary Authors:** Principal Software Architect, Senior System Analyst, Business Analyst, Database Architect & Technical Documentation Engineer  
> **Governing Baselines:**
> - Software Requirements Specification (SRS) v1.0 (`Docx/ServiceOps_SRS.docx`)
> - Software Project Proposal v1.0 (`Docx/ServiceOps_Project_Proposal.docx`)
> - Baseline System Architecture Design (SAD) v1.0 (`Docx/ServiceOps_System_Architecture_Design.docx`)
> - Database Design Specification v1.0 (`Docx/ServiceOps_Database_Design_Specification.docx`)
> - Approved Phase 01 Architectural Foundation (`docs/sdd/PHASE_01_ARCHITECTURAL_FOUNDATION_AND_GAP_ANALYSIS.md`)
> - Interactive UI/UX Design System Prototype (`design/index.html`)

---

## Executive Summary & Engineering Methodology

This document establishes the **authoritative, implementation-ready requirement catalogue** for ServiceOps. Through deep multi-disciplinary analysis, every requirement from the source SRS and Project Proposal has been systematically extracted, analyzed, and classified into standard engineering dimensions.

### Extraction & Structuring Rules
1. **Exhaustive Functional Elaboration:** Every functional requirement is expanded into a complete 13-point specification defining responsible roles, triggers, pre-conditions, main success paths, alternative flows, failure modes, enforcing business rules, module bindings, and implementation priorities.
2. **Measurable Non-Functional Acceptance Criteria:** Every quality attribute (security, performance, availability, reliability, maintainability, scalability) is assigned concrete, verifiable metrics and testing methodologies.
3. **Formal Requirement Governance:** Ambiguities, duplicate definitions, conflicting statements, and unstated assumptions identified across the original documents have been explicitly audited, cross-referenced, and resolved.
4. **Zero Invention Guarantee:** No extraneous features or scope alterations have been introduced beyond the approved project vision and architecture baseline.

---

## Master Requirement Classification Index

The ServiceOps requirement landscape is partitioned into ten distinct engineering categories:

1. [Section 1: Detailed Functional Requirements Analysis](#1-detailed-functional-requirements-analysis) (66 Requirements across 11 Functional Domains)
2. [Section 2: Non-Functional Requirements & Measurable Acceptance Criteria](#2-non-functional-requirements--measurable-acceptance-criteria) (12 Quality Requirements)
3. [Section 3: Business Rules Catalog](#3-business-rules-catalog) (BR-001 through BR-012)
4. [Section 4: User & Role Requirements](#4-user--role-requirements) (4 Core User Classes & Scopes)
5. [Section 5: Security Requirements](#5-security-requirements) (Authentication, RBAC, Data Protection, ASVS)
6. [Section 6: Integration Requirements](#6-integration-requirements) (REST, WebSockets, DB, Redis, SMTP, S3, Monitoring)
7. [Section 7: Reporting Requirements](#7-reporting-requirements) (Role-Specific Dashboards & Export Pipelines)
8. [Section 8: Data Requirements](#8-data-requirements) (Entities, Constraints, Transactions, Archival)
9. [Section 9: Performance Requirements](#9-performance-requirements) (Latency, Throughput, Concurrency)
10. [Section 10: Operational Requirements](#10-operational-requirements) (Backups, Disaster Recovery, Observability, CI/CD)
11. [Section 11: Requirement Anomalies Audit](#11-requirement-anomalies-audit) (Duplications, Conflicts, Ambiguities, and Resolutions)
12. [Section 12: Comprehensive Traceability Matrix](#12-comprehensive-traceability-matrix) (End-to-End Requirement Verification)

---

## 1. Detailed Functional Requirements Analysis

Every functional requirement from the source documentation is elaborated below using the standardized 13-point engineering template.

### 1.1 Authentication and Account Management (MOD-01)

#### FR-AUTH-001: User Sign-In with Valid Credentials
* **Requirement ID:** `FR-AUTH-001`
* **Requirement Name:** User Sign-In with Valid Credentials
* **Detailed Description:** The system shall authenticate registered users using normalized work email address and password, verifying cryptographic hashes and issuing authorized session credentials.
* **Responsible User Role:** All Users (Employee, IT Support Agent, IT Manager, System Administrator)
* **Trigger:** User submits login form on the authentication interface (`/login`).
* **Preconditions:** User account exists in PostgreSQL database and status is `ACTIVE`.
* **Main Behavior:** User provides email and plaintext password. Backend validates input syntax, normalizes email to lowercase, fetches user record, verifies password hash via Argon2id, resets failed login counter on success, issues short-lived JWT access token and rotated refresh token cookie, logs authentication event, and returns user identity payload with assigned roles.
* **Expected Outcome:** User is authenticated, session is established, and user is redirected to role-specific dashboard.
* **Alternative Scenarios:** User possesses multiple roles; system applies the union of permissions or prompts role selector if configured.
* **Failure Scenarios:**
  - Non-existent email: System returns generic `401 Unauthorized` without revealing account existence.
  - Invalid password: System increments failed attempt counter, evaluates throttling rule (`FR-AUTH-007`), returns generic `401 Unauthorized`.
  - Deactivated or locked account: System returns `403 Forbidden` with reason code `ACCOUNT_LOCKED` or `ACCOUNT_INACTIVE`.
* **Business Rules:** `BR-001`, `BR-010`, `BR-011`
* **Related Modules:** `AuthModule`, `UsersModule`, `AuditModule`
* **Priority:** `Critical`

---

#### FR-AUTH-002: Argon2id Password Hashing
* **Requirement ID:** `FR-AUTH-002`
* **Requirement Name:** Argon2id Password Hashing
* **Detailed Description:** The system shall hash user passwords using the Argon2id algorithm with enterprise-grade cryptographic cost parameters prior to persistent storage.
* **Responsible User Role:** System / Backend Security Engine
* **Trigger:** User registration, password reset completion, or administrative credential provisioning.
* **Preconditions:** Plaintext password satisfies password complexity policy (minimum 12 characters, uppercase, lowercase, number, symbol).
* **Main Behavior:** Backend passes plaintext password and a cryptographically secure 128-bit random salt to the Argon2id engine (configured parameters: `memoryCost: 65536 KB`, `timeCost: 3 iterations`, `parallelism: 1 thread`, `hashLength: 32 bytes`). The resulting encoded hash string is written to `users.password_hash`. Plaintext password is never logged or retained in memory longer than the hashing function call.
* **Expected Outcome:** Passwords are cryptographically protected against GPU/ASIC offline dictionary and rainbow-table attacks.
* **Alternative Scenarios:** Legacy hash verification (not applicable for initial release; all passwords use Argon2id from v1.0).
* **Failure Scenarios:**
  - Hashing algorithm failure: Server returns `500 Internal Server Error`, transaction rolls back, zero data persisted.
* **Business Rules:** `BR-010`
* **Related Modules:** `AuthModule`
* **Priority:** `Critical`

---

#### FR-AUTH-003: Dual-Token Credential Issuance
* **Requirement ID:** `FR-AUTH-003`
* **Requirement Name:** Dual-Token Credential Issuance (Access & Refresh Tokens)
* **Detailed Description:** The system shall issue ephemeral in-memory access tokens and securely managed HttpOnly refresh tokens upon successful authentication.
* **Responsible User Role:** System / Backend Auth Engine
* **Trigger:** Successful execution of `FR-AUTH-001` or token refresh cycle (`FR-AUTH-004`).
* **Preconditions:** User credentials verified and account is active.
* **Main Behavior:** System generates:
  1. Access Token: Signed JWT (lifetime: 15 minutes), containing claims (`sub: userId`, `email`, `role`, `permissions: []`). Returned in JSON response payload and stored strictly in client memory.
  2. Refresh Token: 256-bit entropy random token (lifetime: 7 days). Stored as SHA-256 hash in `refresh_tokens` database table with expiry timestamp. Dispatched to client via an `HttpOnly`, `Secure`, `SameSite=Strict` cookie path-restricted to `/api/v1/auth/refresh`.
* **Expected Outcome:** Client obtains authorization token for API requests while protecting the persistent session token from XSS and CSRF exploitation.
* **Alternative Scenarios:** Mobile / programmatic API client: refresh token transmitted via secure header if cookie support is absent (configured via client flag).
* **Failure Scenarios:**
  - Database failure writing refresh token record: Transaction aborted, access token not issued, returns `500 Internal Server Error`.
* **Business Rules:** `BR-010`, `BR-011`
* **Related Modules:** `AuthModule`
* **Priority:** `Critical`

---

#### FR-AUTH-004: Refresh Token Rotation & Invalidation Detection
* **Requirement ID:** `FR-AUTH-004`
* **Requirement Name:** Refresh Token Rotation & Reuse Detection
* **Detailed Description:** The system shall rotate refresh tokens upon every refresh exchange and immediately invalidate the entire session family if reuse of an invalidated refresh token is detected.
* **Responsible User Role:** Authenticated Client / System
* **Trigger:** Client issues `POST /api/v1/auth/refresh` with existing refresh token cookie prior to access token expiry.
* **Preconditions:** Client presents a valid, unexpired refresh token cookie.
* **Main Behavior:** Backend hashes presented token with SHA-256 and searches `refresh_tokens` table:
  - If token is found and status is active: Backend marks consumed token as `revoked: true`, generates a brand-new refresh token and access token, writes new refresh token record to DB, sets new cookie, and returns new access token.
  - If token is found but already revoked (Replay / Theft scenario): Backend immediately revokes all active refresh tokens belonging to that user family (`revoked_at: now()`), logs critical security alert in `audit_logs`, clears client cookie, and returns `401 Unauthorized`.
* **Expected Outcome:** Legitimate users stay signed in seamlessly; token theft attempts trigger automated instant session termination across all devices.
* **Alternative Scenarios:** Concurrent refresh calls within 5-second grace window: handled via Redis mutex lock to prevent false-positive revocation during network latency.
* **Failure Scenarios:**
  - Expired refresh token: Returns `401 Unauthorized`, clears cookie, prompts user to sign in again.
* **Business Rules:** `BR-010`, `BR-011`
* **Related Modules:** `AuthModule`, `AuditModule`
* **Priority:** `High`

---

#### FR-AUTH-005: User Sign-Out & Session Revocation
* **Requirement ID:** `FR-AUTH-005`
* **Requirement Name:** User Sign-Out & Session Revocation
* **Detailed Description:** The system shall allow authenticated users to terminate their active session, revoking the associated refresh token and clearing client session cookies.
* **Responsible User Role:** All Users
* **Trigger:** User clicks "Sign out" button in application header.
* **Preconditions:** User is currently authenticated with valid session cookie.
* **Main Behavior:** Client dispatches `POST /api/v1/auth/logout`. Backend marks current refresh token as revoked in database, clears the HttpOnly refresh token cookie with an expired `Max-Age=0` directive, emits audit record `auth.logout`, and disconnects active WebSocket connections for the user session. Client purges access token from memory and redirects to `/login`.
* **Expected Outcome:** Session credentials immediately become invalid on both client and server.
* **Alternative Scenarios:** Sign out from all devices: backend revokes all active refresh tokens where `user_id == current_user.id`.
* **Failure Scenarios:**
  - Network interruption: Client clears local state regardless; backend token expires naturally or via next rotation cycle.
* **Business Rules:** `BR-010`
* **Related Modules:** `AuthModule`, `AuditModule`
* **Priority:** `High`

---

#### FR-AUTH-006: Account Activation and Deactivation
* **Requirement ID:** `FR-AUTH-006`
* **Requirement Name:** Account Activation and Deactivation
* **Detailed Description:** Authorized administrators shall activate, deactivate, or lock user accounts without deleting historical ticket or audit references.
* **Responsible User Role:** System Administrator
* **Trigger:** Administrator updates user status in People Management console (`/people`).
* **Preconditions:** Administrator holds `user:manage` permission; target account exists.
* **Main Behavior:** Administrator changes user status (e.g., `ACTIVE` to `DEACTIVATED`). Backend updates `users.status`, revokes all active refresh tokens for the user, terminates active WebSocket connections, and logs `user.deactivate` in audit log. Deactivated user cannot authenticate or perform actions, but all historical tickets requested or resolved by the user preserve referential integrity.
* **Expected Outcome:** User access is instantly revoked while data history remains intact.
* **Alternative Scenarios:** Reactivation: Administrator changes status to `ACTIVE`; user receives notification email and can log in or reset password.
* **Failure Scenarios:**
  - Administrator attempts to deactivate their own account: Request rejected with `400 Bad Request` to prevent self-lockout.
  - Non-administrator attempts update: Server returns `403 Forbidden`.
* **Business Rules:** `BR-002`, `BR-010`, `BR-011`
* **Related Modules:** `UsersModule`, `AuthModule`, `AuditModule`
* **Priority:** `High`

---

#### FR-AUTH-007: Failed Authentication Throttling & Account Locking
* **Requirement ID:** `FR-AUTH-007`
* **Requirement Name:** Failed Authentication Throttling & Account Locking
* **Detailed Description:** The system shall throttle repeated failed authentication attempts and lock accounts after 8 consecutive failures to prevent brute-force attacks.
* **Responsible User Role:** System / Security Engine
* **Trigger:** Consecutive failed login attempts for a single email or IP address.
* **Preconditions:** User exists or anonymous brute-force scan occurs.
* **Main Behavior:**
  1. Per-IP Rate Limiting: Redis sliding-window counter restricts IP to max 10 failed attempts per minute. Exceeding triggers `429 Too Many Requests`.
  2. Account Lockout: Database tracks `failed_login_attempts`. Upon 8 consecutive failures within 30 minutes, account status transitions to `LOCKED`, failed timestamp is recorded, security alert event `auth.lock` is written to `audit_logs`, and admin notification is dispatched.
  3. Locked account rejects authentication with message directing user to contact helpdesk or reset password.
* **Expected Outcome:** Brute-force credential stuffing attacks are stopped automatically.
* **Alternative Scenarios:** Account unlock: Administrator manually unlocks account in `/people`, or user completes verified password reset workflow (`FR-AUTH-008`).
* **Failure Scenarios:**
  - Redis unavailable: System falls back to database-level failed attempt counter.
* **Business Rules:** `BR-010`
* **Related Modules:** `AuthModule`, `AuditModule`, `NotificationsModule`
* **Priority:** `High`

---

#### FR-AUTH-008: Secure Password-Reset Workflow
* **Requirement ID:** `FR-AUTH-008`
* **Requirement Name:** Secure Password-Reset Workflow
* **Detailed Description:** The system shall provide a secure, single-use, time-limited password reset workflow that does not reveal account existence to unauthenticated requesters.
* **Responsible User Role:** All Users
* **Trigger:** User submits work email on `/reset` page.
* **Preconditions:** None required on client; user may or may not exist.
* **Main Behavior:**
  1. User inputs email. Interface always displays: *"If an account exists for that email, a reset link is on its way."* (prevents user enumeration).
  2. If account exists and is not deactivated, backend generates a cryptographically random 256-bit token, hashes it with SHA-256, stores hash in DB with 30-minute expiry, and dispatches reset link via BullMQ email queue (`FR-NOT-002`).
  3. User clicks link, enters new password meeting complexity policy. Backend validates token validity, hashes new password with Argon2id (`FR-AUTH-002`), updates `users.password_hash`, deletes consumed reset token, revokes all existing sessions, resets failed login counter to 0, unlocks account if locked, and logs `auth.password_reset`.
* **Expected Outcome:** User securely regains account access without compromising account discovery.
* **Alternative Scenarios:** Token expired or already used: User is redirected to `/reset` with notification that the link has expired.
* **Failure Scenarios:**
  - Password does not meet complexity: Form rejects with specific requirement feedback before submission.
  - SMTP delivery failure: BullMQ retries 3 times; if permanently failed, logs error in system logs.
* **Business Rules:** `BR-010`
* **Related Modules:** `AuthModule`, `NotificationsModule`, `AuditModule`
* **Priority:** `High`

---

### 1.2 Roles and Permissions (MOD-02)

#### FR-RBAC-001: Four Role Hierarchy Support
* **Requirement ID:** `FR-RBAC-001`
* **Requirement Name:** Four Role Hierarchy Support
* **Detailed Description:** The system shall support four formal roles: Employee, IT Support Agent, IT Manager, and System Administrator, each with distinct operational boundaries.
* **Responsible User Role:** System / Security Engine
* **Trigger:** System initialization, user provisioning, or role check.
* **Preconditions:** Database seeded with the 4 core roles in `roles` table.
* **Main Behavior:** System maintains four immutable system roles:
  - `Employee`: Can create and manage own tickets, view public knowledge base, receive notifications, confirm resolutions.
  - `IT Support Agent`: Can view assigned/team ticket queues, investigate tickets, record public comments and internal notes, resolve tickets, draft knowledge articles.
  - `IT Manager`: Can oversee all tickets, assign/reassign tickets, balance agent workloads, declare major incidents, manage SLA policies, view reports.
  - `System Administrator`: Can manage user accounts, grant roles, configure ticket categories, manage SLA policies, view append-only audit trail, configure organization settings.
* **Expected Outcome:** Every user operates strictly within their assigned operational domain.
* **Alternative Scenarios:** Multi-role assignment (e.g., user is both Employee and IT Support Agent): system applies the additive union of permissions.
* **Failure Scenarios:**
  - Role definition missing in database: Startup health check fails with fatal configuration error.
* **Business Rules:** `BR-001`, `BR-002`, `BR-011`
* **Related Modules:** `UsersModule`, `AuthModule`
* **Priority:** `Critical`

---

#### FR-RBAC-002: Default Employee Role for Self-Registration
* **Requirement ID:** `FR-RBAC-002`
* **Requirement Name:** Default Employee Role for Self-Registration
* **Detailed Description:** Any new self-registered user account shall automatically receive the Employee role by default and cannot self-assign elevated privileges.
* **Responsible User Role:** New User / System
* **Trigger:** User completes registration or first-time enterprise sign-in.
* **Preconditions:** Registration enabled or new work email verified.
* **Main Behavior:** When a new user record is inserted, the registration service assigns the `Employee` role identifier in `user_roles`. The user role cannot be chosen from the client request payload; any role parameter passed in the body is stripped by DTO validation pipes.
* **Expected Outcome:** Newly provisioned accounts only possess baseline requester permissions.
* **Alternative Scenarios:** Initial provisioning seed script: explicitly creates the initial `System Administrator` account with secure randomly generated credentials.
* **Failure Scenarios:**
  - Client attempts privilege escalation by injecting `role: "Administrator"` in body: DTO validator rejects request with `400 Bad Request (whitelisted properties only)`.
* **Business Rules:** `BR-001`, `BR-002`
* **Related Modules:** `UsersModule`, `AuthModule`
* **Priority:** `Critical`

---

#### FR-RBAC-003: Administrator-Only Elevated Role Granting
* **Requirement ID:** `FR-RBAC-003`
* **Requirement Name:** Administrator-Only Elevated Role Granting
* **Detailed Description:** Only authorized System Administrators shall grant, modify, or revoke elevated roles (Agent, Manager, Administrator).
* **Responsible User Role:** System Administrator
* **Trigger:** Administrator updates user roles in People Management (`/people`).
* **Preconditions:** Authenticated user holds `role:manage` permission and `Administrator` role.
* **Main Behavior:** Administrator selects target user and assigns or removes roles. Backend verifies administrator permission, updates `user_roles` within an atomic transaction, invalidates active cached permission sessions for the target user, and records a mandatory audit event `role.grant` or `role.revoke` detailing actor, target, role, and timestamp.
* **Expected Outcome:** Elevated permissions are strictly controlled and auditable.
* **Alternative Scenarios:** Revoking manager role from user with active incident command: system prompts reassigning open command responsibilities before proceeding.
* **Failure Scenarios:**
  - Non-administrator issues role update API call: Server returns `403 Forbidden` and logs unauthorized attempt.
  - Attempt to remove Administrator role from the sole remaining administrator account: Blocked with `400 Bad Request` to prevent orphan lockout.
* **Business Rules:** `BR-002`, `BR-010`, `BR-011`
* **Related Modules:** `UsersModule`, `AuditModule`
* **Priority:** `Critical`

---

#### FR-RBAC-004: Atomic Permissions Mapping to Roles
* **Requirement ID:** `FR-RBAC-004`
* **Requirement Name:** Atomic Permissions Mapping to Roles
* **Detailed Description:** The system shall support granular, atomic permissions grouped into logical permission sets and mapped to system roles.
* **Responsible User Role:** System / Security Engine
* **Trigger:** Permission guard evaluation on API requests.
* **Preconditions:** Role-permission mappings seeded in database.
* **Main Behavior:** System models permissions as discrete action-resource tokens (e.g. `ticket:create`, `ticket:assign`, `ticket:resolve`, `comment:read_internal`, `comment:write_internal`, `incident:declare`, `sla:manage`, `user:manage`, `audit:read`). Roles map to sets of permissions. When a user authenticates, their effective permissions are compiled and evaluated by NestJS `PermissionsGuard`.
* **Expected Outcome:** Authorization logic is decoupled from hardcoded role strings, allowing fine-grained access control.
* **Alternative Scenarios:** Custom permission overrides per user: supported via direct user-permission association table in database design.
* **Failure Scenarios:**
  - Database mapping corrupt: System defaults to deny-all security posture.
* **Business Rules:** `BR-011`
* **Related Modules:** `UsersModule`, `AuthModule`
* **Priority:** `High`

---

#### FR-RBAC-005: Server-Side Authorization Verification on Every Endpoint
* **Requirement ID:** `FR-RBAC-005`
* **Requirement Name:** Server-Side Authorization Verification
* **Detailed Description:** The backend API shall independently verify authentication, role validity, permission grants, and resource ownership for every protected HTTP route and WebSocket message.
* **Responsible User Role:** System / Backend Security Engine
* **Trigger:** Inbound HTTP request or WebSocket event received at NestJS Gateway.
* **Preconditions:** Request contains bearer access token or session cookie.
* **Main Behavior:** Execution pipeline:
  1. `JwtAuthGuard`: Validates JWT signature, expiration, and issuer. Attaches `req.user`.
  2. `RolesGuard`: Verifies `req.user.roles` matches `@Roles(...)` metadata.
  3. `PermissionsGuard`: Verifies `req.user.permissions` contains `@Permissions(...)`.
  4. `OwnershipInterceptor`: Validates that user owns the target resource or possesses organizational scope permission.
* **Expected Outcome:** Absolute security enforcement independent of client UI presentation.
* **Alternative Scenarios:** Public endpoints (e.g., `/auth/login`, `/auth/reset`): explicitly marked with `@Public()` decorator to bypass guards.
* **Failure Scenarios:**
  - Missing token: `401 Unauthorized`.
  - Insufficient role/permission: `403 Forbidden`.
* **Business Rules:** `BR-011`
* **Related Modules:** `AuthModule`, `UsersModule`
* **Priority:** `Critical`

---

#### FR-RBAC-006: Explicit Access Denial on Insufficient Permission
* **Requirement ID:** `FR-RBAC-006`
* **Requirement Name:** Explicit Access Denial
* **Detailed Description:** The system shall deny access and return standardized error payloads when a user attempts an operation without required permissions.
* **Responsible User Role:** System
* **Trigger:** User issues request lacking authorization.
* **Preconditions:** User is authenticated.
* **Main Behavior:** Guard halts request execution immediately. NestJS global exception filter catches rejection and formats standard JSON response:
  ```json
  {
    "statusCode": 403,
    "error": "Forbidden",
    "message": "You do not have permission to perform this action.",
    "requiredPermission": "ticket:assign",
    "timestamp": "2026-11-06T15:00:00.000Z"
  }
  ```
  Security event is logged if attempt represents a potential privilege escalation probe.
* **Expected Outcome:** Unauthorized operations fail safely without leaking internal data or stack traces.
* **Alternative Scenarios:** Anonymous user attempting protected route: returns `401 Unauthorized` directing client to login.
* **Failure Scenarios:** None; fail-closed behavior is the default.
* **Business Rules:** `BR-011`
* **Related Modules:** `AuthModule`, `UsersModule`
* **Priority:** `Critical`

---
