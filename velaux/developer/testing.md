---
title: Testing
description: VelaUX's frontend and server unit tests, the end-to-end suite, linting and code generation.
---

## Frontend

```shell
yarn lint
yarn test
```

`yarn test` runs the `@velaux/ui` tests with `ts-mocha`; on `main` it ends with `373 passing`.

## Server unit tests

The server's unit tests need three things running: envtest's API server and etcd, and the MySQL, PostgreSQL and MongoDB databases the datastore tests talk to.

### envtest

`make setup-test-server` installs kubebuilder and the envtest binaries into `/usr/local/kubebuilder/bin` with `sudo`. If you'd rather not, install them where `setup-envtest` keeps them and point the tests there, as CI does:

```shell
go install sigs.k8s.io/controller-runtime/tools/setup-envtest@v0.25.2
export KUBEBUILDER_ASSETS="$(setup-envtest use 1.37.0 -p path)"
```

Without either, every suite that starts a control plane fails in `BeforeSuite` with `fork/exec /usr/local/kubebuilder/bin/etcd: no such file or directory`.

### Databases

`docker-compose.test.yml` starts the three databases with the credentials CI uses:

```shell
make test-db-up      # MySQL 8.0 on 3306, PostgreSQL 11 on 5432, MongoDB 5.0 on 27017
make test-db-down    # stop and remove them
```

`docs/TESTING.md` in the repository lists the credentials and how to get past a port that's already taken.

### Run them

```shell
make unit-test-server-local
```

This runs `go test -gcflags=all=-l` over `./pkg/...` and `./cmd/...` and writes `coverage.txt`. The `-gcflags=all=-l` turns off inlining, which `gomonkey` needs to patch functions; leave it in when you run one package yourself:

```shell
go test -gcflags=all=-l ./pkg/server/utils/... ./pkg/server/infrastructure/datastore/kubeapi/...
```

Expected output:

```
ok  	github.com/kubevela/velaux/pkg/server/utils	3.998s
ok  	github.com/kubevela/velaux/pkg/server/utils/bcode	2.726s
?   	github.com/kubevela/velaux/pkg/server/utils/container	[no test files]
ok  	github.com/kubevela/velaux/pkg/server/utils/filters	1.717s
ok  	github.com/kubevela/velaux/pkg/server/infrastructure/datastore/kubeapi	4.738s
```

CI runs `make unit-test-server-ci` instead: the same packages, but `pkg/server/domain/service` through Ginkgo with `--procs=1 --focus=serial`, since its suite is meant to run serially.

On v1.9.5 the target is `make unit-test-server`, and it doesn't use the compose file: CI starts the databases itself.

## End-to-end tests

The e2e suite in `e2e-test/` starts a VelaUX server in the test process on `127.0.0.1:8001`, against whatever cluster `KUBECONFIG` points at, and drives it over the REST API. It expects that cluster to be set up the way CI sets it up:

```shell
k3d cluster create velaux-e2e
export KUBECONFIG=$(k3d kubeconfig write velaux-e2e)

make e2e-setup-core              # installs the vela CLI, KubeVela, and the fluxcd and vela-workflow addons
make start-addon-mock-server     # an addon registry for the addon specs, in the background
vela addon enable ./addon replicas=0
make e2e-server-test
```

:::caution
`make e2e-setup-core` pins its own versions (CLI v1.10.3, KubeVela v1.9.2, vela-workflow 0.6.0), and `make install-vela` pipes the install script into `bash`, replacing the `vela` on your `PATH`. On a cluster that already has KubeVela, skip it and enable the two addons yourself.
:::

CI also starts a second cluster, `worker`, for the multi-cluster specs, writing its kubeconfig to `/tmp/worker.kubeconfig`; without it those specs fail. The cloud cluster specs in `cluster_test.go` read Alibaba Cloud credentials from `ALIYUN_ACCESS_KEY_ID` and `ALIYUN_ACCESS_KEY_SECRET`. To run part of the suite, focus it:

```shell
go test ./e2e-test -ginkgo.focus "Test env rest api"
```

## Lint

```shell
make reviewable
```

Runs `go mod tidy`, `go fmt` and `goimports`, `go vet`, `staticcheck` and `golangci-lint` (v2.14.0 on `main`; the target installs it if it's missing). `make check-diff` runs the same and fails if any file changed, which is what CI checks.

## Code generation

The REST API's OpenAPI spec, `docs/apidoc/swagger.json`, is generated from the route definitions:

```shell
make build-swagger
```

It starts the server's bean container, so it needs a `KUBECONFIG` it can parse, though not a cluster it can reach; with none it stops with `invalid configuration: no configuration has been provided`. The committed spec isn't regenerated on every change and has fallen behind the routes on `main`, so expect the diff to carry more than your own change; commit it only when you change the API.

`yarn build-packages` also rewrites `packages/velaux-ui/rollup.build.css`, which is tracked. Don't commit that change unless you meant to change the styles.
