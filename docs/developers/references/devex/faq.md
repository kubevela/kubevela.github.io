---
title:  FAQ
---

## Common Questions

### Who are using KubeVela?

The organisations that have adopted KubeVela are listed in [ADOPTERS.md](https://github.com/kubevela/community/blob/main/ADOPTERS.md).

### What is the difference between KubeVela and project-X ?

Refer to the [comparison details](../../../getting-started/introduction.md#kubevela-vs-other-software).

### Do you support Crossplane? What's the difference between terraform and Crossplane in KubeVela?

KubeVela natively supports Crossplane as they're already CRDs, while terraform was not a CRD controller, so the KubeVela community authored a [terraform controller](https://github.com/kubevela/terraform-controller) for integration. You can choose any of them as you wish. 


### What's the relationship between KubeVela and OAM? What will KubeVela mainly focus?

* OAM(Open Application Model) is the model behind KubeVela, it provides a platform-agnostic application model including the best practices and methodology for different vendors to follow. The evolution of the model depends primarily on the practices of KubeVela currently.
* KubeVela is the control plane running on Kubernetes, it works as a CRD controller and brings OAM model into your Cloud Native PaaS along with lots of addon capabilities. KubeVela will mainly focus on application delivery, the goal is to make deploying and operating applications across today's hybrid, multi-cloud environments easier, faster and more reliable.

## Common Issues

### `vela install` installed an older version than I expected

`vela install` installs the KubeVela version that matches the CLI, so a 1.11 `vela` installs KubeVela 1.11. Check both with `vela version`: `CLI Version` is the CLI, `Core Version` is what runs in the cluster. Install the CLI of the release you want, or name the version:

```bash
vela install --version v1.12.0
```

### VelaUX doesn't show sources or module components

The `velaux` addon in the official registry is VelaUX v1.9.5, built before KubeVela 1.12. It runs against 1.12, but it doesn't show the features 1.12 added, such as sources and module components. Use the `vela` CLI for those, for example `vela status <app-name>`.

### My Application is refused with "source expressions are not enabled"

The full message is:

```
source expressions are not enabled on this cluster; an operator enables them with the EnableCelExpressions feature gate
```

Sources and `$( )` expressions are alpha and off by default. An operator turns them on with the vela-core chart's `featureGates.enableCelExpressions` value, keeping the version already installed:

```bash
helm upgrade kubevela kubevela/vela-core -n vela-system --reuse-values \
  --version <installed version> \
  --set featureGates.enableCelExpressions=true
```

With the gate on, each Application still opts in with the annotation `app.oam.dev/cel-expressions: "true"`, unless the operator also sets `featureGates.requireCelExpressionOptIn=false`. Without the annotation, the error tells you to add it.

### Pods stay `Pending` with "Too many pods"

A single-node local cluster (k3d, kind, minikube) runs at most 110 pods on its node. Addons and test runs that were stopped part way leave pods behind, so new ones wait. Find what is using the node and delete what you no longer need:

```bash
kubectl get pods -A --no-headers | wc -l
kubectl get namespaces
```

For more room, create the cluster with more nodes, for example `k3d cluster create --agents 2`.

### Why don't the kubevela.net addresses work?

The `kubevela.net` domain is gone, so every address on it fails. Use these instead:

Content | old | new
--- | --- | ---
Documentation | https://kubevela.net | https://kubevela.io
Image Hub | "hub.kubevela.net" | "docker.io" or "ghcr.io/kubevela"
Helm charts | https://charts.kubevela.net/core | https://kubevela.github.io/charts
Official Addon Registry | https://addons.kubevela.net | https://kubevela.github.io/catalog/official
Experimental Addon Registry | - | https://kubevela.github.io/catalog/experimental

The move happened in v1.9; the [v1.8 to v1.9 upgrade guide](../../../upgrade-guides/v1.9/index.md) has the commands to update your addon registry.

VelaD isn't affected, but note that its last release is v1.9.5, which installs KubeVela 1.9.5. For a newer KubeVela, use `vela install` or Helm.

### You have reached rate limit for Docker Image Registry

By default, the community use images from docker registry for installation. You can use the following alternatives:

1. You can use github container registry, check the [list of official images](https://github.com/orgs/kubevela/packages) for more details. There're two kinds of format:

* Before v1.4.1, the image format is `ghcr.io/<git-repo>/vela-core:<version>`, e.g. "ghcr.io/kubevela/kubevela/vela-core:latest".
* After v1.4.1, the image format has changed to `ghcr.io/kubevela/<align with docker hub>`, e.g. "ghcr.io/kubevela/oamdev/vela-core:latest".

2. If you insist on using Docker registry, you may increase the limit by authenticating and upgrading: https://www.docker.com/increase-rate-limit .

### How to change the admin password of VelaUX?

If you're using v1.3, the default password is in the secret:

```bash
kubectl get secret admin -n vela-system
```

If you're using v1.4 to v1.7, the default password is `VelaUX12345`, and you must change it after the first login.

From v1.8, there is no default password: the first time you open VelaUX, it asks you to create the administrator account (a username, a password and an email). To change the password later, use the user settings in VelaUX.

If you forget it and another administrator exists, they can reset your password from the Users page.

If the administrator is the only user, you can delete it and restart VelaUX. With no users left, the next time you open VelaUX it asks you to create the administrator account again. Only do this when the administrator is the only user: VelaUX offers the first-visit setup only when there are no users at all, so on an install with other users, deleting the administrator leaves no way to create a new one.

```bash
# Find the administrator's ConfigMap: usr- followed by the username
kubectl get cm -n kubevela | grep '^usr-'

# Delete it, here for an administrator called admin: use the name listed above.
# With MongoDB as the datastore, delete the user from MongoDB instead.
kubectl delete cm usr-admin -n kubevela

# Restart VelaUX
kubectl delete pod -l app.oam.dev/component=velaux-server -n vela-system
```

### How can I build my own addon registry?

See [Build your Own Registry](/addons/developer/addon-registry).

### How does KubeVela support stateful workload?

We recommend you to use [CRD Operator](https://kubernetes.io/docs/concepts/extend-kubernetes/operator/) for stateful workload. If you just want to use StatefulSet, you can refer to [this blog](https://kubevela.io/blog/2022/05/30/abstraction-kubevela) to build your own easily.

### How to deal with slow multi-cluster requests?

There are several common possible reasons for slow multi-cluster requests.

1. Your managed cluster is far from your hub cluster. For example, one in Beijing and another one in London. This is hard to speed up. You might need to find methods to build stable network connections between them. KubeVela currently cannot help it.

2. Your cluster-gateway uses version &lt;= 1.3.2. There is a rate limiter in cluster-gateway in old versions. Therefore, if you have lots of multi-cluster requests, they will be blocked at cluster-gateway. Upgrading cluster-gateway to a newer version could solve it.

3. Your cluster-gateway hits the resource limits. For example, the CPU/Memory usage is high. This could happen if you have lots of clusters. You can raise the resource configuration for the cluster-gateway.