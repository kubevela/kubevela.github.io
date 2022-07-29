---
title: FluxCD
---

This addon is built based [FluxCD](https://fluxcd.io/)

## install

```shell
vela addon enable fluxcd
```


If you only want to deploy the helm application with fluxcd addon, you can execute the following command to enable only helm related components.

```shell
$ vela addon enable fluxcd onlyHelmComponents=true
```

## Definitions

The following definitions will be enabled after the installation of fluxcd addon.

|DEFINITION NAME                         |DEFINITION TYPE           |DEFINITION DESCRIPTION|
|    :----:   |          :----: | ---|
|helm                                    |ComponentDefinition       |helps to deploy a helm chart from git repo, helm repo or S3 compatible bucket|
|kustomize                               |ComponentDefinition       |helps to deploy a kustomize style artifact and GitOps capability to watch changes from git repo or image registry|
|kustomize-json-patch                    |TraitDefinition           |A list of JSON6902 patch to selected target|
|kustomize-patch                         |TraitDefinition           |A list of StrategicMerge or JSON6902 patch to selected target|
|kustomize-strategy-merge                |TraitDefinition           |A list of strategic merge to kustomize config

### helm

#### Parameters

| Parameters      | Description                                                                                                                                                                                                                                                                                                                                                              | Example                            |
| --------------- | ----------- | ---------------------------------- |
| repoType        | required, indicates the type of repository, should be "helm","git", "oss", or "oci".                                                                                                                                                                                                                                                                                             | Helm                               |
| pullInterval    | optional, the interval at which to check for repository/bucket and release updates, default to 5m                                                                                                                                                                                                                                                                        | 5m                                 |
| url             | required, the Git or Helm repository URL, OSS endpoint, accept HTTP/S or SSH address as git url                                                                                                                                                                                                                                                                          | https://charts.bitnami.com/bitnami |
| secretRef       | optional, the name of the Secret object that holds the credentials required to pull the repo. The username and password fields must be included in the HTTP/S basic authentication Secret. For TLS the secret must contain a certFile and keyFile, and/or caCert fields. For TLS authentication, the secret must contain a certFile / keyFile field and/or caCert field. | sec-name                           |
| timeout         | optional, the timeout for operations like download index/clone repository                                                                                                                                                                                                                                                                                                | 60s                                |
| chart           | required, the relative path to helm chart for git/oss source. The chart name for helm resource                                                                                                                                                                                                                                                                           | redis-cluster                      |
| version         | optional, chart version, * by default                                                                                                                                                                                                                                                                                                                                    | 6.2.7                              |
| targetNamespace | optional, the namespace to install chart, decided by chart itself                                                                                                                                                                                                                                                                                                        | your-ns                            |
| releaseName     | optional, release name after installed                                                                                                                                                                                                                                                                                                                                   | your-rn                            |
| values          | optional, override the Values.yaml inchart, using for the rendering of Helm                                                                                                                                                                                                                                                                                              |                                    |
| installTimeout  | optional, the timeout for operation `helm install`, and 10 minutes by default                                                                                                                                                                                                                                                                                            | 20m                                |
| interval        | optional, the  Interval at which to reconcile the Helm release, default to 30s                                                                                                                                                                                                                                                                                           | 1m                                 |
| oss             | optional, The [oss](#OSS) source configuration                                                                                                        |                             |
| git             | optional, The [git](#OSS) source configuration                                                                                                        | dev                         |

##### OSS

| Parameters     | Description                                                                                                                                           | Example                     |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| bucketName | required, bucket name                                                                                                                                 | your-bucket                 |
| provider   | optional, Generic or aws, if you get the certificate from aws EC2, fill in aws. The default is generic.                                               | generic                     |
| region     | optional, bucket region                                                                                                                               |                             |

##### Git

| Parameters     | Description                                                                                                                                           | Example                     |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| branch      | optional, Git branch, master by default                                                                                                               | your-branch                 |


#### Example

You can create an application like below to deploy a helm chart which stored in helm repository.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: helm-redis
spec:
  components:
    - name: redis
      type: helm
      properties:
        repoType: "helm"
        url: "https://charts.bitnami.com/bitnami"
        chart: "redis"
        version: "16.8.5"
        values: 
          master:
            persistence:
              size: 16Gi
          replica:
            persistence:
              size: 16Gi
```

If your helm chart is stored in OCI registry, you can create the application like this:

***Note***: Please guarantee your fluxcd addon version >= v1.3.1

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: oci-app
  namespace: default
spec:
  components:
    - name: test-oci
      type: helm
      properties:
        repoType: "oci"
        url: oci://ghcr.io/stefanprodan/charts
        chart: podinfo
        version: '6.1.*'
```

If your helm chart is stored in OSS, you can create the application like this:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: bucket-app
spec:
  components:
    - name: bucket-comp
      type: helm
      properties:
        repoType: oss
        # required if bucket is private
        secretRef: bucket-secret
        chart: ./chart/podinfo-5.1.3.tgz
        url: oss-cn-beijing.aliyuncs.com
        oss:
            bucketName: definition-registry
```

If your helm chart stored in git, you can create the application like this:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
   name: app-delivering-chart
spec:
   components:
     - name: terraform-controller
       type: helm
       properties:
          repoType: git
          url: https://github.com/oam-dev/terraform-controller
          chart: ./chart
          git:
          	branch: master
```

### kustomize

#### Parameters

| Parameters     | Description                                                                                                                                           | Example                     |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| repoType       | required, indicates the type of repository, should be "helm","git" or "oss".                                                                          | oss                         |
| pullInterval   | optional, Synchronize with Git repository, and the time interval between tuning helm release. The default value is 5m (5 minutes）                    | 10m                         |
| url            | required, bucket's endpoint, no need to fill in with scheme                                                                                           | oss-cn-beijing.aliyuncs.com |
| secretRef      | optional, Save the name of a Secret, which is the credential to read the bucket. Secret contains accesskey and secretkey fields                       | sec-name                    |
| timeout        | optional, The timeout period of the download operation, the default is 20s                                                                            | 60s                         |
| path           | required, The directory containing the kustomization.yaml file, or the directory containing a set of YAML files (used to generate kustomization.yaml) | ./prod                      |
| oss            | optional, The [oss](#OSS) source configuration                                                                                                        |                             |
| git            | optional, The [git](#OSS) source configuration                                                                                                        |                             |
| imageRepository| optional, The image [repository](#Image Repository) for automatically update image to git                                                             |                             |

##### Image Repository

| Parameter         | Required | Description                                                                                                                                                                           | Example                                            |
| ------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| image     | required     | The image url                                                                                                                                                 | oamdev/vela-core                                             |
| secretRef     | optional     | If it's a private image registry, use `kubectl create secret docker-registry` to create the secret                                                                                                                                                 | my-secret                                             |
| policy        | optional     | [Policy](#Image policy) gives the particulars of the policy to be followed in selecting the most recent image.        |
| filterTags    | optional      | [FilterTags](#FilterTags) enables filtering for only a subset of tags based on a set of rules. If no rules are provided, all the tags from the repository will be ordered and compared.                                                                                                                       | $timestamp                                             |
| commitMessage     | optional      | Use for more commit message


###### Image policy

| Parameter         | Required | Description                                                                                                                                                                           | Example                                            |
| ------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| alphabetical.order     | optional     | Order specifies the sorting order of the tags. Given the letters of the alphabet as tags, ascending order would select Z, and descending order would select A                                                                                                                                                 | asc                                             |
| numerical.order     | optional      | Given the integer values from 0 to 9 as tags, ascending order would select 9, and descending order would select 0                                                                                                                                               | asc                                             |
| semver.range     | optional      | Range gives a semver range for the image tag; the highest version within the range that's a tag yields the latest image                                                                                                                                                 | '>=1.0.0 <2.0.0'                                             |


###### FilterTags

| Parameter         | Required | Description                                                                                                                                                                           | Example                                            |
| ------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| extract     | optional      | Extract allows a capture group to be extracted from the specified regular expression pattern, useful before tag evaluation                                                                                                                                                 | $timestamp                                             |
| pattern     | optional      | Pattern specifies a regular expression pattern used to filter for image tags                                                                                                                                                 | '^master-[a-f0-9]'                                             |

#### Example

1. If your kustomize style artifact is stored in oss, you can create application by flowing these steps:

(Optional)If your OSS bucket needs identity verification, create a Secret first:

```shell
$ kubectl create secret generic bucket-secret --from-literal=accesskey=<your-ak> --from-literal=secretkey=<your-sk>
secret/bucket-secret created
```

Deploy this application:

```shell
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: bucket-app
spec:
  components:
    - name: bucket-comp
      type: kustomize
      properties:
        repoType: oss
        # If the bucket is private, you will need to provide
        secretRef: bucket-secret
        url: oss-cn-beijing.aliyuncs.com
        oss:
          bucketName: definition-registry
        path: ./app/prod/
```

2. If your artifact is stored in git, you can create application like this:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: git-app
spec:
  components:
    - name: git-comp
      type: kustomize
      properties:
        repoType: git
        url: https://github.com/<path>/<to>/<repo>
        git:
          branch: master
          provider: GitHub
        path: ./app/dev/
```

3. If you want to create a application which updated automatically when image updated. You can create the application like this.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: image-app
spec:
  components:
    - name: image
      type: kustomize
      properties:
        imageRepository:
          image: <your image>
          secretRef: imagesecret
          filterTags:
            pattern: '^master-[a-f0-9]+-(?P<ts>[0-9]+)'
            extract: '$ts'
          policy:
            numerical:
              order: asc
          commitMessage: "Image: {{range .Updated.Images}}{{println .}}{{end}}"
```

## Note

In this addon, there are five controllers to be installed by default
  
- Source controller
  - The source-controller is a Kubernetes operator, specialised in artifacts acquisition from external sources such as Git, Helm repositories and S3 buckets. The source-controller implements the source.toolkit.fluxcd.io API and is a core component of the GitOps toolkit.
  - ![overview](https://github.com/fluxcd/source-controller/blob/main/docs/diagrams/source-controller-overview.png)

- Image (metadata) reflector controller
  - This is a controller that reflects container image metadata into a Kubernetes cluster. It pairs with the image update automation controller to drive automated config updates.

- Image automation controller
  - This controller automates updates to YAML when new container images are available.
  - Its sibling, image-reflector-controller, scans container image repositories and reflects the metadata in Kubernetes resources. This controller reacts to that image metadata by updating YAML files in a git repository, and committing the changes.

- kustomize-controller
  - The kustomize-controller is a Kubernetes operator, specialized in running continuous delivery pipelines for infrastructure and workloads defined with Kubernetes manifests and assembled with Kustomize.
  - ![overview](https://github.com/fluxcd/kustomize-controller/blob/main/docs/diagrams/kustomize-controller-overview.png)

- helm-controller
  - The helm-controller is a Kubernetes operator, allowing one to declaratively manage Helm chart releases. It is part of a composable GitOps toolkit and depends on source-controller to acquire the Helm charts from Helm repositories.
  - The desired state of a Helm release is described through a Kubernetes Custom Resource named HelmRelease. Based on the creation, mutation or removal of a HelmRelease resource in the cluster, Helm actions are performed by the operator.
  - ![overview](https://github.com/fluxcd/helm-controller/blob/main/docs/diagrams/helm-controller-overview.png)
