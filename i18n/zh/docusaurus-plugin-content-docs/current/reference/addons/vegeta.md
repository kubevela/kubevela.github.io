---
title: vegeta
---

## 安装插件

```shell
$ vela addon enable vegeta
```

## 卸载插件

```shell
$ vela addon disable vegeta
```

## 支持的工作负载类型

Vegeta Trait 支持下面的几种工作负载webservice，worker 和 cloneset。

## 开始使用

使用一个 webservice 组件来开始，将下面的声明保存到 show-vegeta.yaml，并运行 vela up -f show-vegeta.yaml 来启动。

```shell
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: new-vegeta
  namespace: vegeta
spec:
  components:
    - name: new-vegeta
      type: webservice
      properties:
        exposeType: ClusterIP
        image: nginx:latest
        ports:
        - expose: true
          port: 80
          protocol: TCP
          ports: 80
      traits:
        - type: vegeta
          properties:
            dorequest: 'GET http://show-vegeta:80'
            parallelism: 1
            backofflimit: 10
```

检查 app 和 trait 的状态：

```shell
vela ls app -n vegeta
APP             COMPONENT       TYPE            TRAITS  PHASE   HEALTHY STATUS          CREATED-TIME
new-vegeta      new-vegeta      webservice      vegeta  running healthy Ready:1/1       2022-05-31 21:24:28 +0800 CST

vela status  new-vegeta  -n vegeta
About:

  Name:         new-vegeta
  Namespace:    vegeta
  Created at:   2022-05-31 21:24:28 +0800 CST
  Status:       running

Workflow:

  mode: DAG
  finished: true
  Suspend: false
  Terminated: false
  Steps
  - id:rqfzusuxgj
    name:new-vegeta
    type:apply-component
    phase:succeeded
    message:

Services:

  - Name: new-vegeta
    Cluster: local  Namespace: vegeta
    Type: webservice
    Healthy Ready:1/1
    Traits:
      ? vegeta

vela logs new-vegeta --name new-vegeta -n vegeta
? You have 2 deployed resources in your app. Please choose one:  [Use arrows to move, type to filter]
> Cluster: local | Namespace: vegeta | Kind: Deployment | Name: new-vegeta
  Cluster: local | Namespace: vegeta | Kind: Job | Name: new-vegeta

Choose the Job to show testing data logs
```

- 如果你想获取一个更友好的输出，使用下面这两个工具： jaggr 和 jplot 来查看数据。

```shell
kubectl logs new-vegeta--1-qrh67  -n vegeta -f | jaggr @count=rps hist\[100,200,300,400,500\]:code p25,p50,p95:latency sum:bytes_in sum:bytes_out | jplot rps+code.hist.100+code.hist.200+code.hist.300+code.hist.400+code.hist.500 latency.p95+latency.p50+latency.p25 bytes_in.sum+bytes_out.sum
```

- 如何安装 jplot 和 jagrr
    - https://github.com/rs/jplot
    - https://github.com/rs/jaggr
