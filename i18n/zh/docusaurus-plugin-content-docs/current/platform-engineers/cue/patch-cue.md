---
title:  为 CUE 变量打补丁
---

在我们在进行 Definition 的编写时，有时我们需要对其他的组件或者运维特征进行修改、打补丁。

> 关于如何在运维特征和工作流中为资源打补丁，请参考 ...

在默认情况下，KubeVela 会将需要打补丁的值通过 CUE 的 merge 来进行合并。然而，CUE 作为一门配置语言，为了保持其安全性，无法处理有冲突的字段名。

比如，在一个组件实例中已经设置 replicas=5，那一旦有运维特征实例，尝试给 replicas 字段的值打补丁就会失败。所以我们建议你提前规划好，不要在组件和运维特征之间使用重复的字段名。

但在一些情况下，我们确实需要处理覆盖已被赋值的字段。比如，在进行多环境资源的差异化配置时，我们希望不同环境中的环境变量是不同的：如默认的环境变量为 `MODE=PROD`，测试环境中需要修改为 `MODE=DEV DEBUG=true`。

此时，我们可以部署如下的应用：

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: deploy-with-override
spec:
  components:
    - name: nginx-with-override
      type: webservice
      properties:
        image: nginx
      traits:
        - type: myenv
          properties:
            env:
              MODE: prod
  policies:
    - name: test
      type: topology
      properties:
        clusters: ["local"]
        namespace: test
    - name: prod
      type: topology
      properties:
        clusters: ["local"]
        namespace: prod
    - name: override-env
      type: override
      properties:
        components:
          - name: nginx-with-override
            traits:
              - type: myenv
                properties:
                  env:
                    MODE: test
                    DEBUG: "true"

  workflow:
    steps:
      - type: deploy
        name: deploy-test
        properties:
          policies: ["test", "override-env"]
      - type: deploy
        name: deploy-prod
        properties:
          policies: ["prod"]
```

`deploy-test` 会将 nginx 部署到 test namespace 下，同时，为这个测试环境下的 nginx 加上 `MODE=test DEBUG=true` 的环境变量。而 prod namespace 下的 nginx 将保留原本的 `MODE=prod` 环境变量。

KubeVela 提供了一系列策略型补丁来帮助你完成这类需求。值得注意的是，策略型补丁并不是 CUE 官方提供的功能, 而是 KubeVela 扩展开发而来。

下面，我们以编写一个环境变量补丁的运维特征来分别介绍补丁策略的使用方法。

## 补丁策略

### patchKey

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
          - name: TEST
            value: test
      traits:
        - type: myenv
          properties:
            env:
              TEST2: test2
```

最终，我们可以看到应用的环境变量中包含了两个环境变量：`TEST=test` 和 `TEST2=test2`。

### retainKeys

如果你希望在合并环境变量的同时，能够覆盖重复的环境变量值的话，你可以使用 `+patchStrategy=retainKeys` 注释。

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
          - name: TEST
            value: test
          - name: TEST2
            value: old-value
      traits:
        - type: myenv
          properties:
            env:
              TEST2: test2
```

最终，我们可以看到应用的环境变量中包含了两个环境变量：`TEST=test` 和 `TEST2=test2`。

### replace

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
          - name: TEST
            value: test
          - name: TEST2
            value: test2
      traits:
        - type: myenv
          properties:
            env:
              TEST: replace
```

最终，我们可以看到应用的环境变量中只保留了新的环境变量：`TEST=replace`。
