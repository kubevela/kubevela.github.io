---
title:  FAQ
---

## What is the difference between KubeVela and project-X ?

Refer to the [comparison details](https://kubevela.io/docs/#kubevela-vs-other-software).

## You have reached rate limit for Docker Image Registry 

By default, the community use images from docker registry for installation. You can use the following alternatives:

1. You can use github container registry, check the [list of official images](https://github.com/orgs/kubevela/packages) for more details. Use it like:

```
docker pull ghcr.io/kubevela/kubevela/vela-core:latest
```

2. Alibaba Container Registry also sponsor KubeVela community, you can use `acr.kubevela.net/` as prefix, acr has a sync for each KubeVela official images. Use it like:

```
docker pull acr.kubevela.net/oamdev/vela-core:latest
```

* You can check if the error occurs by:

Check the logs of Pod kubevela-vela-core and found the issue as below.

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

## Do yo support Crossplane, what's the difference between terraform and corssplane in KubeVela?

KubeVela natively support Crossplane as they're already CRDs, while terraform was not a CRD controller, so the KubeVela community author a [terraform controller](https://github.com/kubevela/terraform-controller) for integration. You can choose any of them as you wish. 


### What's the relationship between KubeVela and OAM? What will KubeVela mainly focus?

* OAM(Open Application Model) is the model behind KubeVela, it provides a platform-agnostic application model including the best practices and methodology for different vendors to follow. The evolution of the model depends primarily on the practices of KubeVela currently.
* KubeVela is the control plane running on Kubernetes, it works as a CRD controller and brings OAM model into your Cloud Native PaaS along with lots of addon capabilities. KubeVela will mainly focus on application delivery, the goal is to make deploying and operating applications across today's hybrid, multi-cloud environments easier, faster and more reliable.

