---
title:  依赖关系
---

本节将介绍如何在 KubeVela 中指定工作流步骤的依赖关系。

> 注意：在当前版本（1.4）中，工作流中的步骤是顺序执行的，这意味着步骤间有一个隐式的依赖关系，即：下一个步骤依赖上一个步骤的成功执行。此时，在工作流中指定依赖关系的意义可能不大。
> 
> 在未来的版本（1.5+）中，你将可以显示指定工作流步骤的执行方式（如：改成 DAG 并行执行），此时，你可以通过指定步骤的依赖关系来控制工作流的执行。

## 如何使用

在 KubeVela 中，可以在步骤中通过 `dependsOn` 来指定步骤间的依赖关系。

如：我们希望在部署完组件之后，发送一个消息通知：

```yaml
...
workflow:
  steps:
    - name: comp
      type: apply-component
    - name: notify
      type: notification
      dependsOn:
        - comp
```

在这种情况下，KubeVela 等待步骤 comp 执行完毕后，再执行 notify 步骤发送消息通知。

部署如下 YAML：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: dependsOn-app
  namespace: default
spec:
  components:
  - name: express-server
    type: webservice
    properties:
      image: oamdev/hello-world
      ports:
        - port: 8000
  workflow:
    steps:
      - name: comp
        type: apply-component
        properties:
          component: express-server
      - name: slack-message
        type: notification
        dependsOn:
          - comp
        properties:
          slack:
            url:
              value: <your slack url>
            message:
              text: depends on comp
```

## 期望结果

使用 vela status 命令查看应用的状态：

```bash
$ vela status depends
About:

  Name:      	depends
  Namespace: 	default
  Created at:	2022-06-24 17:20:50 +0800 CST
  Status:    	running

Workflow:

  mode: StepByStep
  finished: true
  Suspend: false
  Terminated: false
  Steps
  - id:e6votsntq3
    name:comp
    type:apply-component
    phase:succeeded
    message:
  - id:esvzxehgwc
    name:slack-message
    type:notification
    phase:succeeded
    message:

Services:

  - Name: express-server
    Cluster: local  Namespace: default
    Type: webservice
    Healthy Ready:1/1
    No trait applied
```

可以看到，所有的步骤状态均为成功。并且，当组件被成功部署后，slack 中也收到了一条消息通知。