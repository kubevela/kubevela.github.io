---
title:  AWS CLOUDWATCH-LOG-METRIC-FILTER
---

## 描述

Terraform module which creates Cloudwatch resources on AWS

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 create_cloudwatch_log_metric_filter | Whether to create the Cloudwatch log metric filter | bool | false |  
 log_group_name | The name of the log group to associate the metric filter with | string | true |  
 metric_transformation_default_value | The value to emit when a filter pattern does not match a log event. | string | false |  
 metric_transformation_name | The name of the CloudWatch metric to which the monitored log information should be published (e.g. ErrorCount) | string | true |  
 metric_transformation_namespace | The destination namespace of the CloudWatch metric. | string | true |  
 metric_transformation_value | What to publish to the metric. For example, if you're counting the occurrences of a particular term like 'Error', the value will be '1' for each occurrence. If you're counting the bytes transferred the published value will be the value in the log event. | string | false |  
 name | A name for the metric filter. | string | true |  
 pattern | A valid CloudWatch Logs filter pattern for extracting metric data out of ingested log events. | string | true |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
