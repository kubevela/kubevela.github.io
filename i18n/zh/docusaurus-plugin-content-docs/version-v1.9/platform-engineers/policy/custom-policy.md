---
title: 自定义策略
---

本节将介绍通过 CUE 实现自定义策略，在开始之前，你要学习 [模块定义](../../getting-started/definition.md) 的基本概念和 [如何管理模块定义](../cue/definition-edit.md)。

## 通过策略生成资源

通过 Policy 生成资源类似于 Trait ，策略可用于跨 component 定义事物。

让我们使用 `vela def init` 创建一个基本的策略脚手架：

```
vela def init my-plc -t policy --desc "My ingress route policy." > myroute.cue
```

我们希望创建一个这样的脚手架:

```
$ cat myroute.cue
"my-plc": {
	annotations: {}
	attributes: {}
	description: "My ingress route policy."
	labels: {}
	type: "policy"
}

template: {
}
```

规则要和 component 定义保持一致，必须制定 `output`，`outputs` 可用于多个对象，格式如下:

```cue
output: {
    <full template data>
}
outputs: <unique-name>: 
  <full template data>
```

如下是一个通过策略创建流量拆分服务网格对象的示例。
```cue
"my-plc": {
	description: "My service mesh policy."
	type:        "policy"
}

template: {
	#ServerWeight: {
		service: string
		weight:  int
	}
	parameter: {
		weights: [...#ServerWeight]
	}

	output: {
		apiVersion: "split.smi-spec.io/v1alpha3"
		kind:       "TrafficSplit"
		metadata: name: context.name
		spec: {
			service:  context.name
			backends: parameter.weights
		}
	}
}
```

把这个 Policy 应用到控制平面来使其生效：

```
vela def apply myroute.cue
```

随后我们的终端用户可以立即发现并在 `Application` 中使用这个 Policy。

执行 `vela up` 命令后：

```shell
cat <<EOF | vela up -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: my-test-2
spec:
  components:
    - name: server-v1
      type: webservice
      properties:
        image: oamdev/hello-world:v1
    - name: server-v2
      type: webservice
      properties:
        image: oamdev/hello-world:v2
  policies:
    - type: my-plc
      name: unified
      properties:
        weights:
          - service: server-v1
            weight: 80
          - service: server-v2
            weight: 20
EOF
```

该策略由 KubeVela 生成如下所示的 Kubernetes 资源:

```
apiVersion: split.smi-spec.io/v1alpha3
kind: TrafficSplit
metadata:
  name: unified
  namespace: default
spec:
  backends:
  - service: server-v1
    weight: 80
  - service: server-v2
    weight: 20
  service: unified
```

如果需要，你可以在策略中定义任何 Kubernetes API 对象。

## 特殊策略

并不是所有的策略都可以生成资源, 有几个 [内置策略](../../end-user/policies/references.md) 用于控制整个交付过程和工作流程。

:::tip
这些特殊策略通常编写在 application controller 代码中，无需通过 CUE 自定义。
:::
