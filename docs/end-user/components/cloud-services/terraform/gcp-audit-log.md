---
title:  Gcp-Audit-Log
---

## Description

Terraform module for configuring an integration with Google Cloud Platform Organziations and Projects for Audit Logs analysis

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 organization_id | The organization ID, required if org_integration is set to true | string | false |  
 service_account_private_key | The private key in JSON format, base64 encoded (required when use_existing_service_account is set to true) | string | false |  
 prefix | The prefix that will be use at the beginning of every generated resource | string | false |  
 labels | Set of labels which will be added to the resources managed by the module | map(string) | false |  
 enable_ubla | Boolean for enabled Uniform Bucket Level Access on the audit log bucket | bool | false |  
 pubsub_subscription_labels | Set of labels which will be added to the subscription | map(string) | false |  
 org_integration | If set to true, configure an organization level integration | bool | false |  
 use_existing_service_account | Set this to true to use an existing Service Account | bool | false |  
 bucket_force_destroy |  | bool | false |  
 bucket_region | The region where the new bucket will be created, valid values for Multi-regions are (EU, US or ASIA) alternatively you can set a single region or Dual-regions follow the naming convention as outlined in the GCP bucket locations documentation https://cloud.google.com/storage/docs/locations#available-locations|string|US|false| | string | false |  
 log_bucket_retention_days | The number of days to keep logs before deleting. Default is 30 | number | false |  
 required_apis |  | map(any) | false |  
 existing_bucket_name | The name of an existing bucket you want to send the logs to | string | false |  
 lacework_integration_name |  | string | false |  
 pubsub_topic_labels | Set of labels which will be added to the topic | map(string) | false |  
 log_bucket_location | The location of the bucket. Default is global | string | false |  
 project_id | A project ID different from the default defined inside the provider | string | false |  
 bucket_labels | Set of labels which will be added to the audit log bucket | map(string) | false |  
 existing_sink_name | The name of an existing sink to be re-used for this integration | string | false |  
 wait_time | Amount of time to wait before the next resource is provisioned. | string | false |  
 lifecycle_rule_age | Number of days to keep audit logs in Lacework GCS bucket before deleting. Leave default to keep indefinitely | number | false |  
 log_bucket | The name of the bucket that will receive log objects | string | false |  
 k8s_filter | Filter out GKE logs from GCP Audit Log sinks.  Default is false | bool | false |  
 service_account_name | The Service Account name (required when use_existing_service_account is set to true) | string | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
