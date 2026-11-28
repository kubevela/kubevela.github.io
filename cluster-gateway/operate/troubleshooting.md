---
title: Troubleshoot Cluster Gateway
sidebar_label: Troubleshooting
description: The common Cluster Gateway failures, what each error means, and how to read the gateway's logs.
---

Start with two checks: is the APIService available, and does a request through the proxy work?

```shell
kubectl get apiservice v1alpha1.cluster.core.oam.dev
kubectl get --raw /apis/cluster.core.oam.dev/v1alpha1/clustergateways/<cluster>/proxy/version
```

If the APIService isn't available, nothing behind it works, and every request fails with `the server is currently unable to handle the request`, so fix that first. If it is, the proxy request's error says which side failed, and the table below says what it means.

## Errors through the proxy

| Error | Cause | Fix |
| --- | --- | --- |
| `no such cluster <cluster>` | There's no Secret by that name in the gateway's Secret namespace, or the Secret isn't a valid cluster. | Check the name and namespace. With the standalone chart it's `open-cluster-management-credentials`, with KubeVela `vela-system`. Then run `kubectl get clustergateway <cluster>` for the specific reason. |
| `clustergateways.cluster.core.oam.dev "<cluster>" not found`, from `kubectl get clustergateway` | The Secret has no `cluster.core.oam.dev/cluster-credential-type` label. | Add the label: see [the cluster Secret](../concepts/cluster-secrets.md#what-the-gateway-reads). |
| `missing label key: api-endpoint` | The Secret has no `endpoint` data key. Despite the wording, it's a data key, not a label. | Add `endpoint` with the member's API server URL. |
| `unrecognized secret credential type` | The credential type label has a value other than `X509Certificate`, `ServiceAccountToken` or `Dynamic`. | Fix the label's value; it's case sensitive. |
| `You must be logged in to the server (Unauthorized)` | The **member** cluster rejected the credential in the Secret. It reads like your hub login failing, but your hub request got through. | Replace the token or certificate. Expired tokens from `vela cluster join` on an exec kubeconfig (EKS) end up here: see [Cloud provider clusters](../guides/register-clusters.md#cloud-provider-clusters). |
| `Forbidden`, naming a user on the member cluster | The member's RBAC refused the registered credential, or the impersonated user with `ClientIdentityPenetration`. | Grant the permission on the member cluster. With impersonation, the credential also needs the `impersonate` verb. |
| `dial tcp <address>: i/o timeout`, or `connection refused` | The gateway's pod can't reach the endpoint. | Use an address the hub's pods can reach, not `127.0.0.1` or `0.0.0.0` from a local kubeconfig. Check firewalls and security groups between the clusters, or set `proxy-url`. |
| `x509: certificate signed by unknown authority`, or `certificate is valid for ..., not ...` | `ca.crt` doesn't match the member's serving certificate, or the endpoint's host isn't in it. | Use the CA from the member's kubeconfig, and a host name the certificate lists. |
| `failed to issue credential from external command: exec: executable <name> not found` | A `Dynamic` cluster's command isn't in the gateway's image. | Build an image with it: see [Dynamic](../guides/register-clusters.md#dynamic). |
| `proxying by user <user> is forbidden authorization failed` | `--authorize-proxy-subpath` is on, and the user can't make the inner request on the hub. | Grant it on the hub, or drop the flag. |

## The APIService isn't available

```shell
kubectl describe apiservice v1alpha1.cluster.core.oam.dev
```

`kubectl get apiservice` shows the reason beside `False`, and `describe` shows the full message:

| Reason | Cause |
| --- | --- |
| `MissingEndpoints` | No gateway pod is ready (`endpointslices for service/... have no addresses`). Look at the pods and their logs. |
| `ServiceNotFound` | The Service the APIService points at doesn't exist, as after uninstalling one gateway and installing the other. |
| `FailedDiscoveryCheck` with a TLS error | The hub can't verify the gateway's certificate. With KubeVela, vela-core writes the CA into the APIService at startup, so restart vela-core, or check its log for `Failed to set up cluster-gateway TLS`. With cert-manager, check the Certificate is ready. |
| `FailedDiscoveryCheck` with a timeout | The hub's kube-apiserver can't reach the gateway's pod network, as happens with some managed control planes and private clusters. Allow the API server to reach the gateway's port, `9443`. |

The gateway also has to run in the hub cluster, where the hub's kube-apiserver can reach its Service. When you run vela-core from an IDE to debug it, keep the gateway in the cluster: see [Multi-Cluster IDE Debugging](/docs/next/platform-engineers/debug/multicluster-debugging).

## vela-core won't start, or can't reach clusters

At startup, vela-core waits up to five minutes for the APIService, logging `waiting for cluster gateway service: ClusterGateway APIService (...) is not ready`, then exits with `failed to wait for cluster gateway, unable to use multi-cluster`. Fix the APIService as above and vela-core starts on its next restart.

If it's running but a cluster doesn't work, run the same proxy request as vela-core's ServiceAccount, which is what the controller uses:

```shell
kubectl get --raw /apis/cluster.core.oam.dev/v1alpha1/clustergateways/<cluster>/proxy/version \
  --as=system:serviceaccount:vela-system:kubevela-vela-core
```

`vela cluster probe <cluster>` makes the same check against the member's `/healthz`. More on KubeVela's side is in [Manage Clusters](/docs/next/platform-engineers/system-operation/managing-clusters) and [System Info and Diagnose](/docs/next/platform-engineers/system-operation/system-info-diagnose).

## The gateway's logs

```shell
# With KubeVela
kubectl logs --namespace vela-system deployment/kubevela-cluster-gateway
# Standalone
kubectl logs --namespace cluster-gateway deployment/gateway-deployment
```

With more than one replica, `deployment/...` picks one pod. Use the pod labels to read them all: `app.kubernetes.io/name=vela-core-cluster-gateway` with KubeVela, `app=gateway` standalone.

What to look for:

* `Failed getting secret "<namespace>"/"<cluster>"`: a request named a cluster with no Secret. The namespace in the message is the one the gateway reads, which settles any doubt about `--secret-namespace`.
* `failed converting secret to gateway: ...`: a Secret with the label but something wrong in it. These are logged on every list, so one bad Secret logs on every `kubectl get clustergateways`, and the bad Secret is left out of the list.
* `"Unhandled Error" err="apiserver received an error that is not an metav1.Status: ..."`: a proxy request that failed. The text after it is the same error the client got, followed by a stack of the server's request filters, which you can skip.
* `Generated self-signed cert`: the gateway started without `--tls-cert-file`, which is expected with the standalone chart.

Each proxied request isn't logged by default. Add `-v=3` or higher to the container's `args` for a `"HTTP" verb="CONNECT" URI=".../proxy/..."` line per request with its latency, and remove it again after: the volume is high.
