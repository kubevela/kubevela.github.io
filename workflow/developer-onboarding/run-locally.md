---
title: Run Locally
description: "Run the vela-workflow controller from source against a k3d cluster, try a change with a WorkflowRun, and run the e2e suite the way CI does."
---

## Start a cluster

Any cluster works; these pages use [k3d](https://k3d.io). Write its kubeconfig to a file of its own and point `KUBECONFIG` at it, so nothing you do here reaches the cluster your default context names:

```shell
k3d cluster create workflow-dev --no-lb --k3s-arg "--disable=traefik@server:0"
export KUBECONFIG="$(k3d kubeconfig write workflow-dev)"
```

## Run the controller from source

From the repository root:

```shell
make core-install   # the CRDs from charts/vela-workflow/crds, and the vela-system namespace
make def-install    # the built-in step definitions, into vela-system
make run            # regenerate, then go run ./cmd against $KUBECONFIG
```

`make core-install` and `make def-install` end with:

```console
09:45:08 [ OK ] CRDs installed successfully
...
09:45:10 [ OK ] Built-in workflow step definitions installed successfully
```

and `make run`, once the generators are done, with the controller's log:

```console
go run ./cmd
...
"Starting workers" controller="workflowrun" controllerGroup="core.oam.dev" controllerKind="WorkflowRun" worker count=4
```

`make run` starts the controller in the foreground, with leader election and the admission webhook off. Leave it running and use a second terminal (with the same `KUBECONFIG`) to try a WorkflowRun:

```yaml title="hello.yaml"
apiVersion: core.oam.dev/v1alpha1
kind: WorkflowRun
metadata:
  name: hello
  namespace: default
spec:
  workflowSpec:
    steps:
      - name: say-hello
        type: print-message-in-status
        properties:
          message: hello from my build
```

```shell
kubectl apply -f hello.yaml
kubectl get workflowrun hello
kubectl get workflowrun hello -o jsonpath='{.status.steps[0].message}'
```

```console
NAME    PHASE       AGE
hello   succeeded   3s
hello from my build
```

Like `make test`, `make run` regenerates the CRDs and code first, so it can leave the same two changes in your tree: see [Generated files](build-and-test.md#generated-files).

Stop the controller with Ctrl-C. To pick up a code change, start `make run` again; `go run ./cmd` on its own skips the generators and starts quicker once they are up to date.

:::note
`make def-install` applies the definitions under `charts/vela-workflow/definitions/` with the chart's template lines stripped. After you change one, run it again, or `kubectl apply` that definition yourself.
:::

Pass `DEFINITION_NAMESPACE=<ns>` to both targets to create that namespace and install the definitions there instead of `vela-system`.

## Run the e2e suite

The e2e suite in `e2e/` runs against a cluster with the controller installed from the chart, built from your tree. CI does it in five steps:

```shell
make image-load                      # build Dockerfile.e2e as oamdev/vela-workflow:latest and import it into k3d
make e2e-setup-controller-pre-hook   # patch the chart so the controller writes coverage
make e2e-setup-controller            # helm install ./charts/vela-workflow with that image, CEL expressions on
make e2e-test                        # go test ./e2e
make end-e2e                         # stop the controller and copy its coverage to /tmp/e2e-profile.out
```

Three things to know when you run it yourself:

- **`make image-load` and `make end-e2e` assume k3d's default cluster**, `k3s-default`: `k3d image import` runs without `-c`, and `hack/e2e/end_e2e.sh` reads the container `k3d-k3s-default-server-0`. On a cluster with another name, build and import the image yourself, and skip `end-e2e` unless you want the coverage:

  ```shell
  docker build -t oamdev/vela-workflow:latest -f Dockerfile.e2e .
  k3d image import -c workflow-dev oamdev/vela-workflow:latest
  ```

- **The pre-hook edits `charts/vela-workflow/templates/workflow-controller.yaml` in place.** Put it back with `git checkout charts/` before you commit.
- **The suite installs into `vela-system`**, so don't run it on a cluster where the `make run` controller or another vela-workflow is running: two controllers would both reconcile the WorkflowRuns.

## Clean up

```shell
helm uninstall vela-workflow -n vela-system   # if you ran the e2e setup
k3d cluster delete workflow-dev
```
