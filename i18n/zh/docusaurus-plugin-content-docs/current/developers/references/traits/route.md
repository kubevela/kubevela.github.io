---
title:  Route
---

## 描述

配置到你服务的外部入口。

## Specification

列出 `Route` trait 的所有配置项。

```yaml
name: my-app-name

services:
  my-service-name:
    ...
    route:
      domain: example.com
      issuer: tls
      rules:
        - path: /testapp
          rewriteTarget: /
```

## 属性

名称 | 描述 | 类型 | 是否必须 | 默认值 
------------ | ------------- | ------------- | ------------- | ------------- 
 domain |  域名名称 | string | 是 | empty 
 issuer |  | string | 是 | empty 
 rules |  | [[]rules](#rules) | 否 |  
 provider |  | string | 否 |
 ingressClass |  | string | 否 |  


### 规则

名称 | 描述 | 类型 | 是否必须 | 默认值 
------------ | ------------- | ------------- | ------------- | ------------- 
 path |  | string | 是 |  
 rewriteTarget |  | string | 是 | empty 
