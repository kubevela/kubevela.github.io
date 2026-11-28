---
title: Examples
---

Each example is complete: enable the addons it names, paste the commands in order, and you get the output shown. They were run on a single-node [k3d](https://k3d.io) cluster with KubeVela v1.12.0-alpha.3 and the catalog's addons as of 2026-11-27.

| Example | Addons | What you end up with |
| --- | --- | --- |
| [Deploy Kustomize from Git](./kustomize-from-git.md) | fluxcd | An Application that Flux keeps in sync with a directory in a Git repository. |
| [Expose an Application with ingress-nginx](./expose-with-ingress-nginx.md) | ingress-nginx, fluxcd | A `webservice` reachable on a host name through the `gateway` trait. |
| [Serve HTTPS with cert-manager](./https-with-cert-manager.md) | cert-manager, ingress-nginx, fluxcd | The same Application over TLS, with a certificate cert-manager issues and renews. |
| [Write an addon from scratch](./write-an-addon.md) | none, you write it | A small addon of your own, with a parameter, a component type and the Application that runs it. |
| [Host your own addon registry](./host-an-addon-registry.md) | chartmuseum | The addon from the previous example published, versioned and enabled from a registry you run. |

The [Quick Start](../getting-started/quick-start.md) is the shortest of them: enable `fluxcd` and deploy a Helm chart.

To run them on a fresh cluster of your own:

```shell
k3d cluster create addons-demo --k3s-arg "--disable=traefik@server:0" -p "8080:80@loadbalancer" -p "8443:443@loadbalancer"
vela install --yes
```

k3s ships Traefik as its ingress controller; turning it off leaves the cluster's load balancer port free for ingress-nginx in the examples that use it. The two port mappings let you reach that load balancer from your machine, on 8080 for HTTP and 8443 for HTTPS.
