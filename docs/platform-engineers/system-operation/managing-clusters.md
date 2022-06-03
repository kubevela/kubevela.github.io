---
title: Lifecycle of Managed Cluster
---

This section will introduce the lifecycle of managed clusters.

## Create clusters

KubeVela can generally adopt any Kubernetes cluster as managed cluster, the control plane won't install anything to your managed cluster unless you have enable any addons.

If you don't have any clusters, you can refer to [VelaD](https://github.com/kubevela/velad) to create one:

```
velad install --name <cluster-name> --cluster-only
```

## Join Clusters

You can simply join an existing cluster into KubeVela by specifying its KubeConfig as below

```shell script
vela cluster join <your kubeconfig path>
```

It will use the field `context.cluster` in KubeConfig as the cluster name automatically,
you can also specify the name by `--name` parameter. For example:

```shell
$ vela cluster join beijing.kubeconfig --name beijing
$ vela cluster join hangzhou-1.kubeconfig --name hangzhou-1
$ vela cluster join hangzhou-2.kubeconfig --name hangzhou-2
```

## List clusters

After clusters joined, you could list all clusters managed by KubeVela.

```bash
$ vela cluster list
CLUSTER                 TYPE            ENDPOINT                ACCEPTED        LABELS
local                   Internal        -                       true                  
cluster-beijing         X509Certificate <ENDPOINT_BEIJING>      true                  
cluster-hangzhou-1      X509Certificate <ENDPOINT_HANGZHOU_1>   true                  
cluster-hangzhou-2      X509Certificate <ENDPOINT_HANGZHOU_2>   true                  
```

> By default, the hub cluster where KubeVela locates is registered as the `local` cluster. You can use it like a managed cluster in spite that you cannot detach it or modify it.

## Label your cluster

You can also give labels to your clusters, which helps you select clusters for deploying applications.

```bash
$ vela cluster labels add cluster-hangzhou-1 region=hangzhou
$ vela cluster labels add cluster-hangzhou-2 region=hangzhou
$ vela cluster list
CLUSTER                 TYPE            ENDPOINT                ACCEPTED        LABELS
local                   Internal        -                       true                  
cluster-beijing         X509Certificate <ENDPOINT_BEIJING>      true                  
cluster-hangzhou-1      X509Certificate <ENDPOINT_HANGZHOU_1>   true            region=hangzhou
cluster-hangzhou-2      X509Certificate <ENDPOINT_HANGZHOU_2>   true            region=hangzhou
```

## Detach your cluster 

You can also detach a cluster if you do not want to use it anymore.

```shell script
$ vela cluster detach beijing
```

> It is dangerous to detach a cluster that is still in-use. But if you want to do modifications to the held cluster credential, like rotating certificates, it is possible to do so. 

## Rename a cluster 

This command can rename cluster managed by KubeVela.

```shell script
$ vela cluster rename cluster-prod cluster-production
```

## Next

- Manage cluster with [UI console](../../how-to/dashboard/target/overview).