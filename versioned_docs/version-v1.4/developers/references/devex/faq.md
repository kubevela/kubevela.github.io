---
title:  FAQ
---

## Common Questions

### Who are using KubeVela?

https://github.com/kubevela/kubevela/issues/1662

### What is the difference between KubeVela and project-X ?

Refer to the [comparison details](https://kubevela.io/docs/#kubevela-vs-other-software).

### Do yo support Crossplane? What's the difference between terraform and Corssplane in KubeVela?

KubeVela natively support Crossplane as they're already CRDs, while terraform was not a CRD controller, so the KubeVela community author a [terraform controller](https://github.com/kubevela/terraform-controller) for integration. You can choose any of them as you wish. 


### What's the relationship between KubeVela and OAM? What will KubeVela mainly focus?

* OAM(Open Application Model) is the model behind KubeVela, it provides a platform-agnostic application model including the best practices and methodology for different vendors to follow. The evolution of the model depends primarily on the practices of KubeVela currently.
* KubeVela is the control plane running on Kubernetes, it works as a CRD controller and brings OAM model into your Cloud Native PaaS along with lots of addon capabilities. KubeVela will mainly focus on application delivery, the goal is to make deploying and operating applications across today's hybrid, multi-cloud environments easier, faster and more reliable.

## Common Issues

### The document website is very slow to access.

You can use https://kubevela.net/ as a faster alternative.

### You have reached rate limit for Docker Image Registry 

By default, the community use images from docker registry for installation. You can use the following alternatives:

1. You can use github container registry, check the [list of official images](https://github.com/orgs/kubevela/packages) for more details. There're two kinds of format:

* Before v1.4.1, the image format is `ghcr.io/<git-repo>/vela-core:<version>`, e.g. "ghcr.io/kubevela/kubevela/vela-core:latest".
* After v1.4.1, the image format has changed to `ghcr.io/kubevela/<align with docker hub>`, e.g. "ghcr.io/kubevela/oamdev/vela-core:latest".

2. Alibaba Container Registry also sponsor KubeVela community, you can use `acr.kubevela.net/` as prefix for the docker registry, acr has a sync for each KubeVela official images. Use it like `acr.kubevela.net/oamdev/vela-core:latest`.

3. If you insist on using Docker registry, you may increase the limit by authenticating and upgrading: https://www.docker.com/increase-rate-limit .
 
### SchemaError of ApplicationRevision CRD

> SchemaError(dev.oam.core.v1beta1.ApplicationRevision.spec.referredObjects): array should have exactly one sub-item） 

https://github.com/kubevela/kubevela/issues/3874

This could be a potential problem for k8s 1.19. Try to run the following command and see if it can help.

```
kubectl patch crd applicationrevisions.core.oam.dev --type json -p='[{"op": "remove", "path": "/spec/versions/1/schema/openAPIV3Schema/properties/spec/properties/referredObjects/x-kubernetes-preserve-unknown-fields"}]'
```

### How to get my admin password of VelaUX?

If you're using v1.3, the default password is in the secret:

```
kubectl get secret admin -n vela-system
```

If you're using v1.4+, the default password is `VelaUX12345`.

### How can I build my own addon registry?

https://kubevela.io/docs/platform-engineers/addon/addon-registry

### How does KubeVela support stateful workload?

We recommend you to use [CRD Operator](https://kubernetes.io/docs/concepts/extend-kubernetes/operator/) for stateful workload. If you just want to use StatefulSet, you can refer to [this blog](https://kubevela.io/blog/2022/05/30/abstraction-kubevela) to build your own easily.