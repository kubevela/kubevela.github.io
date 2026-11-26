---
title: Code Conventions
---

In this section, you will find the code conventions for all kinds of code KubeVela project related. It's not necessary to learn all of them at once, but make sure you have read corresponding parts before you start to code.

- [Go Code Conventions](#go-code-conventions)
- [Bash or Script Conventions](#bash-or-script-conventions)
- [API Conventions](#api-conventions)
- [Testing Conventions](#testing-conventions)
- [Directory and File Conventions](#directory-and-file-conventions)
- [Logging Conventions](#logging-conventions)

## Go Code Conventions

  - [Go Code Review Comments](https://github.com/golang/go/wiki/CodeReviewComments)

  - [Effective Go](https://golang.org/doc/effective_go.html)

  - Know and avoid [Go landmines](https://gist.github.com/lavalamp/4bd23295a9f32706a48f)

  - Comment your code.
    - [Go's commenting conventions](https://go.dev/blog/godoc)
    - If reviewers ask questions about why the code is the way it is, that's a
      sign that comments might be helpful.

  - Command-line flags should use dashes, not underscores

  - API
    - According to RFC3986, URLs are "case sensitive". KubeVela uses snake_case for API URLs.
      - e.g.: `POST /v1/cloud_clusters`

  - Naming
    - Please consider package name when selecting an interface name, and avoid
      redundancy.

      - e.g.: `storage.Interface` is better than `storage.StorageInterface`.

    - Do not use uppercase characters, underscores, or dashes in package
      names.
    - Please consider parent directory name when choosing a package name.

      - so pkg/controllers/autoscaler/foo.go should say `package autoscaler`
        not `package autoscalercontroller`.
      - Unless there's a good reason, the `package foo` line should match
        the name of the directory in which the .go file exists.
      - Importers can use a different name if they need to disambiguate.

    - Locks should be called `lock` and should never be embedded (always `lock
      sync.Mutex`). When multiple locks are present, give each lock a distinct name
      following Go conventions - `stateLock`, `mapLock` etc.

## Bash or Script Conventions

  - https://google.github.io/styleguide/shell.xml

  - Ensure that build, release, test, and cluster-management scripts run on
    macOS

## API Conventions

- KubeVela follows the Kubernetes conventions

  - [API changes](https://github.com/kubernetes/community/blob/master/contributors/devel/sig-architecture/api_changes.md)

  - [API conventions](https://github.com/kubernetes/community/blob/master/contributors/devel/sig-architecture/api-conventions.md)
  
## Testing Conventions

- All new packages and most new significant functionality must come with unit
  tests

- Table-driven tests are preferred for testing multiple scenarios/inputs; for
  example, see [TestNamespaceAuthorization](https://git.k8s.io/kubernetes/test/integration/auth/auth_test.go)
  
- Unit tests must pass on Linux, which is what CI runs. The `vela` CLI must also
  build on Windows (CI checks it).

- Avoid waiting for a short amount of time (or without waiting) and expect an
  asynchronous thing to happen (e.g. wait for 1 seconds and expect a Pod to be
  running). Wait and retry instead.

- Significant features should come with integration (test/integration) and/or
  end-to-end (e2e/) tests.

- Including new vela cli commands and major features of existing commands

Please refer to [the principle of test](./principle-of-test.md) for more details.

## Directory and File Conventions

Where things live in [kubevela/kubevela](https://github.com/kubevela/kubevela):

| Path | What it holds |
| --- | --- |
| `apis/` | The API types (`core.oam.dev` and the others). |
| `cmd/core/` | The entry point of the core controller. |
| `pkg/` | The controller's packages: application reconcile, workflow providers, CUE rendering, addons and more. |
| `pkg/webhook/` | The admission webhooks. |
| `references/` | The `vela` CLI. |
| `vela-templates/definitions/` | The built-in X-Definitions, as CUE. |
| `charts/vela-core/` | The Helm chart, including the CRDs and the definitions generated from `vela-templates/definitions/`. |
| `test/e2e-*/` | The end-to-end suites, one directory per area. |

Definitions live in `vela-templates/definitions/`; `make manifests` regenerates `charts/vela-core/definitions` from them, so commit both.

- Avoid package sprawl. Find an appropriate subdirectory for new packages, and
  avoid general utility packages: name a package for what it does.

- All filenames should be lowercase. Go source files and directories use
  underscores, not dashes.

- Go dependencies are managed with [Go modules](https://go.dev/ref/mod).
  Third-party code must include its license.

## Logging Conventions

### Structured logging

We recommend using `klog.InfoS` to structure the log. The `msg` argument need start from a capital letter.
and name arguments should always use lowerCamelCase.

```golang
// func InfoS(msg string, keysAndValues ...interface{})
klog.InfoS("Reconcile traitDefinition", "traitDefinition", klog.KRef(req.Namespace, req.Name))
// output:
// I0605 10:10:57.308074   22276 traitdefinition_controller.go:59] "Reconcile traitDefinition" traitDefinition="vela-system/expose"
```

### Use `klog.KObj` and `klog.KRef` for Kubernetes objects

`klog.KObj` and `klog.KRef` can unify the output of kubernetes object.

```golang
// KObj is used to create ObjectRef when logging information about Kubernetes objects
klog.InfoS("Start to reconcile", "appDeployment", klog.KObj(appDeployment))
// KRef is used to create ObjectRef when logging information about Kubernetes objects without access to metav1.Object
klog.InfoS("Reconcile application", "application", klog.KRef(req.Namespace, req.Name))
```

### Logging Level

[This file](https://github.com/kubevela/kubevela/blob/master/pkg/controller/common/logs.go) contains KubeVela's log level,
you can set the log level by `klog.V(level)`.

```golang
// you can use klog.V(common.LogDebug) to print debug log
klog.V(common.LogDebug).InfoS("Successfully applied components", "workloads", len(workloads))
```

Looking for more details in [Structured Logging Guide](https://github.com/kubernetes/community/blob/master/contributors/devel/sig-instrumentation/migration-to-structured-logging.md#structured-logging-in-kubernetes).


## Linting and formatting

To ensure consistency across the Go codebase, we require all code to pass a number of linter checks.

To run all linters, use the `reviewable` Makefile target:

```shell script
make reviewable
```

The command will clean code along with some lint checks. Please remember to check in all changes after that.