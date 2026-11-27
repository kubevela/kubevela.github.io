---
title: Addon Reference
---

This page lists every file and directory an addon can carry, and every field of `metadata.yaml`. To build an addon step by step, start with [Make Your Own Addon](make-your-own-addon.md).

## Layout

```shell
my-addon/
├── metadata.yaml          # required
├── README.md              # required
├── template.cue           # or template.yaml
├── parameter.cue
├── NOTES.cue
├── resources/
│   ├── xxx.cue
│   └── xxx.yaml
├── definitions/
├── schemas/
├── godef/
│   ├── module.yaml
│   └── go.mod
├── crates/
│   ├── _imports.cue
│   └── <crate-name>/
├── config-templates/
└── views/
```

| Path | Required | What it holds |
| --- | --- | --- |
| `metadata.yaml` | yes | The addon's name, version, dependencies and requirements. See [metadata.yaml](#metadatayaml). |
| `README.md` | yes | What the addon does, shown to users in VelaUX and the CLI. See [README.md](#readmemd). |
| `template.cue` or `template.yaml` | no | The Application that installs the addon's operator. See [Application files](#application-files). |
| `parameter.cue` | no | The parameters a user sets with `vela addon enable <name> key=value`. |
| `NOTES.cue` | no | A `notes` string printed after the addon is enabled. |
| `resources/` | no | Components (CUE) or Kubernetes objects (YAML) added to the addon's Application. |
| `definitions/` | no | Definitions in CUE or YAML, applied to the hub. See [Definitions](#definitions). |
| `schemas/` | no | UI schemas for the addon's definitions, read by VelaUX. See [UI schemas](#ui-schemas). |
| `godef/` | no | Definitions written in Go with defkit. See [Go definitions](#go-definitions-godef). |
| `crates/` | no | Crates the addon installs. See [Crates](#crates-crates). |
| `config-templates/` | no | [Config templates](/docs/reference/config-template). |
| `views/` | no | [VelaQL views](/docs/platform-engineers/system-operation/velaql). |

`vela addon init <name>` creates the required files and a sample of most of the rest.

## metadata.yaml

`metadata.yaml` describes the addon so the CLI and VelaUX can list it. An example:

```yaml
name: example
version: 1.0.0
description: Example addon.
icon: https://example.com/icon.png
url: https://example.com

tags:
  - only_example

deployTo:
  runtimeCluster: false

dependencies:
  - name: fluxcd
    version: ">= 1.0.0, < 3.0.0"

needNamespace:
  - example-system

system:
  vela: ">=v1.4.0"
  kubernetes: ">=1.19.0-0"

annotations:
  example.com/owner: platform-team

invisible: false
```

| Field | Required | Type | Usage |
| --- | --- | --- | --- |
| `name` | yes | string | The name of the addon. |
| `version` | yes | string | The version of the addon. Increase it on every change, following [SemVer](https://semver.org/). |
| `description` | yes | string | A description of the addon. |
| `icon` | no | string | URL of the icon shown in VelaUX. |
| `url` | no | string | The website of the project behind the addon. |
| `tags` | no | []string | Tags to organise and display the addon. |
| `dependencies[]` | no | array of objects | Addons this one depends on. KubeVela enables them before this addon. |
| `dependencies[].name` | yes | string | The name of the addon dependency. |
| `dependencies[].version` | no | string | A version constraint for the dependency, such as `">= 1.0.0, < 2.0.0"`. KubeVela picks the latest version that matches, or the latest version if no constraint is given. |
| `system.vela` | no | string | The vela-core versions the addon works with. Enabling it on any other version is refused, unless you pass `--skip-version-validating`. |
| `system.kubernetes` | no | string | The Kubernetes versions the addon works with. Enabling it on any other version is refused. |
| `deployTo.runtimeCluster` | no | bool | By default the addon is installed on the hub only. Set it to `true` to deliver it to every managed cluster too. Only read when the Application file is `template.yaml`. |
| `deployTo.disableControlPlane` | no | bool | Accepted in the file, but vela-core 1.12 doesn't read it, so setting it changes nothing. |
| `needNamespace` | no | []string | Namespaces to create wherever the addon is installed. Each one (other than `vela-system`) becomes a `raw` component of the addon's Application. |
| `uxPlugins` | no | map[string]string | [VelaUX plugins](/velaux/install) that come with the addon, as plugin name to download URL. |
| `annotations` | no | map[string]string | Free-form annotations for addon maintainers' own tooling. KubeVela doesn't read them. |
| `invisible` | no | bool | Set to `true` to hide the addon from VelaUX's addon list. It can still be enabled by name. |

## README.md

VelaUX shows the README to anyone about to enable the addon, so it should answer:

* What is the addon?
* Why would you use it? The use cases.
* How do you use it, as an end user? An end-to-end example is best.
* What does it install? The definitions and the controllers behind them.

An [experimental addon](https://github.com/kubevela/catalog/tree/master/experimental/addons) has no fixed rules for its README, but one that wants to be [verified](https://github.com/kubevela/catalog/tree/master/addons) is judged on it first.

## Definitions

`definitions/` holds ComponentDefinitions, TraitDefinitions, PolicyDefinitions and WorkflowStepDefinitions, as YAML manifests or as [CUE definitions](/docs/getting-started/definition). Enabling the addon renders the CUE files and applies everything here to the hub.

:::note
Definitions are applied to the hub only, never to managed clusters.
:::

## UI schemas

`schemas/` holds [UI schema](/velaux/extend/ui-schema) files that change how VelaUX shows a definition's parameters. Each file becomes a ConfigMap in `vela-system`, named after the file up to its first `.`, and VelaUX only looks up ConfigMaps named `<type>-uischema-<name>`. So the file name must be:

```
<type>-uischema-<name>.yaml
```

where `<type>` is `component`, `trait`, `workflowstep`, `policy`, `config` or `addon`, and `<name>` is the definition, config template or addon it belongs to. For example, the `fluxcd` addon ships `schemas/component-uischema-helm.yaml` for its `helm` component.

A file with any other name is installed but never read. That includes the `schemas/myschema.yaml` sample that `vela addon init` creates, so rename it before you rely on it.

## Go definitions (`godef/`)

`godef/` is a Go module of definitions written with [defkit](/docs/platform-engineers/defkit/overview), instead of or beside the CUE ones in `definitions/`. It holds `module.yaml`, `go.mod` and the Go sources.

When you enable the addon from a local directory, the CLI compiles the Go definitions to CUE and installs them with the rest. A Go definition with the same name as one in `definitions/` is refused, unless you pass `--override-definitions`, in which case the Go one wins.

`vela addon init <name> --godef` creates the module. Name the definitions to stub out with `--components`, `--traits`, `--policies` and `--workflowsteps`, each a comma-separated list:

```shell
vela addon init my-addon --godef --components api --traits scaler
```

## Crates (`crates/`)

`crates/` lists the [crates](/docs/next/platform-engineers/crate/intro) the addon installs, through its own Application. Crates need the `EnableCrateComponent` feature gate on vela-core; with it off, enabling an addon that carries them fails.

- `crates/_imports.cue` names crates to fetch from a crate registry, each with an optional `registry` and an exact `version` (no ranges).
- Every directory directly under `crates/` is an inline crate bundled with the addon, and must have a `_crate.cue`. A directory without one is refused.

A crate name can be declared once per addon, either as an import or inline.

## Application files

Most addons install an operator, and the operator is described as an ordinary KubeVela [Application](/docs/getting-started/core-concept). That Application comes from two places:

- `template.yaml` or `template.cue`: the Application itself, with any components, policies and workflow.
- `resources/`: extra components (CUE files) or Kubernetes objects (YAML files) added to it.

A YAML template is the simplest way to write a fixed Application. A CUE template can read the addon's parameters, so one addon can install different operators and definitions depending on what the user asks for.

- [Write the Application in YAML](addon-application.md#write-it-in-yaml)
- [Write the Application in CUE](addon-application.md)

The [example addon](https://github.com/kubevela/catalog/tree/master/experimental/addons/example) in the catalog uses every file on this page.

## Config templates (`config-templates/`)

`config-templates/` holds [config templates](/docs/reference/config-template), installed when the addon is enabled.

## Views (`views/`)

`views/` holds [VelaQL views](/docs/platform-engineers/system-operation/velaql), installed as ConfigMaps when the addon is enabled.
