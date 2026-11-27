---
title: Build and Test
description: Build terraform-controller, run it against a local k3d cluster, and run the unit, lint and end-to-end checks CI runs.
---

Everything here runs from a clone of the repository:

```shell
git clone git@github.com:<you>/terraform-controller.git
cd terraform-controller
git remote add upstream https://github.com/kubevela/terraform-controller.git
```

## Build

```shell
make manager
```

That runs `controller-gen` (deepcopy), `go fmt`, `go vet`, then builds `bin/manager`.

## Generated code

The deepcopy functions (`api/**/zz_generated.deepcopy.go`) and the CRDs (`chart/crds/`) are generated from the types in `api/`. After changing a type:

```shell
make generate manifests
```

Commit what changes. CI runs `make reviewable` (manifests, fmt, vet, lint, `go mod tidy`) and fails when the tree is not clean afterwards, so run it before you push:

```shell
make check-diff
```

## Lint

```shell
make lint
```

```console
golangci-lint run ./...
0 issues.
```

## Unit tests

```shell
make test
```

The tests are in `controllers/...`. Several suites patch functions at runtime with [gomonkey](https://github.com/agiledragon/gomonkey), which needs to write to the test binary's code pages. **macOS doesn't allow that**: on a Mac, those packages panic with `panic: permission denied` in `gomonkey.modifyBinary`, and only `controllers/configuration`, `controllers/configuration/backend` and `controllers/process/container` pass. Run the tests on Linux, as CI does, or in a container:

```shell
docker run --rm -v "$PWD":/src -w /src golang:1.27.1 \
  go test -gcflags=all=-l ./controllers/...
```

The suites mock `envtest`'s start and stop, so no Kubernetes binaries are needed.

## Run it against a local cluster

A k3d cluster of your own, with its kubeconfig in a file, so your default context is left alone:

```shell
k3d cluster create tf-dev --wait --kubeconfig-update-default=false
k3d kubeconfig write tf-dev --output ./tf-dev.kubeconfig
export KUBECONFIG=$PWD/tf-dev.kubeconfig
```

Install the CRDs and run the controller on your machine:

```shell
make install
make run
```

Run from your machine, the controller has no chart setting its environment, so it falls back to the built-in images and keeps each Configuration's state in the Configuration's own namespace. Apply a Configuration that needs no credentials, from another shell:

```shell
kubectl apply -f examples/random/configuration_random.yaml
kubectl get configuration -w
```

Stop `make run` with Ctrl-C, then `kubectl delete -f examples/random/configuration_random.yaml` once it's running again, or the finalizer holds the Configuration.

## End-to-end tests

The e2e tests apply the `examples/random/` Configurations to a cluster running the chart and check the results. CI builds the image, loads it into kind, installs the chart from `./chart`, then runs `make configuration`. The same on k3d:

```shell
docker build -t oamdev/terraform-controller:e2e .
k3d image import oamdev/terraform-controller:e2e -c tf-dev
helm upgrade --install terraform-controller ./chart -n terraform --create-namespace \
  --set image.tag=e2e --set image.pullPolicy=IfNotPresent --set backend.namespace=terraform --wait
TERRAFORM_BACKEND_NAMESPACE=terraform make configuration
```

Leave `make e2e` alone: it also runs `make alibaba`, which needs Alibaba Cloud credentials.

## Clean up

```shell
k3d cluster delete tf-dev
```

Next: [Pull Requests and Releases](pull-requests.md).
