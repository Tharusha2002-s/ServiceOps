# ServiceOps — Enterprise AWS DevOps Deployment & Infrastructure Guide

This guide provides end-to-end instructions for deploying, managing, and scaling the **ServiceOps Enterprise IT Service Management Platform** exclusively on **Amazon Web Services (AWS)** using production-grade container orchestration (AWS ECS Fargate, Amazon ECR, Amazon RDS PostgreSQL, Application Load Balancers, and AWS Route 53).

---

## 1. Cloud Architecture & AWS Topology

ServiceOps on AWS utilizes managed multi-AZ services for high availability, zero server maintenance, and automated scaling:

```
                                 [ End Users / Clients ]
                                            │
                                            ▼
                           +---------------------------------+
                           │       Amazon Route 53 (DNS)     │
                           +---------------------------------+
                                            │
                                            ▼
                           +---------------------------------+
                           │ AWS Certificate Manager (HTTPS) │
                           +---------------------------------+
                                            │
                                            ▼
                  +-----------------------------------------------------+
                  │      AWS Application Load Balancer (ALB)            │
                  │             (Public Multi-AZ Subnets)               │
                  +-----------------------------------------------------+
                            │                               │
            Path: /api/*, /socket.io/*                      │ Path: /* (UI)
                            ▼                               ▼
       +------------------------------------+  +------------------------------------+
       │     ServiceOps Backend Service     │  │    ServiceOps Frontend Service     │
       │       (AWS ECS Fargate Tasks)      │  │      (AWS ECS Fargate Tasks)       │
       │       Private App Subnets (AZ A/B) │  │      Private App Subnets (AZ A/B)  │
       +------------------------------------+  +------------------------------------+
                         │                                       │
                         +-------------------+-------------------+
                                             │
                                             ▼
                 +-----------------------------------------------------+
                 │           Amazon RDS PostgreSQL 16 DB               │
                 │             (Private DB Subnets Multi-AZ)           │
                 +-----------------------------------------------------+
```

### AWS Port & Security Group Rules

| Port | Service | Source | Destination |
| :--- | :--- | :--- | :--- |
| **80** | ALB HTTP | `0.0.0.0/0` | Redirects to HTTPS 443 |
| **443** | ALB HTTPS | `0.0.0.0/0` | SSL Termination via ACM |
| **3000** | ECS Frontend | ALB Security Group | Next.js Container |
| **4000** | ECS Backend API | ALB Security Group | NestJS Core Container |
| **5432** | RDS PostgreSQL | ECS Security Group | Amazon RDS PostgreSQL |
| **6379** | ElastiCache Redis | ECS Security Group | Amazon ElastiCache |

---

## 2. Option A: Enterprise Serverless Deployment (AWS ECS Fargate + RDS)

### Step 1: Provision CloudFormation Stack
Use the comprehensive CloudFormation template located at [`infra/aws/cloudformation.yml`](file:///d:/Project/ServiceOps/infra/aws/cloudformation.yml):

```bash
aws cloudformation deploy \
  --template-file infra/aws/cloudformation.yml \
  --stack-name serviceops-prod \
  --parameter-overrides \
      EnvironmentName=serviceops-prod \
      DBUsername=serviceopsadmin \
      DBPassword=YourStrongMasterPassword123! \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Step 2: Store Production Secrets in AWS Secrets Manager
```bash
# Database connection string
aws secretsmanager create-secret \
  --name serviceops/prod/DATABASE_URL \
  --secret-string "postgresql://serviceopsadmin:YourStrongMasterPassword123!@<RDS-Endpoint>:5432/serviceops_db?schema=public"

# Cryptographic token secrets
aws secretsmanager create-secret \
  --name serviceops/prod/JWT_ACCESS_SECRET \
  --secret-string "$(openssl rand -hex 32)"

aws secretsmanager create-secret \
  --name serviceops/prod/JWT_REFRESH_SECRET \
  --secret-string "$(openssl rand -hex 32)"

aws secretsmanager create-secret \
  --name serviceops/prod/COOKIE_SECRET \
  --secret-string "$(openssl rand -hex 32)"

# Brevo transactional email
aws secretsmanager create-secret \
  --name serviceops/prod/BREVO_API_KEY \
  --secret-string "xkeysib-your-production-brevo-api-key"
```

### Step 3: Automated Build & ECR Push
Run the AWS deployment pipeline script [`deploy-aws.sh`](file:///d:/Project/ServiceOps/deploy-aws.sh):
```bash
chmod +x deploy-aws.sh
./deploy-aws.sh
```

This builds `linux/amd64` images, pushes them to Amazon ECR, and automatically triggers an ECS rolling service update.

---

## 3. Option B: Cost-Optimized Single EC2 Instance Deployment

For startup or development environments seeking low AWS expenditure (~$25–$45/month):

1. **Launch EC2 Instance:**
   - **AMI:** Ubuntu Server 22.04 LTS (HVM)
   - **Instance Type:** `t3.medium` (2 vCPU, 4 GiB RAM)
   - **Storage:** 30 GiB gp3
   - **Security Group:** Inbound ports `80` (HTTP), `443` (HTTPS), `22` (SSH from your IP).
2. **User Data (Automated Launch):**
   - Under **Advanced Details** &rarr; **User Data**, paste the contents of [`infra/aws/ec2-user-data.sh`](file:///d:/Project/ServiceOps/infra/aws/ec2-user-data.sh).
3. The instance will automatically boot, install Docker, clone your repository, generate cryptographic secrets, run schema migrations, and launch ServiceOps behind Nginx with automated 02:00 AM database backups.

---

## 4. Monitoring, Health Probes & Observability

- **Liveness Probe:** `GET http://<ALB-DNS>/api/v1/health/liveness` &rarr; returns `{ status: "ok" }`.
- **Database Readiness:** `GET http://<ALB-DNS>/api/v1/health` &rarr; validates PostgreSQL query and connection latency.
- **Cryptographic Audit Verification:** `GET http://<ALB-DNS>/api/v1/audit/verify` &rarr; validates the entire SHA-256 block chain from `GENESIS`.
- **CloudWatch Log Group:** `/ecs/serviceops-prod` for centralized log streaming and alarms.

---

## 5. Automated Backups & Disaster Recovery

### Amazon RDS Backups
- Amazon RDS automatically creates daily system snapshots retained for 7 days, with Point-In-Time Restore (PITR) up to the last 5 minutes.

### Manual / EC2 Backups
```bash
./scripts/backup-db.sh
```
This dumps the PostgreSQL database into `./backups/postgres/serviceops_db_<TIMESTAMP>.sql.gz` and automatically purges backups older than 14 days.

### Database Restoration
```bash
./scripts/restore-db.sh ./backups/postgres/serviceops_db_20261123T000000Z.sql.gz
```

---

## 6. Pre-Seeded Default Accounts

| Persona / Role | Email Address | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@serviceops.com` | `Admin@123` | Full governance, user approvals, audit verification |
| **IT Manager** | `manager@serviceops.com` | `Manager@123` | Triage, SLA policy review, Major Incident declaration |
| **IT Support Agent** | `agent@serviceops.com` | `Agent@123` | Ticket assignment, private notes, CMDB asset linking |
| **Employee Requester** | `employee@serviceops.com` | `Employee@123` | Self-service catalog, public replies, closure acceptance |
