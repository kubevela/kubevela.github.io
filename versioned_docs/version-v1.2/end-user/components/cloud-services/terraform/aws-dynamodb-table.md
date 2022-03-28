---
title:  AWS DYNAMODB-TABLE
---

## Description

Terraform module which creates DynamoDB table on AWS

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 autoscaling_enabled | Whether or not to enable autoscaling. See note in README about this setting | bool | false |  
 create_table | Controls if DynamoDB table and associated resources are created | bool | false |  
 range_key | The attribute to use as the range (sort) key. Must also be defined as an attribute | string | false |  
 billing_mode | Controls how you are billed for read/write throughput and how you manage capacity. The valid values are PROVISIONED or PAY_PER_REQUEST | string | false |  
 local_secondary_indexes | Describe an LSI on the table; these can only be allocated at creation so you cannot change this definition after you have created the resource. | any | false |  
 replica_regions | Region names for creating replicas for a global DynamoDB table. | any | false |  
 server_side_encryption_enabled | Whether or not to enable encryption at rest using an AWS managed KMS customer master key (CMK) | bool | false |  
 timeouts | Updated Terraform resource management timeouts | map(string) | false |  
 autoscaling_write | A map of write autoscaling settings. `max_capacity` is the only required key. See example in examples/autoscaling | map(string) | false |  
 autoscaling_indexes | A map of index autoscaling configurations. See example in examples/autoscaling | map(map(string)) | false |  
 ttl_attribute_name | The name of the table attribute to store the TTL timestamp in | string | false |  
 stream_enabled | Indicates whether Streams are to be enabled (true) or disabled (false). | bool | false |  
 tags | A map of tags to add to all resources | map(string) | false |  
 autoscaling_defaults | A map of default autoscaling settings | map(string) | false |  
 attributes | List of nested attribute definitions. Only required for hash_key and range_key attributes. Each attribute has two properties: name - (Required) The name of the attribute, type - (Required) Attribute type, which must be a scalar type: S, N, or B for (S)tring, (N)umber or (B)inary data | list(map(string)) | false |  
 point_in_time_recovery_enabled | Whether to enable point-in-time recovery | bool | false |  
 ttl_enabled | Indicates whether ttl is enabled | bool | false |  
 stream_view_type | When an item in the table is modified, StreamViewType determines what information is written to the table's stream. Valid values are KEYS_ONLY, NEW_IMAGE, OLD_IMAGE, NEW_AND_OLD_IMAGES. | string | false |  
 autoscaling_read | A map of read autoscaling settings. `max_capacity` is the only required key. See example in examples/autoscaling | map(string) | false |  
 name | Name of the DynamoDB table | string | false |  
 hash_key | The attribute to use as the hash (partition) key. Must also be defined as an attribute | string | false |  
 write_capacity | The number of write units for this table. If the billing_mode is PROVISIONED, this field should be greater than 0 | number | false |  
 read_capacity | The number of read units for this table. If the billing_mode is PROVISIONED, this field should be greater than 0 | number | false |  
 global_secondary_indexes | Describe a GSI for the table; subject to the normal limits on the number of GSIs, projected attributes, etc. | any | false |  
 server_side_encryption_kms_key_arn | The ARN of the CMK that should be used for the AWS KMS encryption. This attribute should only be specified if the key is different from the default DynamoDB CMK, alias/aws/dynamodb. | string | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
