---
title:  实践案例-理想汽车
---
## 背景
理想汽车后台服务采用的是微服务架构，虽然借助kubernetes进行部署，但运维工作依然很复杂。并具有以下特点
- 一个应用能运行起来并对外提供服务，正常情况下都需要配套的db实例以及redis集群支撑
- 应用之间存在依赖关系，对于部署顺序有比较强的诉求
- 应用部署流程中需要和外围系统(比如配置中心)交互

下面以一个理想汽车的经典场景为例，介绍如何借助kubevela的workflow实现以上诉求

## 典型场景介绍

![场景架构](li.jpg)

这里面包含两个应用分别是base-server和proxy-server, 整体应用部署需要满足以下条件
- base-server 成功启动(ready)后需要往配置中心(apollo)注册信息
- base-server 需要绑定到service和ingress进行负载均衡
- proxy-server 需要在base-server成功运行后启动，并需要获取到base-server对应的service的clusterIP
- proxy-server 依赖redis中间件，需要在redis成功运行后启动
- proxy-server 需要从配置中心(apollo)读取base-server的相关注册信息

可见整个部署过程，如果人为操作，会变得异常困难以及容易出错，借助kubevela可以轻松实现场景的自动化和一键式运维


