---
title: 使用 OCM
---

[Open Cluster Management (OCM)](https://open-cluster-management.io/) 是一个强大的多集群管理工具，它可以让你的托管集群连接到集群的控制平面，甚至这些托管的集群并不能被控制平面直接访问到。它特别能处理托管集群和控制平面处于不同VPC的情况。

这篇文章主要介绍在 KubeVela 的环境下如何使用 OCM。

## 安装 OCM

OCM的安装可以通过命令`vela addon`来完成。但在 KubeVela 的环境下使用 OCM，有两个插件必须要安装。

```shell
vela addon enable ocm-hub-control-plane
`````

这个插件旨在提供 OCM 的基本功能。例如，你可以通过创建 OCM ManifestWorks 来直接分配资源。 但是目前 KubeVela 并不会使用 OCM 来管理应用。

```shell
vela addon enable ocm-gateway-manager-addon
```

安装第二个应用可以让 KubeVela 通过 cluster gateway 来使用 OCM的托管集群。

## 加入集群

你可以使用 `vela cluster join -t ocm`  命令来加入 OCM ManagedCluster。请注意， 相比较通过 `vela cluster join` 命令来加入集群，加入 OCM ManagedCluster 并不需要你的托管集群的 APIServer 可以直接被中心的控制平面访问到。 但是你必须保证你的托管集群可以访问中心控制平面的  KAS (kube-apiserver)。

```shell
# This command needs to use the kubeconfig of the control plane where KubeVela lives.  
$ vela cluster join managed-cluster.kubeconfig -t ocm --name ocm-cluster
Successfully prepared registration config.
Registration operator successfully deployed.
Registration agent successfully deployed.
Successfully found corresponding CSR from the agent.
Approving the CSR for cluster "ocm-cluster".              
Successfully add cluster ocm-cluster, endpoint: https://127.0.0.1:6443. 
```

## 检查集群状态

在运行命令后， 你可能需要几分钟时间来等待相关 OCM agents 就绪。

```shell
# Change ocm-cluster to your cluster name.
$ kubectl get managedclusteraddons -n ocm-cluster                                                    
NAME                     AVAILABLE   DEGRADED   PROGRESSING
cluster-proxy            True                   
managed-serviceaccount   True                   
cluster-gateway          True
```

> 假如任何 ManagedClusterAddons 不可用， 你可能需要检查所有 OCM 相关的 pod 是否都正常运行。可以随时在 [KubeVela Github Repo](https://github.com/kubevela/kubevela/) 提出 issues or discussions.

现在你可以通过命令 `vela cluster probe` 来验证插件的安装。
```shell
$ vela cluster probe ocm-cluster                                  
Connect to cluster ocm-cluster successfully.
ok
```

## 应用 KubeVela Application

很好！ 现在你可以在 KubeVela 环境下像使用普通集群一样使用已经加入的 OCM 托管集群。

```shell
$ cat <<EOF | vela up -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: example-app
  namespace: default
spec:
  components:
  - name: hello-world
    properties:
      image: crccheck/hello-world
    type: webservice
  policies:
  - name: ocm-cluster
    properties:
      clusters: ["ocm-cluster"]
    type: topology
EOF
```

```shell
$ vela status example-app
About:

  Name:         example-app                  
  Namespace:    default                      
  Created at:   2022-06-14 21:10:46 +0800 CST
  Status:       running                      

Workflow:

  mode: DAG
  finished: true
  Suspend: false
  Terminated: false
  Steps
  - id:vl17hfpjtv
    name:deploy-ocm-cluster
    type:deploy
    phase:succeeded 
    message:

Services:

  - Name: hello-world  
    Cluster: ocm-cluster  Namespace: default
    Type: webservice
    Healthy Ready:1/1
    No trait applied
```

## 参考

关于在 KubeVela 环境下使用 OCM 更多的信息，可以参与以下内容。
- [Open Cluster Management](https://open-cluster-management.io/) OCM 项目
- [ocm-hub-control-plane](https://github.com/kubevela/catalog/tree/master/addons/ocm-hub-control-plane) `ocm-hub-control-plane` KubeVela 插件
- [ocm-gateway-manager-addon](https://github.com/kubevela/catalog/tree/master/addons/ocm-gateway-manager-addon) `ocm-gateway-manager-addon` KubeVela 插件
- [KubeVela x OCM Demo](https://github.com/kubevela/samples/tree/master/12.Open_Cluster_Management_Demo). KubeVela 和 OCM 的演示