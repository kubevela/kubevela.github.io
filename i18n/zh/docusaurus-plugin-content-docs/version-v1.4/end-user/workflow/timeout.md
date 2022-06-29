---
title:  步骤超时
---

> 注意：你需要升级到 1.5 及以上版本来使用超时功能。

本节将介绍如何在 KubeVela 中为工作流步骤添加超时时间。

在 KubeVela 工作流中，每个步骤都可以指定一个 `timeout`，你可以使用 `timeout` 来指定该步骤的超时时间。

`timeout` 遵循 `duration` 格式，例如 `30s`, `1m` 等。你可以参考 Golang 的 [parseDuration](https://pkg.go.dev/time#ParseDuration)。

如果一个步骤在指定的时间内没有完成，KubeVela 会将该步骤的状态置为 `failed`，步骤的 Reason 会设置为 `timeout`。

部署如下例子：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: timeout-example
  namespace: default
spec:
  components:
  - name: comp1
    type: webservice
    properties:
      image: crccheck/hello-world
      port: 8000
  - name: comp2
    type: webservice
    properties:
      image: crccheck/hello-world
      port: 8000
  workflow:
    steps:
    - name: apply-comp1
      type: apply-component
      properties:
        component: comp1
    - name: suspend
      type: suspend
      timeout: 5s
    - name: apply-comp2
      type: apply-component
      properties:
        component: comp2
```

使用 vela status 命令查看应用状态：

```bash
$ vela status timeout-example
About:

  Name:      	timeout-example
  Namespace: 	default
  Created at:	2022-06-25 00:51:43 +0800 CST
  Status:    	workflowTerminated

Workflow:

  mode: StepByStep
  finished: true
  Suspend: false
  Terminated: true
  Steps
  - id:1f58n13qdp
    name:apply-comp1
    type:apply-component
    phase:succeeded
    message:
  - id:1pfije4ugt
    name:suspend
    type:suspend
    phase:failed
    message:
  - id:lqxyenjxj4
    name:apply-comp2
    type:apply-component
    phase:skipped
    message:

Services:

  - Name: comp1
    Cluster: local  Namespace: default
    Type: webservice
    Healthy Ready:1/1
    No trait applied
```

可以看到，当第一个组件被成功部署后，工作流会暂停在第二个 `suspend` 步骤上。该 `suspend` 步骤被设置了一个五秒的超时时间，如果在五秒内没有继续该工作流的话，该步骤会因为超时而失败。而第三个步骤因为前面的 `suspend` 步骤失败了，从而被跳过了执行。