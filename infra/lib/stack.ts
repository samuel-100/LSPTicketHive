import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export class LSPTicketHiveStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC
    const vpc = new ec2.Vpc(this, "Vpc", {
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        { name: "public", subnetType: ec2.SubnetType.PUBLIC },
      ],
    });

    // Security group for EC2 (web traffic + SSH)
    const webSg = new ec2.SecurityGroup(this, "WebSg", {
      vpc,
      description: "Allow HTTP, HTTPS, and SSH",
    });
    webSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), "HTTP");
    webSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), "HTTPS");
    webSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(3000), "Next.js");
    webSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(4000), "API");
    webSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), "SSH");

    // Security group for database
    const dbSg = new ec2.SecurityGroup(this, "DbSg", {
      vpc,
      description: "Allow PostgreSQL from EC2",
    });
    dbSg.addIngressRule(webSg, ec2.Port.tcp(5432), "PostgreSQL from EC2");

    // App secrets (Stripe, JWT)
    const appSecrets = new secretsmanager.Secret(this, "AppSecrets", {
      secretName: "lsp-tickethive/app",
      secretStringValue: cdk.SecretValue.unsafePlainText(JSON.stringify({
        STRIPE_SECRET_KEY: "sk_test_CHANGE_ME",
        STRIPE_WEBHOOK_SECRET: "whsec_CHANGE_ME",
        JWT_SECRET: "CHANGE_ME",
      })),
    });

    // RDS PostgreSQL (free tier: t3.micro)
    const database = new rds.DatabaseInstance(this, "Database", {
      engine: rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_15 }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      securityGroups: [dbSg],
      databaseName: "tickethive",
      credentials: rds.Credentials.fromGeneratedSecret("tickethive_admin"),
      allocatedStorage: 20,
      maxAllocatedStorage: 50,
      publiclyAccessible: false,
      removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
      backupRetention: cdk.Duration.days(1),
    });

    // S3 bucket for event images
    const imagesBucket = new s3.Bucket(this, "ImagesBucket", {
      cors: [{
        allowedOrigins: ["*"],
        allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT],
        allowedHeaders: ["*"],
      }],
      publicReadAccess: true,
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        ignorePublicAcls: false,
        blockPublicPolicy: false,
        restrictPublicBuckets: false,
      }),
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // IAM role for EC2
    const ec2Role = new iam.Role(this, "Ec2Role", {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore"),
      ],
    });
    appSecrets.grantRead(ec2Role);
    imagesBucket.grantReadWrite(ec2Role);

    // EC2 instance (free tier: t3.micro)
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      "#!/bin/bash",
      "set -e",
      "",
      "# Install Node.js 20",
      "curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -",
      "yum install -y nodejs git",
      "",
      "# Clone the app",
      "cd /home/ec2-user",
      "git clone https://github.com/samuel-100/LSPTicketHive.git app",
      "cd app",
      "",
      "# Install dependencies",
      "npm install --workspace=packages/shared --workspace=packages/database --workspace=apps/api --workspace=apps/web",
      "",
      "# Generate Prisma client",
      "npx prisma generate --schema=packages/database/prisma/schema.prisma",
      "",
      "# Build API",
      "npm run build --workspace=apps/api",
      "",
      "# Build Web",
      "npm run build --workspace=apps/web",
      "",
      `# Get DB credentials from Secrets Manager`,
      `DB_SECRET=$(aws secretsmanager get-secret-value --secret-id ${database.secret!.secretArn} --region eu-west-1 --query SecretString --output text)`,
      `DB_HOST=$(echo $DB_SECRET | python3 -c "import sys,json; print(json.load(sys.stdin)['host'])")`,
      `DB_PASS=$(echo $DB_SECRET | python3 -c "import sys,json; print(json.load(sys.stdin)['password'])")`,
      `DB_USER=$(echo $DB_SECRET | python3 -c "import sys,json; print(json.load(sys.stdin)['username'])")`,
      "",
      `export DATABASE_URL="postgresql://$DB_USER:$DB_PASS@$DB_HOST:5432/tickethive"`,
      "",
      "# Run database migrations",
      "npx prisma db push --schema=packages/database/prisma/schema.prisma --accept-data-loss",
      "",
      "# Create systemd services",
      `cat > /etc/systemd/system/tickethive-api.service << 'SERVICEEOF'`,
      "[Unit]",
      "Description=LSPTicketHive API",
      "After=network.target",
      "",
      "[Service]",
      "Type=simple",
      "User=ec2-user",
      "WorkingDirectory=/home/ec2-user/app",
      "ExecStart=/usr/bin/node apps/api/dist/index.js",
      "Restart=always",
      "Environment=NODE_ENV=production",
      "Environment=PORT=4000",
      `EnvironmentFile=/home/ec2-user/app/.env`,
      "",
      "[Install]",
      "WantedBy=multi-user.target",
      "SERVICEEOF",
      "",
      `cat > /etc/systemd/system/tickethive-web.service << 'SERVICEEOF'`,
      "[Unit]",
      "Description=LSPTicketHive Web",
      "After=network.target",
      "",
      "[Service]",
      "Type=simple",
      "User=ec2-user",
      "WorkingDirectory=/home/ec2-user/app/apps/web",
      "ExecStart=/usr/bin/node .next/standalone/server.js",
      "Restart=always",
      "Environment=NODE_ENV=production",
      "Environment=PORT=3000",
      "Environment=HOSTNAME=0.0.0.0",
      `EnvironmentFile=/home/ec2-user/app/.env`,
      "",
      "[Install]",
      "WantedBy=multi-user.target",
      "SERVICEEOF",
      "",
      "# Write env file",
      `echo 'DATABASE_URL=postgresql://'$DB_USER':'$DB_PASS'@'$DB_HOST':5432/tickethive' > /home/ec2-user/app/.env`,
      `echo 'JWT_SECRET=lsp-tickethive-jwt-secret-change-later' >> /home/ec2-user/app/.env`,
      `echo 'STRIPE_SECRET_KEY=sk_test_CHANGE_ME' >> /home/ec2-user/app/.env`,
      `echo 'PORT=4000' >> /home/ec2-user/app/.env`,
      `echo 'FRONTEND_URL=http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):3000' >> /home/ec2-user/app/.env`,
      `echo 'NEXT_PUBLIC_API_URL=http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):4000' >> /home/ec2-user/app/.env`,
      "",
      "# Fix ownership and start services",
      "chown -R ec2-user:ec2-user /home/ec2-user/app",
      "systemctl daemon-reload",
      "systemctl enable tickethive-api tickethive-web",
      "systemctl start tickethive-api tickethive-web",
    );

    const instance = new ec2.Instance(this, "AppServer", {
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      securityGroup: webSg,
      role: ec2Role,
      userData,
      keyPair: undefined,
    });

    // Outputs
    new cdk.CfnOutput(this, "AppUrl", { value: `http://${instance.instancePublicIp}:3000` });
    new cdk.CfnOutput(this, "ApiUrl", { value: `http://${instance.instancePublicIp}:4000` });
    new cdk.CfnOutput(this, "DatabaseEndpoint", { value: database.dbInstanceEndpointAddress });
    new cdk.CfnOutput(this, "ImagesBucketName", { value: imagesBucket.bucketName });
    new cdk.CfnOutput(this, "InstanceId", { value: instance.instanceId });
  }
}
