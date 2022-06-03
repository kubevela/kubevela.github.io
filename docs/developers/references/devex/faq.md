---
title:  FAQ
---

## What is the difference between KubeVela and project-X ?

Refer to the [comparison details](https://kubevela.io/docs/#kubevela-vs-other-software).

## You have reached your pull rate limit

When you look into the logs of Pod kubevela-vela-core and found the issue as below.

```
kubectl get pod -n vela-system -l app.kubernetes.io/name=vela-core
```
```console
NAME                                 READY   STATUS    RESTARTS   AGE
kubevela-vela-core-f8b987775-wjg25   0/1     -         0          35m
```

>Error response from daemon: too many requests: You have reached your pull rate limit. You may increase the limit by 
>authenticating and upgrading: https://www.docker.com/increase-rate-limit
 
You can use github container registry instead.

```
docker pull ghcr.io/kubevela/kubevela/vela-core:latest
```


