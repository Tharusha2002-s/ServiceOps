# ServiceOps — Enterprise AWS Production Deployment Guide
## Complete Cloud DevOps Manual for Amazon Web Services (AWS)

---

**Document Information:**
- **Product:** ServiceOps Enterprise IT Service Management Platform
- **Deployment Platform:** Amazon Web Services (AWS)
- **Target Architectures:** AWS ECS Fargate (Serverless Multi-AZ) & Amazon EC2 (Cost-Optimized)
- **Author:** Senior Cloud DevOps & Infrastructure Team
- **Version:** 2.0.0 (AWS Cloud Edition)

---

## 1. High-Availability AWS Architecture Blueprint

ServiceOps on AWS utilizes high-availability managed services across multiple Availability Zones (AZs) for high reliability, zero server patching, and automatic scaling:

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

---

## 2. Option A: Enterprise Production Deployment (AWS ECS Fargate + RDS)

This is the recommended enterprise architecture. It runs containers serverlessly without managing virtual machines.

### Step 1: Provision Infrastructure via CloudFormation
A single CloudFormation template provisions the complete VPC, Multi-AZ subnets, Security Groups, RDS PostgreSQL, ECR repositories, and Application Load Balancer:

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

Once deployment completes, note the outputs:
- `LoadBalancerDNS`: The public DNS URL of your Application Load Balancer.
- `RDSStorageEndpoint`: The private PostgreSQL endpoint.
- `BackendECRUri` & `FrontendECRUri`: The Docker container registry paths.

---

### Step 2: Store Production Secrets in AWS Secrets Manager
Store sensitive credentials in AWS Secrets Manager:

```bash
# Database connection string pointing to Amazon RDS
aws secretsmanager create-secret \
  --name serviceops/prod/DATABASE_URL \
  --secret-string "postgresql://serviceopsadmin:YourStrongMasterPassword123!@<RDSStorageEndpoint>:5432/serviceops_db?schema=public"

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

# Brevo transactional email credentials
aws secretsmanager create-secret \
  --name serviceops/prod/BREVO_API_KEY \
  --secret-string "xkeysib-your-production-brevo-api-key"
```

---

### Step 3: Build & Push Container Images to Amazon ECR
Run the automated deployment script [`deploy-aws.sh`](file:///d:/Project/ServiceOps/deploy-aws.sh):

```bash
chmod +x deploy-aws.sh
./deploy-aws.sh
```

This builds optimized `linux/amd64` images for both frontend and backend, authenticates with Amazon ECR, tags them with the git commit SHA, pushes them to AWS, and triggers an ECS service redeployment.

---

### Step 4: Register ECS Task Definitions & Launch Services
Update `<ACCOUNT_ID>` and `<REGION>` in:
- [`infra/aws/ecs-task-backend.json`](file:///d:/Project/ServiceOps/infra/aws/ecs-task-backend.json)
- [`infra/aws/ecs-task-frontend.json`](file:///d:/Project/ServiceOps/infra/aws/ecs-task-frontend.json)

Register the tasks with Amazon ECS:
```bash
aws ecs register-task-definition --cli-input-json file://infra/aws/ecs-task-backend.json
aws ecs register-task-definition --cli-input-json file://infra/aws/ecs-task-frontend.json
```

Create the ECS services (running in the private application subnets):
```bash
# Backend ECS Service
aws ecs create-service \
  --cluster serviceops-prod-cluster \
  --service-name serviceops-prod-backend-service \
  --task-definition serviceops-backend-task \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[<PrivateSubnet1>,<PrivateSubnet2>],securityGroups=[<ECSSecurityGroup>],assignPublicIp=ENABLED}" \
  --load-balancers targetGroupArn=<BackendTargetGroupArn>,containerName=serviceops-backend,containerPort=4000

# Frontend ECS Service
aws ecs create-service \
  --cluster serviceops-prod-cluster \
  --service-name serviceops-prod-frontend-service \
  --task-definition serviceops-frontend-task \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[<PrivateSubnet1>,<PrivateSubnet2>],securityGroups=[<ECSSecurityGroup>],assignPublicIp=ENABLED}" \
  --load-balancers targetGroupArn=<FrontendTargetGroupArn>,containerName=serviceops-frontend,containerPort=3000
```

---

### Step 5: Configure Custom Domain & SSL (Route 53 + ACM)
1. In **AWS Certificate Manager (ACM)**, request a free public certificate for `yourdomain.com` and `*.yourdomain.com`.
2. Validate the certificate via Route 53 DNS validation.
3. In the CloudFormation stack or ALB console, add an **HTTPS:443 Listener** using this ACM certificate.
4. In **Route 53**, create an `A` record with **Alias** pointing directly to your Application Load Balancer.

---

## 3. Option B: Cost-Optimized Single EC2 Deployment (Budget Friendly)

For startup or development environments seeking low AWS expenditure (~$25–$45/month):

1. **Launch EC2 Instance:**
   - **AMI:** Ubuntu Server 22.04 LTS (HVM)
   - **Instance Type:** `t3.medium` (2 vCPU, 4 GiB Memory)
   - **Storage:** 30 GiB gp3
   - **Security Group:** Inbound ports `80` (HTTP), `443` (HTTPS), `22` (SSH from your IP).
2. **User Data (Automated Launch):**
   - Under **Advanced Details** &rarr; **User Data**, paste the contents of [`infra/aws/ec2-user-data.sh`](file:///d:/Project/ServiceOps/infra/aws/ec2-user-data.sh).
3. The instance will automatically boot, install Docker, clone your repository, generate cryptographic secrets, run schema migrations, and launch ServiceOps behind Nginx with automated 02:00 AM database backups.

---

## 4. Monitoring, CloudWatch & Disaster Recovery

### Health Checks
- **Backend API:** `GET http://<ALB-DNS>/api/v1/health/liveness` &rarr; returns HTTP 200 `{ status: "ok" }`.
- **Database Connection:** `GET http://<ALB-DNS>/api/v1/health` &rarr; verifies active PostgreSQL connection.
- **Audit Ledger Integrity:** `GET http://<ALB-DNS>/api/v1/audit/verify` &rarr; verifies cryptographic chain from `GENESIS`.

### CloudWatch Logs
- All container logs stream into CloudWatch Log Group: `/ecs/serviceops-prod`.
- Configure an alarm for HTTP 5xx errors on the Application Load Balancer to notify via Amazon SNS.

### Automated Backups
- **Amazon RDS:** Automated daily snapshots retained for 7 days with point-in-time restore (PITR) up to 5 minutes.
- **EC2 Option:** Daily automated compressed SQL dumps created at `/opt/serviceops/backups/` and retained for 14 days.
