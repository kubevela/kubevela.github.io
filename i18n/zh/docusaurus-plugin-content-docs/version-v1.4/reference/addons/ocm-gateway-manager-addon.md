---
title: OCM Cluster-Gateway Manager
---

OCM Cluster-Gateway Manager 插件在管理集群中安装了一个 operator 组件，帮助管理员通过自定义资源 ClusterGatewayConfiguration 轻松操作集群网关实例的配置。 *警告*：此插件将在首次安装时重新启动集群网关实例。

## Cluster-Gateway Manager 可以做什么？

它可以在以下几个方面来帮助我们：

* 自动轮换集群网关服务器的 TLS 证书。
* 自动发现新集群。
* 结构化集群网关的组件配置。
* 管理集群网关访问每个集群的“出口认证”。

请注意，由 cluster-gateway 代理的请求将使用`open-cluster-management-managed-serviceaccount/cluster-gateway`的身份访问托管集群，并且默认情况下具有 cluster-admin 权限，因此请注意这一点。


###  如何确定插件是正常运转的？

运行以下命令来检查插件的健康状况：

```shell
$ kubectl -n <cluster> get managedclusteraddon
kubectl get managedclusteraddon -A
NAMESPACE   NAME                     AVAILABLE   DEGRADED   PROGRESSING
<cluster>   cluster-gateway          True                   
<cluster>   cluster-proxy            True                   
<cluster>   managed-serviceaccount   True 
```

如果一次要浏览的集群太多，请通过下面的命令来安装二进制命令`clusteradm`：

```shell
curl -L https://raw.githubusercontent.com/open-cluster-management-io/clusteradm/main/install.sh | bash
```

然后通过运行下面的命令来获取多集群插件状态：

```shell
$ clusteradm get addon
<ManagedCluster>
└── managed1
    └── cluster-gateway
    │   ├── <Status>
    │   │   ├── Available -> true
    │   │   ├── ...
    │   ├── <ManifestWork>
    │       └── clusterrolebindings.rbac.authorization.k8s.io
    │       │   ├── open-cluster-management:cluster-gateway:default (applied)
    │       └── ...
    └── cluster-proxy
    │   ├── <Status>
    │   │   ├── Available -> true
    │   │   ├── ...
    │   ├── <ManifestWork>
    │       └── ...
    └── managed-serviceaccount
        └── <Status>
        │   ├── Available -> true
        │   ├── ...
        └── <ManifestWork>
            └── ...
```

### ClusterGatewayConfiguration API 配置示例

你可以通过以下命令来查看或编辑集群网关部署的整体配置信息：

```shell
$ kubectl get clustergatewayconfiguration -o yaml
apiVersion: v1
kind: List
items:
- apiVersion: proxy.open-cluster-management.io/v1alpha1
  kind: ClusterGatewayConfiguration
  metadata: ...
  spec:
    egress:
      clusterProxy:
        credentials:
          namespace: open-cluster-management-addon
          proxyClientCASecretName: proxy-server-ca
          proxyClientSecretName: proxy-client
        proxyServerHost: proxy-entrypoint.open-cluster-management-addon
        proxyServerPort: 8090
      type: ClusterProxy
    image: oamdev/cluster-gateway:v1.1.11
    installNamespace: vela-system
    secretManagement:
      managedServiceAccount:
        name: cluster-gateway
      type: ManagedServiceAccount
    secretNamespace: open-cluster-management-credentials
```
