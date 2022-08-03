---
title: Working with OCM
---

[Open Cluster Management (OCM)](https://open-cluster-management.io/) is a powerful multi-cluster tool which allows you to connect your managed clusters to the control plane, even if the managed cluster is not directly accessible from the control plane. It is especially useful when your managed clusters and your control plane locate in different VPCs.

This section will introduce how to use OCM with KubeVela.

## Enable OCM

The installation of OCM is directly available through `vela addon`. There are two addons you need to install if you want to use KubeVela with OCM.

```shell
$ vela addon enable ocm-hub-control-plane
```

This addon allows you to use the basic capabilities provided by OCM. For example, you can create OCM ManifestWorks to dispatch resources directly. But KubeVela will not use OCM for its application management for now.

```shell
$ vela addon enable ocm-gateway-manager-addon
```

Enabling the second addon will allow you to let KubeVela use the underlying OCM managed clusters through cluster gateway.

## Join Cluster

You can use `vela cluster join -t ocm` command to join cluster through OCM ManagedCluster. Notice that, compared to normal `vela cluster join`, joining OCM ManagedCluster does not need your managed cluster APIServer to be accessible from the hub control plane. But you need to make sure your managed cluster could access the KAS (kube-apiserver) of the hub control plane.

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

## Check Cluster Status

After that, you need to wait for some time (usually several minutes) for all the related OCM agents to be ready.
```shell
# Change ocm-cluster to your cluster name.
$ kubectl get managedclusteraddons -n ocm-cluster                                                    
NAME                     AVAILABLE   DEGRADED   PROGRESSING
cluster-proxy            True                   
managed-serviceaccount   True                   
cluster-gateway          True
```
> If any ManagedClusterAddons failed to be available, you might need to check if all the OCM related pods are running healthy. Feel free to raise issues or discussions on [KubeVela Github Repo](https://github.com/kubevela/kubevela/).

Now you can validate everything is ready through `vela cluster probe`.
```shell
$ vela cluster probe ocm-cluster                                  
Connect to cluster ocm-cluster successfully.
ok
```

## Apply KubeVela Application

Perfect! You can now use the joined OCM managed cluster in KubeVela just as a normal cluster.
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

## Reference

For more information about using KubeVela with OCM, you could refer to the following materials.
- [Open Cluster Management](https://open-cluster-management.io/) The OCM project.
- [ocm-hub-control-plane](https://github.com/kubevela/catalog/tree/master/addons/ocm-hub-control-plane) The KubeVela addon of `ocm-hub-control-plane`.
- [ocm-gateway-manager-addon](https://github.com/kubevela/catalog/tree/master/addons/ocm-gateway-manager-addon) The KubeVela addon of `ocm-gateway-manager-addon`.
- [KubeVela x OCM Demo](https://github.com/kubevela/samples/tree/master/12.Open_Cluster_Management_Demo). The demo of KubeVela working with OCM.