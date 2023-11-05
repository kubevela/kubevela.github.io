---
title:  将 CRD Operator 扩展为组件
---

让我们使用 [OpenKruise](https://github.com/openkruise/kruise) 演示如何将 CRD 扩展为 KubeVela 组件。
**该机制适用于所有 CRD Operator**。

### 第 1 步：安装 CRD 控制器

您需要 [安装 CRD 控制器](https://github.com/openkruise/kruise#quick-start) 到您的 K8s 系统中。

### 第 2 步：创建组件定义

要将 Cloneset（OpenKruise 工作负载之一）注册为 KubeVela 中的新工作负载类型，唯一需要做的就是为其创建一个 `ComponentDefinition` 对象。
完整的示例可以在这个 [cloneset.yaml](https://github.com/kubevela/catalog/blob/master/registry/cloneset.yaml) 中找到。
下面列出几个重点。

#### 1. 描述工作负载类型

```yaml
...
  annotations:
    definition.oam.dev/description: "OpenKruise cloneset"
...
```

该组件类型的一行描述。 它将显示在辅助命令中，例如 `$ vela Components`。

#### 2.注册其底层CRD

```yaml
...
workload:
  definition:
    apiVersion: apps.kruise.io/v1alpha1
    kind: CloneSet
...
```

这是将 OpenKruise Cloneset 的 API 资源 (`fapps.kruise.io/v1alpha1.CloneSet`) 注册为工作负载类型的方法。
KubeVela使用Kubernetes API资源发现机制来管理所有注册的能力。

#### 3. 定义模板

```yaml
...
schematic:
  cue:
    template: |
      output: {
          apiVersion: "apps.kruise.io/v1alpha1"
          kind:       "CloneSet"
          metadata: labels: {
            "app.oam.dev/component": context.name
          }
          spec: {
              replicas: parameter.replicas
              selector: matchLabels: {
                  "app.oam.dev/component": context.name
              }
              template: {
                  metadata: labels: {
                    "app.oam.dev/component": context.name
                  }
                  spec: {
                      containers: [{
                        name:  context.name
                        image: parameter.image
                    }]
                  }
              }
          }
      }
      parameter: {
          // +usage=Which image would you like to use for your service
          // +short=i
          image: string

          // +usage=Number of pods in the cloneset
          replicas: *5 | int
      }
 ```

### 第 3 步：向 KubeVela 注册新组件类型

只要定义文件准备好了，你只需要把它应用到 Kubernetes 上就可以了。

```bash
$ kubectl apply -f https://raw.githubusercontent.com/oam-dev/catalog/master/registry/cloneset.yaml
```

新的组件类型将立即可供开发人员在 KubeVela 中使用。
