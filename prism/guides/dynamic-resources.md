---
title: Dynamic Resources
description: Defining a new Kubernetes API at runtime with a pair of CUE templates over an existing resource. Prism v1.7.0, chart install only.
---

Prism v1.7.0 can serve APIs you define at runtime. A ConfigMap in `vela-system` holds two CUE templates: an encoder, which turns an object of your new kind into an object of an existing kind, and a decoder, which turns it back. Prism registers the new resource as soon as the ConfigMap appears and removes it when the ConfigMap goes; every read and write goes to the existing resource underneath.

:::caution
This is experimental, and the `vela-prism` addon doesn't expose it: the addon registers no APIService for the group and gives Prism no access to the objects underneath. It works with the chart from Prism's repository at the `v1.7.0` tag, which registers `dynamic.prism.oam.dev` and grants Prism read and write on every resource in the cluster (`apiGroups: ["*"]`, `resources: ["*"]`). Read [Permissions](#permissions) before using it.
:::

## Turn it on

Install the chart from the tag, as in [Install](../getting-started/install.md#the-chart-at-v170). `dynamicAPI.enabled` is `true` by default.

Until at least one dynamic resource is defined, the group has nothing to serve and its APIService shows `False (FailedDiscoveryCheck)`. While any APIService is unavailable, the hub's namespace controller can't finish deleting namespaces: they stay `Terminating` with `Discovery failed for some groups, 1 failing: ... dynamic.prism.oam.dev/v1alpha1`. Define a resource straight after installing, or install with `--set dynamicAPI.enabled=false` if you don't want the feature.

## Define a resource

The source kind, your new API, is the `parameter` of the encoder; the target kind, what's stored, is the `parameter` of the decoder. Each template's `output` is the converted object. Prism reads the `apiVersion` and `kind` from each `parameter`, so both must be concrete.

This defines a namespaced `Note`, stored as a ConfigMap:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: note-api
  namespace: vela-system
data:
  encoder: |
    parameter: {
      apiVersion: "dynamic.prism.oam.dev/v1alpha1"
      kind:       "Note"
      metadata: {...}
      spec: text: string
    }
    output: {
      apiVersion: "v1"
      kind:       "ConfigMap"
      metadata:   parameter.metadata & {labels: "notes.example.com/note": "true"}
      data: text: parameter.spec.text
    }
  decoder: |
    parameter: {
      apiVersion: "v1"
      kind:       "ConfigMap"
      metadata: {...}
      data: {...}
    }
    output: {
      apiVersion: "dynamic.prism.oam.dev/v1alpha1"
      kind:       "Note"
      metadata:   parameter.metadata
      if parameter.data.text != _|_ {
        spec: text: parameter.data.text
      }
    }
```

```shell
kubectl apply -f note-api.yaml
kubectl wait --for=condition=Available apiservice/v1alpha1.dynamic.prism.oam.dev --timeout=2m
kubectl api-resources --api-group=dynamic.prism.oam.dev
```

```console
NAME    SHORTNAMES   APIVERSION                       NAMESPACED   KIND
notes                dynamic.prism.oam.dev/v1alpha1   true         Note
```

The resource name is the kind in lower case with an `s`, and the scope follows the target: a namespaced target gives a namespaced resource.

## Use it

```yaml
apiVersion: dynamic.prism.oam.dev/v1alpha1
kind: Note
metadata:
  name: release-plan
  namespace: team-a
spec:
  text: Ship on Thursday.
```

```shell
kubectl apply -f note.yaml
kubectl get notes -n team-a -l notes.example.com/note=true
kubectl get configmap release-plan -n team-a -o jsonpath='{.data.text}'
```

```console
note.dynamic.prism.oam.dev/release-plan created
NAME           CREATEAT
release-plan   2026-11-27T16:59:34Z
Ship on Thursday.
```

Update and delete go through the same way: `kubectl apply` with new text rewrites the ConfigMap, and `kubectl delete note release-plan -n team-a` deletes it.

## Limits

* **A list is the target's list, every item decoded.** Prism lists all ConfigMaps in the namespace, not just the ones that were Notes, which is why the encoder above adds a label and the `get` filters on it. Without the selector, `kubectl get notes` shows `kube-root-ca.crt` too. The decoder must accept every object of the target kind (hence the `if` around `spec`), or the whole list fails.
* **Only the `dynamic.prism.oam.dev` group reaches Prism.** The chart registers an APIService for that group, `v1alpha1`, alone. A template naming any other group defines a resource the hub never routes to.
* **No `watch`, and a plain table.** `kubectl get` shows the name and creation time only.
* **Changes to the ConfigMap re-register the resource**, briefly removing it. A malformed template is logged (`kubectl logs -n vela-system deploy/vela-prism`) and the resource isn't registered.

## Permissions

The caller's RBAC is checked on the dynamic resource (`notes.dynamic.prism.oam.dev` above), and Prism then writes the target with its own ServiceAccount, which the chart lets do anything. Whoever may create a Note can create a ConfigMap in that namespace, whether or not their own RBAC allows it; and whoever may write ConfigMaps in `vela-system` can define a resource over any kind in the cluster, Secrets included. Keep `vela-system` write access to cluster administrators, and narrow the chart's `*` rule to the kinds you map onto.
