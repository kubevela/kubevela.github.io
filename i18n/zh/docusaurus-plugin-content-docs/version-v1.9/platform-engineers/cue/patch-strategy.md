---
title:  补丁策略
---

在默认情况下，KubeVela 会将需要打补丁的值通过 CUE 的 merge 来进行合并。但是目前 CUE 无法处理有冲突的字段名。

KubeVela 提供了一系列补丁策略来帮助解决冲突的问题。在编写补丁型运维特征和工作流时，如果你发现值冲突的问题，可以结合使用这些补丁策略。值得注意的是，补丁策略并不是 CUE 官方提供的功能, 而是 KubeVela 扩展开发而来。

> 关于如何在定义中打补丁，请参考 [在定义中打补丁](../traits/patch-trait.md)。

我们以编写一个环境变量补丁的运维特征来分别介绍补丁策略的使用方法。

## patchKey

如果你希望为指定容器添加多个环境变量，你可以使用 `+patchKey=name` 注释来找到这个容器。此时，KubeVela 会执行 merge 操作，将这些环境变量与已有的环境变量进行合并。这意味着，patchKey 无法处理重复的字段名。

> 在 KubeVela 1.4 版本之后，你可以使用 , 分割多个 patchKey，如 patchKey=name,image。

在环境中部署如下 definition：

```yaml
myenv: {
	type: "trait"
	annotations: {}
	labels: {
		"ui-hidden": "true"
	}
	description: "Add env on K8s pod for your workload which follows the pod spec in path 'spec.template'"
	attributes: appliesToWorkloads: ["*"]
}
template: {
	patch: {
			spec: template: spec: {
					// +patchKey=name
					containers: [{
							name: context.name
							env: [
									for k, v in parameter.env {
											name:  k
											value: v
									},
							]
					}]
			}
	}

	parameter: {
			env: [string]: string
	}
}
```

在如下应用中使用这个策略型补丁：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: webservice-app
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        image: crccheck/hello-world
        env:
          - name: OLD
            value: old
      traits:
        - type: myenv
          properties:
            env:
              NEW: new
```

在不使用 `myenv` 这个补丁特征之前，应用的环境变量为：

```
spec:
  containers:
  - env:
    - name: OLD
      value: old
```

在使用了 `myenv` 这个补丁特征之后，应用的环境变量为：

```
spec:
  containers:
  - env:
    - name: OLD
      value: old
    - name: NEW
      value: new
```

最终，我们可以看到应用的环境变量中包含了两个环境变量：`OLD=old` 和 `NEW=new`。

## retainKeys

如果你希望在合并环境变量的同时，能够覆盖重复的环境变量值的话，你可以使用 `+patchStrategy=retainKeys` 注释。

这个注解的策略，与 Kubernetes 官方的 [retainKeys](https://kubernetes.io/docs/tasks/manage-kubernetes-objects/update-api-object-kubectl-patch/#use-strategic-merge-patch-to-update-a-deployment-using-the-retainkeys-strategy) 策略类似。

> 在下面这个例子中，+patchKey=name 会指定 patch 应该应用到哪个容器上，而 +patchStrategy=retainKeys 则会指定在合并环境变量时，如果遇到重复的环境变量名，则覆盖环境变量值。

```yaml
myenv: {
	type: "trait"
	annotations: {}
	labels: {
		"ui-hidden": "true"
	}
	description: "Add env on K8s pod for your workload which follows the pod spec in path 'spec.template'"
	attributes: appliesToWorkloads: ["*"]
}
template: {
	patch: {
			spec: template: spec: {
					// +patchKey=name
					containers: [{
							name: context.name
							// +patchStrategy=retainKeys
							env: [
									for k, v in parameter.env {
											name:  k
											value: v
									},
							]
					}]
			}
	}

	parameter: {
			env: [string]: string
	}
}
```

在如下应用中使用这个策略型补丁：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: webservice-app
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        image: crccheck/hello-world
        env:
          - name: OLD
            value: old
          - name: OLD2
            value: old2
      traits:
        - type: myenv
          properties:
            env:
              NEW: new
              OLD2: override
```

在不使用 `myenv` 这个补丁特征之前，应用的环境变量为：

```
spec:
  containers:
  - env:
    - name: OLD
      value: old
    - name: OLD2
      value: old2
```

在使用了 `myenv` 这个补丁特征之后，应用的环境变量为：

```
spec:
  containers:
  - env:
    - name: OLD
      value: old
    - name: OLD2
      value: override
    - name: NEW
      value: new
```

最终，我们可以看到应用的环境变量中包含了三个环境变量：`OLD=old`，`OLD2=override` 和 `NEW=new`。

## replace

如果你希望直接替换掉整个环境变量数组的话，你可以使用 `+patchStrategy=replace` 注释。

> 在下面这个例子中，+patchKey=name 会指定 patch 应该应用到哪个容器上，而 +patchStrategy=replace 则会指定在合并数组时，直接替换整个环境变量数组。

```yaml
myenv: {
	type: "trait"
	annotations: {}
	labels: {
		"ui-hidden": "true"
	}
	description: "Add env on K8s pod for your workload which follows the pod spec in path 'spec.template'"
	attributes: appliesToWorkloads: ["*"]
}
template: {
	patch: {
			spec: template: spec: {
					// +patchKey=name
					containers: [{
							name: context.name
							// +patchStrategy=replace
							env: [
									for k, v in parameter.env {
											name:  k
											value: v
									},
							]
					}]
			}
	}

	parameter: {
			env: [string]: string
	}
}
```

在如下应用中使用这个策略型补丁：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: webservice-app
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        image: crccheck/hello-world
        env:
          - name: OLD
            value: old
          - name: OLD2
            value: old2
      traits:
        - type: myenv
          properties:
            env:
              NEW: replace
```

在不使用 `myenv` 这个补丁特征之前，应用的环境变量为：

```
spec:
  containers:
  - env:
    - name: OLD
      value: old
    - name: OLD2
      value: old2
```

在使用了 `myenv` 这个补丁特征之后，应用的环境变量为：

```
spec:
  containers:
  - env:
    - name: NEW
      value: replace
```

最终，我们可以看到应用的环境变量中只保留了新的环境变量：`NEW=replace`。
