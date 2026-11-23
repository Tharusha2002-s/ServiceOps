# ServiceOps — Enterprise DevOps Deployment & Infrastructure Guide

This guide provides end-to-end instructions for deploying, managing, and scaling the **ServiceOps Enterprise IT Service Management Platform** across bare-metal servers, Linux Virtual Private Servers (VPS), Docker environments, and cloud platforms (Railway, Render, AWS, DigitalOcean).

---

## 1. System Architecture & Topology

ServiceOps is built as an enterprise-grade modular monolith with full container orchestration:

```
                                  [ Internet / Clients ]
                                             |
                                             v
                            +---------------------------------+
                            |       Nginx Reverse Proxy       |
                            |  Ports: 80 (HTTP) / 443 (HTTPS) |
                            +---------------------------------+
                                      |              |
                      /api/ & /socket.io/            | (All other routes)
                                      v              v
               +---------------------------+   +---------------------------+
               |  ServiceOps Core Engine   |   |   ServiceOps Web Portal   |
               |     (NestJS API @ 4000)   |   |    (Next.js App @ 3000)   |
               +---------------------------+   +---------------------------+
                             |       |
                 +-----------+       +-----------+
                 v                               v
   +---------------------------+   +---------------------------+
   |   PostgreSQL 16 Database  |   |    Redis 7 Broker & Cache |
   |        (Port 5432)        |   |        (Port 6379)        |
   +---------------------------+   +---------------------------+
                 |
   +---------------------------+
   |   Prometheus & Grafana    |
   | (Metrics & Observability) |
   +---------------------------+
```

### Network Port Allocation

| Port | Service | Scope | Protocol |
| :--- | :--- | :--- | :--- |
| **80** | Nginx HTTP | Public | HTTP (Redirects to 443) |
| **443** | Nginx HTTPS / TLS | Public | HTTPS / WSS |
| **3000** | Next.js Frontend UI | Internal Bridge | HTTP |
| **4000** | NestJS Backend API & Sockets | Internal Bridge | HTTP / Socket.io |
| **5432** | PostgreSQL 16 | Internal Bridge | TCP |
| **6379** | Redis 7 | Internal Bridge | TCP |
| **3001** | Grafana Dashboard | Private / Admin | HTTP |
| **9090** | Prometheus Metrics Engine | Private | HTTP |

---

## 2. 60-Second Quickstart (Self-Hosted Community Edition)

Anyone can run ServiceOps locally or on a private server with a single command.

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) & Docker Compose v2.20+
- Git

### Linux / macOS:
```bash
# 1. Clone repository
git clone https://github.com/your-org/ServiceOps.git
cd ServiceOps

# 2. Run the 1-click turnkey setup script
chmod +x setup.sh
./setup.sh
```

### Windows:
Double-click `setup.bat` or run in PowerShell / Command Prompt:
```cmd
git clone https://github.com/your-org/ServiceOps.git
cd ServiceOps
setup.bat
```

The script will automatically:
1. Verify Docker installation.
2. Generate a secure `.env` file from `.env.example` with cryptographically random secrets.
3. Build and launch all containers (`PostgreSQL`, `Redis`, `Backend`, `Frontend`).
4. Apply Prisma database schema migrations and seed default administrative accounts.

---

## 3. Production Deployment on Linux VPS (Ubuntu 22.04 LTS / Debian 12)

Follow these steps to deploy ServiceOps onto a production cloud virtual machine (AWS EC2, DigitalOcean Droplet, Hetzner, Linode).

### Step 1: Server Provisioning & Firewall Configuration
```bash
# Update server packages
sudo apt update && sudo apt upgrade -y

# Install Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Configure UFW Firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

### Step 2: Clone & Configure Environment
```bash
git clone https://github.com/your-org/ServiceOps.git /opt/serviceops
cd /opt/serviceops

# Copy master environment template
cp .env.example .env

# Generate secure production secrets
sed -i "s/prod_access_secret_serviceops_minimum_32_characters_random_hex/$(openssl rand -hex 32)/g" .env
sed -i "s/prod_refresh_secret_serviceops_minimum_32_characters_random_hex/$(openssl rand -hex 32)/g" .env
sed -i "s/prod_cookie_signing_secret_serviceops_2026_super_secure/$(openssl rand -hex 32)/g" .env
sed -i "s/postgres123/$(openssl rand -hex 16)/g" .env

# Edit domain and email credentials
nano .env
```
Ensure you update:
- `DOMAIN_NAME`: your public domain (e.g. `serviceops.yourcompany.com`)
- `BREVO_API_KEY`: your Brevo transactional API key (`xkeysib-...`)
- `ADMIN_NOTIFICATION_EMAIL`: IT administrator notification inbox

### Step 3: Run the Automated Deployment Engine
```bash
chmod +x deploy.sh scripts/*.sh
./deploy.sh
```

The script builds production containers, launches the full stack with Nginx, verifies backend liveness, and configures an automated daily database backup cron job at 02:00 AM.

### Step 4: SSL/TLS Certificate Provisioning (Let's Encrypt)
To enable HTTPS with free Let's Encrypt certificates:
```bash
# Install Certbot
sudo apt install certbot -y

# Obtain certificate in standalone mode (temporarily stop Nginx container if on port 80)
docker compose stop nginx
sudo certbot certonly --standalone -d serviceops.yourcompany.com

# Mount certificates into Nginx
sudo mkdir -p /opt/serviceops/infra/nginx/certs
sudo cp /etc/letsencrypt/live/serviceops.yourcompany.com/fullchain.pem /opt/serviceops/infra/nginx/certs/
sudo cp /etc/letsencrypt/live/serviceops.yourcompany.com/privkey.pem /opt/serviceops/infra/nginx/certs/

# Restart Nginx
docker compose up -d nginx
```

---

## 4. Cloud Platform (PaaS) Deployments

### Deploying to Railway
ServiceOps is ready for PaaS deployment with Railway:
1. Create a new Railway project.
2. Add a **PostgreSQL** database service.
3. Add a **Redis** service.
4. Deploy the **Backend**:
   - Source: `/backend`
   - Set environment variables (`DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `COOKIE_SECRET`, `BREVO_API_KEY`).
   - Start Command: `npx prisma db push && node dist/main`
5. Deploy the **Frontend**:
   - Source: `/frontend`
   - Set `NEXT_PUBLIC_API_URL` to your backend Railway domain.

---

## 5. Automated Database Backups & Disaster Recovery

### Manual Backup
```bash
./scripts/backup-db.sh
```
This dumps the PostgreSQL database into `./backups/postgres/serviceops_db_<TIMESTAMP>.sql.gz` and automatically purges backups older than 14 days.

### Database Restoration
```bash
./scripts/restore-db.sh ./backups/postgres/serviceops_db_20261123T000000Z.sql.gz
```

---

## 6. Enterprise Health Checks & Observability

- **Liveness Probe:** `GET /api/v1/health/liveness` &rarr; returns `{ status: "ok" }`.
- **Database Readiness:** `GET /api/v1/health` &rarr; tests PostgreSQL query and latency.
- **Cryptographic Audit Ledger Verification:** `GET /api/v1/audit/verify` &rarr; validates the complete SHA-256 block chain from `GENESIS`.
- **Prometheus Metrics:** Integrated scraping on port 9090.
- **Grafana Dashboards:** Accessible at `http://your-server:3001` (Default user: `admin`).

---

## 7. Default Seeded Enterprise Accounts

| Persona / Role | Email Address | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@serviceops.com` | `Admin@123` | Full governance, user approvals, audit verification |
| **IT Manager** | `manager@serviceops.com` | `Manager@123` | Triage, SLA policy review, Major Incident declaration |
| **IT Support Agent** | `agent@serviceops.com` | `Agent@123` | Ticket assignment, private notes, CMDB asset linking |
| **Employee Requester** | `employee@serviceops.com` | `Employee@123` | Self-service catalog, public replies, closure acceptance |
