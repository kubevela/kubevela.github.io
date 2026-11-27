---
title: Identity Exchange
description: Make member clusters see the hub user instead of the registered credential, and the rules that change who is impersonated.
---

By default a member cluster sees the registered credential on every request, whoever sent it on the hub (see [The Proxy Path](../concepts/proxy-path.md#whose-identity-the-member-sees)). With the `ClientIdentityPenetration` feature gate on, the gateway impersonates the hub user instead: the member cluster sees the hub user's name and groups, and its own RBAC decides what they may do.

## Turn it on

With KubeVela, `authentication.enabled=true` on the vela-core chart turns the gate on, along with KubeVela's own authentication: see [Underlying Mechanism](/docs/next/platform-engineers/auth/advance).

With the standalone chart, add the gate to the Deployment's `--feature-gates` argument. The chart writes that argument even when it's empty, so replace it:

```shell
kubectl --namespace cluster-gateway get deployment gateway-deployment \
  -o jsonpath='{.spec.template.spec.containers[0].args}'; echo
```

```console
["--secure-port=9443","--secret-namespace=open-cluster-management-credentials","--feature-gates="]
```

```shell
kubectl --namespace cluster-gateway patch deployment gateway-deployment --type json -p '[
  {"op": "replace", "path": "/spec/template/spec/containers/0/args/2",
   "value": "--feature-gates=ClientIdentityPenetration=true"}
]'
kubectl --namespace cluster-gateway rollout status deployment gateway-deployment
```

A later `helm upgrade` writes the chart's arguments back, so repeat the patch after one.

A client can also ask for impersonation on a single request, gate or no gate, with `?impersonate=true` on the proxy URL. A client can only narrow its own access that way, never widen it.

## What the member cluster needs

The registered credential now acts on behalf of hub users, so it needs permission to impersonate them on the member cluster, and the hub users need RBAC of their own there:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: cluster-gateway-impersonator
rules:
  - apiGroups: [""]
    resources: ["users", "groups", "serviceaccounts"]
    verbs: ["impersonate"]
  - apiGroups: ["authentication.k8s.io"]
    resources: ["userextras/*", "uids"]
    verbs: ["impersonate"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: cluster-gateway-impersonator
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-gateway-impersonator
subjects:
  - kind: ServiceAccount
    name: cluster-gateway
    namespace: kube-system
```

The gateway passes on the user's name, groups and extra fields, so the credential needs `impersonate` on all three. Without it, every request fails with `users "<name>" is forbidden: User "system:serviceaccount:kube-system:cluster-gateway" cannot impersonate resource "users" ...`.

The hub user arrives on the member with their hub groups, `system:authenticated` included, so anything the member grants `system:authenticated` they get.

## Rules

A proxy configuration changes who the gateway impersonates, per user, group or cluster. The first rule that matches wins, and a request that no rule matches impersonates the hub user as it is:

```yaml
apiVersion: cluster.core.oam.dev/v1alpha1
kind: ClusterGatewayProxyConfiguration
spec:
  clientIdentityExchanger:
    rules:
      - name: super-user
        type: PrivilegedIdentityExchanger
        source:
          group: platform-admins
      - name: ci-in-prod
        type: StaticMappingIdentityExchanger
        source:
          user: system:serviceaccount:ci:deployer
          cluster: prod
        target:
          user: ci-deployer
          groups:
            - deployers
```

| Rule type | What reaches the member cluster |
| --- | --- |
| `PrivilegedIdentityExchanger` | The registered credential itself, with no impersonation. |
| `StaticMappingIdentityExchanger` | The `target` user, groups and UID. |

`source` matches on `user`, `group`, `uid` and `cluster`, and on the regular expressions `userPattern`, `groupPattern` and `clusterPattern`; every field you give has to match. A rule with no `source` never matches.

There are two places to put rules:

* **For every cluster**, a file passed with `--cluster-gateway-proxy-config`. The gateway reads it at startup, so restart it after a change. The vela-core chart ships one, with a single rule: `PrivilegedIdentityExchanger` for the `kubevela:ux` group, so VelaUX isn't impersonated.
* **For one cluster**, the same YAML in its Secret's `cluster.core.oam.dev/cluster-gateway-proxy-configuration` annotation. These rules apply to that cluster only, whatever `cluster` they name, and are tried before the file's. They take effect as soon as the Secret is updated.

The gateway logs each match, which is the way to check which rule applied:

```console
identity exchanged with rule `super-user` in the proxy config from cluster `member`
```

Rules from the file log `from global config` instead.

[Identity Exchange on two clusters](../examples/identity-exchange.md) runs all of this end to end.
