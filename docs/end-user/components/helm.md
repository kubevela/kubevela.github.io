---
title:  Helm
---

KubeVela's Helm component meets the needs of users to connect to Helm Chart. You can deploy any ready-made Helm chart software package from Helm Repo, Git Repo or OSS bucket through the Helm component, and overwrite its parameters.

## Deploy From Helm Repo

In this `Application`, we hope to deliver a component called redis-comp. It is a chart from the [bitnami](https://charts.bitnami.com/bitnami).

```shell
cat <<EOF | kubectl apply -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: app-delivering-chart
spec:
  components:
    - name: redis-comp
      type: helm
      properties:
        chart: redis-cluster
        version: 6.2.7
        url: https://charts.bitnami.com/bitnami
        repoType: helm
EOF
```

Please copy the above code block and deploy it directly to the runtime cluster:
```shell
application.core.oam.dev/app-delivering-chart created
```

Finally, we use `vela ls` to view the application status after successful delivery:
```shell
APP                 	COMPONENT 	TYPE      	TRAITS	PHASE  	HEALTHY	STATUS	CREATED-TIME                 
app-delivering-chart	redis-comp	helm      	      	running	healthy	      	2021-08-28 18:48:21 +0800 CST
```

We also see that the PHASE of the app-delivering-chart APP is running and the STATUS is healthy.

### Attributes

| Parameters      | Description                                                                                                                                                                                                                                                                                                                                                              | Example                            |
| --------------- | ----------- | ---------------------------------- |
| repoType        | required, indicates where it's from                                                                                                                                                                                                                                                                                                                                      | Helm                               |
| pullInterval    | optional, synchronize with Helm Repo, tunning interval and 5 minutes by default                                                                                                                                                                                                                                                                                          | 10m                                |
| url             | required, Helm Reop address, it supports http/https                                                                                                                                                                                                                                                                                                                      | https://charts.bitnami.com/bitnami |
| secretRef       | optional, The name of the Secret object that holds the credentials required to pull the repo. The username and password fields must be included in the HTTP/S basic authentication Secret. For TLS the secret must contain a certFile and keyFile, and/or caCert fields. For TLS authentication, the secret must contain a certFile / keyFile field and/or caCert field. | sec-name                           |
| timeout         | optional, timeout for pulling repo index                                                                                                                                                                                                                                                                                                                                 | 60s                                |
| chart           | required, chart title                                                                                                                                                                                                                                                                                                                                                    | redis-cluster                      |
| version         | optional, chart version, * by default                                                                                                                                                                                                                                                                                                                                    | 6.2.7                              |
| targetNamespace | optional, the namespace to install chart, decided by chart itself                                                                                                                                                                                                                                                                                                        | your-ns                            |
| releaseName     | optional, release name after installed                                                                                                                                                                                                                                                                                                                                   | your-rn                            |
| values          | optional, override the Values.yaml inchart, using for the rendering of Helm                                                                                                                                                                                                                                                                                              |                                    |


## Deploy From OSS bucket

| Parameters | Description | Example |
| ---------- | ----------- | ------- |
| repoType        | required, indicates where it's from                                                                                             | oss                         |
| pullInterval    | optional, synchronize with bucket, tunning interval and 5 minutes by default                                                    | 10m                         |
| url             | required, bucket's endpoint and no need to fill in with scheme                                                                  | oss-cn-beijing.aliyuncs.com |
| secretRef       | optional, Save the name of a Secret, which is the credential to read the bucket. Secret contains accesskey and secretkey fields | sec-name                    |
| timeout         | optional, The timeout period of the download operation, the default is 20s                                                      | 60s                         |
| chart           | required, Chart storage path (key)                                                                                              | ./chart/podinfo-5.1.3.tgz   |
| version         | optional, In OSS source, this parameter has no effect                                                                           |                             |
| targetNamespace | optional, The namespace of the installed chart, which is determined by the chart itself by default                              | your-ns                     |
| releaseName     | optional, Installed release name                                                                                                | your-rn                     |
| values          | optional, Overwrite the Values.yaml of the chart for Helm rendering.                                                            |                             |
| oss.bucketName  | required, bucket name                                                                                                           | your-bucket                 |
| oss.provider    | optional, Optional generic or aws, fill in aws if the certificate is obtained from aws EC2. The default is generic.             | generic                     |
| oss.region      | optional, bucket region                                                                                                         |                             |

**How-to**

1. (Opentional) If your OSS bucket needs identity verification, create a Secret:

```shell
$ kubectl create secret generic bucket-secret --from-literal=accesskey=<your-ak> --from-literal=secretkey=<your-sk>
secret/bucket-secret created
```

1. Example
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

## Deploy From Git Repo

| Parameters | Description | Example |
| ---------- | ----------- | ------- |
| repoType        | required, indicates where it's from                                                                                                                                                                                                                                                           | git                                             |
| pullInterval    | optional, synchronize with Git Repo, tunning interval and 5 minutes by default                                                                                                                                                                                                                | 10m                                             |
| url             | required, Git Repo address                                                                                                                                                                                                                                                                    | https://github.com/oam-dev/terraform-controller |
| secretRef       | optional, The name of the Secret object that holds the credentials required to pull the Git repository. For HTTP/S basic authentication, the Secret must contain the username and password fields. For SSH authentication, the identity, identity.pub and known_hosts fields must be included | sec-name                                        |
| timeout         | optional, The timeout period of the download operation, the default is 20s                                                                                                                                                                                                                    | 60s                                             |
| chart           | required, Chart storage path (key)                                                                                                                                                                                                                                                            | ./chart/podinfo-5.1.3.tgz                       |
| version         | optional, In Git source, this parameter has no effect                                                                                                                                                                                                                                         |                                                 |
| targetNamespace | optional, the namespace to install chart, decided by chart itself                                                                                                                                                                                                                             | your-ns                                         |
| releaseName     | optional, Installed release name                                                                                                                                                                                                                                                              | your-rn                                         |
| values          | optional, Overwrite the Values.yaml of the chart for Helm rendering.                                                                                                                                                                                                                          |                                                 |
| git.branch      | optional, Git branch, master by default                                                                                                                                                                                                                                                       | dev                                             |

**How-to**

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