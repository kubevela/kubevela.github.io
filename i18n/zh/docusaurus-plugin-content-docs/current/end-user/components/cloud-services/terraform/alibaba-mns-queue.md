---
title:  阿里云 MNS-QUEUE
---

## 描述

Create a queue instance based on the Terraform module。

## 参数说明


 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 delay_seconds | This attribute defines the length of time, in seconds, after which every message sent to the queue is dequeued. Valid value range: 0-604800 seconds, i.e., 0 to 7 days。 | number | false |  
 maximum_message_size | This indicates the maximum length, in bytes, of any message body sent to the queue. Valid value range: 1024-65536, i.e., 1K to 64K。 | number | false |  
 message_retention_period | Messages are deleted from the queue after a specified length of time, whether they have been activated or not. This attribute defines the viability period, in seconds, for every message in the queue. Valid value range: 60-259200 seconds, i.e., 1 minutes to 3 days。 | number | false |  
 name | Two queues on a single account in the same region cannot have the same name. A queue name must start with an English letter or a digit, and can contain English letters, digits, and hyphens, with the length not exceeding 256 characters。 | string | false |  
 polling_wait_seconds | Long polling is measured in seconds. When this attribute is set to 0, long polling is disabled. When it is not set to 0, long polling is enabled and message dequeue requests will be processed only when valid messages are received or when long polling times out. The value range is 0-30 seconds。 | number | false |  
 region | (Deprecated from version 1.2.0) The region used to launch this module resources。 | string | false |  
 visibility_timeout | Dequeued messages change from active (visible) status to inactive (invisible) status. This attribute defines the length of time, in seconds, that messages remain invisible. Messages return to active status after the set period. Valid value range: 1-43200 seconds, i.e., 1 seconds to 12 hours。 | number | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to。 | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to。 | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to。 | string | false |  
