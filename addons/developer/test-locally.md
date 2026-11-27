---
title: Test an Addon Locally
---

Everything you need to test an addon runs on your laptop: a throwaway [k3d](https://k3d.io) cluster with KubeVela on it, the addon's directory, and `vela addon enable` pointed at that directory. This page sets that up, then runs the same checks the catalog's CI runs on a pull request.

## 1. A cluster with KubeVela

```shell
k3d cluster create addon-dev
vela install --yes
```

`vela install` installs the vela-core release that matches your CLI. To test against another release, pass `-v`, for example `vela install -v v1.11.2 --yes`. The catalog's CI uses v1.11.0, so an addon meant for the catalog should work there too.

## 2. Render it without installing

Before anything touches the cluster, see what the addon renders. For the `podinfo` addon from [Make Your Own Addon](./make-your-own-addon.md):

```shell
vela addon enable ./podinfo --dry-run
```

```console
enabling addon by local dir: ./podinfo
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  annotations:
    addon.oam.dev/traitDefinitions: mytrait
  labels:
    addons.oam.dev/name: podinfo
    addons.oam.dev/registry: local
    addons.oam.dev/version: 6.11.2
  name: addon-podinfo
  namespace: vela-system
spec:
  components:
  - name: addon-podinfo
    properties:
      chart: podinfo
      repoType: oci
      url: oci://ghcr.io/stefanprodan/charts
      version: 6.11.2
    type: helm
  - name: myresource
    properties:
      objects:
      - apiVersion: v1
        kind: Namespace
        metadata:
          name: myns
    type: k8s-objects
status: {}
# ...then the TraitDefinition mytrait, and a ConfigMap each for the UI schema and the view
```

`--dry-run` prints the addon's Application, its definitions and its UI schemas as YAML and applies nothing. Parameters work as they do for a real enable: `vela addon enable ./podinfo --dry-run key=value`.

## 3. Enable it from the directory

```shell
vela addon enable ./my-addon
```

The addon's name comes from `metadata.yaml`, and `vela addon status my-addon` shows `local` as its registry. Dependencies aren't enabled for a local addon the way they are from a registry: enable each one under `dependencies` first, or the CLI stops with `you must first enable dependencies: [<names>]`.

After an edit, run the same command again: it re-renders the directory and updates what's on the cluster. You don't need to bump the version while you're iterating; the version only matters once the addon is published.

When something doesn't come up, the addon is an Application, so the usual tools apply:

```shell
vela status addon-my-addon -n vela-system
vela status addon-my-addon -n vela-system --tree --detail
```

## 4. Use it

Apply an Application that uses the addon's definitions, as a user would. If the addon is headed for the catalog, keep that Application: it belongs in `examples/<addon>/`, and an Application that should reach `running` belongs in `test/e2e-test/addon-test/definition-test/testdata/<addon>/`, where CI checks it.

## 5. Run the catalog's checks

From a clone of [kubevela/catalog](https://github.com/kubevela/catalog), with your addon in it, run what the `Addon-test` workflow runs. You need Go 1.27.1.

```shell
make check-addon-semver
go build -o addon-test test/e2e-test/addon-test/main.go
./addon-test $(git diff --name-only origin/master)
```

`addon-test` takes the changed files, checks that each changed addon's `metadata.yaml` changed with it, then enables every verified addon the change touches, against whatever cluster your kubeconfig points at. Run it on the throwaway cluster, not one you care about: it enables and disables addons. A missed version bump looks like this:

```console
changing file: addons/fluxcd/template.cue without upgrading the version of addon: fluxcd
```

It only enables addons under `addons/`. For an experimental addon it stops after the version check, so steps 2 to 4 are the test.

`make test` and `make build` in the catalog's `Makefile` run the legacy traits and workloads, which moved to `legacy/`, so they fail with `cd: ./traits/routetrait: No such file or directory`. Neither is part of CI; use the commands above.

## 6. Clean up

```shell
vela addon disable my-addon
k3d cluster delete addon-dev
```
