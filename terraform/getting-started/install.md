---
title: Install
description: Install terraform-controller through the KubeVela terraform addon or its Helm chart, then enable a cloud provider.
---

There are two ways in. On KubeVela, enable the `terraform` addon. Without KubeVela, or to pick the controller version yourself, install the Helm chart.

## With KubeVela: the terraform addon

```shell
vela addon enable terraform
```

The addon installs the `terraform-controller` chart into `vela-system` through FluxCD's Helm support (it enables the `fluxcd` addon first if it is missing).

:::note Which controller version the addon installs
The addon pins its chart version: addon 1.1.3, the current one in the catalog, installs terraform-controller v0.7.12, not the v0.9.1 that KubeVela 1.12 is built against. The addon has no parameter for the chart version. To run v0.9.1, install the chart directly, below. The [Versions](../versions.md) page has the details.
:::

The addon takes two parameters:

| Parameter | Default | Does |
| --- | --- | --- |
| `upgradeCRD` | `false` | Upgrade the `Configuration` and `Provider` CRDs when the addon is upgraded. Helm never does on its own: see [Upgrade](../operate/upgrade.md). |
| `values` | none | Helm values for the chart, as in [Configure](../operate/configure.md). |

```shell
vela addon enable terraform upgradeCRD=true
```

### Enable a cloud provider

Each cloud has a provider addon. It adds that cloud's component types, and a config template for its credentials.

```shell
vela addon list | grep terraform-
```

```console
terraform-alibaba  KubeVela  Kubernetes Terraform Controller for Alibaba Cloud                  [1.0.6, ...]  disabled
terraform-aws      KubeVela  Kubernetes Terraform Controller for AWS                            [1.0.3, ...]  disabled
terraform-azure    KubeVela  Kubernetes Terraform Controller for Azure                          [1.0.3, ...]  disabled
terraform-baidu    KubeVela  Kubernetes Terraform Controller Provider for Baidu Cloud           [1.0.3, ...]  disabled
terraform-ec       KubeVela  Kubernetes Terraform Controller Provider for Elastic Cloud         [1.0.2, ...]  disabled
terraform-gcp      KubeVela  Kubernetes Terraform Controller Provider for Google Cloud Platform [1.0.3, ...]  disabled
terraform-tencent  KubeVela  Kubernetes Terraform Controller Provider for Tencent Cloud         [1.0.4, ...]  disabled
terraform-ucloud   KubeVela  Kubernetes Terraform Controller Provider for UCloud                [1.0.3, ...]  disabled
```

```shell
vela addon enable terraform-<provider-name>
```

`vela addon` also disables, upgrades and shows the status of an addon.

### Authenticate the provider

The provider addons register config templates:

```shell
vela config-template list | grep terraform
```

Create a config from one. For AWS, with the keys set in your shell first (`read -rs AWS_SECRET_ACCESS_KEY`), so they stay out of your history:

```shell
vela config create aws -t terraform-aws name=aws AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID" AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY" AWS_DEFAULT_REGION=us-east-1
```

The config becomes a Terraform `Provider` named by `name`. Components use the Provider called `default` unless they, or their component type, set `providerRef`, so name your main one `default`, or set `providerRef` on each component.

Then [provision a cloud resource](../guides/consume-cloud-services.md).

## Without KubeVela: the Helm chart

The chart is published to the KubeVela chart repository, one chart version per controller release:

```shell
helm repo add kubevela https://kubevela.github.io/charts
helm repo update
helm search repo kubevela/terraform-controller --versions | head -4
```

```console
NAME                         	CHART VERSION	APP VERSION	DESCRIPTION
kubevela/terraform-controller	0.9.1        	0.9.1      	A Kubernetes Terraform controller
kubevela/terraform-controller	0.9.0        	0.9.0      	A Kubernetes Terraform controller
kubevela/terraform-controller	0.8.2        	0.8.2      	A Kubernetes Terraform controller
```

Install it, keeping the Terraform state in the controller's own namespace:

```shell
helm upgrade --install terraform-controller kubevela/terraform-controller \
  --version 0.9.1 --namespace terraform --create-namespace \
  --set backend.namespace=terraform --wait
```

```shell
kubectl get pods -n terraform
```

```console
NAME                                   READY   STATUS    RESTARTS   AGE
terraform-controller-d44c4bf5f-9bhjt   1/1     Running   0          13s
```

:::caution Set backend.namespace outside vela-system
`backend.namespace` is where the controller keeps each `Configuration`'s Terraform state, as a Secret. It defaults to `vela-system`, which only exists where KubeVela is installed. Installed anywhere else with the default, every `Configuration` stays in `ProvisioningAndChecking`: the Job's `terraform-init` container fails with `Error loading state: namespaces "vela-system" not found`.
:::

:::caution arm64 nodes
The chart's default `terraformImage`, `oamdev/docker-terraform:1.1.6`, is published for `linux/amd64` only. On an arm64 node (Apple silicon k3d or kind, Graviton) the Terraform Job never starts: its `terraform-init` container stays in `ImagePullBackOff` with `no match for platform in manifest`, and every Configuration sits in `ProvisioningAndChecking`. Where the node can run amd64 binaries under emulation (Docker Desktop can), point `terraformImage` at the amd64 image itself, by its platform digest:

```shell
--set terraformImage=oamdev/docker-terraform@sha256:defb733d94730dcd8e6ef77c764e9ed07314b59dab620633222c36528df0fa69
```

Otherwise, build an arm64 Terraform image and set that.
:::

Your cloud credentials then go into a `Provider` object: see [How It Works](../concepts/how-it-works.md#provider). For Terraform that needs no credentials, set `inlineCredentials: true` on the `Configuration`, as the [Quick Start](quick-start.md) does.

The chart's other settings are on [Configure](../operate/configure.md).
