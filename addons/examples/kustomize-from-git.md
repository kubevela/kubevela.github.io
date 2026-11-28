---
title: Deploy Kustomize from Git
---

The `fluxcd` addon's `kustomize` component points Flux at a directory in a Git repository. Flux builds it with Kustomize, applies the result, and checks the repository again every `pullInterval`, so a commit to that directory reaches the cluster without anyone running `vela up`.

This deploys [podinfo](https://github.com/stefanprodan/podinfo)'s own Kustomize overlay from GitHub.

## Enable the addon

```shell
vela addon enable fluxcd
```

## Deploy

```shell
cat <<EOF | vela up -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: podinfo-kustomize
  namespace: default
spec:
  components:
    - name: podinfo
      type: kustomize
      properties:
        repoType: git
        url: https://github.com/stefanprodan/podinfo
        git:
          tag: 6.11.2
        path: ./kustomize
        pullInterval: 1m
        targetNamespace: default
EOF
```

```console
Applying an application in vela K8s object format...
✅ App has been deployed 🚀🚀🚀
    Port forward: vela port-forward podinfo-kustomize
             SSH: vela exec podinfo-kustomize
         Logging: vela logs podinfo-kustomize
      App status: vela status podinfo-kustomize
        Endpoint: vela status podinfo-kustomize --endpoint
Application default/podinfo-kustomize applied.
```

The component creates a Flux `GitRepository` and a `Kustomization`:

```shell
vela status podinfo-kustomize
```

```console
About:

  Name:      	podinfo-kustomize
  Namespace: 	default
  Created at:	2026-11-27 10:42:47 +0000 GMT
  Healthy:   	✅
  Details:   	running

Workflow:

  mode: DAG-DAG
  finished: true
  Suspend: false
  Terminated: false
  Steps
  - id: 5dg2a7j5j5
    name: podinfo
    type: apply-component
    phase: succeeded

Services:

  - Name: podinfo
    Cluster: local
    Namespace: default
    Type: kustomize
    Health: ✅
    No trait applied
```

The Application reports healthy as soon as those two objects exist, before Flux has cloned anything, so look at what Flux applied, and at Flux itself below. Flux labels what it applies with the Kustomization's name; here that's podinfo's own Deployment, Service and HorizontalPodAutoscaler:

```shell
kubectl get deploy,svc,hpa -n default -l kustomize.toolkit.fluxcd.io/name=podinfo
```

```console
NAME                      READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/podinfo   2/2     2            2           52s

NAME              TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)             AGE
service/podinfo   ClusterIP   10.43.108.64   <none>        9898/TCP,9999/TCP   52s

NAME                                          REFERENCE            TARGETS              MINPODS   MAXPODS   REPLICAS   AGE
horizontalpodautoscaler.autoscaling/podinfo   Deployment/podinfo   cpu: <unknown>/99%   2         4         2          52s
```

## See Flux's side

```shell
kubectl get gitrepository,kustomization -n default
```

```console
NAME                                             URL                                       AGE   READY   STATUS
gitrepository.source.toolkit.fluxcd.io/podinfo   https://github.com/stefanprodan/podinfo   10s   True    stored artifact for revision '6.11.2@sha1:b501abd1f0f2acf49c39f2d9cd47b460578d87f0'

NAME                                                AGE   READY   STATUS
kustomization.kustomize.toolkit.fluxcd.io/podinfo   10s   True    Applied revision: 6.11.2@sha1:b501abd1f0f2acf49c39f2d9cd47b460578d87f0
```

To follow a branch instead of a tag, set `git.branch`. With `prune: true` (the default), an object deleted from the directory is deleted from the cluster on the next run.

## Clean up

```shell
vela delete podinfo-kustomize -y
```

The Kustomization is deleted with the Application, and Flux deletes what it applied.

## Reference

- [fluxcd addon](../fluxcd.md#kustomize): every `kustomize` parameter.
