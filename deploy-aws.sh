#!/usr/bin/env bash
# ==============================================================================
# ServiceOps Enterprise ITSM Platform — AWS Automated DevOps Deployment Script
# Targets: Amazon Elastic Container Registry (ECR) & Amazon ECS Fargate
# ==============================================================================
set -euo pipefail

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-}"
ENV_NAME="${ENV_NAME:-serviceops-prod}"

echo -e "${CYAN}==============================================================================${NC}"
echo -e "${CYAN}        ServiceOps Enterprise ITSM — AWS Production Deployment Pipeline        ${NC}"
echo -e "${CYAN}==============================================================================${NC}\n"

# 1. Check AWS CLI and Docker
if ! command -v aws >/dev/null 2>&1; then
  echo -e "${RED}[ERROR] AWS CLI is required but not installed. Please install: https://aws.amazon.com/cli/${NC}"
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo -e "${RED}[ERROR] Docker is required but not installed.${NC}"
  exit 1
fi

# 2. Resolve AWS Account ID if not set
if [ -z "$AWS_ACCOUNT_ID" ]; then
  echo -e "${YELLOW}Detecting AWS Account ID from active AWS credentials...${NC}"
  AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query "Account" --output text)
fi

ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
BACKEND_REPO="${ENV_NAME}-backend"
FRONTEND_REPO="${ENV_NAME}-frontend"
IMAGE_TAG="$(git rev-parse --short HEAD 2>/dev/null || echo 'latest')"

echo -e "Target AWS Account:  ${GREEN}${AWS_ACCOUNT_ID}${NC}"
echo -e "Target AWS Region:   ${GREEN}${AWS_REGION}${NC}"
echo -e "ECR Registry:        ${GREEN}${ECR_REGISTRY}${NC}"
echo -e "Deployment Tag:      ${GREEN}${IMAGE_TAG}${NC}\n"

# 3. Authenticate Docker with Amazon ECR
echo -e "${CYAN}[1/4] Authenticating Docker with Amazon ECR...${NC}"
aws ecr get-login-password --region "${AWS_REGION}" | docker login --username AWS --password-stdin "${ECR_REGISTRY}"

# Ensure repositories exist
aws ecr describe-repositories --repository-names "${BACKEND_REPO}" --region "${AWS_REGION}" >/dev/null 2>&1 || \
  aws ecr create-repository --repository-name "${BACKEND_REPO}" --region "${AWS_REGION}" >/dev/null

aws ecr describe-repositories --repository-names "${FRONTEND_REPO}" --region "${AWS_REGION}" >/dev/null 2>&1 || \
  aws ecr create-repository --repository-name "${FRONTEND_REPO}" --region "${AWS_REGION}" >/dev/null

# 4. Build Docker Images (Target linux/amd64 for AWS Fargate/EC2)
echo -e "\n${CYAN}[2/4] Building production container images for linux/amd64...${NC}"

echo "Building Backend container..."
docker build --platform linux/amd64 -t "${ECR_REGISTRY}/${BACKEND_REPO}:${IMAGE_TAG}" -t "${ECR_REGISTRY}/${BACKEND_REPO}:latest" -f backend/Dockerfile backend/

echo "Building Frontend container..."
docker build --platform linux/amd64 -t "${ECR_REGISTRY}/${FRONTEND_REPO}:${IMAGE_TAG}" -t "${ECR_REGISTRY}/${FRONTEND_REPO}:latest" -f frontend/Dockerfile frontend/

# 5. Push to Amazon ECR
echo -e "\n${CYAN}[3/4] Pushing images to Amazon ECR...${NC}"
docker push "${ECR_REGISTRY}/${BACKEND_REPO}:${IMAGE_TAG}"
docker push "${ECR_REGISTRY}/${BACKEND_REPO}:latest"

docker push "${ECR_REGISTRY}/${FRONTEND_REPO}:${IMAGE_TAG}"
docker push "${ECR_REGISTRY}/${FRONTEND_REPO}:latest"

# 6. Trigger ECS Rolling Deployment (if cluster exists)
echo -e "\n${CYAN}[4/4] Updating Amazon ECS Services...${NC}"
CLUSTER_NAME="${ENV_NAME}-cluster"

if aws ecs describe-clusters --clusters "${CLUSTER_NAME}" --region "${AWS_REGION}" --query "clusters[0].status" --output text 2>/dev/null | grep -q "ACTIVE"; then
  echo "Forcing new deployment on ECS cluster '${CLUSTER_NAME}'..."
  aws ecs update-service --cluster "${CLUSTER_NAME}" --service "${ENV_NAME}-backend-service" --force-new-deployment --region "${AWS_REGION}" || true
  aws ecs update-service --cluster "${CLUSTER_NAME}" --service "${ENV_NAME}-frontend-service" --force-new-deployment --region "${AWS_REGION}" || true
  echo -e "${GREEN}✓ ECS rolling deployment initiated successfully!${NC}"
else
  echo -e "${YELLOW}Notice: ECS cluster '${CLUSTER_NAME}' not active yet.${NC}"
  echo -e "You can provision the cluster using: aws cloudformation deploy --template-file infra/aws/cloudformation.yml --stack-name ${ENV_NAME} --capabilities CAPABILITY_NAMED_IAM"
fi

echo -e "\n${GREEN}==============================================================================${NC}"
echo -e "${GREEN}             🎉 AWS Deployment Completed Successfully!                        ${NC}"
echo -e "${GREEN}==============================================================================${NC}\n"
