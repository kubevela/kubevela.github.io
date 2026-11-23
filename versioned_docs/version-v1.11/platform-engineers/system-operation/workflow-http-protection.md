---
title: Outbound HTTP Protection
---

vela-core makes HTTP requests on behalf of Applications, definitions and addons. From v1.11.1 it refuses requests to cloud metadata and link-local addresses, and from v1.11.2 it also refuses loopback addresses and bounds how long a request may take and how much it may read. This page explains what is refused, how to add to the denylist, the stricter modes, and the bounds.

:::caution Upgrading to v1.11.1 or v1.11.2
A request that worked before can now fail the step or the render. See [What may fail after an upgrade](#what-may-fail-after-an-upgrade) before you upgrade.
:::

## What is protected

The protection applies to every outbound HTTP request vela-core makes:

- the `request`, `webhook` and `notification` workflow steps (HTTP notifications: DingTalk, Lark, Slack; email goes over SMTP and is not covered);
- custom workflow steps that use `vela/http` or the `vela/op` HTTP actions (`op.#HTTPDo`, `op.#HTTPGet`, `op.#HTTPPost`, `op.#HTTPPut`, `op.#HTTPDelete`);
- `vela/http` in component, trait and policy definitions;
- addon registry fetches, Helm repository and chart fetches (including `oci://` from v1.11.2), and `ref-objects` URLs.

Destinations are checked in two places:

1. **When the connection opens.** The check runs on the IP address the host name resolved to, so a host name that points at a refused address is refused too.
2. **On every redirect.** A request is stopped at a redirect to a refused destination, and after at most 10 redirects.

A refused request fails with one of these errors, wrapped in the request's own error:

| Error | Meaning |
| ----- | ------- |
| `blocked SSRF host: <host>` | The host name matches an entry in `denyHosts`. |
| `blocked SSRF target: <ip>` | The destination address is denied: a `denyCIDRs` entry, an address that is always refused, or a private address while [`blockPrivateHTTPAddresses`](#feature-gates) is on. |

A workflow step that fails this way is retried with backoff, up to `workflow.step.errorRetryTimes`, like any other step error.

### HTTP proxies are not used

Guarded requests connect directly and ignore `HTTP_PROXY`, `HTTPS_PROXY` and `NO_PROXY` on the vela-core Deployment: a request sent through a proxy could reach a denied address that vela-core never sees. A cluster that reaches the internet only through a proxy can't reach Slack, webhooks, addon registries or Helm repositories from vela-core; the request fails with a dial or timeout error, not an SSRF one. This is tracked in [kubevela/kubevela#7685](https://github.com/kubevela/kubevela/issues/7685).

## What is refused

### Always refused

| Entry | Covers | From |
| ----- | ------ | ---- |
| `metadata.google.internal` | GCP metadata server | v1.11.1 |
| `169.254.0.0/16` | IPv4 link-local, including the AWS, Azure and GCP metadata address `169.254.169.254` | v1.11.1 |
| `fe80::/10` | IPv6 link-local | v1.11.1 |
| `fd00:ec2::254` | AWS IPv6 metadata endpoint | v1.11.1 |
| `100.100.100.200` | Alibaba Cloud metadata server | v1.11.1 |
| `127.0.0.0/8`, `::1` | Loopback | v1.11.2 |
| `0.0.0.0/8`, `::` | Unspecified address | v1.11.2 |
| `64:ff9b:1::/48` | Local-use NAT64 | v1.11.2 |

An address under the well-known NAT64 prefix `64:ff9b::/96` is judged by the IPv4 address it carries, so `64:ff9b::a9fe:a9fe` is refused like `169.254.169.254`.

The metadata entries are built into the controller, and the chart also writes them to a default ConfigMap. Deleting that ConfigMap, or turning discovery off, does not remove them. There is no allowlist mode.

Destinations inside the cluster, such as a Service ClusterIP or `*.svc.cluster.local`, and public destinations stay allowed unless you deny them. [`blockPrivateHTTPAddresses`](#feature-gates) refuses ClusterIPs too, since they are private addresses. To call a Service from a step, use its DNS name, not `localhost`.

### Adding to the denylist

vela-core reads every ConfigMap in its own namespace (`vela-system` by default) labelled `config.oam.dev/type` with the config template's name (`workflow.httpDeny.configTemplateName`, `vela-core-http-deny` by default), including the chart's default `vela-core-http-deny-default`, and adds their entries to the built-in ones. It watches them, so a change takes effect without a restart.

Create one with `vela config create`, which checks the entries before writing:

```shell
vela config create team-http-deny \
  --template vela-core-http-deny \
  --namespace vela-system \
  'denyHosts={*.example.com,internal.example.net}' \
  'denyCIDRs={198.51.100.0/24,203.0.113.7}'
```

Or write the ConfigMap yourself:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: team-http-deny
  namespace: vela-system
  labels:
    config.oam.dev/type: vela-core-http-deny # workflow.httpDeny.configTemplateName
data:
  denyHosts: |
    *.example.com
    internal.example.net
  denyCIDRs: |
    198.51.100.0/24
    203.0.113.7
```

`denyHosts` takes exact host names, IP addresses, and wildcards that start with `*.`; a wildcard matches subdomains but not the bare domain. `denyCIDRs` takes IP addresses and CIDR ranges. Each key holds one entry per line; blank lines and `#` comments are ignored.

:::caution
One invalid entry in any labelled ConfigMap rejects the whole set. A running controller logs `failed to reload workflow HTTP deny ConfigMaps; keeping last good policy` and ignores every change until it's fixed, and a controller that starts with it refuses to start (`failed to initialize workflow HTTP deny ConfigMaps`). Check the controller log after you edit a ConfigMap by hand.
:::

## Feature gates

Two feature gates make the protection stricter. Both are off by default, and stay off on upgrade.

| Helm value | Controller flag | Effect |
| ---------- | --------------- | ------ |
| `featureGates.blockPrivateHTTPAddresses` | `--feature-gates=BlockPrivateHTTPAddresses=true` | Also refuses private addresses: RFC 1918 (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`) and ULA (`fc00::/7`). This breaks calls to in-cluster Services, whose ClusterIPs are private, and to addon registries or Helm repositories on private addresses. |
| `featureGates.disableWorkflowHTTP` | `--feature-gates=DisableWorkflowHTTP=true` | Turns off HTTP from workflow steps. A step fails with `workflow outbound HTTP is disabled by DisableWorkflowHTTP feature gate`. `vela/http` in definitions, addon and Helm fetches are not affected. |

```shell
helm upgrade kubevela kubevela/vela-core -n vela-system -f <your values file> \
  --set featureGates.blockPrivateHTTPAddresses=true
```

## Timeouts and response size

From v1.11.2 every guarded request is bounded:

- **Timeout.** A request that sets no timeout times out after 3s. The `request`, `webhook` and `notification` steps take a `timeout` parameter, and custom steps set `request.timeout` on `op.#HTTPDo` or `vela/http`: a Go duration with a unit, greater than 0 and at most `workflow.http.maxTimeout` (default `60s`). Anything else fails the step with `timeout <t> must be greater than 0 and at most <max>`. `vela/http` in definitions has no timeout parameter and uses `workflow.http.maxTimeout`.
- **Response size.** A response body over `workflow.http.maxResponseBytes` (default 1 MiB) fails with `response body exceeds <n> bytes`, rather than being cut short.

A request holds one of the controller's reconcile workers until it returns, so raise these with care.

| Helm value | Controller flag | Default |
| ---------- | --------------- | ------- |
| `workflow.http.maxTimeout` | `--max-workflow-http-timeout` | `60s` |
| `workflow.http.maxResponseBytes` | `--max-workflow-http-response-bytes` | `1048576` |

## Chart values

| Value | Default | Description |
| ----- | ------- | ----------- |
| `workflow.httpDeny.configTemplateName` | `vela-core-http-deny` | Name of the config template and value of the discovery label (`--workflow-http-deny-config-template-name`). An empty string turns discovery off and skips the template and the default ConfigMap; the built-in entries stay. Quote a name that YAML would read as a number, a boolean or null. |
| `workflow.httpDeny.installConfigTemplate` | `true` | Install the config template `vela config create --template` uses. |
| `workflow.httpDeny.defaultConfig.enabled` | `true` | Install the default denylist ConfigMap. |
| `workflow.httpDeny.defaultConfig.name` | `vela-core-http-deny-default` | Name of the default ConfigMap. |
| `workflow.httpDeny.defaultConfig.denyHosts` | `metadata.google.internal` | Host names in the default ConfigMap. |
| `workflow.httpDeny.defaultConfig.denyCIDRs` | the four metadata addresses above | IP addresses and CIDR ranges in the default ConfigMap. |
| `workflow.http.maxTimeout` | `60s` | See [Timeouts and response size](#timeouts-and-response-size). From v1.11.2. |
| `workflow.http.maxResponseBytes` | `1048576` | See [Timeouts and response size](#timeouts-and-response-size). From v1.11.2. |

## What may fail after an upgrade

From v1.11.1:

- A call to a cloud metadata or link-local address, on purpose or through a host name that resolves to one. Search your Applications, WorkflowRuns, definitions and addon registries for `169.254.`, `metadata.google.internal`, `fd00:ec2::254` and `100.100.100.200`.
- Anything that reached the internet through `HTTP_PROXY` or `HTTPS_PROXY`; see [HTTP proxies are not used](#http-proxies-are-not-used).

From v1.11.2:

- A call to `localhost`, `127.0.0.1` or another loopback address, or to `0.0.0.0`. Use the Service's DNS name.
- A `timeout` of `0`, negative, without a unit, or over `workflow.http.maxTimeout`.
- A response over `workflow.http.maxResponseBytes`.
- A custom step whose `tls_config` names a Secret in another namespace; see [HTTPDo](../workflow/cue-actions.md#httpdo).
- A `request` step that gets an HTTP 400. The step fails on any status of 400 or above; before v1.11.2 a 400 passed. In return, a reply that isn't JSON no longer fails the step: `responseBody` holds the body as sent, and `response` is set only when the body is JSON.
