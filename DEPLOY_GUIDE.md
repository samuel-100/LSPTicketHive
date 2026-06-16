# LSPTicketHive — AWS Cloud Deployment Guide

Everything runs in your AWS account (951151046842). No local machine needed.

## Step 1: Create AWS Cloud9 Environment

1. Go to AWS Console → search "Cloud9"
2. **Switch region to `eu-west-1` (Ireland)** — top right dropdown
3. Click "Create environment"
4. Name: `lsp-tickethive-dev`
5. Instance type: `t3.small` (enough for builds)
6. Platform: Amazon Linux 2023
7. Click "Create"

## Step 2: Clone & Setup in Cloud9

Once Cloud9 opens, run in the terminal:

```bash
# Clone the code (we'll push to CodeCommit first)
# Or upload the LSPTicketHive folder via Cloud9's File > Upload

# Install dependencies
cd LSPTicketHive
npm install

# Install CDK globally
npm install -g aws-cdk
```

## Step 3: Deploy Infrastructure

```bash
cd infra
npm install
cdk bootstrap aws://951151046842/eu-west-1
cdk deploy
```

This creates: VPC, RDS PostgreSQL, S3 bucket, ECR repos, IAM roles.

## Step 4: Update Secrets

After CDK deploys, go to AWS Secrets Manager and update `lsp-tickethive/app`:
- `STRIPE_SECRET_KEY` → your Stripe test key
- `STRIPE_WEBHOOK_SECRET` → from Stripe dashboard
- `JWT_SECRET` → any random string (generate with `openssl rand -base64 32`)

## Step 5: Build & Push Docker Images

```bash
# Login to ECR
aws ecr get-login-password --region eu-west-1 | docker login --username AWS --password-stdin 951151046842.dkr.ecr.eu-west-1.amazonaws.com

# Build and push API
docker build -t lsp-tickethive-api -f apps/api/Dockerfile .
docker tag lsp-tickethive-api:latest 951151046842.dkr.ecr.eu-west-1.amazonaws.com/lsp-tickethive-api:latest
docker push 951151046842.dkr.ecr.eu-west-1.amazonaws.com/lsp-tickethive-api:latest

# Build and push Web
docker build -t lsp-tickethive-web -f apps/web/Dockerfile .
docker tag lsp-tickethive-web:latest 951151046842.dkr.ecr.eu-west-1.amazonaws.com/lsp-tickethive-web:latest
docker push 951151046842.dkr.ecr.eu-west-1.amazonaws.com/lsp-tickethive-web:latest
```

## Step 6: Create App Runner Services

Go to AWS Console → App Runner → Create service:

**API Service:**
- Source: ECR → `lsp-tickethive-api:latest`
- Port: 4000
- Instance role: `LSPTicketHive-InstanceRole`
- Environment variables (from Secrets Manager)

**Web Service:**
- Source: ECR → `lsp-tickethive-web:latest`  
- Port: 3000
- Environment variable: `NEXT_PUBLIC_API_URL` = your API App Runner URL

## Step 7: Run Database Migration

```bash
# Get DB endpoint from CDK output or RDS console
export DATABASE_URL="postgresql://postgres:PASSWORD@ENDPOINT:5432/tickethive"
npx prisma db push --schema=packages/database/prisma/schema.prisma
```

## Your App is Live!

App Runner gives you HTTPS URLs like:
- Web: `https://xxxxx.eu-west-1.awsapprunner.com`
- API: `https://yyyyy.eu-west-1.awsapprunner.com`

## Cost Estimate (with $100 credits)

| Service | Monthly |
|---------|---------|
| Cloud9 (t3.small) | ~$15 |
| RDS (t3.micro, free tier) | $0 |
| App Runner (low traffic) | ~$10 |
| S3 (free tier) | $0 |
| ECR | ~$1 |
| **Total** | **~$26/month** |

Your $100 credits will last ~3-4 months.

## Add a Domain Later

1. Buy domain in Route 53 (~$12/year for .com)
2. Add custom domain in App Runner settings
3. SSL certificate is automatic
