---
title: Register Clusters
description: Register a member cluster with a ServiceAccount token, a client certificate or a credential command, check it through the proxy, and remove it.
---

A cluster is registered with Cluster Gateway by creating a Secret in the namespace the gateway reads (`--secret-namespace`). The Secret's name is the cluster's name. There is nothing else to apply: the gateway watches the Secret namespace, so a new Secret works as soon as it is created and a deleted one stops at once.

| Installed with | Secret namespace |
| --- | --- |
| The standalone chart | `open-cluster-management-credentials` |
| KubeVela | `vela-system`. Use `vela cluster join` there, which writes the Secret for you: see [Manage Clusters](/docs/next/platform-engineers/system-operation/managing-clusters). |

## The cluster Secret

Every cluster is a Secret with a `cluster.core.oam.dev/cluster-credential-type` label, an `endpoint` the gateway's pods can reach, the member's CA in `ca.crt`, and the credential itself. Each key is described in [Cluster Secrets](../concepts/cluster-secrets.md#what-the-gateway-reads); the sections below give a complete Secret for each credential type.

## Credential types

### ServiceAccountToken

A bearer token. The usual choice is a ServiceAccount on the member cluster with a long-lived token. On the member cluster:

```shell
kubectl create serviceaccount cluster-gateway --namespace kube-system
kubectl create clusterrolebinding cluster-gateway \
  --clusterrole=cluster-admin --serviceaccount=kube-system:cluster-gateway
kubectl apply -f - <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: cluster-gateway-token
  namespace: kube-system
  annotations:
    kubernetes.io/service-account.name: cluster-gateway
type: kubernetes.io/service-account-token
EOF
TOKEN=$(kubectl get secret cluster-gateway-token --namespace kube-system -o jsonpath='{.data.token}' | base64 -d)
kubectl get secret cluster-gateway-token --namespace kube-system -o jsonpath='{.data.ca\.crt}' | base64 -d > ca.crt
```

The ClusterRole you bind is what every hub client allowed to use this cluster's proxy can do on it, so bind something narrower than `cluster-admin` if that's more than they need.

Then, on the hub, with `ENDPOINT` set to the member's API server URL:

```shell
ENDPOINT=https://member.example.com:6443
kubectl create secret generic member --namespace open-cluster-management-credentials \
  --from-literal=endpoint="$ENDPOINT" \
  --from-literal=token="$TOKEN" \
  --from-file=ca.crt=ca.crt
kubectl label secret member --namespace open-cluster-management-credentials \
  cluster.core.oam.dev/cluster-credential-type=ServiceAccountToken
```

The same Secret as YAML:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: member
  namespace: open-cluster-management-credentials
  labels:
    cluster.core.oam.dev/cluster-credential-type: ServiceAccountToken
type: Opaque
stringData:
  endpoint: https://member.example.com:6443
  token: <SERVICE_ACCOUNT_TOKEN>
  ca.crt: |
    -----BEGIN CERTIFICATE-----
    <MEMBER_CA_CERTIFICATE>
    -----END CERTIFICATE-----
```

### X509Certificate

A client certificate and key, such as the ones in an admin kubeconfig. To take them from the current context of a kubeconfig for the member cluster:

```shell
kubectl config view --raw --minify --flatten -o jsonpath='{.users[0].user.client-certificate-data}' | base64 -d > tls.crt
kubectl config view --raw --minify --flatten -o jsonpath='{.users[0].user.client-key-data}' | base64 -d > tls.key
kubectl config view --raw --minify --flatten -o jsonpath='{.clusters[0].cluster.certificate-authority-data}' | base64 -d > ca.crt
```

Then, on the hub:

```shell
ENDPOINT=https://member.example.com:6443
kubectl create secret generic member --namespace open-cluster-management-credentials \
  --from-literal=endpoint="$ENDPOINT" \
  --from-file=ca.crt=ca.crt --from-file=tls.crt=tls.crt --from-file=tls.key=tls.key
kubectl label secret member --namespace open-cluster-management-credentials \
  cluster.core.oam.dev/cluster-credential-type=X509Certificate
```

### Dynamic

The gateway runs a command to get a credential, the same way kubectl runs a kubeconfig `exec` plugin. The `exec` key holds the plugin configuration as JSON (`command`, `args`, `env`, `apiVersion`), and the command prints an `ExecCredential` with a token or a client certificate and key. The gateway caches the credential until a minute before its `expirationTimestamp`, then runs the command again; a credential with no expiry is fetched on every request.

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: member
  namespace: open-cluster-management-credentials
  labels:
    cluster.core.oam.dev/cluster-credential-type: Dynamic
type: Opaque
stringData:
  endpoint: https://member.example.com:6443
  exec: |
    {
      "apiVersion": "client.authentication.k8s.io/v1",
      "command": "aws",
      "args": ["eks", "get-token", "--cluster-name", "member", "--output", "json"]
    }
```

The command runs inside the gateway's container, and the `oamdev/cluster-gateway` image has nothing in it but the gateway and Alpine's base tools. To use a cloud CLI such as `aws`, `gcloud` or `kubelogin`, build an image on top of it with the CLI and whatever it needs to authenticate, and run that image. Otherwise every request fails with `exec: executable aws not found`.

### Cloud provider clusters

Cluster Gateway 1.10.0-alpha.1 has no built-in support for EKS, GKE or AKS credentials: a managed cluster uses one of the three types above. For short-lived cloud tokens, `Dynamic` with a custom image is the way to refresh them.

`vela cluster join` doesn't keep an exec plugin. Given a kubeconfig whose user is an exec plugin (the usual EKS kubeconfig), it runs the plugin once on your machine and stores the token it gets as a `ServiceAccountToken` Secret. That token stops working when it expires, about 15 minutes later for EKS. Join such clusters with a ServiceAccount token instead.

## Check a cluster through the proxy

List the registered clusters:

```shell
kubectl get clustergateways
```

```console
NAME     PROVIDER   CREDENTIAL-TYPE       ENDPOINT-TYPE   HEALTHY
member              ServiceAccountToken   Const           false
```

`HEALTHY` is `false` unless something writes a health status, which the gateway doesn't do on its own: it says nothing about whether the cluster can be reached. To check that, send a request through the proxy:

```shell
kubectl get --raw /apis/cluster.core.oam.dev/v1alpha1/clustergateways/member/proxy/version
```

kubectl itself works against a member cluster when its server is the proxy path, using your hub credentials:

```shell
HUB=$(kubectl config view --minify -o jsonpath='{.clusters[0].cluster.server}')
kubectl --server "$HUB/apis/cluster.core.oam.dev/v1alpha1/clustergateways/member/proxy" get nodes
```

Every kubectl command works that way, `exec`, `logs -f` and `get -w` included. With KubeVela, `vela cluster probe member` does the same check against the member's `/healthz`.

If any of these fail, see [Troubleshooting](../operate/troubleshooting.md).

## Remove a cluster

Delete its Secret:

```shell
kubectl delete secret member --namespace open-cluster-management-credentials
```

With KubeVela, use `vela cluster detach member`, which also drops the cluster from the ResourceTrackers that record what each Application deployed there.
