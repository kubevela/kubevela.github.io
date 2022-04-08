---
title:  Deploy Helm Charts
---

KubeVela's Helm component meets the needs of users to connect to Helm Chart. You can deploy any ready-made Helm chart software package from Helm Repo, Git Repo or OSS bucket through the Helm component, and overwrite its parameters.

## Deploy From Helm Repo

In this `Application`, we hope to deliver a component called redis-comp. It is a chart from the [bitnami](https://charts.bitnami.com/bitnami).

```shell
cat <<EOF | vela up -f -
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


## Deploy From OSS bucket

1. (Optional) If your OSS bucket needs identity verification, create a Secret:

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