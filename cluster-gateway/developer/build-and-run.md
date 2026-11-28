---
title: Build and Run
description: Build the cluster-gateway binary and image, run your build on a k3d hub with a member cluster, and run the gateway on your machine.
---

## Get the code

```shell
git clone https://github.com/<you>/cluster-gateway.git
cd cluster-gateway
git remote add upstream https://github.com/oam-dev/cluster-gateway.git
```

Fork [oam-dev/cluster-gateway](https://github.com/oam-dev/cluster-gateway) first, and branch from `master`.

## Build the binary

```shell
make
```

That runs codegen, `go fmt` and `go vet`, and builds `bin/manager`, the gateway. It takes about a minute the first time.

```shell
./bin/manager --help | head -3
```

```console
Launch the cluster-gateway aggregated apiserver

Usage:
```

## Build the image

```shell
make gateway IMG_TAG=dev ARCH=arm64
```

`make gateway` builds `oamdev/cluster-gateway:<IMG_TAG>` from `cmd/apiserver/Dockerfile`, for `linux/amd64` unless you set `ARCH`. Set it to your cluster nodes' architecture: on Apple silicon, k3d and kind nodes are `arm64`. `make ocm-addon-manager` builds the addon manager the same way, and `make image` builds both.

## Run your build on k3d

A cluster for the gateway, your image loaded into it, and the standalone chart with `tag` pointing at it:

```shell
k3d cluster create cg-dev --no-lb --k3s-arg "--disable=traefik@server:0" --wait
k3d image import oamdev/cluster-gateway:dev -c cg-dev
helm install cluster-gateway ./charts/cluster-gateway \
  --kube-context k3d-cg-dev --namespace vela-system --create-namespace \
  --set tag=dev --set featureGate.healthiness=true --set featureGate.secretCache=true \
  --wait
kubectl --context k3d-cg-dev wait --for=condition=Available apiservice/v1alpha1.cluster.core.oam.dev --timeout=2m
```

```console
apiservice.apiregistration.k8s.io/v1alpha1.cluster.core.oam.dev condition met
```

That's how CI installs it, `vela-system` and both feature gates included, so the [e2e suite](./testing.md#e2e-tests) runs against it unchanged. The chart's `imagePullPolicy` is `IfNotPresent`, so it uses the imported image rather than pulling.

Register the cluster with itself, so there's something to proxy to. `e2e/env/prepare` reads the client certificate from your kubeconfig and prints a Secret named `loopback` pointing at the in-cluster API server:

```shell
kubectl config use-context k3d-cg-dev
go run ./e2e/env/prepare | kubectl apply -f -
kubectl get clustergateway
kubectl get --raw /apis/cluster.core.oam.dev/v1alpha1/clustergateways/loopback/proxy/healthz; echo
```

```console
secret/loopback created
NAME       PROVIDER   CREDENTIAL-TYPE   ENDPOINT-TYPE   HEALTHY
loopback              X509Certificate   Const           false
ok
```

`prepare` uses the kubeconfig in `KUBECONFIG` (or `~/.kube/config`) and its current context, which is why it switches context first. It writes to `open-cluster-management-credentials`, the chart's default Secret namespace.

For a member cluster too, follow the [Quick Start](../getting-started/quick-start.md) from step 1 with `--set tag=dev` and the image imported into the hub.

## Iterate

```shell
make gateway IMG_TAG=dev ARCH=arm64
k3d image import oamdev/cluster-gateway:dev -c cg-dev
kubectl --namespace vela-system rollout restart deployment gateway-deployment
kubectl --namespace vela-system rollout status deployment gateway-deployment
```

The image build compiles everything inside Docker from scratch, so a rebuild takes a few minutes. Run the unit tests for the package you're changing first.

## Running it on your machine

The Makefile's `local-run` target, and `docs/local-run.md`, run the gateway on your workstation with `--standalone-debug-mode`. At `v1.10.0-alpha.1` that mode starts and serves, but it isn't usable: it needs `--kubeconfig` pointing at the hub (it doesn't read `KUBECONFIG`, and stops with `unable to load in-cluster configuration` without it), and even then every `list` of `clustergateways` panics with a nil pointer in `ClusterGateway.List`, and every proxy request fails with `no such cluster`. Run your build in a cluster as above instead.

## Clean up

```shell
k3d cluster delete cg-dev
```

