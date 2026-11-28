---
title: Workflow Outbound HTTP Protection
---

Workflow steps that make HTTP calls block cloud metadata and link-local destinations by default. The protection belongs to the workflow engine, so it works the same in vela-core and in the standalone `vela-workflow` controller: what is blocked, the default denylist, how to extend it, the stricter feature gates and the request limits are in [Workflow Outbound HTTP Protection](/workflow/next/operate/http-protection) in the Workflow docs. This page covers what vela-core adds.

:::caution Upgrade note
The denylist is on from KubeVela 1.11.1, 1.10.10 and 1.9.15. Upgrading from an older release turns it on. A workflow step that called a cloud metadata endpoint on purpose, for example `http://169.254.169.254/`, now fails. See [Upgrade note](/workflow/next/operate/http-protection#upgrade-note) before you upgrade.
:::

## Outside workflows

In vela-core the same checks also apply outside workflows:

- `vela/http` called from a component, trait, policy or source definition, and the legacy `processing.http`
- Helm chart downloads, from Helm repositories, chart URLs and `oci://` registries
- objects fetched from a URL by `ref-objects`

A blocked call there fails the render or the download with the same errors as a workflow step: `blocked SSRF host: <host>` or `blocked SSRF target: <ip>`.

`DisableWorkflowHTTP` stops workflow steps and the legacy `processing.http` in definitions. It does not stop `vela/http` in a definition template or Helm chart downloads. `blockPrivateHTTPAddresses` also refuses Helm repositories, `oci://` registries and `vela/http` calls in definitions on private addresses.

## Addresses vela-core always blocks

vela-core also blocks these addresses. They are not part of the denylist, and no ConfigMap or chart value changes them. The standalone `vela-workflow` controller does not add them.

| Entry | Covers |
| ----- | ------ |
| `127.0.0.0/8`, `::1` | Loopback: the controller's own metrics, health and webhook ports |
| `0.0.0.0/8`, `::` | The unspecified address, which reaches the local host |
| `64:ff9b:1::/48` | The local-use NAT64 prefix |

A `vela-core` that you run outside the cluster, for example while developing, can no longer call `localhost`. The loopback block is in 1.10.10, 1.11.2 and 1.12.0, not in 1.9.15 or 1.11.1.

## vela-core settings

| Setting | `vela-core` |
| ------- | ----------- |
| Config template for `vela config create` | `vela-core-http-deny` |
| Discovery label on your own ConfigMaps | `config.oam.dev/type: vela-core-http-deny` |
| Default ConfigMap | `vela-core-http-deny-default` |
| Block private addresses | `featureGates.blockPrivateHTTPAddresses` |
| Disable workflow HTTP | `featureGates.disableWorkflowHTTP` |

```shell
vela config create team-http-deny \
  --template vela-core-http-deny \
  --namespace vela-system \
  'denyHosts={*.example.com,internal.example.net}' \
  'denyCIDRs={198.51.100.0/24,203.0.113.7}'
```

The other values, under `workflow.httpDeny` and `workflow.http`, have the same names as in the `vela-workflow` chart: see [Chart values](/workflow/next/operate/http-protection#chart-values). To run both charts side by side, see [Install both charts together](/workflow/next/operate/http-protection#install-both-charts-together).
