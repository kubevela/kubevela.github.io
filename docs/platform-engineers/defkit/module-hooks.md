---
title: Module Hooks
---

Module hooks are pre-apply and post-apply lifecycle actions declared in `module.yaml` and executed by `vela def apply-module`. They let you prepare the cluster before definitions land, and verify or notify after they land — without writing custom controllers.

Hooks come in two forms: **path hooks** (apply YAML manifests from a directory) and **script hooks** (run a shell script). Both can be marked optional, given a timeout, and — for path hooks — wait for resource readiness.

## Why Module Hooks?

Definitions rarely exist in isolation. A typical module needs a few things to be true *before* its `ComponentDefinition`s and `TraitDefinition`s can be applied, and a few things to be checked *after*:

- A target **namespace** must exist (and sometimes be labeled or annotated)
- A **CRD** that a trait patches must already be registered
- A **secret** or **ConfigMap** with credentials needs to be in place
- After applying, a **smoke test** should confirm the definitions actually register and are visible to applications

Module hooks let you encode these steps next to the definitions they support, so `vela def apply-module` runs setup → apply → verify in a single command.

:::caution Not transactional
A module apply is **not** atomic: there is no rollback. Definition failures during the apply phase are recorded but do not halt subsequent `post-apply` hooks, and a `post-apply` hook failure leaves already-applied definitions in place. See [Execution Order](#execution-order) for the exact semantics.
:::

## Declare hooks

Hooks are declared under `spec.hooks` in the module's `module.yaml`. For the module's other fields, see [module.yaml](./modules.md#moduleyaml).

```yaml title="module.yaml"
apiVersion: core.oam.dev/v1beta1
kind: DefinitionModule
metadata:
  name: defkit-demo
spec:
  description: |
    Minimal defkit demo module — one ComponentDefinition (simple-deploy)
    plus pre/post-apply hooks and module-wide placement constraints.
  maintainers:
    - name: Platform Team
      email: platform@example.com
  categories:
    - demo

  hooks:
    pre-apply:
      - path: hooks/pre
        wait: true
        timeout: 1m
      - script: hooks/pre/check-cluster.sh
        timeout: 30s

    post-apply:
      - script: hooks/post/smoke-test.sh
        timeout: 2m
        optional: true
```

### `Hook` fields

| Field | Type | Description |
|---|---|---|
| `path` | string | Directory (relative to the module root) containing `*.yaml`/`*.yml` manifests. Files are applied in alphabetical order — use numeric prefixes (`01-`, `02-`) to control ordering. Mutually exclusive with `script`. |
| `script` | string | Path (relative to the module root) of a shell script to execute. The script is chmod'd to `0755` before invocation. Mutually exclusive with `path`. |
| `wait` | bool | (Path hooks only) After applying, wait for the created/updated resources to become ready. Default `false`. |
| `waitFor` | string | (Path hooks only) Readiness condition. See [Waiting for Readiness](#waiting-for-readiness). Only used when `wait: true`. |
| `optional` | bool | When `true`, hook failure becomes a **warning** instead of an error; subsequent hooks continue to run. Default `false` (failure halts the module apply). |
| `timeout` | duration | Maximum time the hook may take. Parsed by Go's `time.ParseDuration` (e.g. `30s`, `2m`, `1h`). Invalid values silently fall back to the per-hook default. For path hooks, the timeout is enforced **only when `wait: true`** — it bounds the readiness wait, not the apply itself. Script hooks always honour `timeout`. |

## Hook Types

Each entry in `pre-apply` / `post-apply` is **either** a path hook **or** a script hook (set `path` xor `script`).

### Path Hooks — apply YAML manifests

Path hooks read every `.yaml` / `.yml` file under the named directory, parse multi-document YAML, and apply each resource via the Kubernetes API:

```yaml title="module.yaml (path hook)"
hooks:
  pre-apply:
    - path: hooks/pre        # directory under <module root>
      wait: true             # wait for resources to be ready
      timeout: 1m            # bounds the readiness wait only, not the apply phase (path hooks)
```

Inside that directory you can place anything that `kubectl apply -f` would accept:

```yaml title="hooks/pre/01-namespace.yaml"
apiVersion: v1
kind: Namespace
metadata:
  name: defkit-demo
  labels:
    app.kubernetes.io/managed-by: defkit-demo
    purpose: demo
```

**Behaviour details:**

- Files are applied in alphabetical order. Use numeric prefixes (`01-namespace.yaml`, `02-rbac.yaml`, `03-crd.yaml`) when ordering matters.
- Each file may contain multiple YAML documents (separated by `---`).
- For every resource whose `metadata.namespace` is empty, the executor sets it to the target namespace passed to `vela def apply-module`. The executor does not introspect whether the kind is namespace- or cluster-scoped — it just defaults the field. For cluster-scoped kinds (e.g. `Namespace`, `CustomResourceDefinition`), the API server silently strips the field on admission, so this is harmless in practice.
- If a resource already exists, the executor reads its `resourceVersion` and performs an update; otherwise it creates.

### Script Hooks — run a shell script

Script hooks execute an arbitrary shell script. The executor injects two environment variables and runs the script with `cwd` set to the module root.

:::caution
A script hook runs on the machine that runs `apply-module`, as that user, with their kubeconfig. `apply-module` also accepts remote modules (see [Share and Version a Module](./share-a-module.md)), so before applying one, review every script and manifest path its `spec.hooks` lists, wherever in the module they sit, or pass `--skip-hooks`.
:::

```yaml title="module.yaml (script hook)"
hooks:
  pre-apply:
    - script: hooks/pre/check-cluster.sh
      timeout: 30s
```

```bash title="hooks/pre/check-cluster.sh"
#!/usr/bin/env bash
# Pre-apply script hook. Defkit injects MODULE_PATH and NAMESPACE into the env.
set -euo pipefail

echo "[pre-apply] module=$MODULE_PATH  namespace=$NAMESPACE"
echo "[pre-apply] kubectl context: $(kubectl config current-context 2>/dev/null || echo 'none')"
echo "[pre-apply] kubevela controller pods:"
kubectl -n vela-system get pods -l app.kubernetes.io/name=vela-core --no-headers 2>/dev/null \
    || echo "  (no vela-system pods found — that's ok for the demo)"
```

**Environment available to the script:**

| Variable | Value |
|---|---|
| `MODULE_PATH` | Absolute path of the module root (the directory containing `module.yaml`). |
| `NAMESPACE` | Target namespace passed to `vela def apply-module --namespace <ns>` (defaults to `vela-system`). |
| Plus all variables from the parent `os.Environ()` (e.g. `KUBECONFIG`, `PATH`). |

**Execution details:**

- Working directory is `$MODULE_PATH` — relative paths resolve to the module root.
- On success, only `stdout` is printed (under `Output:`); `stderr` is captured but not displayed.
- On failure, the returned error includes the exit status plus both `stderr` and `stdout` (in that order), so script writers can use either stream for diagnostics.
- The executor `chmod 0755`s the script before running it, so you don't need to set the executable bit when authoring.

## Waiting for Readiness

For path hooks with `wait: true`, the executor polls each applied resource every **2 seconds** until it is ready (or the hook times out).

### Default readiness check (`waitFor` omitted)

When you don't provide `waitFor`, the executor inspects each resource's `status` field with this precedence:

1. **`status.conditions`** — if present, resource is ready when any condition with `type ∈ {Ready, Available, Established}` has `status: "True"`.
2. **`status.phase`** — if present, resource is ready when `phase ∈ {Running, Bound, Active}`. This handles Namespaces (`Active`), Pods (`Running`), and PersistentVolumes (`Bound`).
3. **No `status` at all** — assumed ready. This makes the default sensible for resources like ConfigMap or RBAC objects that have no observable status.

For the demo's `01-namespace.yaml`, the default check just works: the Namespace becomes ready when its `status.phase` transitions to `Active`.

### Custom `waitFor` — simple condition name

If `waitFor` matches the regex `^[A-Z][a-zA-Z]*$` (e.g. `Ready`, `Established`, `Available`), the executor looks for a condition with that exact `type` and `status: "True"`:

```yaml title="module.yaml (wait for a CRD to be Established)"
hooks:
  pre-apply:
    - path: hooks/pre/crds
      wait: true
      waitFor: Established   # wait for status.conditions[type=Established].status == "True"
      timeout: 2m
```

### Custom `waitFor` — CUE expression

If `waitFor` is anything else (contains spaces, operators, dots, etc.), it is evaluated as a **CUE expression** against the resource's JSON. The resource is the root context, so you can reference any field by path:

```yaml title="module.yaml (wait for replicas to converge)"
hooks:
  pre-apply:
    - path: hooks/pre/deployment
      wait: true
      waitFor: 'status.replicas == status.readyReplicas'
      timeout: 5m
```

```yaml title="module.yaml (wait for a phase)"
hooks:
  pre-apply:
    - path: hooks/pre/job
      wait: true
      waitFor: 'status.phase == "Running"'
      timeout: 5m
```

## Timeouts and Defaults

Each hook has its own timeout. When `timeout:` is omitted (or set to a string that fails `time.ParseDuration`), the executor falls back to the per-hook-type default:

| Constant | Default | Applies to |
|---|---|---|
| `DefaultScriptTimeout` | `30s` | Script hooks |
| `DefaultWaitTimeout` | `5m` | Path hooks with `wait: true` |
| `DefaultPollInterval` | `2s` | Readiness polling interval (not configurable per hook) |

Use Go duration syntax: `s`, `m`, `h`, `ms`, etc. — for example `45s`, `2m`, `1h30m`.

## Optional Hooks

Set `optional: true` to keep the module apply going even if the hook fails:

```yaml title="module.yaml (optional smoke test)"
hooks:
  post-apply:
    - script: hooks/post/smoke-test.sh
      timeout: 2m
      optional: true     # failure logs a Warning, does not halt
```

```bash title="hooks/post/smoke-test.sh"
#!/usr/bin/env bash
# Post-apply script hook. Marked optional in module.yaml — failure becomes a warning.
set -euo pipefail

echo "[post-apply] verifying simple-deploy ComponentDefinition is registered..."

if kubectl get componentdefinition simple-deploy -n vela-system >/dev/null 2>&1; then
    echo "[post-apply] OK — simple-deploy ComponentDefinition is present"
else
    echo "[post-apply] WARN — simple-deploy not found (may have been skipped by placement)"
    exit 1
fi
```

When this script exits non-zero, `vela def apply-module` prints `Warning: post-apply[0]: ... failed (optional): script failed: ...` and continues — useful for verification hooks that should not block a successful apply.

A non-optional hook failure, by contrast, halts the module apply: any remaining hooks and definitions in the same phase are skipped, and the command exits non-zero.

## Dry Run

`vela def apply-module --dry-run` reports what each hook *would* do without touching the cluster:

- **Path hooks** print one line per resource: `[dry-run] Would apply: KIND namespace/name`. The file is still parsed (so YAML syntax errors are caught), but `Create`/`Update` is skipped, and waits are skipped.
- **Script hooks** print `[dry-run] Would execute: hooks/pre/check-cluster.sh`. The script is **not** executed and `chmod` is **not** performed.

Dry-run is the recommended way to validate a `module.yaml` after editing hooks.

## Execution Order

For a single phase (`pre-apply` or `post-apply`), hooks run sequentially in the order they appear in `module.yaml`. The execution sequence for `vela def apply-module` is:

1. Resolve module (`module.yaml`, placement constraints, definition discovery)
2. Run **`pre-apply`** hooks in order — abort on first non-optional failure
3. Apply all `ComponentDefinition` / `TraitDefinition` / `PolicyDefinition` / `WorkflowStepDefinition` resources (skipping those filtered out by placement)
4. Run **`post-apply`** hooks in order — abort on first non-optional failure

If step 2 fails (a non-optional pre-apply hook errors), steps 3 and 4 are skipped and the CLI exits non-zero.

Step 3 is more forgiving: individual definition failures are **recorded** but do not halt the definitions loop or skip step 4 — post-apply hooks still run even when some definitions failed to apply. The one exception is `--conflict=fail`, where an already-existing definition causes the CLI to return early before reaching post-apply.

If step 4 fails (a non-optional post-apply hook errors), the CLI exits non-zero — but every definition that step 3 applied is left in place.

## Complete Example — Demo Module

A defkit module is just a Go module that registers one or more definitions and ships a `module.yaml` alongside them. The recommended on-disk layout puts each hook category in its own directory under `hooks/`:

```text title="module layout"
my-module/
├── module.yaml
├── go.mod
├── components/
│   └── simple_deploy.go        # defkit.NewComponent(...).Template(...) + init()/Register()
└── hooks/
    ├── pre/
    │   ├── 01-namespace.yaml   # applied first (alphabetical) by a `path:` hook
    │   └── check-cluster.sh    # NOT applied — only the YAML files in this dir are picked up
    └── post/
        └── smoke-test.sh
```

You can name the directories anything you like — defkit only cares about the values you write into the `path:` and `script:` fields of `module.yaml`. The layout above is convention, not requirement. Scaffold a new module with [Quick Start](./quick-start.md).

```yaml title="module.yaml"
apiVersion: core.oam.dev/v1beta1
kind: DefinitionModule
metadata:
  name: defkit-demo
spec:
  description: |
    Minimal defkit demo module — one ComponentDefinition (simple-deploy)
    plus pre/post-apply hooks and module-wide placement constraints.
  maintainers:
    - name: Platform Team
      email: platform@example.com
  categories:
    - demo

  hooks:
    pre-apply:
      # Path hook: apply YAML manifests from a directory (alphabetical order).
      # No `waitFor:` — the executor's default isResourceReady handles
      # Namespace.status.phase == "Active" out of the box.
      - path: hooks/pre
        wait: true
        timeout: 1m

      # Script hook: run a shell script. defkit injects $MODULE_PATH and $NAMESPACE.
      - script: hooks/pre/check-cluster.sh
        timeout: 30s

    post-apply:
      # Optional script hook: failure becomes a warning, not an error.
      - script: hooks/post/smoke-test.sh
        timeout: 2m
        optional: true
```

:::tip Mixing path hooks and script hooks in the same directory
The path hook `hooks/pre` only picks up `*.yaml` / `*.yml` files. The `check-cluster.sh` shell script that sits alongside `01-namespace.yaml` is **not** applied as a manifest — it only runs because the second hook entry references it explicitly as a `script:`. Keeping both in `hooks/pre/` is purely a filesystem convenience.
:::

## See Also

- [Cluster Placement](./cluster-placement.md) — filter which definitions run on which clusters (the other module-level concern in `module.yaml`).
- [Definition Modules](./modules.md): module layout, `module.yaml` fields and the `vela def` commands.
