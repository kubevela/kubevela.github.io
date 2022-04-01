---
title: China Merchants Bank's Practice on Offline Installation with KubeVela 
author: Xiangbo Ma
author_title: (Cloud platform development team)
author_url: http://www.cmbchina.com/
author_image_url: /img/china-merchants-bank.jpg
tags: [ KubeVela ]
description: ""
image: https://raw.githubusercontent.com/oam-dev/KubeVela.io/main/docs/resources/KubeVela-03.png
hide_table_of_contents: false
---

The cloud platform development team of China Merchants Bank has been trying out KubeVela since 2021 internally and aims to using it for enhancing our primary application delivery and management capabilities. Due to the specific security concern for financial insurance industry, network control measurements are relatively strict, and our intranet cannot directly pull Docker Hub image, and there is no Helm image source available as well. Therefore, in order to landing KubeVela in the intranet, you must perform a complete offline installation.

This article will take the KubeVela V1.2.5 version as an example, introduce the offline installation practice to help other users easier to complete KubeVela's deployment in offline environment.

## KubeVela Offline Installation Solution

We divide the offline installation of KubeVela in three parts, which are Vela CLI, Vela Core, and Addon offline installation. Each part mainly involves the loading of the relevant Docker image and Helm's package, which can greatly speed up deployment process in offline environment.

Before doing so, please ensure that Kubernetes cluster version is  `>= v1.19 && < v1.22`. One way of KubeVela as a control plane relies on Kubernetes, which can be placed in any product or in any cloud provider. At the same time, you can also use Kind or Minikube to deploy KubeVela locally.

### Vela CLI Offline Installation

- First, you need to download of the binary version of `vela` that you want by checking KubeVela [Release Log](https://github.com/oam-dev/kubevela/releases)
- Unzip binary files and configure the appropriate environment variables in `$PATH`
   - Unzip binary file
      - `tar -zxvf vela-v1.2.5-linux-amd64.tar.gz`
      - `mv ./linux-amd64/vela /usr/local/bin/vela`
   - Set environment variables
      - `vi /etc/profile`
      - `export PATH="$PATH:/usr/local/bin"`
      - `source /etc/profile`
   - Verify the installation of Vela CLI through `vela version`
```shell
CLI VERSION: V1.2.5
Core Version:
GitRevision: git-ef80b66
GOLANGVERSION: Go1.17.7
```
 
- At this point, Vela CLI has been deployed offline!

### Vela Core Offline Installation

- Before deploying Vela Core offline, first you need to install [Helm](https://helm.sh/docs/intro/install/) in an offline environment and its version needs to meet `v3.2.0+`
- Prepare Docker image. Vela Core's deployment mainly involves 5 images, you need to first visit the Docker Hub in extranet to download the corresponding images, then load them to offline environment
   - Pull the image from Docker Hub
      - `docker pull oamdev/vela-core:v1.2.5`
      - `docker pull oamdev/cluster-gateway:v1.1.7`
      - `docker pull oamdev/kube-webhook-certgen:v2.3`
      - `docker pull oamdev/alpine-k8s:1.18.2`
      - `docker pull oamdev/hello-world:v1`
   - Save image to local disks
      - `docker save -o vela-core.tar oamdev/vela-core:v1.2.5`
      - `docker save -o cluster-gateway.tar oamdev/cluster-gateway:v1.1.7`
      - `docker save -o kube-webhook-certgen.tar oamdev/kube-webhook-certgen:v2.3`
      - `docker save -o alpine-k8s.tar oamdev/alpine-k8s:1.18.2`
      - `docker save -o hello-world.tar oamdev/hello-world:v1`
   - Re-load the image in the offline environment
      - `docker load vela-core.tar`
      - `docker load cluster-gateway.tar`
      - `docker load kube-webhook-certgen.tar`
      - `docker load alpine-k8s.tar`
      - `docker load hello-world.tar`
- Download [KubeVela Core](https://github.com/oam-dev/KubeVela/releases), copy it to offline environment and use Helm to repackage
   - Repackage the KubeVela source code and install the chart package to the control cluster offline
      - `helm package kubevela/charts/vela-core --destination kubevela/charts`
      - `helm install --create-namespace -n vela-system kubevela kubevela/charts/vela-core-0.1.0.tgz --wait`
   - Check the output
```shell
KubeVela Control Plane Has Been successfully set up on your cluster.
```

- At this point, Vela Core has been deployed offline!

### Addon Offline Installation

- First download [Catalog Source](https://github.com/oam-dev/catalog) and copy it to offline environment
- Here, we will take VelaUX, one of many more addons, as an example. First prepare its Docker image, VelaUX mainly involve 2 images, you need to first access the extranet to download the corresponding image from Docker Hub, then load it to offline environment
   - Pull the image from Docker Hub
      - `docker pull oamdev/vela-apiserver:v1.2.5`
      - `docker pull oamdev/velaux:v1.2.5`
   - Save image to local disks
      - `docker save -o vela-apiserver.tar oamdev/vela-apiserver:v1.2.5`
      - `docker save -o velaux.tar oamdev/velaux:v1.2.5`
   - Re-load the image in the offline environment
      - `docker load vela-apiserver.tar`
      - `docker load velaux.tar`
- Install VelaUX
   - Install VelaUX via Vela CLI
      - `vela addon enable catalog-master/addons/velaux`
   - Check the output
```shell
  Addon: velaux enabled Successfully.
```
 
   - If there is a cluster installed route Controller or Nginx Ingress Controller and also linked with an available domain, you can deploy external routing to make VelaUX accessible. Here present Openshift Route as an example, you can also choose Ingress if you wish
```yaml
apiVersion: route.openshift.io/v1
kind: Route
metadata:
name: velaux-route
namespace: vela-system
spec:
host: velaux.xxx.xxx.cn
port:
  targetPort: 80
to:
  kind: Service
  name: velaux
  weight: 100
wildcardPolicy: None
```

   - Check the installation
```shell
curl -I -m 10 -o /dev/null -s -w %{http_code} http://velaux.xxx.xxx.cn/applications
```

- At this point, VelaUX has been deployed offline! At the same time, for other types of Addon's offline deployment, access to the corresponding directory of the [Catalog Source](https://github.com/oam-dev/catalog) and repeat the above moves, you would complete all the addons' offline deployments for good.

## Summarize

During offline deployment, we also try to save Vela Core and Addon's resource that generated to  be YAML files after deploying in extranet and re-deploy them in an offline environment, but because of all different kinds of resource involved in and it requires many other authorization issues to resolve, this way is more than cumbersome.

With this practice of KubeVela's offline deployment , we hope it help you build a complete set of KubeVela in offline environment much faster. Offline installation is pretty much a pain point for most developers, we also see that the KubeVela community is introducing the brand new [velad](https://github.com/oam-dev/elad), a fully offline, highly accountable installation tool. Velad can help automate completion by making many steps as one, such as preparing clusters, downloading and packing image, installing and etc. Further more, it do support many features: In Linux machine (such as Alibaba Cloud ECS) we can locally spin up a cluster to install Vela-Core; while starting a KubeVela control plane, do not have to worry about its data to be lost when machine behind it accidentally was shutdown; Velad can stores all the data from control plane cluster into a traditional database (such as MySQL deployed on another ECS).

In the recent version to come, China Merchants Bank will increase the efforts in the open source community of KubeVela, actively building: enterprise-level capacity, enhancement on multi-cluster, offline deployment and application-level observability. We'll also be contributing the financial industry's user scenarios and business needs, driving cloud-native ecology achieve more easily and efficient application management experience, and at last but not at least, welcome you the community member to join us together in this journey.