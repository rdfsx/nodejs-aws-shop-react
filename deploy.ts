import {BlockPublicAccess, Bucket} from 'aws-cdk-lib/aws-s3';
import * as iam from "aws-cdk-lib/aws-iam";
import {CloudFrontWebDistribution, OriginAccessIdentity} from "aws-cdk-lib/aws-cloudfront";
import {BucketDeployment, Source} from "aws-cdk-lib/aws-s3-deployment";
import {App, Stack} from "aws-cdk-lib";

const app = new App();
const stack = new Stack(app, 'TestStack');


const cloudFrontOAI = new OriginAccessIdentity(stack, "JSCC-OAI");

const bucket = new Bucket(stack,
    'StaticBucket', {
    bucketName: "js-cloudfront-s3",
        websiteIndexDocument: "index.html",
        publicReadAccess: false,
        blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    });
bucket.addToResourcePolicy(new iam.PolicyStatement({
    actions: ["s3:GetObject"],
    resources: [bucket.arnForObjects("*")],
    principals: [new iam.CanonicalUserPrincipal(cloudFrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId)],
}));

const distribution = new CloudFrontWebDistribution(stack, "JSCC-distribution",{
    originConfigs: [{
        s3OriginSource: {
            s3BucketSource: bucket,
            originAccessIdentity: cloudFrontOAI,
        },
        behaviors: [{
            isDefaultBehavior: true,
        }]
    }]
});

new BucketDeployment(stack, "JSCC-Bucket-Deployment", {
    sources: [Source.asset("./dist")],
    destinationBucket: bucket,
    distribution,
    distributionPaths: ["/*"]
});

