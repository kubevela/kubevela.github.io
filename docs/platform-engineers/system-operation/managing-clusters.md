---
title: Managing Clusters
---

## Manage the cluster via UI

* Support connecting the exist kubernetes cluster.
* Support connecting the ACK cluster.

Users with cluster management permissions can enter the cluster management page to add or detach managed clusters.

![cluster-management](https://static.kubevela.net/images/1.3/cluster-management.jpg)

For connecting the ACK clusters, the platform will save some cloud info, Region, VPC, Dashboard Address, etc. When users use the cluster to create a Target, the cloud information is automatically assigned to the Target, which the cloud service applications can use.

## Manage the cluster via CLI

### vela cluster list

This command could list all clusters managed by KubeVela currently.
```bash
$ vela cluster list
CLUSTER         TYPE    ENDPOINT                
CLUSTER    	ALIAS	TYPE           	ENDPOINT                   	ACCEPTED	LABELS
local      	     	Internal       	-                          	true
ask-beijing	     	X509Certificate	https://*.*.*.*:6443	    true
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