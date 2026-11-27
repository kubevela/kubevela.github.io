---
title: API
description: The cluster.core.oam.dev/v1alpha1 resources Cluster Gateway serves, their fields and their subresources.
---

Cluster Gateway serves the `cluster.core.oam.dev/v1alpha1` API group through the APIService `v1alpha1.cluster.core.oam.dev`. Every resource is cluster-scoped and read-only: the gateway builds each object from a [cluster Secret](../concepts/cluster-secrets.md) when it is read, and there is no `create`, `update`, `delete` or `watch`.

| Resource | Verbs | Subresources |
| --- | --- | --- |
| `clustergateways` | `get`, `list` | `proxy`, `health` |
| `virtualclusters` | `get`, `list` | none |

## ClusterGateway

```yaml
apiVersion: cluster.core.oam.dev/v1alpha1
kind: ClusterGateway
metadata:
  name: member                  # the Secret's name
spec:
  provider: ""
  access:
    endpoint:
      type: Const               # or ClusterProxy
      const:
        address: https://member.example.com:6443
        caBundle: <base64 CA>   # or insecure: true, when the Secret has no ca.crt
        proxy-url: socks5://proxy:1080
    credential:
      type: ServiceAccountToken # or X509Certificate, or Dynamic
      serviceAccountToken: <token>
      x509:
        certificate: <base64>
        privateKey: <base64>
status:
  healthy: false
  healthyReason: ""
```

| Field | From the Secret |
| --- | --- |
| `spec.access.endpoint.type` | The `cluster.core.oam.dev/cluster-endpoint-type` label; `Const` when it's missing. |
| `spec.access.endpoint.const.address` | `endpoint` |
| `spec.access.endpoint.const.caBundle`, `.insecure` | `ca.crt` or `ca`; `insecure: true` when neither is there. |
| `spec.access.endpoint.const.proxy-url` | `proxy-url` |
| `spec.access.credential.type` | The `cluster.core.oam.dev/cluster-credential-type` label. A `Dynamic` cluster always shows `Dynamic`, whatever its command printed. |
| `spec.access.credential.serviceAccountToken`, `.x509` | `token`; `tls.crt` and `tls.key`; or the output of `exec` for `Dynamic`. |
| `status.healthy`, `status.healthyReason` | The `status.cluster.core.oam.dev/healthy` and `healthy-reason` annotations, with `HealthinessCheck` on. |

`spec.provider` is never set from a Secret.

The object includes the credential, so `get` on `clustergateways` is as sensitive as reading the Secret.

`kubectl get clustergateways` prints:

| Column | Shows |
| --- | --- |
| `PROVIDER` | `spec.provider`, so empty |
| `CREDENTIAL-TYPE` | `spec.access.credential.type` |
| `ENDPOINT-TYPE` | `spec.access.endpoint.type` |
| `HEALTHY` | `status.healthy`: `false` unless something writes the health annotations |

## clustergateways/proxy

```
/apis/cluster.core.oam.dev/v1alpha1/clustergateways/<cluster>/proxy/<path>
```

Any HTTP method. The request, from `<path>` on, is sent to the cluster's kube-apiserver with the cluster's credential, and the response is streamed back. Connection upgrades are passed through, so `exec`, `attach`, `port-forward` and watches work. On the hub, the call is authorized as the HTTP verb on `clustergateways/proxy` for that cluster's name. How the identity travels is in [The Proxy Path](../concepts/proxy-path.md#whose-identity-the-member-sees).

## clustergateways/health

`get` returns the `ClusterGateway`; `update` with a `status` writes `status.healthy` and `status.healthyReason` back to the Secret's annotations. The gateway doesn't probe clusters: a controller such as the OCM addon writes the status, and `status` only shows it with the `HealthinessCheck` feature gate on.

## VirtualCluster

A plainer view of the same clusters, without credentials, for clients that only need to know what exists:

```shell
kubectl get virtualclusters
```

| Field or column | What it shows |
| --- | --- |
| `metadata.name` | The cluster's name. The hub itself is listed as `local`, unless the gateway runs with `--virtual-clutser-with-control-plane=false`. |
| `spec.alias` | The `cluster.core.oam.dev/cluster-alias` annotation on the Secret. |
| `spec.credential-type` | The credential type label; `Internal` for `local`, `ManagedCluster` for OCM clusters. |
| `spec.endpoint` | The Secret's `endpoint`, or the `cluster.core.oam.dev/cluster-endpoint-type` label's value (such as `ClusterProxy`) whenever the Secret has that label; `-` for `local`. A Secret with neither is left out. |
| `spec.accepted` | Whether the cluster is accepted: always `true` for a Secret, and the hub's acceptance for an OCM `ManagedCluster`. |
| `metadata.labels` | The Secret's labels, without the gateway's own (`cluster.core.oam.dev/*`), plus `cluster.core.oam.dev/control-plane`, `true` only for `local`. |

`list` takes a label selector, so `kubectl get virtualclusters -l region=eu` lists the clusters whose Secret carries `region=eu`.

## ClusterGatewayProxyConfiguration

Not served by the API: it's the format of the file passed with `--cluster-gateway-proxy-config`, and of the per-cluster annotation. See [Identity Exchange](../guides/identity-exchange.md).

```yaml
apiVersion: cluster.core.oam.dev/v1alpha1
kind: ClusterGatewayProxyConfiguration
spec:
  clientIdentityExchanger:
    rules:
      - name: <rule name>
        type: PrivilegedIdentityExchanger | StaticMappingIdentityExchanger
        source:            # every field given must match
          user: <name>
          group: <name>
          uid: <uid>
          cluster: <cluster>
          userPattern: <regexp>
          groupPattern: <regexp>
          clusterPattern: <regexp>
        target:            # StaticMappingIdentityExchanger only
          user: <name>
          groups: [<name>]
          uid: <uid>
```
