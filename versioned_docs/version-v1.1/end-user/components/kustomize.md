---
title:  Kustomize
---

Create a Kustomize Component, it could be from Git Repo or OSS bucket or image registry.

## Watch Files

### Deploy From OSS bucket

KubeVela's `kustomize` component meets the needs of users to directly connect Yaml files and folders as component products. No matter whether your Yaml file/folder is stored in a Git Repo or an OSS bucket, KubeVela can read and deliver it.

Let's take the YAML folder component from the OSS bucket registry as an example to explain the usage. In the `Application` this time, I hope to deliver a component named bucket-comp. The deployment file corresponding to the component is stored in the cloud storage OSS bucket, and the corresponding bucket name is definition-registry. `kustomize.yaml` comes from this address of oss-cn-beijing.aliyuncs.com and the path is `./app/prod/`.


1. (Optional) If your OSS bucket needs identity verification, create a Secret:

```shell
$ kubectl create secret generic bucket-secret --from-literal=accesskey=<your-ak> --from-literal=secretkey=<your-sk>
secret/bucket-secret created
```

2. Deploy it:

```shell
cat <<EOF | kubectl apply -f -
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

#### Attributes

| Parameters     | Description                                                                                                                                           | Example                     |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| repoType       | required, The value of the Git. To indicate that kustomize configuration comes from the Git repository                                                | oss                         |
| pullInterval   | optional, Synchronize with Git repository, and the time interval between tuning helm release. The default value is 5m (5 minutes）                    | 10m                         |
| url            | required, bucket's endpoint, no need to fill in with scheme                                                                                           | oss-cn-beijing.aliyuncs.com |
| secretRef      | optional, Save the name of a Secret, which is the credential to read the bucket. Secret contains accesskey and secretkey fields                       | sec-name                    |
| timeout        | optional, The timeout period of the download operation, the default is 20s                                                                            | 60s                         |
| path           | required, The directory containing the kustomization.yaml file, or the directory containing a set of YAML files (used to generate kustomization.yaml) | ./prod                      |
| oss.bucketName | required, bucket name                                                                                                                                 | your-bucket                 |
| oss.provider   | optional, Generic or aws, if you get the certificate from aws EC2, fill in aws. The default is generic.                                               | generic                     |
| oss.region     | optional, bucket region                                                                                                                               |                             |


### Deploy From Git Repo


| Parameters   | Description                                                                                                                                                                                                                                                                              | Example                                         |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| repoType     | required, The value of the Git. To indicate that kustomize configuration comes from the Git repository                                                                                                                                                                                   | git                                             |
| pullInterval | optional, Synchronize with Git repository, and the time interval between tuning helm release. The default value is 5m (5 minutes）                                                                                                                                                       | 10m                                             |
| url          | required, Git repository address                                                                                                                                                                                                                                                         | https://github.com/oam-dev/terraform-controller |
| secretRef    | optional, The Secret object name that holds the credentials required to pull the Git repository. The username and password fields must be included in the HTTP/S basic authentication Secret. For SSH authentication, the identity, identity.pub and known_hosts fields must be included | sec-name                                        |
| timeout      | optional, The timeout period of the download operation, the default is 20s                                                                                                                                                                                                               | 60s                                             |
| git.branch   | optional, Git branch, master by default                                                                                                                                                                                                                                                  | dev                                             |
| git.provider   | optional, Determines which git client library to use. Defaults to GitHub, it will pick go-git. AzureDevOps will pick libgit2                                                                                                                                                                                                                                                  | GitHub                                             |

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

| Parameter         | Required | Description                                                                                                                                                                           | Example                                            |
| ------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| image     | required     | The image url                                                                                                                                                 | oamdev/vela-core                                             |
| secretRef     | optional     | If it's a private image registry, use `kubectl create secret docker-registry` to create the secret                                                                                                                                                 | my-secret                                             |
| policy.alphabetical.order     | optional     | Order specifies the sorting order of the tags. Given the letters of the alphabet as tags, ascending order would select Z, and descending order would select A                                                                                                                                                 | asc                                             |
| policy.numerical.order     | optional      | Given the integer values from 0 to 9 as tags, ascending order would select 9, and descending order would select 0                                                                                                                                               | asc                                             |
| policy.semver.range     | optional      | Range gives a semver range for the image tag; the highest version within the range that's a tag yields the latest image                                                                                                                                                 | '>=1.0.0 <2.0.0'                                             |
| filterTags.extract     | optional      | Extract allows a capture group to be extracted from the specified regular expression pattern, useful before tag evaluation                                                                                                                                                 | $timestamp                                             |
| filterTags.pattern     | optional      | Pattern specifies a regular expression pattern used to filter for image tags                                                                                                                                                 | '^master-[a-f0-9]'                                             |
| commitMessage     | optional      | Use for more commit message                                                                                                                                                 |  'Image: {{range .Updated.Images}}{{println .}}{{end}}'                                             |

**Example**

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