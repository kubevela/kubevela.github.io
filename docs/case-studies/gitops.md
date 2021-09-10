---
title:  GitOps with KubeVela
---

GitOps is a continuous delivery method that allows developers to automatically deploy applications by changing code in a Git repository. In this section, you will learn how to use KubeVela for GitOps deployment.

## Preparation

First, prepare a Git Repository with `Application` files that need to be applied, please refer to [KubeVela-GitOps-Demo](https://github.com/FogDong/KubeVela-GitOps-Demo):

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: first-vela-workflow
  namespace: default
spec:
  components:
  - name: express-server
    type: webservice
    properties:
      image: stefanprodan/podinfo
      port: 9898
    traits:
    - type: ingress
      properties:
        domain: testsvc.example.com
        http:
          /: 9898
  - name: nginx-server
    type: webservice
    properties:
      image: nginx:1.21
      port: 80
```

Second, apply a secret with your Git username and password in cluster:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: my-secret
type: kubernetes.io/basic-auth
stringData:
  username: your username
  password: your password
```

## Write the Application that can apply automatically

Apply the `Application` file to the cluster:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: git-app
spec:
  components:
  - name: gitops
    type: kustomize
    properties:
      repoType: git
      # your git repository url
      url: https://github.com/FogDong/KubeVela-GitOps-Demo
      # your secret name
      secretRef: my-secret
      # the interval time of pull config from repo
      pullInterval: 1m
      git:
        branch: master
      path: .
```

Check the `Application` in clusters, we can see that the `git-app` automatically pulls the config from Git Repository and apply the application to the cluster:

```shell
$ kubectl get application

NAME                  COMPONENT        TYPE         PHASE     HEALTHY   STATUS   AGE
first-vela-workflow   express-server   webservice   running   true               1s
git-app               gitops           kustomize    running   true               3s
```

## Edit the configuration

After the `Application` is running, we want to re-apply the app to the `prod` namespace. We can edit the `Application` file in Git Repository:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: first-vela-workflow
  namespace: default
spec:
  components:
  - name: express-server
    type: webservice
    properties:
      image: stefanprodan/podinfo
      port: 9898
    traits:
    - type: ingress
      properties:
        domain: testsvc.example.com
        http:
          /: 9898
  - name: nginx-server
    type: webservice
    properties:
      image: nginx:1.21
      port: 80

  policies:
    - name: my-policy
      type: env-binding
      properties:
        clusterManagementEngine: single-cluster
        envs:
          - name: my-env
            placement:
              namespaceSelector:
                name: prod
  workflow:
    steps:
      - name: multi-env
        type: multi-env
        properties:
          policy: my-policy
          env: my-env
```

Check the `Application` in clusters, we can see the application has been applied to `prod` namespace after a while:

```shell
$ kubectl get application -A

NAMESPACE     NAME                  COMPONENT                               TYPE         PHASE     HEALTHY   STATUS   AGE
default       first-vela-workflow   express-server                          webservice   running   true               10m
default       git-app               gitops                                  kustomize    running   true               10m
prod          first-vela-workflow   express-server                          webservice   running   true               8s
```