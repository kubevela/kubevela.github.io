---
title: Lifecycle of Managed Cluster
---

This section will introduce the lifecycle of managed clusters.

## Create clusters

KubeVela can generally adopt any Kubernetes cluster as managed cluster, the control plane won't install anything to your managed cluster unless you have enable any addons.

If you don't have any clusters, you can refer to [VelaD](https://github.com/kubevela/velad/blob/main/docs/02.multicluster.md) to create one for demo:

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
CLUSTER         ALIAS   TYPE            ENDPOINT                ACCEPTED        LABELS
local                   Internal        -                       true                  
beijing                 X509Certificate <ENDPOINT_BEIJING>      true                  
hangzhou-1              X509Certificate <ENDPOINT_HANGZHOU_1>   true                  
hangzhou-2              X509Certificate <ENDPOINT_HANGZHOU_2>   true                  
```

> By default, the hub cluster where KubeVela locates is registered as the `local` cluster. You can use it like a managed cluster in spite that you cannot detach it or modify it.

## Label your cluster

You can also give labels to your clusters, which helps you select clusters for deploying applications.

```bash
$ vela cluster labels add hangzhou-1 region=hangzhou
$ vela cluster labels add hangzhou-2 region=hangzhou
$ vela cluster list
CLUSTER         ALIAS   TYPE            ENDPOINT                ACCEPTED        LABELS
local                   Internal        -                       true                  
beijing                 X509Certificate <ENDPOINT_BEIJING>      true                  
hangzhou-1              X509Certificate <ENDPOINT_HANGZHOU_1>   true            region=hangzhou
hangzhou-2              X509Certificate <ENDPOINT_HANGZHOU_2>   true            region=hangzhou
```

## Detach your cluster 

You can also detach a cluster if you do not want to use it anymore.

```shell script
$ vela cluster detach beijing
```

> Detaching drops the cluster from every ResourceTracker, then deletes its credentials. What KubeVela deployed there keeps running but is no longer tracked, so deleting the Application won't remove it, and Applications that still place to the cluster fail their deploy step. Check nothing is deployed there first: `kubectl get resourcetrackers -o json | jq -r '.items[] | select(any(.spec.managedResources[]?; .cluster == "<cluster>")) | .metadata.name'`

## Rotate a cluster's credentials

To replace the credentials KubeVela holds for a cluster, for example after rotating its certificates, join it again under the same name with the new kubeconfig. KubeVela asks before it overwrites the existing credentials (pass `-y` to skip the question), and Applications keep deploying to the cluster without being detached:

```shell
vela cluster join beijing-new.kubeconfig --name beijing
```

Then check KubeVela can reach the cluster with the new credentials:

```shell
$ vela cluster probe beijing
Connect to cluster beijing successfully.
ok
```

## Probe a cluster

`vela cluster probe` calls the cluster's `/healthz` endpoint through KubeVela, the same way KubeVela reaches the cluster to deploy. Use it to check a cluster is reachable after joining it or changing its credentials.

```shell
vela cluster probe hangzhou-1
```

## Give a cluster an alias

An alias is a display name for a cluster, shown in the `ALIAS` column of `vela cluster list`. The cluster's name, which Applications use, stays the same.

```shell
vela cluster alias hangzhou-1 hz-primary
```

## Rename a cluster 

This command can rename cluster managed by KubeVela.

```shell script
$ vela cluster rename cluster-prod cluster-production
```

## Next

- Manage cluster with [UI console](/velaux/guides/delivery/targets).
- See the [`vela cluster` reference](../../cli/vela_cluster.md) for every subcommand and flag, including `labels del`, `export-config` and the `join` flags `--labels`, `--create-namespace` and `-t ocm`.