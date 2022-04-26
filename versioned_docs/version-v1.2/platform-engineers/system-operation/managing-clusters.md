---
title: Managing Clusters
---

Users could manage clusters in KubeVela through a list of Vela CLI commands.

### vela cluster list

This command could list all clusters managed by KubeVela currently.
```bash
$ vela cluster list
CLUSTER         TYPE    ENDPOINT                
cluster-prod    tls     https://47.88.4.97:6443 
cluster-staging tls     https://47.88.7.230:6443
```

### vela cluster join

This command can join new cluster into KubeVela and name it as `cluster-prod`. The joined cluster can be used in [Multi-Environment Deployment](../../end-user/policies/envbinding).

```shell script
$ vela cluster join example-cluster.kubeconfig --name cluster-prod
```

### vela cluster detach

This command can be used to detach cluster from KubeVela.

```shell script
$ vela cluster detach cluster-prod
```

### vela cluster rename

This command can rename cluster managed by KubeVela.

```shell script
$ vela cluster rename cluster-prod cluster-production
```
