---
title: Workflow Outbound HTTP Protection
---

Workflow steps that make HTTP calls block cloud metadata and link-local destinations by default. This page explains what is blocked, how to extend the denylist, and how to turn on stricter modes. It applies to KubeVela 1.12, to the patch releases listed in the [upgrade note](#upgrade-note), and to the standalone `vela-workflow` chart from 0.6.5 and 0.7.3.

:::caution Upgrade note
The denylist is on from KubeVela 1.11.1, 1.10.10 and 1.9.15. Upgrading from an older release turns it on. A workflow step that called a cloud metadata endpoint on purpose, for example `http://169.254.169.254/`, now fails. See [Upgrade note](#upgrade-note) before you upgrade.
:::

## What is protected

These workflow steps and providers make outbound HTTP calls, and the protection applies to all of them:

- the `request` step
- the `webhook` step, in KubeVela
- the `notification` step, for its DingTalk, Lark and Slack channels (email goes over SMTP and is not checked)
- the `http` provider that custom workflow steps call: `http.#HTTPDo` from `vela/http` and the legacy `op.#HTTPDo` from `vela/op`, with their `#HTTPGet`, `#HTTPPost`, `#HTTPPut` and `#HTTPDelete` shorthands

In `vela-core` the same checks also apply outside workflows:

- `vela/http` called from a component, trait, policy or source definition, and the legacy `processing.http`
- Helm chart downloads, from Helm repositories, chart URLs and `oci://` registries
- objects fetched from a URL by `ref-objects`

A blocked call there fails the render or the download with the same errors.

Destinations are checked in two places:

1. **When the connection opens.** The check runs on the IP address that the host name resolved to. A host name that points at a blocked address is blocked, even if the name itself is not on the denylist.
2. **On every redirect.** A call to an allowed host that redirects to a blocked one is stopped at the redirect. A call follows at most 10 redirects.

These calls do not use `HTTP_PROXY`, `HTTPS_PROXY` or `NO_PROXY`. A proxied connection would only let the controller check the proxy's address, so the controller connects to the destination directly. If the controller can reach the outside only through a proxy, workflow HTTP calls to outside destinations fail after the upgrade.

A blocked call fails the step. The step message contains one of these errors:

| Error | Meaning |
| ----- | ------- |
| `blocked SSRF host: <host>` | The host name matches a host name or wildcard in `denyHosts`. |
| `blocked SSRF target: <ip>` | The destination IP address matches an IP address or range in `denyCIDRs` or `denyHosts`, or it is one of the addresses `vela-core` always blocks, or it is a private address while [`blockPrivateHTTPAddresses`](#feature-gates) is on. When a host name resolved to the address, the error is wrapped: `dial tcp <ip>:<port>: blocked SSRF target: <ip>`. |

## Default denylist

| Type | Entry | Covers |
| ---- | ----- | ------ |
| Host | `metadata.google.internal` | GCP metadata server |
| CIDR | `169.254.0.0/16` | IPv4 link-local, including the AWS, Azure and GCP metadata IP `169.254.169.254` |
| CIDR | `fe80::/10` | IPv6 link-local |
| IP | `fd00:ec2::254` | AWS IPv6 metadata endpoint |
| IP | `100.100.100.200` | Alibaba Cloud metadata server |

An IPv6 address under a NAT64 prefix is checked by the IPv4 address it carries, because the gateway connects to that address. `http://[64:ff9b::a9fe:a9fe]/` is `169.254.169.254` behind the well-known prefix `64:ff9b::/96` and is blocked.

Destinations inside the cluster, such as a Service ClusterIP or `*.svc.cluster.local`, and public destinations stay allowed.

`vela-core` also blocks these addresses. They are not part of the denylist, and no ConfigMap or chart value changes them. The standalone `vela-workflow` controller does not add them.

| Entry | Covers |
| ----- | ------ |
| `127.0.0.0/8`, `::1` | Loopback: the controller's own metrics, health and webhook ports |
| `0.0.0.0/8`, `::` | The unspecified address, which reaches the local host |
| `64:ff9b:1::/48` | The local-use NAT64 prefix |

A `vela-core` that you run outside the cluster, for example while developing, can no longer call `localhost`.

KubeVela has no allowlist mode. You can only add entries to the denylist or turn on one of the stricter [feature gates](#feature-gates).

## How the denylist is built

The controller combines these sources. Every source adds entries. Nothing can remove an entry from the built-in floor.

1. **The built-in floor** in the controller binary. It holds the five default entries above. It stays on when you delete the default ConfigMap, disable discovery or set `workflow.httpDeny.defaultConfig.enabled=false`.
2. **The default ConfigMap** that the chart renders from the Helm values `workflow.httpDeny.defaultConfig.*`. Change it through the values. Helm writes the values back over a manual edit on the next upgrade.
3. **ConfigMaps that you add** in the controller namespace with the discovery label `config.oam.dev/type=<configTemplateName>`. The controller reads only the namespace it runs in, which is `vela-system` by default.

The controller watches these ConfigMaps. A change takes effect without a restart.

One invalid entry in any of the ConfigMaps rejects the whole set. A running controller logs `failed to reload workflow HTTP deny ConfigMaps; keeping last good policy` and ignores every change, in any of the ConfigMaps, until the entry is fixed. A controller that starts while the entry is there does not start: the pod crash-loops with `failed to initialize workflow HTTP deny ConfigMaps` (`vela-core`) or `unable to configure workflow HTTP deny policy` (`vela-workflow`). Check the controller log after you edit a ConfigMap by hand. `vela config create` validates the entries before it writes them.

## Extend the denylist

Add hosts, IP addresses and CIDR ranges with a `Config`, or with a ConfigMap that you write yourself. Entries add to the defaults.

### With `vela config create`

The chart installs a config template for the denylist. `vela config create` needs `vela-core`. Use the template name of the controller that must enforce the entry:

| Chart | Template name |
| ----- | ------------- |
| `vela-core` | `vela-core-http-deny` |
| `vela-workflow`, installed next to `vela-core` | `vela-workflow-http-deny` |

```shell
vela config create team-http-deny \
  --template vela-core-http-deny \
  --namespace vela-system \
  'denyHosts={*.example.com,internal.example.net}' \
  'denyCIDRs={198.51.100.0/24,203.0.113.7}'
```

`vela config create` needs the Config CRD that vela-core installs. With the standalone `vela-workflow` chart and no vela-core, write the ConfigMap yourself, see [With a ConfigMap](#with-a-configmap). Create the config in the namespace where the controller runs.

`denyHosts` takes exact host names, IP addresses, and wildcard host names that start with `*.`. A wildcard matches subdomains but not the bare domain. `denyCIDRs` takes IP addresses and CIDR ranges.

### With a ConfigMap

You can also create the ConfigMap yourself. Put the label that matches your chart on it. Each key holds one entry per line. Blank lines and `#` comments are ignored.

The controller refuses an entry with a port (`example.com:443`), a scheme or a path (`http://example.com/x`), whitespace inside it, a `*` anywhere but a leading `*.`, or a range that is not a valid CIDR. One refused entry rejects all the ConfigMaps, see [How the denylist is built](#how-the-denylist-is-built).

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
    198.51.100.0/24
    203.0.113.7
```

## Feature gates

Two feature gates make the protection stricter. Both are off by default.

| Behavior | Effect | Risk |
| -------- | ------ | ---- |
| Block private addresses | Blocks RFC 1918 (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`) and ULA (`fc00::/7`) destinations. | Breaks most calls to in-cluster Services, because ClusterIPs are private addresses. In vela-core it also refuses Helm repositories, `oci://` registries and `vela/http` calls in definitions on private addresses. |
| Disable workflow HTTP | Blocks all outbound HTTP from workflow steps. The step fails with `workflow outbound HTTP is disabled by DisableWorkflowHTTP feature gate`. | No workflow step can make an HTTP call. |

`DisableWorkflowHTTP` stops workflow steps and the legacy `processing.http` in definitions. It does not stop `vela/http` in a definition template or Helm chart downloads.

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

### Request limits

The same guard limits how long a call may take and how much it may read. The values are under `workflow.http` in both charts.

| Value | Default | Effect |
| ----- | ------- | ------ |
| `workflow.http.maxTimeout` | `60s` | The longest `timeout` a call may set. A longer one, a negative value, or `0`, fails the step with `timeout <value> must be greater than 0 and at most 1m0s`. A call that sets no `timeout` gets 3 seconds, or the configured maximum when it is lower. In `vela-core`, `vela/http` in a definition has no `timeout` parameter and is cut off at this value. |
| `workflow.http.maxResponseBytes` | `1048576` | The largest response body. A longer one fails the workflow step or the `vela-core` render with `response body exceeds 1048576 bytes`. It is not truncated. |
| `workflow.http.nat64Prefixes` | `[]` | `vela-workflow` only. Network-specific NAT64 prefixes whose addresses are checked by the IPv4 address they carry. |

### Turn off discovery

Turn off discovery and the default ConfigMap, leaving only the built-in floor:

```shell
helm upgrade kubevela kubevela/vela-core -n vela-system --reset-then-reuse-values \
  --set workflow.httpDeny.configTemplateName="" \
  --set workflow.httpDeny.defaultConfig.enabled=false
```

`--reset-then-reuse-values` needs Helm 3.14 or later. Plain `--reuse-values` skips the new chart defaults and can fail on a release that was installed before these values existed.

## Install the standalone `vela-workflow` chart

To install only the workflow engine, without `vela-core`:

```shell
helm repo remove kubevela 2>/dev/null || true
helm repo add kubevela https://kubevela.github.io/charts
helm repo update
helm install workflow kubevela/vela-workflow --namespace vela-system --create-namespace
```

The values in [Chart values](#chart-values) apply to this chart too.

## Install both charts together

Each chart installs its own config template and default ConfigMap, and its controller reads only the ConfigMaps that carry its own label. Uninstalling one release does not delete the other's template.

| Chart | Template and discovery label | Default ConfigMap |
| ----- | ---------------------------- | ----------------- |
| `vela-core` | `vela-core-http-deny` | `vela-core-http-deny-default` |
| `vela-workflow` | `vela-workflow-http-deny` | `vela-workflow-http-deny-default` |

Keep the default names when you install both charts. To add a denylist entry that both controllers must enforce, create one ConfigMap for each label.

## Upgrade note

There is no opt-in step. An upgrade to one of these releases turns the protection on:

| Release | Denylist | Loopback block in vela-core | Request limits |
| ------- | -------- | --------------------------- | -------------- |
| 1.9.15 | yes | no | no |
| 1.10.10 | yes | yes | yes |
| 1.11.1 | yes | no | no |
| 1.11.2 | yes | yes | yes |
| 1.12.0 | yes | yes | yes |
| `vela-workflow` 0.6.5, 0.7.3 and later | yes | not in this controller | yes |

- A step that called a cloud metadata endpoint on purpose now fails with `blocked SSRF target` or `blocked SSRF host`. Search your Applications and WorkflowRuns for `169.254.`, `metadata.google.internal`, `fd00:ec2::254` and `100.100.100.200` before you upgrade. For the releases with the loopback block, search for `localhost` and `127.0.0.1` too.
- You cannot remove a built-in entry. Deleting the default ConfigMap or turning off discovery does not allow metadata destinations.
- The stricter modes in [Feature gates](#feature-gates) stay off after an upgrade, so calls to in-cluster Services keep working.
- Guarded calls ignore `HTTP_PROXY`, `HTTPS_PROXY` and `NO_PROXY`. A controller that reaches external services only through a proxy can no longer call them from a workflow step.
- In the releases with the loopback block, `vela-core` refuses `localhost`, `127.0.0.0/8`, `::1` and the unspecified address.
- In the releases with request limits, a call that sets no `timeout` is cut off after 3 seconds, a `timeout` above `workflow.http.maxTimeout` fails the step, and a response body above `workflow.http.maxResponseBytes` fails the step. See [Request limits](#request-limits).
- In the same KubeVela releases the `request` step fails on any status of 400 or above (a 400 used to pass), and a reply that is empty or not JSON no longer fails the step. The raw body is in `responseBody`.
