---
title:  Pull based Component
---

Create a Kustomize Component, it could be from Git Repo or OSS bucket or image registry.

> This type is only apply to CLI.

## Enable the fluxcd addon

This component type is provided by the fluxcd addon, you must enable it firstly.

```shell
vale addon enable fluxcd
```

## Watch Files

### Deploy From OSS bucket

KubeVela's `kustomize` component meets the needs of users to directly connect Yaml files and folders as component products. No matter whether your Yaml file/folder is stored in a Git Repo or an OSS bucket, KubeVela can read and deliver it.

Let's take the YAML folder component from the OSS bucket registry as an example to explain the usage. In the `Application` this time, I hope to deliver a component named bucket-comp. The deployment file corresponding to the component is stored in the cloud storage OSS bucket, and the corresponding bucket name is definition-registry. `kustomize.yaml` comes from this address of `oss-cn-beijing.aliyuncs.com` and the path is `./app/prod/`.


1. (Optional) If your OSS bucket needs identity verification, create a Secret:

```shell
$ kubectl create secret generic bucket-secret --from-literal=accesskey=<your-ak> --from-literal=secretkey=<your-sk>
secret/bucket-secret created
```

2. Deploy it:

```shell
cat <<EOF | vela up -f -
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
EOF
```
Please copy the above code block and deploy it directly to the runtime cluster:

```shell
application.core.oam.dev/bucket-app created
```

Finally, we use `vela ls` to view the application status after successful delivery:
```shell
vela ls
APP                 	COMPONENT  	TYPE      	TRAITS	PHASE  	HEALTHY	STATUS	CREATED-TIME                 
bucket-app          	bucket-comp	kustomize 	      	running	healthy	      	2021-08-28 18:53:14 +0800 CST
```

The PHASE of the app is running, and the STATUS is healthy. Successful application deployment!


### Deploy From Git Repo


**How-to**

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

**Override Kustomize**

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: bucket-app
spec:
  components:
    - name: bucket-comp
      type: kustomize
      properties:
        # ...omitted for brevity
        path: ./app/
     
```

## Watch Image Registry


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