---
title:  AWS IAM-POLICY-DOCUMENT-AGGREGATOR
---

## 描述

Terraform module to aggregate multiple IAM policy documents into single policy document.

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 source_documents | List of JSON IAM policy documents.<br/><br/><b>Limits:</b><br/>* List size max 10<br/> * Statement can be overriden by the statement with the same sid from the latest policy. | list(string) | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
