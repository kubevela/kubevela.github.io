---
title: 集群管理
---

KubeVela 多集群功能中的集群管理是通过 Vela CLI 的一系列相关命令完成的。

### vela cluster list

该命令可列出当前 KubeVela 正在管理的所有子集群。
```bash
$ vela cluster list
CLUSTER         TYPE    ENDPOINT                
cluster-prod    tls     https://47.88.4.97:6443 
cluster-staging tls     https://47.88.7.230:6443
```

### vela cluster join

该命令可将已有的子集群通过 kubeconfig 文件加入到 KubeVela 中，并将其命名为 cluster-prod，供[多环境部署](../../end-user/policies/envbinding)使用。

```shell script
$ vela cluster join example-cluster.kubeconfig --name cluster-prod
```

### vela cluster detach

该命令可用来将 KubeVela 正在管理的子集群移除。

```shell script
$ vela cluster detach cluster-prod
```

### vela cluster rename

该命令可用来重命名 KubeVela 正在管理的子集群。

```shell script
$ vela cluster rename cluster-prod cluster-production
```
