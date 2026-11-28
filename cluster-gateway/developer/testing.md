---
title: Testing
description: Run cluster-gateway's unit tests with envtest, and its e2e suite against a real cluster.
---

## Unit tests

```shell
make test
```

That regenerates code, runs `go fmt` and `go vet`, then `go test ./pkg/... -coverprofile cover.out`. It takes under a minute once the modules are downloaded.

The `VirtualCluster` tests in `pkg/apis/cluster/v1alpha1` start a real kube-apiserver and etcd with envtest, so they need the Kubernetes 1.37 test binaries, found through `KUBEBUILDER_ASSETS`:

```shell
go install sigs.k8s.io/controller-runtime/tools/setup-envtest@release-0.25
export KUBEBUILDER_ASSETS="$(setup-envtest use 1.37.x -p path)"
make test
```

```console
ok  	github.com/oam-dev/cluster-gateway/pkg/addon/controllers	0.804s	coverage: 0.4% of statements
ok  	github.com/oam-dev/cluster-gateway/pkg/apis/cluster/v1alpha1	5.254s	coverage: 58.6% of statements
ok  	github.com/oam-dev/cluster-gateway/pkg/featuregates	0.432s	coverage: 95.7% of statements
ok  	github.com/oam-dev/cluster-gateway/pkg/generated/clientset/versioned/typed/cluster/v1alpha1	1.818s	coverage: 71.4% of statements
ok  	github.com/oam-dev/cluster-gateway/pkg/util/cert	2.181s	coverage: 32.9% of statements
ok  	github.com/oam-dev/cluster-gateway/pkg/util/exec	2.455s	coverage: 98.6% of statements
ok  	github.com/oam-dev/cluster-gateway/pkg/util/loopback	2.724s	coverage: 100.0% of statements
```

`setup-envtest@release-0.25` matches the controller-runtime in `go.mod` and builds with Go 1.27.1; `@latest` may need a newer Go. Without `KUBEBUILDER_ASSETS`, envtest looks in `/usr/local/kubebuilder/bin`, and the `v1alpha1` package fails in its `BeforeSuite` with `unable to start the controlplane ... fork/exec /usr/local/kubebuilder/bin/etcd: no such file or directory`.

To run one package, or one test, skip the Makefile:

```shell
go test ./pkg/apis/cluster/v1alpha1/ -run TestProxyHandler -v
```

Most of the gateway's behaviour is in `pkg/apis/cluster/v1alpha1`: the Secret conversion (`clustergateway_types_secret_test.go`), the proxy handler and its identity exchange (`clustergateway_proxy_test.go`, `clustergateway_proxy_configuration_test.go`), and the round trippers (`transport_test.go`). A bug fix starts with a failing test there.

## E2E tests

The e2e suite runs against a real cluster with the gateway installed. With the cluster from [Run your build on k3d](./build-and-run.md#run-your-build-on-k3d) (the chart in `vela-system`, both feature gates on, and the `loopback` cluster registered):

```shell
make test-e2e
```

```console
go test -o bin/e2e -c ./e2e/
./bin/e2e --test-cluster=loopback
Running Suite: ClusterGateway e2e suite

Will run 7 of 7 specs
•••••••

Ran 7 of 7 Specs in 0.140 seconds
SUCCESS! -- 7 Passed | 0 Failed | 0 Pending | 0 Skipped
PASS
```

`make test-e2e` builds the `roundtrip` specs into `bin/e2e` and runs them against the cluster named by `--test-cluster`, using `KUBECONFIG`. They read the `loopback` ClusterGateway, write and read its health status (which is why `HealthinessCheck` has to be on), and probe it through the proxy.

| Target | Runs | Needs |
| --- | --- | --- |
| `make test-e2e` | `e2e/roundtrip` | The gateway and a registered `loopback` cluster |
| `make test-e2e-ocm` | `e2e/ocm` | OCM installed, the gateway installed through `charts/addon-manager`, as CI's `e2e-ocm-addon-cluster-gateway` job does with `clusteradm` |
| `make e2e-bench-binary` | Builds the `e2e/benchmark` suite, which creates, updates and deletes ConfigMaps through the proxy 100 times | Run the binary yourself, against a cluster |

The README calls the benchmark target `make e2e-benchmark-binary`; the Makefile's name is `e2e-bench-binary`.

