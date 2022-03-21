---
title:  Alibaba Cloud MNS-TOPIC
---

## Description

Create a topic and a subscription based on Terraform module

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 maximum_message_size | This indicates the maximum length, in bytes, of any message body sent to the topic. Valid value range: 1024-65536, i.e., 1K to 64K. | number | false |  
 subscription_name | the Subscription Name,Two subcription Name on a single topic in the same region cannot have the same name.A subscription name must start with an English letter or a digit, and can contain English letters, digits, and hyphens, with the length not exceeding 256 characters. | string | false |  
 filter_tag | Message Filter Label | string | false |  
 region | (Deprecated from version 1.2.0) The region used to launch this module resources. | string | false |  
 topic_name | Two topics on a single account in the same region cannot have the same name. A topic name must start with an English letter or a digit, and can contain English letters, digits, and hyphens, with the length not exceeding 256 characters. | string | false |  
 notify_strategy | The NotifyStrategy attribute of Subscription. This attribute specifies the retry strategy when message sending fails. the attribute has two value EXPONENTIAL_DECAY_RETR or BACKOFF_RETRY  | string | false |  
 notify_content_format | The NotifyContentFormat attribute of Subscription. This attribute specifies the content format of the messages pushed to users. the attribute has two value SIMPLIFIED or XML | string | false |  
 logging_enabled | is log enabled ? | bool | false |  
 endpoint | Describe the terminal address of the message received in this subscription. email format: mail:directmail:XXX@YYY.com ,   queue format: http(s)://AccountId.mns.regionId.aliyuncs.com/, http format: http(s)://www.xxx.com/xxx | string | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
