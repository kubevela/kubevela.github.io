---
title: Workflow Outbound HTTP Protection
---

Workflow steps that make HTTP calls block cloud metadata and link-local destinations by default. This page explains what is blocked, how to extend the denylist, and how to turn on stricter modes. It applies to KubeVela 1.12 and to the standalone `vela-workflow` chart.

:::caution Upgrade note
Upgrading to 1.12 turns this protection on. A workflow step that called a cloud metadata endpoint on purpose, for example `http://169.254.169.254/`, now fails. See [Upgrade note](#upgrade-note) before you upgrade.
:::

## What is protected

These workflow steps and providers make outbound HTTP calls, and the protection applies to all of them:

- the `request` step
- the `webhook` step
- the `notification` step
- the `http` provider, which custom workflow steps use through `vela/http` in `op`

Destinations are checked in two places:

1. **When the connection opens.** The check runs on the IP address that the host name resolved to. A host name that points at a blocked address is blocked, even if the name itself is not on the denylist.
2. **On every redirect.** A call to an allowed host that redirects to a blocked one is stopped at the redirect.

A blocked call fails the step. The step message contains one of these errors:

| Error | Meaning |
| ----- | ------- |
| `blocked SSRF host: <host>` | The host name matches an entry in `denyHosts`. |
| `blocked SSRF target: <ip>` | The destination IP address matches `denyCIDRs`, or it is a private address while [`blockPrivateHTTPAddresses`](#feature-gates) is on. |

## Default denylist

| Type | Entry | Covers |
| ---- | ----- | ------ |
| Host | `metadata.google.internal` | GCP metadata server |
| CIDR | `169.254.0.0/16` | IPv4 link-local, including the AWS, Azure and GCP metadata IP `169.254.169.254` |
| CIDR | `fe80::/10` | IPv6 link-local |
| IP | `fd00:ec2::254` | AWS IPv6 metadata endpoint |
| IP | `100.100.100.200` | Alibaba Cloud metadata server |

Destinations inside the cluster, such as a Service ClusterIP or `*.svc.cluster.local`, and public destinations stay allowed.

KubeVela has no allowlist mode. You can only add entries to the denylist or turn on one of the stricter [feature gates](#feature-gates).

## How the denylist is built

The controller combines three layers. Entries in a higher layer add to the entries below. No layer can remove an entry from the built-in floor.

1. **Helm values** `workflow.httpDeny.defaultConfig.*`. The chart renders them into a labeled default ConfigMap.
2. **ConfigMaps in the controller namespace** that carry the discovery label `config.oam.dev/type=<configTemplateName>`. The controller reads only the namespace it runs in, which is `vela-system` by default. This includes the editable default ConfigMap from the chart and any ConfigMap that you add.
3. **The built-in floor** in the controller binary. It holds the five default entries above. It stays on when you delete the default ConfigMap, disable discovery or set `workflow.httpDeny.defaultConfig.enabled=false`.

The controller watches these ConfigMaps. A change takes effect without a restart. If a reload fails, the controller keeps the last good denylist.

## Extend the denylist

Add hosts, IP addresses and CIDR ranges with a `Config`, or with a ConfigMap that you write yourself. Entries add to the defaults.

### With `vela config create`

The chart installs a config template for the denylist. Use the template name for your chart:

| Chart | Template name |
| ----- | ------------- |
| `vela-core` | `vela-core-http-deny` |
| `vela-workflow` (standalone) | `vela-workflow-http-deny` |

```shell
vela config create team-http-deny \
  --template vela-core-http-deny \
  --namespace vela-system \
  'denyHosts={*.example.com,internal.example.net}' \
  'denyCIDRs={10.96.0.0/12,203.0.113.7}'
```

For the standalone chart, use `--template vela-workflow-http-deny`. Create the config in the namespace where the controller runs.

`denyHosts` takes exact host names, IP addresses, and wildcard host names that start with `*.`. A wildcard matches subdomains but not the bare domain. `denyCIDRs` takes IP addresses and CIDR ranges.

### With a ConfigMap

You can also create the ConfigMap yourself. Put the label that matches your chart on it. Each key holds one entry per line. Blank lines and `#` comments are ignored.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: team-http-deny
  namespace: vela-system
  labels:
    config.oam.dev/type: vela-core-http-deny   # vela-workflow-http-deny for the standalone chart
data:
  denyHosts: |
    *.example.com
    internal.example.net
  denyCIDRs: |
    10.96.0.0/12
    203.0.113.7
```

## Feature gates

Two feature gates make the protection stricter. Both are off by default.

| Behavior | Effect | Risk |
| -------- | ------ | ---- |
| Block private addresses | Blocks RFC 1918 (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`) and ULA (`fc00::/7`) destinations. | Breaks most calls to in-cluster Services, because ClusterIPs are private addresses. |
| Disable workflow HTTP | Blocks all outbound HTTP from workflow steps. The step fails with `workflow outbound HTTP is disabled by DisableWorkflowHTTP feature gate`. | No workflow step can make an HTTP call. |

The Helm value names differ between the two charts:

| Behavior | `vela-core` value | `vela-workflow` value |
| -------- | ----------------- | --------------------- |
| Block private addresses | `featureGates.blockPrivateHTTPAddresses` | `workflow.blockPrivateHTTPAddresses` |
| Disable workflow HTTP | `featureGates.disableWorkflowHTTP` | `workflow.disableWorkflowHTTP` |

```shell
# vela-core
vela install --set featureGates.blockPrivateHTTPAddresses=true

# standalone vela-workflow
helm upgrade --install workflow kubevela/vela-workflow -n vela-system --create-namespace \
  --set workflow.blockPrivateHTTPAddresses=true
```

## Chart values

The values are under `workflow.httpDeny` in both charts. The defaults differ in the names, so that both charts can be installed together.

| Value | `vela-core` default | `vela-workflow` default | Description |
| ----- | ------------------- | ----------------------- | ----------- |
| `workflow.httpDeny.configTemplateName` | `vela-core-http-deny` | `vela-workflow-http-deny` | Name of the config template and the value of the discovery label. An empty string turns discovery off and skips the template and the default ConfigMap. The name must be dot-separated parts of lowercase letters, digits and `-`, at most 63 characters. Quote a name that YAML would read as a number or a boolean. |
| `workflow.httpDeny.installConfigTemplate` | `true` | `true` | Install the config template that `vela config create --template` uses. |
| `workflow.httpDeny.defaultConfig.enabled` | `true` | `true` | Install the default denylist ConfigMap. |
| `workflow.httpDeny.defaultConfig.name` | `vela-core-http-deny-default` | `vela-workflow-http-deny-default` | Name of the default ConfigMap. |
| `workflow.httpDeny.defaultConfig.denyHosts` | `metadata.google.internal` | `metadata.google.internal` | Host names in the default ConfigMap. |
| `workflow.httpDeny.defaultConfig.denyCIDRs` | the four CIDR and IP defaults | the four CIDR and IP defaults | IP addresses and CIDR ranges in the default ConfigMap. |

Turn off discovery and the default ConfigMap, leaving only the built-in floor:

```shell
helm upgrade kubevela kubevela/vela-core -n vela-system --reuse-values \
  --set workflow.httpDeny.configTemplateName="" \
  --set workflow.httpDeny.defaultConfig.enabled=false
```

## Install both charts together

Each chart installs its own config template and default ConfigMap, and its controller reads only the ConfigMaps that carry its own label. Uninstalling one release does not delete the other's template.

| Chart | Template and discovery label | Default ConfigMap |
| ----- | ---------------------------- | ----------------- |
| `vela-core` | `vela-core-http-deny` | `vela-core-http-deny-default` |
| `vela-workflow` | `vela-workflow-http-deny` | `vela-workflow-http-deny-default` |

Keep the default names when you install both charts. To add a denylist entry that both controllers must enforce, create one ConfigMap for each label.

## Upgrade note

Upgrading to KubeVela 1.12, or to a `vela-workflow` release that includes this protection, turns it on. There is no opt-in step.

- A step that called a cloud metadata endpoint on purpose now fails with `blocked SSRF target` or `blocked SSRF host`. Search your Applications and WorkflowRuns for `169.254.`, `metadata.google.internal`, `fd00:ec2::254` and `100.100.100.200` before you upgrade.
- You cannot remove a built-in entry. Deleting the default ConfigMap or turning off discovery does not allow metadata destinations.
- The stricter modes in [Feature gates](#feature-gates) stay off after an upgrade, so calls to in-cluster Services keep working.
