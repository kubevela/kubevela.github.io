---
title: FluxCD
---

The `fluxcd` addon installs [FluxCD](https://fluxcd.io/) controllers and adds the `helm` and `kustomize` component types, so an Application can deploy Helm charts and Kustomize manifests that Flux fetches and keeps in sync.

## When to use it

Since v1.11, KubeVela deploys Helm charts natively with the built-in [`helmchart`](/docs/end-user/components/references#helmchart) component, without FluxCD. Use this addon when you need Kustomize, Git, OSS or OCI sources with polling, image update automation, or you already run Flux.

## What it installs

| Controller | What it does for you | CRDs it adds |
| --- | --- | --- |
| source-controller | Fetches charts and manifests from Git, Helm repositories, OCI registries and S3-compatible buckets, and polls them for changes. | `GitRepository`, `HelmRepository`, `HelmChart`, `Bucket`, `OCIRepository` |
| helm-controller | Installs and upgrades Helm releases for the `helm` component. | `HelmRelease` |
| kustomize-controller | Builds and applies Kustomize manifests for the `kustomize` component. | `Kustomization` |
| image-reflector-controller | Scans an image repository and picks the latest tag by your policy. | `ImageRepository`, `ImagePolicy` |
| image-automation-controller | Commits the picked image tag back to your Git repository. | `ImageUpdateAutomation` |

With `onlyHelmComponents=true` only the source-controller and helm-controller are installed.

## Install

```shell
vela addon enable fluxcd
```

To install only what the `helm` component needs:

```shell
vela addon enable fluxcd onlyHelmComponents=true
```

### Addon parameters

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| registry | Base URL for the images the FluxCD controllers use, for example `ghcr.io`. | string | false | |
| clusters | Clusters to install to. Leave empty to install to all clusters. | []string | false | |
| namespace | Namespace to install the controllers to. | string | false | `flux-system` |
| onlyHelmComponents | Install only the source-controller and helm-controller. | bool | false | `false` |
| helmControllerOptions | Extra arguments for the helm-controller. | []string | false | |
| sourceControllerOptions | Extra arguments for the source-controller. | []string | false | |
| kustomizeControllerOptions | Extra arguments for the kustomize-controller. | []string | false | |
| imageReflectorControllerOptions | Extra arguments for the image-reflector-controller. | []string | false | |
| imageAutomationControllerOptions | Extra arguments for the image-automation-controller. | []string | false | |

## Definitions

The addon adds these definitions:

| Definition name | Definition type | Description |
| --- | --- | --- |
| helm | ComponentDefinition | Deploys a Helm chart from a Helm repository, OCI registry, Git repository or S3-compatible bucket. |
| kustomize | ComponentDefinition | Deploys Kustomize manifests from a Git repository, S3-compatible bucket or OCI registry, and can update image tags in Git. |
| kustomize-json-patch | TraitDefinition | A list of JSON6902 patches to selected targets. |
| kustomize-patch | TraitDefinition | A list of strategic merge or JSON6902 patches to selected targets. |
| kustomize-strategy-merge | TraitDefinition | A list of strategic merge patches for the Kustomize config. |
| helm-labels | TraitDefinition | Patches the labels of Pods created by workloads in a Helm chart. Hidden in VelaUX. |

It also adds the `helm-repository` [config template](#helm-repository-config-template).

### helm

#### Parameters

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| repoType | Type of the source: `helm`, `git`, `oss` or `oci`. | string | false | `helm` |
| url | The Git or Helm repository URL, or the OSS endpoint. Git accepts HTTP/S or SSH addresses. | string | true | |
| chart | The chart name for a Helm or OCI repository; the relative path to the chart for a Git or OSS source, or to a packaged chart (for example `./charts/podinfo-1.2.3.tgz`). | string | true | |
| version | Chart version. | string | false | `*` |
| pullInterval | How often to check the repository or bucket, and the release, for updates. | string | false | `5m` |
| interval | How often to reconcile the Helm release. | string | false | `30s` |
| secretRef | Name of the Secret holding the credentials to pull from the source. | string | false | |
| timeout | Timeout for operations such as downloading the index or cloning the repository. | string | false | |
| installTimeout | Timeout for `helm install`. | string | false | `10m` |
| sourceName | Name of an existing source to use, instead of creating one. | string | false | |
| targetNamespace | Namespace to install the chart to. | string | false | |
| releaseName | Release name. | string | false | |
| retries | How many times to retry a failed install or upgrade. | int | false | `3` |
| values | Chart values. | map | false | |
| valuesFrom | References to ConfigMaps or Secrets holding chart values. See [valuesFrom](#valuesfrom). | []object | false | |
| valuesFiles | Values files to use instead of `values.yaml`, as paths relative to the source. Later files override earlier ones. | []string | false | |
| upgradeCRD | Create and replace the chart's CRDs on upgrade. | bool | false | `false` |
| git | Git source settings. See [git](#git). | object | false | |
| oss | OSS source settings, required when `repoType` is `oss`. See [oss](#oss). | object | false | |
| helmrepository | Helm repository settings. See [helmrepository](#helmrepository). | object | false | |

##### valuesFrom

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| kind | Kind of the object holding the values: `Secret` or `ConfigMap`. | string | true | |
| name | Name of the object, in the same namespace as the Application. | string | true | |
| valuesKey | The data key holding the values. | string | false | `values.yaml` |
| targetPath | YAML dot notation path to merge the value at. When set, `valuesKey` must hold a single flat value. | string | false | |
| optional | Ignore the reference if the object is not found. | bool | false | |

##### git

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| branch | Git branch to check out and watch. | string | false | `main` |
| commit | Git commit to check out. Takes precedence over every other reference field. | string | false | |
| name | Git reference name to check out. Takes precedence over `branch`, `tag` and `semver`. | string | false | |
| semver | Semver expression matched against tags. Takes precedence over `tag`. | string | false | |
| tag | Git tag to check out. Takes precedence over `branch`. | string | false | |

##### oss

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| bucketName | The bucket name. | string | true | |
| provider | `generic` for MinIO, Amazon S3, Google Cloud Storage and Alibaba Cloud OSS; `aws`, `azure` or `gcp` to take credentials from the cloud provider when `secretRef` is not set. | string | false | `generic` |
| region | The bucket region. | string | false | |

##### helmrepository

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| provider | OIDC provider for authentication: `generic`, `aws`, `azure` or `gcp`. Use `generic` for public repositories or static credentials. | string | false | `generic` |

#### Examples

These examples all deploy the [podinfo](https://github.com/stefanprodan/podinfo) chart, so you can compare the sources.

From a Helm repository:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: podinfo
spec:
  components:
    - name: podinfo
      type: helm
      properties:
        repoType: helm
        url: https://stefanprodan.github.io/podinfo
        chart: podinfo
        version: "6.*"
        values:
          replicaCount: 2
```

From an OCI registry:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: podinfo-from-oci
spec:
  components:
    - name: podinfo
      type: helm
      properties:
        repoType: oci
        url: oci://ghcr.io/stefanprodan/charts
        chart: podinfo
        version: "6.*"
```

From an OSS bucket, with the packaged chart uploaded to it:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: podinfo-from-oss
spec:
  components:
    - name: podinfo
      type: helm
      properties:
        repoType: oss
        # required if the bucket is private
        secretRef: bucket-secret
        url: oss-cn-beijing.aliyuncs.com
        chart: ./chart/podinfo-6.5.0.tgz
        oss:
          bucketName: <your-bucket>
```

From a Git repository:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: podinfo-from-git
spec:
  components:
    - name: podinfo
      type: helm
      properties:
        repoType: git
        url: https://github.com/stefanprodan/podinfo
        chart: ./charts/podinfo
        git:
          # podinfo's default branch; the definition defaults to main
          branch: master
```

### kustomize

#### Parameters

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| repoType | Type of the source: `git`, `oss` or `oci`. | string | false | `git` |
| url | The Git repository URL, OSS endpoint or OCI repository. Git accepts HTTP/S or SSH addresses. | string | true | |
| path | Path to the directory holding `kustomization.yaml`, or the plain YAML files to generate one for. | string | true | |
| pullInterval | How often to check the source for updates, and to reconcile the Kustomization. | string | false | `5m` |
| secretRef | Name of the Secret holding the credentials for the source. | string | false | |
| timeout | Timeout for operations such as cloning the repository. | string | false | |
| sourceName | Name of an existing source to use, instead of creating one. | string | false | |
| targetNamespace | Sets or overrides the namespace of the manifests. | string | false | |
| prune | Delete objects that were applied before and are no longer in the source. | bool | false | `true` |
| suspend | Suspend later Kustomize runs. A run that has started is not stopped. | bool | false | `false` |
| force | Recreate objects when a patch fails on an immutable field. | bool | false | `false` |
| decryption | Decrypt secrets in the manifests. See [decryption](#decryption). | object | false | |
| git | Git source settings. See [git](#git). | object | false | |
| oss | OSS source settings, required when `repoType` is `oss`. See [oss](#oss); `provider` takes `generic` or `aws` here. | object | false | |
| oci | OCI source settings. See [oci](#oci). | object | false | |
| imageRepository | Update image tags in Git when a new image is pushed. See [imageRepository](#imagerepository). | object | false | |

##### decryption

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| provider | Decryption provider, for example `sops`. | string | true | |
| secretRef.name | Name of the Secret holding the decryption keys. | string | true | |

##### oci

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| provider | OIDC provider for authentication: `generic`, `aws`, `azure` or `gcp`. | string | false | `generic` |
| tag | Image tag to pull. | string | false | |
| semver | Semver expression matched against tags. Takes precedence over `tag`. | string | false | |
| digest | Image digest to pull. Takes precedence over every other field. | string | false | |

##### imageRepository

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| image | The image to watch, for example `ghcr.io/stefanprodan/podinfo`. | string | true | |
| policy | How to pick the latest tag. See [policy](#policy). | object | true | |
| secretRef | For a private registry, a Secret created with `kubectl create secret docker-registry`. | string | false | |
| filterTags | Only consider tags matching a pattern. See [filterTags](#filtertags). | object | false | |
| commitMessage | Text added to the commit message of each update. | string | false | |
| interval | How often to scan the image repository. | string | false | `5m` |

###### policy

Set one of these.

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| alphabetical.order | `asc` picks the last tag in alphabetical order (Z of A to Z), `desc` the first. | string | false | |
| numerical.order | `asc` picks the highest number, `desc` the lowest. | string | false | |
| semver.range | Picks the highest tag in the semver range, for example `>=1.0.0 <2.0.0`. | string | false | |

###### filterTags

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| pattern | Regular expression a tag must match. | string | false | |
| extract | Capture group to extract from `pattern` before the tags are compared, for example `$ts`. | string | false | |

#### Examples

From a Git repository (podinfo's own Kustomize manifests):

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: podinfo-kustomize
spec:
  components:
    - name: podinfo
      type: kustomize
      properties:
        repoType: git
        url: https://github.com/stefanprodan/podinfo
        git:
          # podinfo's default branch; the definition defaults to main
          branch: master
        path: ./kustomize
```

From an OSS bucket. If the bucket needs credentials, create a Secret first:

```shell
kubectl create secret generic bucket-secret --from-literal=accesskey=<your-ak> --from-literal=secretkey=<your-sk>
```

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: podinfo-kustomize-from-oss
spec:
  components:
    - name: podinfo
      type: kustomize
      properties:
        repoType: oss
        # required if the bucket is private
        secretRef: bucket-secret
        url: oss-cn-beijing.aliyuncs.com
        oss:
          bucketName: <your-bucket>
        path: ./app/prod/
```

With image update automation. Flux watches the image, and when a tag matching the policy appears it commits the new tag to the `path` in your repository, then deploys it. The repository needs a Secret with write access, and the image fields in your YAML need Flux's setter marker; see [GitOps with FluxCD](/docs/end-user/gitops/fluxcd) for the full walkthrough.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: podinfo-image-automation
spec:
  components:
    - name: podinfo-image-automation
      type: kustomize
      properties:
        repoType: git
        url: https://github.com/<your-org>/<your-repo>
        # a Secret with write access to the repository
        secretRef: git-secret
        git:
          branch: main
        path: ./app/prod/
        imageRepository:
          image: ghcr.io/stefanprodan/podinfo
          policy:
            semver:
              range: ">=6.0.0 <7.0.0"
          commitMessage: "Image: {{range .Updated.Images}}{{println .}}{{end}}"
```

## helm-repository config template

The addon adds a `helm-repository` config template, for the credentials of a private Helm repository. It creates a Secret that VelaUX offers when you pick a chart.

| Name | Description | Type | Required | Default |
| --- | --- | --- | --- | --- |
| url | The URL of the Helm repository. | string | true | |
| username | Username for basic auth. | string | false | |
| password | Password for basic auth. | string | false | |
| caFile | The repository's CA certificate, not base64 encoded. | string | false | |

```shell
vela config create my-charts -t helm-repository url=https://charts.example.com username=<user> password=<password>
```
