---
title: ArgoCD + Kubevela Integration
author: Gokhan Karadas
author_title: Trendyol Tech https://www.trendyol.com
author_url: https://github.com/previousdeveloper
author_image_url: https://KubeVela.io/img/logo.svg
tags: [ KubeVela, Argo, IDP, OAM, CD, GitOps]
description: "This document aims to explain the integration of Kubevela and ArgoCD. We have two approaches to integrate this flow. This doc is trying to explain the pros and cons of two different approaches"
image: https://miro.medium.com/max/560/1*Ib0XSoJOnB7VS8x9fLF7zQ.webp
hide_table_of_contents: false
---

# Overview

This document aims to explain the integration of Kubevela and ArgoCD. We have two approaches to integrate this flow. This doc is trying to explain the pros and cons of two different approaches. Before diving deep into details, we can describe Kubevela and ArgoCD.

KubeVela is a modern software delivery platform that makes deploying and operating applications across multi environments easier, faster, and more reliable.

KubeVela is infrastructure agnostic and **application-centric**. It allows you to build robust software and deliver them anywhere! Kubevela provides an Open Application Model (OAM) based abstraction approach to ship applications and any resource across multiple environments.

Open Application Model (OAM) is a set of standard yet higher-level abstractions for modeling cloud-native applications on top of today’s hybrid and multi-cloud environments. You can find more conceptual details here.

<!--truncate-->

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: first-vela-app
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        image: oamdev/hello-world
        ports:
         - port: 8000
           expose: true
      traits:
        - type: scaler
          properties:
            replicas: 1
```
### ArgoCD

Argo CD is a declarative continuous delivery tool for Kubernetes applications.
It uses the GitOps style to create and manage Kubernetes clusters. When any changes are made to the application configuration in Git, Argo CD will compare it with the configurations of the running application and notify users to bring the desired and live state into sync.

### Flux

By default, Kubevela works with Flux addon to complete the Gitops journey for applications. You need to enable the flux addon and perform git operations quickly. https://kubevela.io/docs/end-user/gitops/fluxcd.

```shell
vela addon enable fluxcd
```
## Integration with ArgoCD

If you want to use Kubevela with ArgoCD, there are two options to enable it.

- Kubevela dry-run option
- Kubevela + ArgoCD Gitops syncer mode

# 1. Vela dry-run approach

First approach is that without using Kubevela GitOps Controller, we can use ArgoCD as the GitOps Controller, which means ArgoCD applies a raw manifest to the target cluster. Kubevela provides us to export oam application components and traits to native Kubernetes resource therefore we can still use OAM based model and ArgoCD can manage resources with custom argo-repo-server plugin. Behind this approach that KubeVela and OAM can also works as a client side tool with the feature dry-run.

This part describe how ArgoCD apply dry-run mode on Kubevela resources. Firstly, ArgoCD and Kubevela same should be installed.

ArgoCD version v2.5.4

Kubevela version v1.6.4

### Prerequisites

Argo CD allows integrating more config management tools using config management plugins.

### 1. Write the plugin configuration file
Plugins will be configured via a ConfigManagementPlugin manifest located inside the plugin container.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: vela-cmp
  namespace: argocd
data:
  plugin.yaml: |
    apiVersion: argoproj.io/v1alpha1
    kind: ConfigManagementPlugin
    metadata:
      name: vela
    spec:
      version: v1.0
      init:
        command: ["vela", "traits"]
      generate:
        command: ["sh"]
        args:
          - -c
          - |
            vela dry-run -f test-argo-oam.yml
      discover:
        # fileName: "-oam.yml*"
        find:
          # This does the same thing as fileName, but it supports double-start (nested directory) glob patterns.
          glob: "**/*oam*.yml"
```

```shell
kubectl apply -f vela-cmp.yml
```

This plugin is responsible for converting Kubevela OAM manifest definition to raw kubernetes object and ArgoCD should be responsible to deploy.

### 2. Register the plugin sidecar

To install a plugin, patch argocd-repo-server to run the plugin container as a sidecar, with argocd-cmp-server as its entrypoint.

Vela plugin runs the vela command to export manifest when the plugin is discovered on git manifest. Before initializing the plugin, we need to install Kubevela CLI to run the order successfully. The below configuration adds an init container to download the necessary CLI.

```yaml
initContainers:
 - name: kubevela
   image: nginx:1.21.6
   command:
    - bash
    - '-c'
    - |
     #!/usr/bin/env bash
     set -eo pipefail
     curl -fsSl https://kubevela.io/script/install.sh | bash -s 1.6.4
   env:
    - name: VELA_INSTALL_DIR
      value: /custom-tools
   resources:
    limits:
     cpu: 50m
     memory: 64Mi
    requests:
     cpu: 10m
     memory: 32Mi
   volumeMounts:
    - name: custom-tools
      mountPath: /custom-tools
   terminationMessagePath: /dev/termination-log
   terminationMessagePolicy: File
   imagePullPolicy: IfNotPresent
```
after adding init container, we need to add our custom sidecar binary to run plugins properly. To use configmap plugin configuration in our sidecar, we need to mount configmap plugin to our pods

```yaml
containers:
        - name: vela
          image: nginx
          command:
            - /var/run/argocd/argocd-cmp-server
          env:
            - name: KUBECONFIG
              value: /kubeconfig
          resources: {}
          volumeMounts:
            - name: var-files
              mountPath: /var/run/argocd
            - name: vela-cli-dir
              mountPath: /.vela
            - name: kubeconfig
              mountPath: /kubeconfig
              subPath: kubeconfig
            - name: plugins
              mountPath: /home/argocd/cmp-server/plugins
            - name: vela-cmp
              mountPath: /home/argocd/cmp-server/config/plugin.yaml
              subPath: plugin.yaml
            - name: cmp-tmp
              mountPath: /tmp
            - name: custom-tools
              mountPath: /usr/local/bin/vela
              subPath: vela
```
### 3. Configure Argo CD to watch this repo for Git pushes.

Create git repository and put oam manifest to target directory after you can create a simple ArgoCD application that watch git repository and apply manifests to local kubernetes cluster.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: test-2
spec:
  components:
    - name: wf-poc-app-2
      type: webservice
      properties:
        image: oamdev/helloworld-python:v1
        env:
          - name: "TARGET"
            value: "ArgoCD"
        port: 8080
```
### 4. Final Output

ArgoCD synced applications successfully and rendered kubernetes resources.

![img](https://miro.medium.com/max/1400/0*noBT6sj-0K-DQ3PB)

# 2. Kubevela Controller + ArgoCD Gitops syncer

Second approach is that we can use Kubevela gitops controller way as the server side and argocd can be our gitops syncer. This approach is flexible to use native kubevela feature set without using a custom plugin or dry run module. We just need to add below annotations to our manifest repository to ignore outofsync.

```shell
argocd.argoproj.io/compare-options: IgnoreExtraneous
```
In this example, ArgoCD tracks native Kubevela application resources and its revision.

![img](https://miro.medium.com/max/1400/0*97AatDKE2fC5wQdX)

## Conclusion

**1. Vela Dry-run approach**
- Kubevela can be installed different cluster from ArgoCD.
- Limited Kubevela features, we just use component and traits definition.
- Workflow and policy features don’t supported by this way.
- Depend on Kubevela dry run feature.
- No needed rbac, ui or any different experience from ARGO.

**2. Kubevela Controller + ArgoCD Gitops syncer**
- Kubevela must be installed to ArgoCD cluster.
- We can use all the features of Kubevela.
- No need depends on anything.


Reference: https://gokhan-karadas1992.medium.com/argocd-kubevela-integration-eb88dc0484e0

Big thanks to [Erkan Zileli](https://github.com/erkanzileli) 🎉🎉🎉
