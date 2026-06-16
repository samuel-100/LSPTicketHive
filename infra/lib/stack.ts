import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as apprunner from "aws-cdk-lib/aws-apprunner";
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
      natGateways: 0, // save cost — use VPC endpoints instead
      subnetConfiguration: [
        { name: "public", subnetType: ec2.SubnetType.PUBLIC },
        { name: "isolated", subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      ],
    });

    // Security group for database
    const dbSg = new ec2.SecurityGroup(this, "DbSg", {
      vpc,
      description: "Allow PostgreSQL from App Runner",
    });
    dbSg.addIngressRule(ec2.Peer.ipv4(vpc.vpcCidrBlock), ec2.Port.tcp(5432));

    // App secrets (Stripe, JWT)
    const appSecrets = new secretsmanager.Secret(this, "AppSecrets", {
      secretName: "lsp-tickethive/app",
      secretStringValue: cdk.SecretValue.unsafePlainText(JSON.stringify({
        STRIPE_SECRET_KEY: "sk_test_CHANGE_ME",
        STRIPE_WEBHOOK_SECRET: "whsec_CHANGE_ME",
        JWT_SECRET: "CHANGE_ME",
      })),
    });

    // RDS PostgreSQL (free tier eligible) — generates its own credentials
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
      publiclyAccessible: true,
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

    // ECR repositories for container images
    const apiRepo = new ecr.Repository(this, "ApiRepo", {
      repositoryName: "lsp-tickethive-api",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const webRepo = new ecr.Repository(this, "WebRepo", {
      repositoryName: "lsp-tickethive-web",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // IAM role for App Runner to access ECR
    const appRunnerAccessRole = new iam.Role(this, "AppRunnerAccessRole", {
      assumedBy: new iam.ServicePrincipal("build.apprunner.amazonaws.com"),
    });
    apiRepo.grantPull(appRunnerAccessRole);
    webRepo.grantPull(appRunnerAccessRole);

    // IAM role for App Runner instance (runtime)
    const instanceRole = new iam.Role(this, "InstanceRole", {
      assumedBy: new iam.ServicePrincipal("tasks.apprunner.amazonaws.com"),
    });
    appSecrets.grantRead(instanceRole);
    imagesBucket.grantReadWrite(instanceRole);

    // Outputs
    new cdk.CfnOutput(this, "DatabaseEndpoint", { value: database.dbInstanceEndpointAddress });
    new cdk.CfnOutput(this, "DatabasePort", { value: database.dbInstanceEndpointPort });
    new cdk.CfnOutput(this, "ImagesBucketName", { value: imagesBucket.bucketName });
    new cdk.CfnOutput(this, "ApiRepoUri", { value: apiRepo.repositoryUri });
    new cdk.CfnOutput(this, "WebRepoUri", { value: webRepo.repositoryUri });
    new cdk.CfnOutput(this, "SecretsArn", { value: appSecrets.secretArn });
  }
}
