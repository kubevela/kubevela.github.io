---
title: Troubleshooting
description: The common ways Prism goes wrong, what each looks like, and how to read its logs.
---

## First checks

```shell
kubectl get apiservice | grep prism.oam.dev
kubectl get pods -n vela-system -l app.oam.dev/component=vela-prism
kubectl logs -n vela-system deploy/vela-prism -c vela-prism --tail=50
```

Every APIService should be `True`. On a chart install, select the pod with `-l app=vela-prism` instead. The addon's pod has an init container, `init-config`, that makes the certificate; `kubectl logs ... -c init-config` shows its output.

## The server is currently unable to handle the request

```console
Error from server (ServiceUnavailable): the server is currently unable to handle the request (get applicationresourcetrackers.prism.oam.dev)
```

The hub can't reach Prism. The APIService's condition says why:

| `kubectl get apiservice` shows | Cause |
| --- | --- |
| `False (EndpointsNotFound)` | No ready pod yet. Normal for a few seconds after `vela addon enable` returns; `kubectl wait --for=condition=Available apiservice/v1alpha1.prism.oam.dev` waits it out. If it stays, look at the pod. |
| `False (ServiceNotFound)` | The APIService points at a Service that isn't there. On the addon, the `namespace` parameter was set to something other than `vela-system`: see [Configuration](./configuration.md#addon-parameters). |
| `False (FailedDiscoveryCheck)` on `v1alpha1.dynamic.prism.oam.dev` | No dynamic resource is defined, so the group serves nothing. See [Dynamic Resources](../guides/dynamic-resources.md#turn-it-on). |
| `False (FailedDiscoveryCheck)` on the other groups | The pod runs but the hub can't talk to it: usually the CA in the APIService doesn't match the pod's certificate. Restart the pod on the addon (its init container patches the CA again); on the chart, run `helm upgrade` so the patch Job runs again. |

## The pod restarts with exit code 139

The chart's default image, `oamdev/vela-prism:v1.6.0`, crashes at once on arm64 nodes, with no log output. Set `image.tag=v1.7.0`.

## Namespaces stay Terminating

```console
Discovery failed for some groups, 1 failing: unable to retrieve the complete list of server APIs: dynamic.prism.oam.dev/v1alpha1: stale GroupVersion discovery: dynamic.prism.oam.dev/v1alpha1
```

The namespace controller won't finish a deletion while any API group is unavailable, and with the chart at v1.7.0 the dynamic group is unavailable until a dynamic resource is defined. Define one, or `helm upgrade` with `--set dynamicAPI.enabled=false` (and `--server-side=false` on Helm 4), and the namespaces finish deleting within a minute. The same happens if Prism's pod is down for any reason, for every Prism group.

## configmaps is forbidden in the logs

```console
E1127 16:20:04.565791       1 reflector.go:140] ... Failed to watch *v1.ConfigMap: failed to list *v1.ConfigMap: configmaps is forbidden: User "system:serviceaccount:vela-system:vela-prism" cannot list resource "configmaps" in API group "" in the namespace "vela-system"
```

Harmless. v1.7.0 always starts the watch for dynamic resource definitions, and the addon (or the chart with `dynamicAPI.enabled=false`) gives Prism no access to ConfigMaps. It retries about every thirty seconds, so the line repeats; nothing else is affected.

## vela status says vela-prism is not serving ApplicationResourceTracker

```console
Error: failed to list ResourceTrackers: no permission for ResourceTracker and vela-prism is not serving ApplicationResourceTracker
```

The user can't read ResourceTrackers, and the hub has no `applicationresourcetrackers` API. Enable the addon. If it is enabled, check the APIService as above.

A `Forbidden` on `applicationresourcetrackers` instead means Prism answered and the user lacks the Role: see [ResourceTrackers](../guides/resource-trackers.md#grant-it-in-one-namespace).

## A Grafana request fails

Prism passes Grafana's answer through. What the error says tells you which side it came from:

| Error | Meaning |
| --- | --- |
| `secrets "grafana.<name>" not found` | No `Grafana` object with that name. Check the `@<grafana>` part of the name, or the `grafana=` label on a list; both default to `default`. |
| `Unauthorized` or `Forbidden` with Grafana's message | Grafana refused the credential in the `Grafana` object. |
| `dial tcp ...: connect: connection refused`, or a timeout | Prism can't reach the endpoint. It calls from its own pod, so the endpoint must resolve and route from `vela-system`. |
| `error when retrieving current configuration of ... connection refused` on `kubectl apply` | The same, seen by `apply`, which reads the object from Grafana before writing it. |
| `request grafana ... failed, path: /api/datasources/0, code: 500` | A datasource update without an `id`, usually from `kubectl replace`: see [Datasources](../guides/grafana.md#datasources). |
| `BadRequest` with a version message | Grafana's `412`: the dashboard changed in Grafana since it was read. Read it again and reapply. |

## Logs

Prism logs with klog. Each request that takes more than half a second gets a trace, which is the quickest way to see what a slow `kubectl` was waiting on:

```console
I1127 16:20:12.871434       1 trace.go:219] Trace[683024728]: "List" accept:application/json;as=Table;v=v1;g=meta.k8s.io,... audit-id:e7502ea5-...
Trace[683024728]: ---"Listing from storage done" 856ms (16:20:12.871)
```

"Storage" here is the backing object: the ResourceTracker list, the cluster Secrets, or Grafana. For more, add `-v=4` to the container's arguments (chart installs; see [Configuration](./configuration.md#flags)).
