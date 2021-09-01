---
title:  Kustomize
---

Create a Kustomize Component, it could be from Git Repo or OSS bucket.

### From OSS bucket 

| Parameters            | Description                                                         | Example                       |
| -------------- |  ------------------------------------------------------------ | --------------------------- |
| repoType       | required, The value of the Git. To indicate that kustomize configuration comes from the Git repository                     | oss                         |
| pullInterval   | optional, Synchronize with Git repository, and the time interval between tuning helm release. The default value is 5m (5 minutes） | 10m                         |
| url            | required, bucket's endpoint, no need to fill in with scheme                          | oss-cn-beijing.aliyuncs.com |
| secretRef      | optional, Save the name of a Secret, which is the credential to read the bucket. Secret contains accesskey and secretkey fields | sec-name                    |
| timeout        | optional, The timeout period of the download operation, the default is 20s                                 | 60s                         |
| path           | required, The directory containing the kustomization.yaml file, or the directory containing a set of YAML files (used to generate kustomization.yaml) | ./prod                      |
| oss.bucketName | required, bucket name                                                  | your-bucket                 |
| oss.provider   | optional, Generic or aws, if you get the certificate from aws EC2, fill in aws. The default is generic. | generic                     |
| oss.region     | optional, bucket region                                                 |                             |

**How-to**

1. (Opentional) If your OSS bucket needs identity verification, create a Secret:

```shell
$ kubectl create secret generic bucket-secret --from-literal=accesskey=<your-ak> --from-literal=secretkey=<your-sk>
secret/bucket-secret created
```

2. Example
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
        repoType: oss
        # required if bucket is private
        secretRef: bucket-secret
        url: oss-cn-beijing.aliyuncs.com
        oss:
          bucketName: definition-registry
        path: ./app/prod/
            
```

### From Git Repo


| Parameters          | Description                                                         | Example                                            |
| --------------- | ------------------------------------------------------------ | ----------------------------------------------- |
| repoType        | required, The value of the Git. To indicate that kustomize configuration comes from the Git repository                 | git                                             |
| pullInterval    | optional, Synchronize with Git repository, and the time interval between tuning helm release. The default value is 5m (5 minutes） | 10m                                             |
| url             | required, Git repository address                                                | https://github.com/oam-dev/terraform-controller |
| secretRef       | optional, The Secret object name that holds the credentials required to pull the Git repository. The username and password fields must be included in the HTTP/S basic authentication Secret. For SSH authentication, the identity, identity.pub and known_hosts fields must be included | sec-name                                        |
| timeout         | optional, The timeout period of the download operation, the default is 20s                                | 60s                                             |
| git.branch      | optional, Git branch, master by default                                     | dev                                             |

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
        path: ./app/dev/
```

## Override Kustomize

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

