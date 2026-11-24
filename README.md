# ServiceOps — Enterprise IT Service Management & Operations Platform

<div align="center">

![ServiceOps Logo](frontend/public/logo.png)

**Next-Generation Enterprise IT Service Management, SLA Automation & Incident War Room Platform**

[![CI/CD Pipeline](https://img.shields.io/badge/CI%2FCD-Passing-10b981.svg)](.github/workflows/ci.yml)
[![QA Test Coverage](https://img.shields.io/badge/QA%20Tests-124%2F124%20Passed-10b981.svg)](docs/ServiceOps_Software_Requirements_Specification_SRS.md)
[![Architecture](https://img.shields.io/badge/Architecture-Modular%20Monolith-blue.svg)](docs/ServiceOps_Project_Proposal.md)
[![Compliance](https://img.shields.io/badge/Compliance-IEEE%20830%20%2F%20ITIL%20v4-6366f1.svg)](docs/ServiceOps_Software_Requirements_Specification_SRS.md)
[![Cloud](https://img.shields.io/badge/Deployment-Amazon%20Web%20Services%20(AWS)-orange.svg)](docs/ServiceOps_AWS_Production_Deployment_Guide.md)

</div>

---

## 🌟 Overview

**ServiceOps** is a proprietary enterprise-grade IT Service Management (ITSM) and Incident Command platform designed for deployment exclusively on **Amazon Web Services (AWS)**. Engineered as a high-performance, modern alternative to legacy systems, ServiceOps unifies employee self-service, IT triage queues, SLA breach prevention, Configuration Management (CMDB), Major Incident War Rooms, and a cryptographic tamper-evident audit ledger into a single cohesive cloud solution.

---

## ✨ Key Capabilities

- 🎯 **ITIL v4 Service Desk:** 7-state lifecycle machine (`NEW` &rarr; `ASSIGNED` &rarr; `IN_PROGRESS` &rarr; `RESOLVED` &rarr; `CLOSED`), dynamic 3x3 Impact x Urgency priority matrix, and private internal notes (`INTERNAL_NOTE`) vs. customer communications.
- ⏱️ **Business-Hours SLA Engine:** 4-tier SLA policies with automated 75% breach warnings and dynamic business hours calculations that automatically pause countdown timers on weekends and outside 08:00–18:00.
- 🖥️ **Hardware CMDB & Asset Correlation:** Centralized inventory of laptops, desktops, docks, monitors, and licenses with unique asset tags, serial numbers, warranty tracking, and bidirectional ticket incident correlation.
- 🚨 **Major Incident War Room Command:** P1 outage declaration, Incident Commander assignment, live broadcast operational timeline, and structured Root Cause Analysis (RCA).
- 🔒 **Cryptographic Tamper-Evident Audit Ledger:** Append-only SHA-256 block-chained ledger with automated sensitive credential scrubbing (`[REDACTED]`) and instant mathematical integrity verification (`GET /api/v1/audit/verify`).
- 🛡️ **Enterprise Security & 6-Digit OTP:** Argon2id password hashing, registration approval workflow, and 30-minute cryptographically secure numeric OTP reset.
- ⚡ **Real-Time WebSockets:** Socket.io event bus for instant ticket updates, typing indicators, and war room collaboration.

---

## ☁️ Production Deployment on Amazon Web Services (AWS)

ServiceOps is engineered for multi-AZ deployment on AWS with zero server management:

### 1. Enterprise Serverless Stack (AWS ECS Fargate + Amazon RDS)
- **Infrastructure as Code:** Provision the complete Multi-AZ VPC, Application Load Balancer, Amazon RDS PostgreSQL 16, and Amazon ECR registries using [`infra/aws/cloudformation.yml`](file:///d:/Project/ServiceOps/infra/aws/cloudformation.yml):
  ```bash
  aws cloudformation deploy \
    --template-file infra/aws/cloudformation.yml \
    --stack-name serviceops-prod \
    --parameter-overrides EnvironmentName=serviceops-prod DBUsername=serviceopsadmin DBPassword=YourPassword123! \
    --capabilities CAPABILITY_NAMED_IAM
  ```
- **Automated Container Push:** Build and push Docker images to Amazon ECR and trigger an ECS rolling deployment using [`deploy-aws.sh`](file:///d:/Project/ServiceOps/deploy-aws.sh):
  ```bash
  ./deploy-aws.sh
  ```

### 2. Cost-Optimized Single EC2 Instance
- Spin up an Amazon EC2 instance (`t3.medium`, Ubuntu 22.04 LTS) and paste [`infra/aws/ec2-user-data.sh`](file:///d:/Project/ServiceOps/infra/aws/ec2-user-data.sh) into the User Data field for zero-touch automated launch.

---

## 🔑 Pre-Seeded Default Accounts

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@serviceops.com` | `Admin@123` | Full system governance, approvals, audit verification |
| **IT Manager** | `manager@serviceops.com` | `Manager@123` | Queue triaging, War Room command, SLA policies |
| **Support Agent** | `agent@serviceops.com` | `Agent@123` | Ticket resolution, private notes, CMDB asset lookup |
| **Employee Requester** | `employee@serviceops.com` | `Employee@123` | Self-service catalog, public replies, closure acceptance |

---

## 💻 Local Development Setup

### Prerequisites
- Node.js 20 LTS or higher
- PostgreSQL 14+ running locally on port 5432
- Redis 7+ running locally on port 6379 (optional, defaults to in-memory)

### 1. Backend Setup
```bash
cd backend
cp .env.example .env
npm install
npx prisma db push
npx ts-node prisma/seed.ts
npm run start:dev
```
*Backend API will run at `http://localhost:4000`, with Swagger documentation at `http://localhost:4000/docs`.*

### 2. Frontend Setup
```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```
*Frontend UI will run at `http://localhost:3000`.*

---

## 🏗️ System Architecture

```
+---------------------------------------------------------------------------------------------+
|                                    SERVICEOPS ARCHITECTURE                                  |
+---------------------------------------------------------------------------------------------+
|                                                                                             |
|   +-----------------------+              HTTPS / WSS              +---------------------+   |
|   |  Employee / Requester | <-----------------------------------> |  Self-Service Desk  |   |
|   +-----------------------+                                       +---------------------+   |
|                                                                                             |
|   +-----------------------+              HTTPS / WSS              +---------------------+   |
|   |  IT Support Personnel | <-----------------------------------> |  Agent Workspace /  |   |
|   |  (Agents & Managers)  |                                       |  Incident War Room  |   |
|   +-----------------------+                                       +---------------------+   |
|                                                                                             |
|   +-----------------------+              HTTPS / WSS              +---------------------+   |
|   |  System Administrator | <-----------------------------------> |  Admin & Audit Deck |   |
|   +-----------------------+                                       +---------------------+   |
|                                                                                             |
|                                          |                                                  |
|                                          v                                                  |
|                      +---------------------------------------+                              |
|                      |        ServiceOps Core API Engine     |                              |
|                      |  (NestJS 10 + Prisma ORM + PostgreSQL)|                              |
|                      +-------------------+-------------------+                              |
|                                          |                                                  |
|                 +------------------------+------------------------+                         |
|                 |                                                 |                         |
|                 v                                                 v                         |
|    +-------------------------+                       +-------------------------+            |
|    |  PostgreSQL 16 Database |                       |   Brevo Email Service   |            |
|    |  (ACID Relational Core) |                       | (Transactional Delivery)|            |
|    +-------------------------+                       +-------------------------+            |
+---------------------------------------------------------------------------------------------+
```

---

## 📚 Documentation & Specifications

- ☁️ [AWS Production Deployment Guide](docs/ServiceOps_AWS_Production_Deployment_Guide.md) — Complete AWS ECS Fargate, ALB, Route 53, and RDS deployment manual.
- 🏢 [SaaS Multi-Tenant Architecture Transformation Guide](docs/ServiceOps_SaaS_Architecture_Transformation_Guide.md) — Blueprint for converting ServiceOps into a commercial B2B SaaS platform on AWS.
- 📘 [Infrastructure & Operations Manual](DEPLOYMENT.md) — Cloud operations, security controls, and disaster recovery.
- 📄 [Software Requirements Specification (IEEE 830 SRS)](docs/ServiceOps_Software_Requirements_Specification_SRS.md) — Complete requirements specification with Requirements Traceability Matrix (124/124 tests passed).
- 💼 [Project Proposal & Executive Blueprint](docs/ServiceOps_Project_Proposal.md) — Business case, technical roadmap, and cost-benefit analysis.

---

## 🧪 Testing & Quality Assurance

ServiceOps features an automated test suite verifying 100% of core engine functionalities across 124 formal test cases:

```bash
# Run unit tests
cd backend && npm test

# Run E2E and security tests
npm run test:e2e
```
