
import {
    aws_s3 as s3,
    aws_iam as iam,
    aws_cloudfront as cloudfront,
    aws_s3_deployment as deploy,
    Stack,
  } from "aws-cdk-lib";
  import { Construct } from 'constructs';

export class StaticSite extends Construct {
  constructor(parent: Stack, name: string) {
    super(parent, name);

    const cloudfrontOAI = new cloudfront.OriginAccessIdentity(this, "AWSStoreOAI");

    const siteBucket = new s3.Bucket(this, "AWSStoreBucket", {
      bucketName: "aws-store-bucket",
      websiteIndexDocument: "index.html",
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL
    });

    siteBucket.addToResourcePolicy(new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [siteBucket.arnForObjects('*')],
      principals: [new iam.CanonicalUserPrincipal(cloudfrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId)]
    }));

    const distribution = new cloudfront.CloudFrontWebDistribution(this, "AWSStoreDistribution", {
      originConfigs: [{
        s3OriginSource: {
          s3BucketSource: siteBucket,
          originAccessIdentity: cloudfrontOAI
        },
        behaviors: [{
          isDefaultBehavior: true
        }]
      }]
    });

    new deploy.BucketDeployment(this, "AWS-Bucket-Deployment", {
      sources: [deploy.Source.asset("./dist")],
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ["/*"]
    });
  }
}