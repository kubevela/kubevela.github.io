---
title:  应用多集群部署
---

KubeVela 支持将单个应用针对不同的环境实现差异化的配置，并利用工作流将配置后的应用部署到不同的环境中。

## 多集群环境创建

KubeVela 默认利用 [OCM](https://open-cluster-management.io/) 的能力完成多集群的管理。

### 前置条件

1. OCM 提供了 `clusteradm` CLI 用于搭建一个多集群环境。你需要下载并提取 [clusteradm](https://github.com/open-cluster-management-io/clusteradm/releases/tag/v0.1.0-alpha.5) 二进制文件。更多细节请查看 clusteradm 的 Github [仓库](https://github.com/open-cluster-management-io/clusteradm/blob/main/README.md#quick-start)。

2. 管控集群的 Kubernetes 版本需要 1.19 及以上。
### 初始化管控集群

```shell
$ clusteradm init
The multicluster hub control plane has been initialized successfully!

You can now register cluster(s) to the hub control plane. Log onto those cluster(s) and run the following command:

    clusteradm join --hub-token <token_data> --hub-apiserver https://127.0.0.1:52189 --cluster-name <cluster_name>

Replace <cluster_name> with a cluster name of your choice. For example, cluster1.
```

初始化成功之后，会得到一个用于后续注册管控集群的 `clusteradm join` 指令。

### 利用现有集群搭建多集群环境

#### 1. 注册被管控集群

我们以注册一个测试（test）集群为例，切换到要作为测试集群的集群。

```
kubectl config use-context <cluster context name>
```

执行 `clusteradm join` 指令，并修改 <cluster_name> 为 test。

```
clusteradm join --hub-token <token_data> --hub-apiserver https://XXXXX:XXXX --cluster-name test

Deploying klusterlet agent. Please wait a few minutes then log onto the hub cluster and run the following command:

    clusteradm accept --clusters test
```

#### 2. 接受被管控集群的注册请求

切换到管控集群。

```
kubectl config use-context <hub cluster context name>
```

接受测试集群的注册请求。

```
clusteradm accept --clusters test
```

本文的例子需要有一个测试（test）集群和一个生产（prod）集群，你可以通过重复第 1 - 2 步来注册一个新的集群作为生产（prod）集群。

## 部署应用到不同的环境

应用部署计划 `multi-env-demo` 的部署工作流程为：首先将测试应用部署计划部署到测试集群，这时应用部署计划的工作流会停止，当检查资源部署状态正常后，恢复工作流，继续将资源部署到生产集群中。

```shell
cat <<EOF | kubectl apply -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: multi-env-demo
  namespace: default
spec:
  components:
    - name: podinfo-server
      type: webservice
      properties:
        image: stefanprodan/podinfo:5.2.1
        port: 9898
      traits:
        - type: expose
          properties:
            port:
              - 9898

  policies:
    - name: my-policies
      type: env-binding
      properties:
        envs:
          - name: test
            patch:
              components:
                - name: podinfo-server
                  type: webservice
                  properties:
                    image: stefanprodan/podinfo:6.0.0
                    port: 9898
            placement:
              clusterSelector:
                name: test

          - name: prod
            patch:
              components:
                - name: podinfo-server
                  type: webservice
                  properties:
                    image: stefanprodan/podinfo:5.1.3
                    port: 9898
                  traits:
                    - type: expose
                      properties:
                        port:
                          - 9898
                        type: LoadBalancer
            placement:
              clusterSelector:
                name: prod

  workflow:
    steps:
      - name: deploy-test
        type: multi-env
        properties:
          env: test
          policy: my-policies

      - name: manual-approval
        type: suspend

      - name: deploy-prod
        type: multi-env
        properties:
          env: prod
          policy: my-policies
EOF
```

### 检查应用部署计划状态

查看应用部署计划的状态：

```
kubectl get application multi-env-demo -o yaml
```

可以看到 `deploy-test` 步骤执行成功，表示应用部署计划成功部署到测试集群，并且执行到 `manual-approval` 步骤时，工作流被暂停执行了。

```yaml
...
  status: workflowSuspending
  workflow:
    ...
    stepIndex: 2
    steps:
    - name: deploy-test
      phase: succeeded
      resourceRef: {}
      type: multi-env
    - name: manual-approval
      phase: succeeded
      resourceRef: {}
      type: suspend
    suspend: true
    terminated: false
```

完成人工审核之后，你可以继续工作流。

```
vela workflow resume multi-env-demo
```

重新查看应用部署计划的状态：

```
kubectl get application multi-env-demo -o yaml
```

可以看到 `deploy-prod` 步骤执行成功，表示应用成功部署到了生产集群。

``` yaml
  ...
  status: running
  workflow:
    ...
    stepIndex: 3
    steps:
    - name: deploy-test
      phase: succeeded
      resourceRef: {}
      type: multi-env
    - name: manual-approval
      phase: succeeded
      resourceRef: {}
      type: suspend
    - name: deploy-prod
      phase: succeeded
      resourceRef: {}
      type: multi-env
    suspend: false
    terminated: true
```