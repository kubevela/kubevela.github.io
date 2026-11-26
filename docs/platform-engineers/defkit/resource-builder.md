---
title: Resource Builder
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Resource builders are the fluent API for constructing Kubernetes resource manifests in Go. They produce the CUE that becomes the `output` / `outputs` blocks of a definition template. Path syntax supports dot-notation (`spec.replicas`), array indices (`containers[0]`), and bracket notation (`labels[app.oam.dev/name]`).

## Constructors

| Constructor | Description |
|---|---|
| `defkit.NewResource(apiVersion, kind string) *Resource` | Creates a typed Kubernetes resource builder. Chain `.Set()`, `.SetIf()`, `.If()/.EndIf()`, and `.SpreadIf()` to populate fields. Pass the result to `tpl.Output()` or `tpl.Outputs(name, r)`. |
| `defkit.NewResourceWithConditionalVersion(kind string) *Resource` | Creates a resource whose `apiVersion` is picked when the template renders. Chain `.VersionIf(condition, apiVersion)` clauses, one per version. Use it when a kind's API version depends on the cluster's Kubernetes version, read with `vela.ClusterVersion()`. |
| `defkit.FromTyped(obj runtime.Object) (*Resource, error)` / `defkit.MustFromTyped(obj) *Resource` | Convert a Go Kubernetes object into a `*Resource` for further chaining. |

## Resource Methods

| Method | Description |
|---|---|
| `.Set(path, value)` | Sets a field at the given path. Supports dot notation (`"metadata.name"`), array indexing (`"spec.containers[0].image"`), and bracket notation (`"metadata.labels[app.oam.dev/name]"`). |
| `.SetIf(cond, path, value)` | Conditionally sets a field only when the condition is true. Generates `if cond { path: value }`. |
| `.SpreadIf(cond, path, value)` | Merges a map into the struct at `path` when the condition is true, next to the fields other calls set there. Use it to add user labels beside fixed ones. The struct needs at least one field from `.Set()`: a spread into an otherwise empty struct is left out of the output, so use `.SetIf()` for that case. |
| `.If(cond)` / `.EndIf()` | Opens/closes a conditional block. All `.Set()` calls between are wrapped in a single `if cond { ... }`. Use when several fields share a guard. |
| `.Directive(path, directive)` | Adds a CUE directive comment at the given path (e.g. `Directive("spec.template.spec.volumes", "patchKey=name")`). The path must take a whole value; a list built element by element with `[0]` paths loses the directive. |
| `.VersionIf(cond, apiVersion)` | Sets the API version conditionally. Used with `NewResourceWithConditionalVersion()`. |
| `.ConditionalStruct(cond, path, fn)` | Emits an entire named sub-struct only when the condition is true. The closure receives an `*OutputStructBuilder` exposing `Set()` and `SetIf()`. |

:::caution
`.If()`/`.EndIf()` guards fields, not the struct around them. When fields of one struct sit under different conditions, the struct itself is always written, and comes out as `{}` when none of them hold. Use `.ConditionalStruct()` when the whole struct must be absent unless its condition is true.
:::

## ArrayBuilder Methods

`defkit.NewArray()` returns an `*ArrayBuilder` that produces a CUE list literal. Mix static, conditional, and comprehension-based entries in a single array.

| Method | Description |
|---|---|
| `.Item(elem)` / `.ItemIf(cond, elem)` | Adds a static / conditional element to the array. |
| `.ForEach(source, elem)` | For-comprehension over a source collection. |
| `.ForEachGuarded(guard, source, elem)` | Guarded comprehension: adds nothing when the guard is false. |
| `.ForEachWith(source, fn func(item *ItemBuilder))` | Callback iteration with access to item-builder methods. |
| `.ForEachWithVar(varName, source, fn)` | Named variable iteration: access the iteration variable by name. |
| `.ForEachWithGuardedFiltered(guard, filter, source, fn)` | Full combo: guarded + filtered comprehension. |
| `.ForEachWithGuardedFilteredVar(varName, guard, filter, source, fn)` | Full combo with named variable. |
| `.ForEachMapWith(source, fn func(entry *MapEntryBuilder))` | One array item per entry of a map-valued source. `entry.Key()` and `entry.Value()` read the entry; `Set`, `If`, `IfSet`, `IfNotSet`, `Let` and `SetDefault` build the item, as on `ItemBuilder`. |
| `.ForEachMapWithGuarded(guard, source, fn)` | Like `ForEachMapWith`, but adds nothing when the guard is false. |

### Element & Concat Helpers

| Helper | Description |
|---|---|
| `defkit.NewArrayElement()` | Builds one element object. Methods: `.Set(key, value)`, `.SetIf(cond, key, value)`, `.PatchKeyField(field, key, value)`. Also used for nested structs inside an element. |
| `defkit.ArrayConcat(left, right Value)` | Joins two lists with `list.Concat([left, right])` and adds the `list` import for you (e.g. a builder-emitted list followed by a parameter array). Both lists must exist when the template renders, so guard an optional one. |

### ItemBuilder (`ForEachWith` callback)

The closure passed to `.ForEachWith*()` receives an `*ItemBuilder` with these methods: `Var()` (access iteration variable via `.Ref()`, `.Field(name)`), `Set(field, value)`, `If(cond, fn)`, `IfSet(field, fn)`, `IfNotSet(field, fn)`, `Let(name, value)`, `SetDefault(field, defValue, typeName)`, `FieldExists(field)`, `FieldNotExists(field)`. See [ForEachWith / ItemBuilder](./collections-api.md#per-item-builder-foreachwith) for the per-element builder pattern.

## List Comprehensions

Three ways to build CUE list comprehensions from array parameters or let-bound arrays.

| Helper | Description |
|---|---|
| `defkit.Each(param).Map(FieldMap)` | Iterates a parameter and maps each item using the given field map. |
| `defkit.From(param)` | Supports chained transformations: `.Filter(cond)`, `.Map(FieldMap)`, `.Dedupe(field)`, `.Guard(cond)`. See [Build Lists and Maps from Parameters](./collections-api.md) for every operation. |
| `defkit.ForEachIn(source).MapFields(FieldMap)` | Iterates any list value, such as a `LetVariable` (a let-bound array) or `defkit.ParamRef(...)`. |

## Field Helpers

| Helper | Description |
|---|---|
| `defkit.FieldRef(name)` | References the named field from the current iteration element. |
| `defkit.OptionalFieldRef(name)` | Like `FieldRef`, but the field is written only when the element has it. |
| `defkit.FieldMap{...}` | A `map[string]Value` specifying field-to-value mappings for comprehension output. |
| `defkit.FieldEquals(field, value)` | Produces a filter predicate for `defkit.From().Filter()`. |

## Helper Builder

See [Template helpers](./collections-api.md#template-helpers-tplhelper) for `tpl.Helper()`, `tpl.AddLetBinding()`, and related let-variable APIs.

## Example

Let's build a `scalable-service` component: a `Deployment` with a `HorizontalPodAutoscaler`, plus a `Service` when the user declares ports and a `ServiceAccount` when they name one. Building on the `my-platform` module scaffolded in [Quick Start](./quick-start.md), drop the file below into `my-platform/components/`.

What each part of the template shows:

| Part of the output | Builders used |
|---|---|
| Deployment labels, annotations, resources | `Set`, `SetIf`, `If`/`EndIf`, and `SpreadIf` to merge user labels with the selector label on the pod template |
| Pod volumes | `Each(...).Map(...)` with `MapVariant`, so each volume gets an `emptyDir`, `configMap` or `secret` source by its `type`; `Directive` marks the list `patchKey=name` so traits can patch a volume by name |
| Container volume mounts | `ArrayConcat` to follow the declared mounts with `extraVolumeMounts` |
| Container ports | `NewArray().ForEachWith(...)` with `ItemBuilder.IfSet` for the optional protocol |
| Pod security context | `ConditionalStruct`, so `securityContext` exists only when `nonRoot` is true |
| HPA metrics | `NewArray()` mixing `Item`, `ItemIf` and `ForEachGuarded`, with `NewArrayElement` for the nested metric bodies |
| Service ports | `Each(...).Map(...)` with `OptionalFieldRef` |
| ServiceAccount | `MustFromTyped`, starting from a typed `corev1.ServiceAccount` |

`list.Concat` fails when either list is missing, and both `volumes` and `extraVolumeMounts` are optional. So the template writes `volumeMounts` only when `volumes` is set, and writes it twice under opposite guards: with the extra mounts appended when they are set, and without them when they are not.

<Tabs groupId="defkit-example">
<TabItem value="go" label="Go (defkit)">

```go
package components

import (
    corev1 "k8s.io/api/core/v1"
    metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"

    "github.com/oam-dev/kubevela/pkg/definition/defkit"
)

func ScalableService() *defkit.ComponentDefinition {
    image := defkit.String("image").Description("Container image")
    cpu := defkit.String("cpu").Default("250m").Description("CPU request and limit for the container")
    memory := defkit.String("memory").Optional().Description("Memory request and limit for the container, for example 512Mi")
    labels := defkit.StringKeyMap("labels").Optional().Description("Labels for the Deployment and its pods")
    annotations := defkit.StringKeyMap("annotations").Optional().Description("Annotations for the Deployment")
    ports := defkit.List("ports").Optional().Description("Container ports, also exposed on a Service").
        WithFields(
            defkit.String("name").Description("Port name, for example http"),
            defkit.Int("port").Description("Port number"),
            defkit.String("protocol").Optional().Values("TCP", "UDP").Description("Port protocol, TCP when unset"),
        )
    volumes := defkit.List("volumes").Optional().Description("Volumes to mount in the container").
        WithFields(
            defkit.String("name").Description("Volume name"),
            defkit.String("mountPath").Description("Where to mount the volume in the container"),
            defkit.OneOf("type").
                Description("Volume source").
                Default("emptyDir").
                Variants(
                    defkit.Variant("emptyDir"),
                    defkit.Variant("configMap").WithFields(
                        defkit.Field("cmName", defkit.ParamTypeString),
                    ),
                    defkit.Variant("secret").WithFields(
                        defkit.Field("secretName", defkit.ParamTypeString),
                    ),
                ),
        )
    extraMounts := defkit.Array("extraVolumeMounts").Optional().Description("Extra volume mounts for the main container.")
    minReplicas := defkit.Int("minReplicas").Default(1).Description("Fewest replicas the autoscaler keeps")
    maxReplicas := defkit.Int("maxReplicas").Default(10).Description("Most replicas the autoscaler runs")
    targetCPU := defkit.Int("targetCPU").Default(80).Description("Average CPU utilisation, as a percentage of the request, that the autoscaler aims for")
    customMetrics := defkit.List("customMetrics").Optional().Description("Per-pod metrics to scale on, served by a custom metrics adapter").
        WithFields(
            defkit.String("name").Description("Metric name"),
            defkit.String("averageValue").Description("Target average value per pod, for example 100"),
        )
    nonRoot := defkit.Bool("nonRoot").Default(false).Description("Refuse to start the pods as root and apply the runtime's default seccomp profile")
    serviceAccount := defkit.String("serviceAccount").Optional().Description("Create a ServiceAccount with this name and run the pods as it")

    return defkit.NewComponent("scalable-service").
        Description("Deployment with a HorizontalPodAutoscaler and an optional Service").
        Workload("apps/v1", "Deployment").
        Params(image, cpu, memory, labels, annotations, ports, volumes, extraMounts,
            minReplicas, maxReplicas, targetCPU, customMetrics, nonRoot, serviceAccount).
        Template(scalableServiceTemplate)
}

func scalableServiceTemplate(tpl *defkit.Template) {
    vela := defkit.VelaCtx()
    image := defkit.String("image")
    cpu := defkit.String("cpu")
    memory := defkit.String("memory")
    labels := defkit.StringKeyMap("labels")
    annotations := defkit.StringKeyMap("annotations")
    ports := defkit.List("ports")
    volumes := defkit.List("volumes")
    extraMounts := defkit.Array("extraVolumeMounts")
    minReplicas := defkit.Int("minReplicas")
    maxReplicas := defkit.Int("maxReplicas")
    targetCPU := defkit.Int("targetCPU")
    customMetrics := defkit.List("customMetrics")
    nonRoot := defkit.Bool("nonRoot")
    serviceAccount := defkit.String("serviceAccount")

    // Each + MapVariant: one pod volume per entry, its source picked by type.
    podVolumes := defkit.Each(volumes).
        Map(defkit.FieldMap{"name": defkit.FieldRef("name")}).
        MapVariant("type", "emptyDir", defkit.FieldMap{
            "emptyDir": defkit.NestedFieldMap(defkit.FieldMap{}),
        }).
        MapVariant("type", "configMap", defkit.FieldMap{
            "configMap": defkit.NestedFieldMap(defkit.FieldMap{"name": defkit.FieldRef("cmName")}),
        }).
        MapVariant("type", "secret", defkit.FieldMap{
            "secret": defkit.NestedFieldMap(defkit.FieldMap{"secretName": defkit.FieldRef("secretName")}),
        })

    // ArrayConcat: a mount for each volume, followed by the extra mounts.
    mounts := defkit.Each(volumes).Map(defkit.FieldMap{
        "name":      defkit.FieldRef("name"),
        "mountPath": defkit.FieldRef("mountPath"),
    })
    allMounts := defkit.ArrayConcat(mounts, defkit.ParamRef("extraVolumeMounts"))

    // ForEachWith + ItemBuilder: protocol is written only when it is set.
    containerPorts := defkit.NewArray().ForEachWith(ports, func(item *defkit.ItemBuilder) {
        v := item.Var()
        item.Set("name", v.Field("name"))
        item.Set("containerPort", v.Field("port"))
        item.IfSet("protocol", func() { item.Set("protocol", v.Field("protocol")) })
    })

    dep := defkit.NewResource("apps/v1", "Deployment").
        Set("metadata.name", vela.Name()).
        SetIf(labels.IsSet(), "metadata.labels", labels).
        SetIf(annotations.IsSet(), "metadata.annotations", annotations).
        Set("spec.selector.matchLabels[app.oam.dev/component]", vela.Name()).
        Set("spec.template.metadata.labels[app.oam.dev/component]", vela.Name()).
        SpreadIf(labels.IsSet(), "spec.template.metadata.labels", labels).
        SetIf(serviceAccount.IsSet(), "spec.template.spec.serviceAccountName", serviceAccount).
        Set("spec.template.spec.containers[0].name", vela.Name()).
        Set("spec.template.spec.containers[0].image", image).
        Set("spec.template.spec.containers[0].resources.requests.cpu", cpu).
        Set("spec.template.spec.containers[0].resources.limits.cpu", cpu).
        If(memory.IsSet()).
        Set("spec.template.spec.containers[0].resources.requests.memory", memory).
        Set("spec.template.spec.containers[0].resources.limits.memory", memory).
        EndIf().
        SetIf(ports.IsSet(), "spec.template.spec.containers[0].ports", containerPorts).
        Directive("spec.template.spec.volumes", "patchKey=name").
        If(volumes.IsSet()).
        SetIf(extraMounts.IsSet(), "spec.template.spec.containers[0].volumeMounts", allMounts).
        SetIf(extraMounts.NotSet(), "spec.template.spec.containers[0].volumeMounts", mounts).
        Set("spec.template.spec.volumes", podVolumes).
        EndIf().
        ConditionalStruct(nonRoot.IsTrue(), "spec.template.spec.securityContext", func(b *defkit.OutputStructBuilder) {
            b.Set("runAsNonRoot", defkit.Lit(true))
            b.Set("seccompProfile", defkit.NewArrayElement().Set("type", defkit.Lit("RuntimeDefault")))
        })
    tpl.Output(dep)

    // NewArray mixing Item, ItemIf and ForEachGuarded for the HPA metrics.
    cpuMetric := defkit.NewArrayElement().
        Set("type", defkit.Lit("Resource")).
        Set("resource", defkit.NewArrayElement().
            Set("name", defkit.Lit("cpu")).
            Set("target", defkit.NewArrayElement().
                Set("type", defkit.Lit("Utilization")).
                Set("averageUtilization", targetCPU)))
    memoryMetric := defkit.NewArrayElement().
        Set("type", defkit.Lit("Resource")).
        Set("resource", defkit.NewArrayElement().
            Set("name", defkit.Lit("memory")).
            Set("target", defkit.NewArrayElement().
                Set("type", defkit.Lit("Utilization")).
                Set("averageUtilization", defkit.Lit(80))))
    podMetric := defkit.NewArrayElement().
        Set("type", defkit.Lit("Pods")).
        Set("pods", defkit.NewArrayElement().
            Set("metric", defkit.NewArrayElement().Set("name", defkit.Reference("m.name"))).
            Set("target", defkit.NewArrayElement().
                Set("type", defkit.Lit("AverageValue")).
                Set("averageValue", defkit.Reference("m.averageValue"))))
    metrics := defkit.NewArray().
        Item(cpuMetric).
        ItemIf(memory.IsSet(), memoryMetric).
        ForEachGuarded(customMetrics.IsSet(), customMetrics, podMetric)

    hpa := defkit.NewResource("autoscaling/v2", "HorizontalPodAutoscaler").
        Set("metadata.name", vela.Name()).
        Set("spec.scaleTargetRef.apiVersion", defkit.Lit("apps/v1")).
        Set("spec.scaleTargetRef.kind", defkit.Lit("Deployment")).
        Set("spec.scaleTargetRef.name", vela.Name()).
        Set("spec.minReplicas", minReplicas).
        Set("spec.maxReplicas", maxReplicas).
        Set("spec.metrics", metrics)
    tpl.Outputs("hpa", hpa)

    svcPorts := defkit.Each(ports).Map(defkit.FieldMap{
        "name":       defkit.FieldRef("name"),
        "port":       defkit.FieldRef("port"),
        "targetPort": defkit.FieldRef("port"),
        "protocol":   defkit.OptionalFieldRef("protocol"),
    })
    svc := defkit.NewResource("v1", "Service").
        Set("metadata.name", vela.Name()).
        Set("spec.selector[app.oam.dev/component]", vela.Name()).
        Set("spec.ports", svcPorts)
    tpl.OutputsIf(ports.IsSet(), "service", svc)

    // MustFromTyped: start the ServiceAccount from a typed Go object.
    sa := defkit.MustFromTyped(&corev1.ServiceAccount{
        TypeMeta: metav1.TypeMeta{APIVersion: "v1", Kind: "ServiceAccount"},
    }).
        Set("metadata.name", serviceAccount)
    tpl.OutputsIf(serviceAccount.IsSet(), "serviceaccount", sa)
}

func init() { defkit.Register(ScalableService()) }
```

</TabItem>
<TabItem value="cue" label="CUE (generated)">

```cue
import (
  "list"
)

"scalable-service": {
  type: "component"
  annotations: {}
  labels: {}
  description: "Deployment with a HorizontalPodAutoscaler and an optional Service"
  attributes: {
    workload: {
      definition: {
        apiVersion: "apps/v1"
        kind:       "Deployment"
      }
      type: "deployments.apps"
    }
  }
}
template: {
  output: {
    apiVersion: "apps/v1"
    kind:       "Deployment"
    metadata: {
      name: context.name
      if parameter["annotations"] != _|_ {
        annotations: parameter.annotations
      }
      if parameter["labels"] != _|_ {
        labels: parameter.labels
      }
    }
    spec: {
      selector: {
        matchLabels: {
          "app.oam.dev/component": context.name
        }
      }
      template: {
        metadata: {
          labels: {
            if parameter["labels"] != _|_ {
              parameter.labels
            }
            "app.oam.dev/component": context.name
          }
        }
        spec: {
          containers: [{
            name:  context.name
            image: parameter.image
            resources: {
              requests: {
                cpu: parameter.cpu
                if parameter["memory"] != _|_ {
                  memory: parameter.memory
                }
              }
              limits: {
                cpu: parameter.cpu
                if parameter["memory"] != _|_ {
                  memory: parameter.memory
                }
              }
            }
            if (parameter["volumes"] != _|_) && (parameter["extraVolumeMounts"] != _|_) {
              volumeMounts: list.Concat([[for v in parameter.volumes {
                {
                  mountPath: v.mountPath
                  name:      v.name
                }
              }], parameter.extraVolumeMounts])
            }
            if (parameter["volumes"] != _|_) && (parameter["extraVolumeMounts"] == _|_) {
              volumeMounts: [for v in parameter.volumes {
                {
                  mountPath: v.mountPath
                  name:      v.name
                }
              }]
            }
            if parameter["ports"] != _|_ {
              ports: [
                for v in parameter.ports {
                  name:          v.name
                  containerPort: v.port
                  if v.protocol != _|_ {
                    protocol: v.protocol
                  }
                },
              ]
            }
          }]
          if parameter["serviceAccount"] != _|_ {
            serviceAccountName: parameter.serviceAccount
          }
          if parameter["volumes"] != _|_ {
            // +patchKey=name
            volumes: [for v in parameter.volumes {
              {
                name: v.name
                if v.type == "emptyDir" {
                  emptyDir: {}
                }
                if v.type == "configMap" {
                  configMap: {
                    name: v.cmName
                  }
                }
                if v.type == "secret" {
                  secret: {
                    secretName: v.secretName
                  }
                }
              }
            }]
          }
        }
      }
    }
    if parameter.nonRoot {
      spec: {
        template: {
          spec: {
            securityContext: {
              runAsNonRoot: true
              seccompProfile: {
                type: "RuntimeDefault"
              }
            }
          }
        }
      }
    }
  }
  outputs: {
    hpa: {
      apiVersion: "autoscaling/v2"
      kind:       "HorizontalPodAutoscaler"
      metadata: {
        name: context.name
      }
      spec: {
        scaleTargetRef: {
          apiVersion: "apps/v1"
          kind:       "Deployment"
          name:       context.name
        }
        minReplicas: parameter.minReplicas
        maxReplicas: parameter.maxReplicas
        metrics: [
          {
            resource: {
              name: "cpu"
              target: {
                averageUtilization: parameter.targetCPU
                type:               "Utilization"
              }
            }
            type: "Resource"
          },
          if parameter["memory"] != _|_ {
            {
              resource: {
                name: "memory"
                target: {
                  averageUtilization: 80
                  type:               "Utilization"
                }
              }
              type: "Resource"
            }
          },
          if parameter["customMetrics"] != _|_ for m in parameter.customMetrics {
            {
              pods: {
                metric: {
                  name: m.name
                }
                target: {
                  averageValue: m.averageValue
                  type:         "AverageValue"
                }
              }
              type: "Pods"
            }
          },
        ]
      }
    }
    if parameter["ports"] != _|_ {
      service: {
        apiVersion: "v1"
        kind:       "Service"
        metadata: {
          name: context.name
        }
        spec: {
          selector: {
            "app.oam.dev/component": context.name
          }
          ports: [for v in parameter.ports {
            {
              name: v.name
              port: v.port
              if v.protocol != _|_ {
                protocol: v.protocol
              }
              targetPort: v.port
            }
          }]
        }
      }
    }
    if parameter["serviceAccount"] != _|_ {
      serviceaccount: {
        apiVersion: "v1"
        kind:       "ServiceAccount"
        metadata: {
          name: parameter.serviceAccount
        }
      }
    }
  }
  parameter: {
    // +usage=Container image
    image: string
    // +usage=CPU request and limit for the container
    cpu: *"250m" | string
    // +usage=Memory request and limit for the container, for example 512Mi
    memory?: string
    // +usage=Labels for the Deployment and its pods
    labels?: [string]: string
    // +usage=Annotations for the Deployment
    annotations?: [string]: string
    // +usage=Container ports, also exposed on a Service
    ports?: [...{
      // +usage=Port name, for example http
      name: string
      // +usage=Port number
      port: int
      // +usage=Port protocol, TCP when unset
      protocol?: "TCP" | "UDP"
    }]
    // +usage=Volumes to mount in the container
    volumes?: [...{
      // +usage=Volume name
      name: string
      // +usage=Where to mount the volume in the container
      mountPath: string
      // +usage=Volume source
      type: *"emptyDir" | "configMap" | "secret"
      if type == "configMap" {
        cmName: string
      }
      if type == "secret" {
        secretName: string
      }
    }]
    // +usage=Extra volume mounts for the main container.
    extraVolumeMounts?: [...]
    // +usage=Fewest replicas the autoscaler keeps
    minReplicas: *1 | int
    // +usage=Most replicas the autoscaler runs
    maxReplicas: *10 | int
    // +usage=Average CPU utilisation, as a percentage of the request, that the autoscaler aims for
    targetCPU: *80 | int
    // +usage=Per-pod metrics to scale on, served by a custom metrics adapter
    customMetrics?: [...{
      // +usage=Metric name
      name: string
      // +usage=Target average value per pod, for example 100
      averageValue: string
    }]
    // +usage=Refuse to start the pods as root and apply the runtime's default seccomp profile
    nonRoot: *false | bool
    // +usage=Create a ServiceAccount with this name and run the pods as it
    serviceAccount?: string
  }
}
```

</TabItem>
</Tabs>

Reproduce the generated CUE with the commands below. The tab shows the file after `cue fmt`.

```shell
vela def validate-module ./my-platform
vela def gen-module ./my-platform -o ./generated-cue
```

Once the module is applied, an Application uses the component like this. The `frontend-nginx` ConfigMap must already exist in the Application's namespace. With no `extraVolumeMounts`, the container mounts the two volumes and nothing else; with no `customMetrics`, the autoscaler scales on CPU and memory.

```yaml title="app.yaml"
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: shop-frontend
spec:
  components:
    - name: frontend
      type: scalable-service
      properties:
        image: nginx:1.27
        memory: 256Mi
        labels:
          team: shop
        ports:
          - name: http
            port: 80
        volumes:
          - name: cache
            mountPath: /var/cache/nginx
          - name: site-config
            mountPath: /etc/nginx/conf.d
            type: configMap
            cmName: frontend-nginx
        maxReplicas: 5
```

## Related

- [ComponentDefinition](./definition-component.md): define workload types
- [Build Lists and Maps from Parameters](./collections-api.md): `Each`, `From` and their operations
- [Template helpers](./collections-api.md#template-helpers-tplhelper): `tpl.Helper()` and let-bindings
- [ForEachWith / ItemBuilder](./collections-api.md#per-item-builder-foreachwith): per-element builder pattern
