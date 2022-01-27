---
title:  阿里云 MSE
---

## 描述

Alibaba Cloud MSE

## 参数说明


### 属性

 名称 | 描述 | 类型 | 是否必须 | 默认值 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 cluster_version | The version of MSE Cluster. Valid values: ZooKeeper_3_4_14, ZooKeeper_3_5_5, NACOS_ANS_1_1_3, NACOS_ANS_1_2_1, EUREKA_1_9_3 | string | false |  
 net_type | The type of network. Valid values: privatenet and pubnet | string | false |  
 acl_entry_list | The whitelist | list(any) | false |  
 cluster_alias_name | The alias name of MSE Cluster | string | false |  
 cluster_specification | The engine specification of MSE Cluster. Valid values: MSE_SC_1_2_200_c：1C2G MSE_SC_2_4_200_c：2C4G MSE_SC_4_8_200_c：4C8G MSE_SC_8_16_200_c：8C16G | string | false |  
 cluster_type | The type of MSE Cluster. Valid values: ZooKeeper、Nacos-Ans and Eureka | string | false |  
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
 INTRANET_PORT | The intranet port of the resource
 Net_TYPE | The type of network
 RESOURCE_IDENTIFIER | The identifier of the resource
 INTERNET_DOMAIN | The internet domain of the resource
 INTERNET_PORT | The internet port of the resource
 INTRANET_DOMAIN | The intranet domain of the resource
