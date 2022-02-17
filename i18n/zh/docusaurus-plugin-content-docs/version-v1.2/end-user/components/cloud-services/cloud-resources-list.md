---
title: 云资源列表
---

| 编排类型  | 云服务商               | 云资源                                                       | 描述                                                         |
| --------- | ---------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| Terraform | 阿里云                 | [ack](./terraform/alibaba-ack.md)                            | Terraform configuration for Alibaba Cloud ACK cluster        |
|           |                        | [amqp](./terraform/alibaba-amqp.md)                          | Terraform configuration for Alibaba Cloud AMQP(RabbitMQ)     |
|           |                        | [ask](./terraform/alibaba-ask.md)                            | Terraform configuration for Alibaba Cloud Serverless Kubernetes (ASK) |
|           |                        | [eip](./terraform/alibaba-eip.md)                            | Terraform configuration for Alibaba Cloud Elastic IP         |
|           |                        | [mongodb](./terraform/alibaba-mongodb.md)                    | Alibaba Cloud MongoDB                                        |
|           |                        | [mse](./terraform/alibaba-mse.md)                            | Terraform configuration for Alibaba Cloud MSE                |
|           |                        | [oss](./terraform/alibaba-oss.md)                            | Terraform configuration for Alibaba Cloud OSS                |
|           |                        | [rds](./terraform/alibaba-rds.md)                            | Terraform configuration for Alibaba Cloud RDS                |
|           |                        | [redis](./terraform/alibaba-redis.md)                        | Terraform configuration for Alibaba Cloud Redis              |
|           |                        | [rocketmq](./terraform/alibaba-rocketmq.md)                  | Terraform configuration for Alibaba Cloud RocketMQ           |
|           |                        | [sls project](./terraform/alibaba-sls-project.md)            | Terraform configuration for Alibaba Cloud SLS Project        |
|           |                        | [sls store](./terraform/alibaba-sls-store.md)                | Terraform configuration for Alibaba Cloud SLS Store          |
|           |                        | [vpc](./terraform/alibaba-vpc.md)                            | Terraform configuration for Alibaba Cloud VPC                |
|           |                        | [vswitch](./terraform/alibaba-vswitch.md)                    | Terraform configuration for Alibaba Cloud VSwitch            |
|           | AWS                    | [acm](./terraform/aws-acm.md)                                | Terraform module which creates and validates ACM certificate |
|           |                        | [alb](./terraform/aws-alb.md)                                | Terraform module to create an AWS Application/Network Load Balancer (ALB/NLB) and associated resources |
|           |                        | [autoscaling](./terraform/aws-autoscaling.md)                | Terraform module which creates Auto Scaling resources on AWS |
|           |                        | [bridgecrew read only](./terraform/aws-bridgecrew-read-only.md) | Bridgecrew READ ONLY integration module                      |
|           |                        | [cloudfront s3 cdn](./terraform/aws-cloudfront-s3-cdn.md)    | Terraform module to easily provision CloudFront CDN backed by an S3 origin |
|           |                        | [cloudfront](./terraform/aws-cloudfront.md)                  | Terraform module which creates CloudFront resources on AWS   |
|           |                        | [cloudwatch cis alarms](./terraform/aws-cloudwatch-cis-alarms.md) | Terraform module which creates Cloudwatch resources on AWS   |
|           |                        | [cloudwatch log group](./terraform/aws-cloudwatch-log-group.md) | Terraform module which creates Cloudwatch resources on AWS   |
|           |                        | [cloudwatch log metric filter](./terraform/aws-cloudwatch-log-metric-filter.md) | Terraform module which creates Cloudwatch resources on AWS   |
|           |                        | [cloudwatch metric alarm](./terraform/aws-cloudwatch-metric-alarm.md) | Terraform module which creates Cloudwatch resources on AWS   |
|           |                        | [cloudwatch metric alarms](./terraform/aws-cloudwatch-metric-alarms.md) | Terraform module which creates Cloudwatch resources on AWS   |
|           |                        | [config](./terraform/aws-config.md)                          | This module configures AWS Config, a service that enables you to assess, audit, and evaluate the configurations of your AWS resources. |
|           |                        | [dynamodb table](./terraform/aws-dynamodb-table.md)          | Terraform module which creates DynamoDB table on AWS         |
|           |                        | [ec2 instance](./terraform/aws-ec2-instance.md)              | Terraform module which creates EC2 instance(s) on AWS        |
|           |                        | [ecs container definition](./terraform/aws-ecs-container-definition.md) | Terraform module to generate well-formed JSON documents (container definitions) that are passed to the  aws_ecs_task_definition Terraform resource |
|           |                        | [ecs](./terraform/aws-ecs.md)                                | Terraform module which creates AWS ECS resources             |
|           |                        | [eks cluster autoscaler](./terraform/aws-eks-cluster-autoscaler.md) | AWS Eks-Cluster-Autoscaler                                   |
|           |                        | [eks external dns](./terraform/aws-eks-external-dns.md)      | AWS Eks-External-Dns                                         |
|           |                        | [eks kube state metrics](./terraform/aws-eks-kube-state-metrics.md) | AWS Eks-Kube-State-Metrics                                   |
|           |                        | [eks node problem detector](./terraform/aws-eks-node-problem-detector.md) | A terraform module to deploy a node problem detector on Amazon EKS cluster |
|           |                        | [eks](./terraform/aws-eks.md)                                | Terraform module to create an Elastic Kubernetes (EKS) cluster and associated worker instances on AWS |
|           |                        | [elasticache redis](./terraform/aws-elasticache-redis.md)    | Terraform module to provision an ElastiCache Redis Cluster   |
|           |                        | [elb](./terraform/aws-elb.md)                                | Terraform module which creates ELB resources on AWS          |
|           |                        | [guardduty](./terraform/aws-guardduty.md)                    | Terraform module to provision AWS Guard Duty                 |
|           |                        | [iam account](./terraform/aws-iam-account.md)                | Terraform module which creates IAM resources on AWS          |
|           |                        | [iam assumable role with oidc](./terraform/aws-iam-assumable-role-with-oidc.md) | Terraform module which creates IAM resources on AWS          |
|           |                        | [iam assumable role with saml](./terraform/aws-iam-assumable-role-with-saml.md) | Terraform module which creates IAM resources on AWS          |
|           |                        | [iam assumable role](./terraform/aws-iam-assumable-role.md)  | Terraform module which creates IAM resources on AWS          |
|           |                        | [iam assumable roles with saml](./terraform/aws-iam-assumable-roles-with-saml.md) | Terraform module which creates IAM resources on AWS          |
|           |                        | [iam assumable roles](./terraform/aws-iam-assumable-roles.md) | Terraform module which creates IAM resources on AWS          |
|           |                        | [iam eks role](./terraform/aws-iam-eks-role.md)              | Terraform module which creates IAM resources on AWS          |
|           |                        | [iam group with assumable roles policy](./terraform/aws-iam-group-with-assumable-roles-policy.md) | Terraform module which creates IAM resources on AWS          |
|           |                        | [iam group with policies](./terraform/aws-iam-group-with-policies.md) | Terraform module which creates IAM resources on AWS          |
|           |                        | [iam nofile](./terraform/aws-iam-nofile.md)                  | Terraform module Terraform module for creating AWS IAM Roles with heredocs |
|           |                        | [iam policy document aggregator](./terraform/aws-iam-policy-document-aggregator.md) | Terraform module to aggregate multiple IAM policy documents into single policy document. |
|           |                        | [iam policy](./terraform/aws-iam-policy.md)                  | Terraform module which creates IAM resources on AWS          |
|           |                        | [iam read only policy](./terraform/aws-iam-read-only-policy.md) | Terraform module which creates IAM resources on AWS          |
|           |                        | [iam role](./terraform/aws-iam-role.md)                      | A Terraform module that creates IAM role with provided JSON IAM polices documents. |
|           |                        | [iam s3 user](./terraform/aws-iam-s3-user.md)                | Terraform module to provision a basic IAM user with permissions to access S3 resources, e.g. to give the user read/write/delete access to the objects in an S3 bucket |
|           |                        | [iam system user](./terraform/aws-iam-system-user.md)        | Terraform Module to Provision a Basic IAM System User Suitable for CI/CD Systems (E.g. TravisCI, CircleCI) |
|           |                        | [iam user](./terraform/aws-iam-user.md)                      | Terraform module which creates IAM resources on AWS          |
|           |                        | [key pair](./terraform/aws-key-pair.md)                      | Terraform module which creates EC2 key pair on AWS           |
|           |                        | [kms key](./terraform/aws-kms-key.md)                        | Terraform module to provision a KMS key with alias           |
|           |                        | [lambda do it all](./terraform/aws-lambda-do-it-all.md)      | Terraform module to provision a lambda with full permissions |
|           |                        | [lambda with inline code](./terraform/aws-lambda-with-inline-code.md) | Terraform module creating a Lambda function with inline code |
|           |                        | [lambda](./terraform/aws-lambda.md)                          | Terraform module, which takes care of a lot of AWS Lambda/serverless tasks (build dependencies, packages, updates, deployments) in countless combinations |
|           |                        | [notify slack](./terraform/aws-notify-slack.md)              | Terraform module which creates SNS topic and Lambda function which sends notifications to Slack |
|           |                        | [rds aurora](./terraform/aws-rds-aurora.md)                  | Terraform module which creates RDS Aurora resources on AWS   |
|           |                        | [rds](./terraform/aws-rds.md)                                | AWS RDS                                                      |
|           |                        | [route53 alias](./terraform/aws-route53-alias.md)            | Terraform Module to Define Vanity Host/Domain (e.g. ) as an ALIAS record |
|           |                        | [route53 cluster hostname](./terraform/aws-route53-cluster-hostname.md) | Terraform module to define a consistent AWS Route53 hostname |
|           |                        | [route53 delegation sets](./terraform/aws-route53-delegation-sets.md) | Terraform module which creates Route53 resources on AWS      |
|           |                        | [route53 records](./terraform/aws-route53-records.md)        | TTerraform module which creates Route53 resources on AWS erraform module which creates Route53 resources on AWS |
|           |                        | [route53 zones](./terraform/aws-route53-zones.md)            |                                                              |
|           |                        | [s3 log storage](./terraform/aws-s3-log-storage.md)          | This module creates an S3 bucket suitable for receiving logs from other AWS services such as S3, CloudFront, and CloudTrail |
|           |                        | [s3](./terraform/aws-s3.md)                                  | Terraform configuration for AWS S3                           |
|           |                        | [secretsmanager for rollbar access tokens](./terraform/aws-secretsmanager-for-rollbar-access-tokens.md) | Terraform module creating a SecretsManager for Rollbar project access tokens |
|           |                        | [security group](./terraform/aws-security-group.md)          | Terraform module which creates EC2-VPC security groups on AWS |
|           |                        | [security hub](./terraform/aws-security-hub.md)              | Terraform module to provision AWS Security Hub               |
|           |                        | [sns topic](./terraform/aws-sns-topic.md)                    | Terraform Module to Provide an Amazon Simple Notification Service (SNS) |
|           |                        | [sqs](./terraform/aws-sqs.md)                                | Terraform module which creates SQS resources on AWS          |
|           |                        | [ssm parameter store](./terraform/aws-ssm-parameter-store.md) | Terraform module to populate AWS Systems Manager (SSM) Parameter Store with values from Terraform. Works great with Chamber. |
|           |                        | [subnet](./terraform/aws-subnet.md)                          | AWS Subnet                                                   |
|           |                        | [utils](./terraform/aws-utils.md)                            | Utility functions for use with Terraform in the AWS environment |
|           |                        | [vpc](./terraform/aws-vpc.md)                                | AWS VPC                                                      |
|           | Azure                  | [database mariadb](./terraform/azure-database-mariadb.md)    | Terraform configuration for Azure Database Mariadb           |
|           |                        | [resource group](./terraform/azure-resource-group.md)        | Azure Resource Group                                         |
|           |                        | [storage account](./terraform/azure-storage-account.md)      | Terraform configuration for Azure Blob Storage Account       |
|           |                        | [subnet](./terraform/azure-subnet.md)                        | Azure Subnet                                                 |
|           |                        | [virtual network](./terraform/azure-virtual-network.md)      | Azure Virtual Network                                        |
|           | 腾讯云                 | [subnet](./terraform/tencent-subnet.md)                      | Tencent Cloud Subnet                                         |
|           |                        | [vpc](./terraform/tencent-vpc.md)                            | Terraform configuration for Tencent Cloud VPC                |
|           | Google  Cloud Platform | [network](./terraform/gcp-network.md)                        | Terraform configuration for Google Cloud Platform            |

