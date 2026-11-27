---
title: Build and Run
description: Building Prism and its image, running your build on a k3d cluster with KubeVela, and running it on your machine.
---

Everything here runs from a clone of the repository:

```shell
git clone https://github.com/kubevela/prism.git
cd prism
```

## Build

```shell
go build ./...
go build -o bin/vela-prism ./cmd/apiserver
```

The Makefile has no target for the binary on its own; `make` with no target runs `generate`.

## Build the image

```shell
make image-apiserver IMG_TAG=dev ARCH=arm64
```

This builds `oamdev/vela-prism:dev` from `cmd/apiserver/Dockerfile`. `ARCH` defaults to `amd64`; set `arm64` on Apple silicon so the image runs on a local k3d cluster. The build takes under a minute once the Go modules are cached.

## Run your build on k3d

You need a cluster with KubeVela; step 1 of the [Quick Start](../getting-started/quick-start.md) makes one. Import the image so the cluster doesn't try to pull it:

```shell
k3d image import oamdev/vela-prism:dev -c prism-demo
```

The `vela-prism` addon can't run a build of current `master`: it starts Prism with `--feature-gates=APIPriorityAndFairness=false`, which the Kubernetes 0.37 libraries on `master` reject (`unrecognized feature gate: APIPriorityAndFairness`), and the addon has no parameter for the arguments. The chart in your checkout has the same argument, so drop it from a copy and install that:

```shell
vela addon disable vela-prism   # if it's enabled
cp -r charts /tmp/prism-chart
sed -i.bak '/APIPriorityAndFairness/d' /tmp/prism-chart/templates/deployment.yaml
helm upgrade --install vela-prism /tmp/prism-chart -n vela-system \
  --set image.tag=dev --set image.pullPolicy=Never \
  --set dynamicAPI.enabled=false --server-side=false --wait
kubectl wait --for=condition=Available apiservice/v1alpha1.prism.oam.dev --timeout=2m
kubectl get vela-clusters
```

```console
NAME    ALIAS   CREDENTIAL_TYPE   ENDPOINT   ACCEPTED   LABELS
local           Internal          -          true       cluster.core.oam.dev/control-plane=true
```

`dynamicAPI.enabled=false` unless you're working on dynamic resources, since the empty dynamic group holds up namespace deletion (see [Dynamic Resources](../guides/dynamic-resources.md#turn-it-on)). `--server-side=false` is for Helm 4 (see [Upgrade](../operate/upgrade.md#with-the-chart)).

After a change, rebuild, import, and restart the pod:

```shell
make image-apiserver IMG_TAG=dev ARCH=arm64
k3d image import oamdev/vela-prism:dev -c prism-demo
kubectl rollout restart deployment/vela-prism -n vela-system
```

## Run it on your machine

`--standalone-debug-mode` serves on `127.0.0.1` without asking the hub to authenticate or authorize requests, which is enough to call the APIs with curl while you work:

```shell
KUBECONFIG=$HOME/.kube/config ./bin/vela-prism \
  --standalone-debug-mode --bind-address=127.0.0.1 --secure-port=9444 \
  --cert-dir=/tmp/prism-certs --kubeconfig=$HOME/.kube/config --authentication-skip-lookup
```

```shell
curl -sk https://127.0.0.1:9444/apis/prism.oam.dev/v1alpha1/clusters
```

Set `KUBECONFIG` as well as `--kubeconfig`. The flag configures the server's own plumbing, but the clients that read ResourceTrackers, Secrets and Grafana come from `KUBECONFIG` (or `~/.kube/config`), and without it they quietly talk to whatever cluster that names: the symptom is `failed to get server groups: Get "https://...": connection refused` on every request.

The hub doesn't route to a local process, so `kubectl get apprt` still goes to the in-cluster Prism; use curl, or a Go test, against the local one.
