#!/bin/bash
set -e

echo "========================================="
echo "  LSPTicketHive — Full Cloud Deployment  "
echo "========================================="

REGION="eu-west-1"
ACCOUNT_ID="951151046842"

echo ""
echo "Step 1: Deploy infrastructure (CDK)..."
cd infra
npm install
npx cdk bootstrap aws://$ACCOUNT_ID/$REGION
npx cdk deploy --require-approval never
cd ..

echo ""
echo "Step 2: Build & push API container..."
API_REPO="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/lsp-tickethive-api"
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com
docker build -t lsp-tickethive-api -f apps/api/Dockerfile .
docker tag lsp-tickethive-api:latest $API_REPO:latest
docker push $API_REPO:latest

echo ""
echo "Step 3: Build & push Web container..."
WEB_REPO="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/lsp-tickethive-web"
docker build -t lsp-tickethive-web -f apps/web/Dockerfile .
docker tag lsp-tickethive-web:latest $WEB_REPO:latest
docker push $WEB_REPO:latest

echo ""
echo "Step 4: Create App Runner services..."
echo "Creating API service..."
aws apprunner create-service \
  --service-name lsp-tickethive-api \
  --source-configuration '{
    "AuthenticationConfiguration": {"AccessRoleArn": "arn:aws:iam::'$ACCOUNT_ID':role/LSPTicketHive-AppRunnerAccessRole"},
    "ImageRepository": {
      "ImageIdentifier": "'$API_REPO':latest",
      "ImageRepositoryType": "ECR",
      "ImageConfiguration": {"Port": "4000"}
    }
  }' \
  --region $REGION || echo "API service may already exist"

echo "Creating Web service..."
aws apprunner create-service \
  --service-name lsp-tickethive-web \
  --source-configuration '{
    "AuthenticationConfiguration": {"AccessRoleArn": "arn:aws:iam::'$ACCOUNT_ID':role/LSPTicketHive-AppRunnerAccessRole"},
    "ImageRepository": {
      "ImageIdentifier": "'$WEB_REPO':latest",
      "ImageRepositoryType": "ECR",
      "ImageConfiguration": {"Port": "3000"}
    }
  }' \
  --region $REGION || echo "Web service may already exist"

echo ""
echo "Step 5: Run database migrations..."
echo "Get the DATABASE_URL from CDK outputs and run:"
echo "  npx prisma db push --schema=packages/database/prisma/schema.prisma"

echo ""
echo "========================================="
echo "  Deployment complete!"
echo "  Check App Runner console for your URLs"
echo "========================================="
