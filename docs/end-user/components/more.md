---
title:  Want More?
---

Components in KubeVela are designed to be brought by users.

## 1. Get from capability center

KubeVela allows you to explore capabilities maintained by platform team.
There are two commands in kubectl vela plugin: `comp` and `trait`.

In case you haven't installed kubectl vela plugin: see [this](../../developers/references/kubectl-plugin#install-kubectl-vela-plugin).
### 1. list

For example, let's try to list all available components in a registry:

```shell
$ kubectl vela comp --discover
Showing components from registry: https://registry.kubevela.net
NAME              	REGITSRY	DEFINITION                 	
cloneset          	default	    clonesets.apps.kruise.io
kruise-statefulset	default	    statefulsets.apps.kruise.io
openfaas          	default	    functions.openfaas.com
````
Note that the `--discover` flag means show all components not in your cluster.

### 2. install
Then you can install a component like:

```shell
$ kubectl vela comp get cloneset
Installing component capability cloneset
Successfully install trait: cloneset                                                                                                 
```

### 3.verify

```shell
$ kubectl get componentdefinition  -n vela-system
NAME         WORKLOAD-KIND   DESCRIPTION
cloneset     CloneSet        Describes long-running, scalable, containerized services that have a stable network endpoint to receive external network traffic from customers. It was implemented by OpenKruise Cloneset.
...(other componentDefinition)

```

By default, the two commands will retrieve capabilities from [repo](https://registry.kubevela.net) maintained by KubeVela.

## 2. Designed by yourself 
Check below documentations about how to bring your own components to the system in various approaches.

- [Helm](../../platform-engineers/helm/component) - Helm chart is a natural form of component, note that you need to have a valid Helm repository (e.g. GitHub repo or a Helm hub) to host the chart in this case.
- [CUE](../../platform-engineers/cue/component) - CUE is powerful approach to encapsulate a component and it doesn't require any repository.
- [Simple Template](../../platform-engineers/kube/component) - Not a Helm or CUE expert? A simple template approach is also provided to define any Kubernetes API resource as a component. Note that only key-value style parameters are supported in this case.
- [Cloud Services](../../platform-engineers/cloud-services) - KubeVela allows you to declare cloud services as part of the application and provision them in consistent API.
