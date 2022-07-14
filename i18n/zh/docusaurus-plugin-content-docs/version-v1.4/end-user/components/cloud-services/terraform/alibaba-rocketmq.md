---
title:  阿里云 ROCKETMQ
---

## 描述

Terraform configuration for Alibaba Cloud RocketMQ

## 参数说明


 名称 | 描述 | 类型 | 是否必须 | 默认值 
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

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  


### 输出

如果设置了 `writeConnectionSecretToRef`，一个 Kubernetes Secret 将会被创建，并且，它的数据里有这些键（key）：

 名称 | 描述 
 ------------ | ------------- 
 GROUP_ID | The id of ons group
 HTTP_ENDPOINT_INTERNAL | The internal http endpoint of ons instance
 HTTP_ENDPOINT_INTERNET | The internet http endpoint of ons instance
 INSTANCE_ID | The id of ons instance
 TCP_ENDPOINT | The tcp endpoint of ons instance
 TOPIC_ID | The id of ons topic
