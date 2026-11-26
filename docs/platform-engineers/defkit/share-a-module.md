---
title: Share and Version a Module
---

A definition module is a Go module, so you share it the way you share any Go code: push it to a Git host, tag a release, and let other teams apply it by its module path. `vela def apply-module` downloads the module with `go mod download`, compiles it and applies its definitions, so the machine running it needs Go and access to the repository.

## Publish a version

Push the module to a repository whose path matches the `module` line of its `go.mod`, then tag it with a semantic version:

```shell
git tag v1.0.0
git push origin v1.0.0
```

A private repository works too, as long as Go can fetch it: set `GOPRIVATE` (for example `GOPRIVATE=github.com/myorg/*`) and give Git credentials for the host, the same as for any private Go dependency.

## Apply a published module

Name the module path and the version:

```shell
vela def apply-module github.com/myorg/definitions@v1.0.0
```

Or pass the version separately:

```shell
vela def apply-module github.com/myorg/definitions --version v1.0.0
```

Without a version, `apply-module` takes the latest one. Pin a version for anything you run more than once, so the same command always applies the same definitions. `vela def list-module`, `validate-module` and `gen-module` take a remote module the same way.

:::caution
`apply-module` runs a module's script hooks on the machine that runs it, as that user, with their kubeconfig. Review the `hooks/` of a module you didn't write before applying it, or pass `--skip-hooks`. See [Module Hooks](./module-hooks.md).
:::

## Choose what gets applied

| Flag | What it does |
|---|---|
| `--version`, `-v` | The version of a remote module to apply. |
| `--types`, `-t` | Apply only these definition types, comma-separated: `component`, `trait`, `policy`, `workflow-step`. |
| `--prefix`, `-p` | Put a prefix on every definition name, for example `--prefix myorg-`, so a module can sit beside definitions with the same names. |
| `--namespace`, `-n` | The namespace to apply the definitions to. Defaults to `vela-system`. |
| `--conflict`, `-c` | What to do when a definition of the same name already exists: `fail` (the default), `skip`, `overwrite`, or `rename`, which applies it as `<name>-1` (or the next free number). |
| `--ignore-placement` | Apply every definition, whatever the module's [placement](./cluster-placement.md) says about this cluster. |
| `--skip-hooks` | Run no hooks. |
| `--skip-pre-apply`, `--skip-post-apply` | Skip only the pre-apply or the post-apply hooks. |
| `--dry-run` | Show what would be applied, without changing the cluster. |
| `--stats` | Print timings and counts when it finishes. |

## Upgrade a module

To move a cluster to a new version, apply it with `--conflict overwrite`; without it, `apply-module` stops at the first definition that already exists:

```shell
vela def apply-module github.com/myorg/definitions@v1.1.0 --dry-run
vela def apply-module github.com/myorg/definitions@v1.1.0 --conflict overwrite
```

Each definition you change gets a new DefinitionRevision, as it would from `vela def apply`. Applications using it pick up the new version on their next reconcile, unless they pin a revision; see [Definition version control](../../end-user/definition-version-control.md).

## Related

- [Definition Modules](./modules.md): module layout, `module.yaml` and the `vela def` commands
- [Module Hooks](./module-hooks.md): run manifests and scripts around the apply
- [Cluster Placement](./cluster-placement.md): choose the clusters each definition applies to
