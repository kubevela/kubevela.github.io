---
title: CLI and Go
---

Running definition tests: the `vela def test` command, its output and exit codes, and the Go
suite that runs the same cases.

## vela def test

```bash
vela def test [PATH] [flags]
```

Runs the `*_test.cue` files at `PATH`, a file or a directory searched recursively. `PATH` defaults to
the current directory.

| Flag | Description |
| --- | --- |
| `-v`, `--verbose` | List passing cases as well as failures. |
| `--json` | Print results as JSON. See [JSON output](#json-output). |
| `--label-filter` | Run only cases whose labels match this Ginkgo label query, such as `'status && !slow'`. |
| `--focus` | Run only cases whose full text (`<file> <definition> / <case>`) matches this regular expression. Repeatable. |
| `--skip` | Skip cases whose full text matches this regular expression. Repeatable. |
| `--focus-file` | Run only cases in files matching this regular expression, optionally with lines: `file:12`, `file:3,9` or `file:1-20`. Repeatable. |
| `--check-pending` | Run `@pending` cases too, and fail any that now pass, since their marker is stale. |
| `--fail-on-pending` | Fail if any selected case is `@pending`. |
| `--upgrade` | Run definitions through KubeVela's CUE upgrader, with every rewrite pass on, instead of testing them as written. |
| `--fail-on-upgrade` | Fail `@upgrade` cases that fail as written, instead of retrying them upgraded. |
| `--envtest-assets` | Directory holding `etcd` and `kube-apiserver` for step and source cases. Defaults to `KUBEBUILDER_ASSETS`. |
| `--crds` | CRD file or directory to install for step and source cases. Defaults to the vela-core chart's, when one is found above the test files. Repeatable. |

Render, status, policy and addon cases contact no cluster. Step and source cases run against a local
API server with no controllers, started on first use and stopped on exit; install its binaries with
[`setup-envtest`](https://pkg.go.dev/sigs.k8s.io/controller-runtime/tools/setup-envtest)
(`setup-envtest use -p path` prints their directory).

### Exit codes

| Code | Meaning |
| --- | --- |
| `0` | Every selected case passed, or is pending or upgraded. |
| `1` | A case failed, a test file failed to load, a pending case passed under `--check-pending`, a case was pending under `--fail-on-pending`, or the command itself failed. |
| `128 + n` | Interrupted by signal `n`, as a shell reports it; the test server is stopped first. |

### JSON output

`--json` prints an array with one object per case, and one per test file that failed to load:

```json
[
  {
    "file": "web_test.cue",
    "line": 21,
    "definition": "web",
    "test": "component-render",
    "case": "runs one replica by default",
    "labels": ["component", "render"],
    "passed": true
  }
]
```

| Field | Present | Description |
| --- | --- | --- |
| `file`, `line` | always; `line` for cases | Where the case or file is. |
| `definition`, `test`, `case`, `labels` | for cases | The definition's name, the function (`component-render`, `workflowstep-exec`, ...), the case's description, and its labels. |
| `passed` | always | Whether the case passed. |
| `failures` | when there are any | Why it failed, or why the file failed to load. |
| `load` | for a file that failed to load | `true`. |
| `skipped` | for a case the filters did not select | `true`. |
| `pending` | for a `@pending` case | `true`. |
| `upgraded` | for an `@upgrade` case that passed once upgraded | `true`. |
| `reason` | with `pending` or `upgraded` | The marker's reason. |

## Go: ginkgotest

`github.com/oam-dev/kubevela/pkg/definition/cuetest/ginkgotest` runs the same cases from a Go suite.

| Function | Description |
| --- | --- |
| `DescribeDefinitions(path, opts...)` | Registers an ordered container for `path`, with a container per test file and a spec per case, labelled with the case's labels and located at the case. A `@pending` case is a pending spec, and an `@upgrade` case that passes once upgraded carries its reason as a report entry. Call it at package level. |
| `WithEnvtestAssets(dir)` | The directory holding `etcd` and `kube-apiserver`, in place of `KUBEBUILDER_ASSETS`. |
| `WithCRDs(paths...)` | CRD files or directories to install, in place of the vela-core chart's. |
| `WithUpgrades()` | Run definitions through the CUE upgrader, with every rewrite pass on. |
| `WithFailOnUpgrade()` | Fail `@upgrade` cases that fail as written, instead of retrying them upgraded. |

The suite's `Test` function must set `cuex.EnableExternalPackageForDefaultCompiler = false` before
`RunSpecs`: renders read CueX's compiler, which otherwise loads external packages from the
kubeconfig's cluster. A path's cases run in order on one process; under `ginkgo -p`, separate paths
run on separate processes. See [Running tests in CI](./definition-testing.md#running-tests-in-ci) for
a complete suite.
