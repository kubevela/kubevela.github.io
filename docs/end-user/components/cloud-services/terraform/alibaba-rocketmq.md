---
title:  Alibaba Cloud ROCKETMQ
---

## Description

Terraform configuration for Alibaba Cloud RocketMQ

## Specification


 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 group_name | The name of MQ group | string | false |  
 group_type | Specify the protocol applicable to the created Group ID. Valid values: tcp, http. Default to tcp | string | false |  
 message_type | The type of the message. Read [Ons Topic Create](https://www.alibabacloud.com/help/doc-detail/29591.html) for further details. | number | false |  
 ons_instance_name | The name of ons instance. The length must be 3 to 64 characters. Chinese characters, English letters digits and hyphen are allowed. | string | false |  
 ons_instance_remark | The specification of ons instance remark. | string | false |  
 ons_topic_remark | The specification of ons topic remark. | string | false |  
 perm | The permission of MQ topic | string | false |  
 topic | The specification of ons topic name. Two topics on a single instance cannot have the same name and the name cannot start with 'GID' or 'CID'. The length cannot exceed 64 characters. | string | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  


### Outputs

If `writeConnectionSecretToRef` is set, a secret will be generated with these keys as below:

 Name | Description 
 ------------ | ------------- 
 GROUP_ID | The id of ons group
 HTTP_ENDPOINT_INTERNAL | The internal http endpoint of ons instance
 HTTP_ENDPOINT_INTERNET | The internet http endpoint of ons instance
 INSTANCE_ID | The id of ons instance
 TCP_ENDPOINT | The tcp endpoint of ons instance
 TOPIC_ID | The id of ons topic
