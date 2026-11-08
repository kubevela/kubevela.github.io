---
title: Module Multi-Cluster Placement
---

In a multi-cluster setup, KubeVela runs on one cluster, the hub. The hub sends workloads to managed clusters. A module can send some of its objects to the managed clusters and keep other objects on the hub.

This page uses these words:

| Word | Meaning |
| --- | --- |
| Hub | The cluster where KubeVela runs. Its cluster name is `local`. |
| Managed cluster | A cluster that you added with `vela cluster join`. |
| Hub object | A module object that installs only on the hub. |
| Runtime object | A module object that installs on the clusters that the installer selects. |

## Why placement is necessary

KubeVela renders Applications on the hub, so the definitions must be on the hub. Some supporting objects must be on the cluster where the workload runs.

The [Crossplane example](./module-crossplane.md) shows this. An Application on the hub sends an `ObjectBucket` to a managed cluster. Crossplane on that cluster needs the provider, the functions, the XRD, the Compositions, and the EnvironmentConfig on the same cluster. If those objects are only on the hub, the bucket is never created.

![Module placement: the hub keeps the definitions and the hub objects, and the runtime objects go to the managed clusters that match region=east](../../resources/module/module-multicluster.png)

In this diagram, the installer selects the clusters with the label `region=east`. The hub step installs the definitions of lines `v1` and `v2` and the catalog ConfigMap on the hub. The runtime step installs the Crossplane objects on `east-1` and `east-2`. The cluster `west-1` does not match, so it receives no module objects. The Application `photos` uses a topology policy to send its `ObjectBucket` to the same clusters.

The purple boxes are module objects, and the green box holds the definitions. The blue boxes are Applications. The orange boxes are the objects that `photos` creates.

The module author and the installer each make one decision:

| Who | Decision | Where |
| --- | --- | --- |
| Module author | Which objects are hub objects, and which are runtime objects | Files and fields in the module |
| Installer | Which clusters receive the runtime objects | `placement` on the `type: module` component, or `vela module deploy` flags |

Definitions always install on the hub. Hub objects always install on the hub.

## Before you start

1. Use a KubeVela version that supports module placement, with `EnableModuleComponent` on. See [Module Registries](./module-registry.md#turn-the-feature-on).
2. Join the managed clusters and add labels. See [Lifecycle of Managed Cluster](../system-operation/managing-clusters.md).

   ```shell
   vela cluster join east-1.kubeconfig --name east-1
   vela cluster join east-2.kubeconfig --name east-2
   vela cluster labels add east-1 region=east
   vela cluster labels add east-2 region=east
   vela cluster list
   ```

   The hub must be able to open the server URL in that kubeconfig. A raw k3d kubeconfig failed until the hub could reach the API server address in the file.

3. Install Crossplane on each managed cluster before you install the module. The module sends the provider and the functions. After the provider is Healthy, create the credentials Secret and the `ClusterProviderConfig` on that cluster. See [Add the AWS credentials](./module-crossplane.md#add-the-aws-credentials).
4. Create the namespaces on each managed cluster. KubeVela does not create them:
   - The install namespace, if the runtime objects include namespaced objects.
   - The namespace of each Application that sends workloads to the cluster.

   `vela cluster join` creates only `vela-system`. See [The namespace of runtime objects](#the-namespace-of-runtime-objects).

### The namespace of runtime objects

:::caution Runtime objects and namespaces
Read these rules before you select an install namespace for a module with runtime objects.

- A runtime object that does not set `metadata.namespace` goes into the install namespace. The install namespace is the namespace of the installer Application. KubeVela also creates the definitions of the module in this namespace. The owned Application `module-<name>` stays in `vela-system`.
- The definitions stay on the hub, in the install namespace.
- KubeVela does not create the install namespace on a managed cluster. `vela-system` exists on each managed cluster, because `vela cluster join` creates it. Any other install namespace, for example `platform`, must exist on each managed cluster before you install.
- An object that sets `metadata.namespace` keeps that namespace.
:::

If the install namespace does not exist on a selected cluster, the runtime step fails. The hub step succeeds, so the definitions are available on the hub:

```text
Step deploy-module-runtime failed: function call error for deploy: Found 1 errors. [(error encountered in cluster west-1: Dispatch: pre-dispatch dryrun failed: Found 1 errors. [(cannot create object: namespaces "platform" not found)])]
```

To recover, create the namespace on the managed cluster. Then start the workflow of the owned Application again:

```shell
kubectl create namespace platform   # on the managed cluster
vela workflow restart module-aws-s3 -n vela-system
```

If you run `vela module deploy` again with the same flags, the failed step does not start again, and the command shows the same error.

## Mark the objects in a module

KubeVela sets the class of each object with these rules. The first rule that matches sets the class.

1. A definition stays on the hub. A runtime annotation on the definition does not move it.
2. The annotation `resource.oam.dev/placement` on the object. The value `hub` or `runtime` wins. This includes a file inside `hub/`.
3. The file is directly in `auxiliary/hub/` or in a line `auxiliary/hub/` directory. The object stays on the hub.
4. The `placement` field in `<line>/_version.cue`.
5. The `placement` field in `_module.cue`.
6. No earlier rule matches. The object stays on the hub.

![Placement decision order for one module object](../../resources/module/module-placement-decision.png)

Yellow is a decision, green stays on the hub, and blue uses the annotation, the line field, or the module field.

The only values are `hub` and `runtime`.

With rule 6, a module with no marks keeps all objects on the hub. Modules that you published before this feature continue to install on the hub only.

The check used package `pr7516demo` `0.1.3` with `--clusters east-1`. These rows are the objects from that package:

| Object | Marks | Where it went |
| --- | --- | --- |
| ComponentDefinition `pr7516demo-v1-permnote` | Annotation `runtime` | Hub |
| ConfigMap `pr7516-ann-runtime-hubmod` | Annotation `runtime`, and `_module.cue` placement `hub` | `east-1` |
| ConfigMap `pr7516-hubdir-ann-hub` | Annotation `hub`, and the file is in `auxiliary/hub/` | Hub |
| ConfigMap `pr7516-mod-unmarked` | No annotation. `_module.cue` placement `hub`. The line placement is `runtime`. | Hub |
| ConfigMap `pr7516-line-unmarked` | No annotation. The line placement is `runtime`. `_module.cue` placement `hub`. | `east-1` |

The line field won for `pr7516-line-unmarked`. The module field kept `pr7516-mod-unmarked` on the hub. The annotation `runtime` sent `pr7516-ann-runtime-hubmod` to `east-1` while the module field was `hub`. Both runtime objects went to `east-1`. `west-1` received none. All runtime objects of one install go to the same clusters.

### Example: the aws-s3 module for managed clusters

This is the module from the Crossplane example, with lines `v1` and `v2`. The provider, the functions, the XRD, the two Compositions, and the EnvironmentConfig must go to the managed clusters. A ConfigMap for a service catalog on the hub must stay on the hub.

```text
aws-s3/
  _module.cue                  placement: "runtime"
  auxiliary/
    packages.yaml              runtime, from _module.cue
    xrd.yaml                   runtime, from _module.cue
    settings.yaml              runtime, from _module.cue
    hub/
      catalog-entry.yaml       hub, from the hub/ directory
  v1/
    _version.cue
    auxiliary/
      composition.yaml         runtime, from _module.cue
    definitions/
      bucket.cue               hub. Definitions always install on the hub.
  v2/
    _version.cue
    auxiliary/
      composition.yaml         runtime, from _module.cue
    definitions/
      bucket.cue               hub. Definitions always install on the hub.
```

The list above is the full order. This example uses the module field and a `hub/` directory. It does not show every row.

`_module.cue`. Package `1.1.0` is package `1.0.1` of the Crossplane example, with the new `placement` field:

```cue
module:    "aws-s3"
version:   "1.1.0"
placement: "runtime"
```

`auxiliary/hub/catalog-entry.yaml`:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: aws-s3-catalog
data:
  owner: team-storage
  summary: S3 buckets through Crossplane
  types: aws-s3/v1/bucket, aws-s3/v2/bucket
```

To make one object a hub object in a runtime module, you can also add the annotation:

```yaml
metadata:
  annotations:
    resource.oam.dev/placement: hub
```

### Rules for the hub directory

- KubeVela reads only the files directly in `hub/`. It does not read subdirectories of `hub/`.
- KubeVela ignores other subdirectories of `auxiliary/`.
- An annotation on an object is stronger than the `hub/` directory. A file in `hub/` with `resource.oam.dev/placement: runtime` is a runtime object.

`vela module publish` shows a warning for each of these cases:

```text
Warning: auxiliary/skipped is not a recognized folder and is ignored; only hub/ is recognized under auxiliary/
Warning: auxiliary/hub/nested is not read; hub/ does not recurse into sub-folders
Warning: auxiliary/hub/keep-runtime.yaml is in hub/ but its own placement annotation is "runtime"; the annotation wins, so it is not hub-only
```

### Wrong values

`vela module publish` rejects a value that is not `hub` or `runtime`. An empty string is also wrong.

```text
Error: parse module: read placement: _module.cue: placement "spoke" is invalid, must be "hub" or "runtime"
Error: parse module: read placement: _module.cue: placement is empty, must be "hub" or "runtime"
Error: parse module: read auxiliary: auxiliary/xrd.yaml: placement "edge" is invalid, must be "hub" or "runtime"
```

A definition with a placement annotation is accepted. The annotation stays on the definition, and the definition installs on the hub.

## Select the clusters

### With the CLI

`--registry` names a module registry you already added. See [Add a registry](./module-registry.md#add-a-registry). These commands use `ghcr`.

```shell
# Send the runtime objects to two clusters by name.
vela module deploy aws-s3 --registry ghcr --version 1.1.0 --clusters east-1,east-2

# Send them to all clusters with a label.
vela module deploy aws-s3 --registry ghcr --version 1.1.0 --cluster-selector region=east

# Succeed when no cluster has the label yet.
vela module deploy aws-s3 --registry ghcr --version 1.1.0 --cluster-selector tier=gpu --allow-empty
```

`--cluster-selector` takes one or more `key=value` pairs, separated by commas. A cluster must have all the labels.

`--dry-run` shows the `placement` property:

```shell
vela module deploy aws-s3 --registry ghcr --version 1.1.0 --cluster-selector region=east -n platform --dry-run
```

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: module-aws-s3-deploy
  namespace: platform
spec:
  components:
  - name: aws-s3
    properties:
      module: aws-s3
      placement:
        clusterLabelSelector:
          region: east
      registry: ghcr
      version: 1.1.0
    type: module
status: {}
```

The CLI checks the flags before it applies the Application:

| Flags | Error |
| --- | --- |
| `--clusters` and `--cluster-selector` together | `--clusters and --cluster-selector cannot be used together` |
| `--allow-empty` with no `--clusters` and no `--cluster-selector` | `--allow-empty needs --clusters or --cluster-selector` |
| `--clusters 'east-1,'` | `placement clusters must not contain an empty name` |

### With an Application

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: aws-s3-module
  namespace: platform
spec:
  components:
    - name: aws-s3
      type: module
      properties:
        registry: ghcr
        version: "1.1.0"
        placement:
          clusterLabelSelector:
            region: east
          # Or select clusters by name:
          # clusters: [east-1, east-2]
          # Succeed when no cluster matches:
          # allowEmpty: true
```

Set `clusters` or `clusterLabelSelector`. Do not set both. The rule is the same as the rule of a [topology policy](../../end-user/policies/references.md#topology).

Admission rejects a wrong `placement`. The error ends with one of these messages:

| `placement` | Message |
| --- | --- |
| `clusters` and `clusterLabelSelector` | `placement must set clusters or clusterLabelSelector, not both.` |
| `{}` | `placement must set clusters or clusterLabelSelector.` |
| `clusters: []` | `placement clusters must name at least one cluster.` |

### Results

| `placement` | Runtime objects go to |
| --- | --- |
| Not set | The hub, with the hub objects |
| `clusters: [local]` | The hub |
| `clusters: [east-1, east-2]` | `east-1` and `east-2` only |
| `clusterLabelSelector: {region: east}` | All clusters with the label `region=east` |
| `clusterLabelSelector: {}` | All clusters, including the hub |
| A selector that matches no cluster | The runtime step fails. Objects already placed stay. |
| A selector that matches no cluster, with `allowEmpty: true` | The install succeeds. KubeVela deletes the runtime objects already placed. The tier shows `Not placed` and `no cluster selected`. |
| A cluster name that does not exist | No cluster. The runtime step fails. |

All runtime objects of one install go to the same clusters. To send different objects to different clusters, use two modules.

## What KubeVela creates

When the install has a placement, the owned Application `module-aws-s3` has two deploy steps:

1. `deploy-module-hub` installs the hub objects and the definitions on the hub.
2. `deploy-module-runtime` installs the runtime objects on the selected clusters.

Each tier splits by class. The runtime part keeps the tier name. The name of the hub part ends with `-hub`.

| Tier | Class | Contents in the example |
| --- | --- | --- |
| `aws-s3-aux` | runtime | Provider, Functions, XRD, EnvironmentConfig |
| `aws-s3-aux-hub` | hub | ConfigMap `aws-s3-catalog` |
| `aws-s3-v1-aux` | runtime | Composition `aws-s3-v1` |
| `aws-s3-v1-defs` | hub | ComponentDefinition `aws-s3-v1-bucket` |
| `aws-s3-v2-aux` | runtime | Composition `aws-s3-v2` |
| `aws-s3-v2-defs` | hub | ComponentDefinition `aws-s3-v2-bucket` |

The order inside a class does not change. A hub tier waits for the hub tier before it. A runtime tier waits for the runtime tier before it.

:::caution
The hub step runs first. The definitions are available on the hub before the runtime step finishes. An Application that uses the definitions at that time can wait for the runtime objects on the managed cluster. Wait until the install is complete before you deliver workloads.
:::

Look at the policies and the steps:

```shell
kubectl -n vela-system get application module-aws-s3 -o yaml
vela status module-aws-s3 -n vela-system
```

| Policy | Contents |
| --- | --- |
| `module-hub` | Topology that selects the cluster `local` |
| `module-hub-override` | Selects the hub tiers |
| `module-runtime` | Topology with the `placement` of the installer, with no changes |
| `module-runtime-override` | Selects the runtime tiers |

`vela status module-aws-s3 -n vela-system` shows the cluster of each tier. The Namespace column prints `vela-system` for every tier. The catalog ConfigMap and the definitions are in the install namespace. The column does not print the install namespace.

### Command output

`vela module deploy` waits for both steps. It shows one row for each tier, with no cluster column. With `--allow-empty`, a runtime tier that went to no cluster shows `Not placed` with the message `no cluster selected`. KubeVela also deletes the runtime objects already placed. A failed selector does not delete those objects.

Run `vela workflow restart module-<name> -n vela-system` to retry a failed runtime step. A second `vela module deploy` with the same flags does not run the failed step again.

If the runtime step fails, the command shows the failed step and returns an error:

```text
Step deploy-module-runtime failed: function call error for deploy: failed to find any cluster matches given labels
Error: application vela-system/module-aws-s3 is in phase workflowFailed: step deploy-module-runtime failed: function call error for deploy: failed to find any cluster matches given labels
```

```text
Step deploy-module-runtime failed: function call error for deploy: failed to get cluster east-9: virtualclusters.cluster.core.oam.dev "east-9" not found
```

## Use the definitions from managed clusters

The definitions are on the hub. Write the Application on the hub, in the install namespace, and send the workload with a [topology policy](../../case-studies/multi-cluster.md):

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: photos
  namespace: platform
spec:
  components:
    - name: photos
      type: aws-s3/v1/bucket
      properties:
        region: us-east-2
  policies:
    - name: east
      type: topology
      properties:
        clusterLabelSelector:
          region: east
```

KubeVela renders the `ObjectBucket` on the hub with `aws-s3-v1-bucket`. Then it sends the `ObjectBucket` to the `region=east` clusters. Crossplane on those clusters uses the Composition that the module installed there, and creates the S3 bucket in `us-east-2`.

The namespace `platform` must exist on each selected cluster. If it does not exist, the workflow step fails:

```text
function call error for deploy: Found 1 errors. [(error encountered in cluster east-1: Dispatch: pre-dispatch dryrun failed: Found 1 errors. [(cannot create object: namespaces "platform" not found)])]
```

Create the namespace, then run `vela workflow restart photos -n platform`.

Use the same selector for the module and for the Applications. If an Application sends a workload to a cluster that does not have the runtime objects, the workload does not work on that cluster.

## Change the clusters

Change `placement` on the installer Application, or run `vela module deploy` again with new flags:

```shell
vela module deploy aws-s3 --registry ghcr --version 1.1.0 --cluster-selector region=west
```

KubeVela installs the runtime objects on the new clusters. It deletes them from the clusters that the new placement does not select.

A label change on a cluster does not move an install. All topology policies work in this way.

- A cluster with a new matching label receives the runtime objects the next time the owned workflow runs. To run it now, restart the workflow:

  ```shell
  vela workflow restart module-aws-s3 -n vela-system
  ```

- A cluster that loses a matching label keeps its objects. A workflow restart does not delete them.

## Uninstall a module

Delete the installer Application. KubeVela deletes the owned Application and the module objects on the hub and on all managed clusters.

```shell
kubectl -n platform delete application aws-s3-module
```

## Next steps

- Place the modules of an addon: [Modules in Addons](./module-addon.md#place-the-modules-of-an-addon).
- Learn about multi-cluster Applications: [Multi Cluster Application](../../case-studies/multi-cluster.md).
