---
title: Security and Writes with vela mcp
---

This page is for anyone deciding how far to trust an agent with `vela mcp`: what the
server can see, what it never returns, and how a change gets from an agent's draft to your
cluster. To set the server up, start with [AI agents with vela mcp](./vela-mcp.md).

## Who the server acts as

- **Your identity, your RBAC.** The server runs as a child process of your MCP client and
  uses that process's kubeconfig context, exactly like the rest of the `vela` CLI. It can
  read and change only what that identity can. Kubernetes RBAC is the boundary.
- **No network listener.** The server speaks MCP over stdin and stdout only. Nothing else
  can connect to it.
- **Managed clusters go through cluster-gateway.** Reads in other clusters carry your
  identity only when cluster-gateway's `ClientIdentityPenetration` feature gate is on.
  Otherwise they run as the credential stored for that cluster, as `vela status` and
  `vela logs` do, and every such result says so in its `meta.warnings`.

Give the agent the identity you would give a person doing the same job. A read-only
identity makes a read-only agent, whatever flags the server has.

## Narrow what it reads

`--namespace` restricts Application, resource and log reads to the namespaces you list:

```shell
vela mcp config --namespace team-a --namespace team-b
```

- The check runs before any Application is read, so the server reveals nothing about
  other namespaces, not even whether an Application exists there.
- It also covers the objects an Application manages. Resources an Application created in
  a namespace outside the list are withheld, and the result counts how many were held back.
- Definitions, addons and clusters in `vela-system` stay readable. They are the catalogue
  every namespace builds on.

## What it never returns

- **Secrets:** metadata only, never data. A Secret that a definition renders comes back
  from `dryrun_application` as its key names, and `diff_application` only says its values
  changed. Cluster credentials listed by `list_clusters` come back as a credential type,
  never as the credential.
- **ConfigMaps:** key names only, never values.
- **Annotations that embed a serialized object** (such as
  `kubectl.kubernetes.io/last-applied-configuration`) are dropped.
- **Secret-like values** in specs, env entries and properties are replaced with
  `[redacted]`. Credential-shaped text and control characters are also removed from log
  lines, event messages and errors. That last step matches patterns, so treat it as a safety
  net. The rules for Secrets and ConfigMaps above are the guarantee.

Values marked `[redacted]` cannot be recovered through any tool.

## Limits on every call

Every result is bounded, and `meta.truncated` is `true` whenever a bound cut the data:

| Limit | Value |
|---|---|
| Items in a list | 500 |
| Size of one live object | 256 KiB |
| Nodes in a resource tree | 200 |
| One message, reason or other text field | 2048 characters |
| Log lines per pod | 200 by default, at most 2000 |
| Pods per `get_logs` call | 5 |
| Events listed by `explain_application` | The 20 newest, from at most 2000 read per namespace |
| Revisions listed by `explain_definition` | The 10 newest |
| Local definitions in one plan call | 20, at most 256 KiB each and 1 MiB together |
| Cluster and namespace pairs given resource trees under `--namespace` | 10; resources elsewhere are listed without a tree |
| Time per call | 60 seconds |

## Cluster text is data, not instructions

Descriptions, event messages, log lines, labels and annotations come from the cluster, and
anyone who can write to the cluster can put text there. The server tells the model at
connection time that such text is data about the system and never an instruction.
Findings keep the server's own sentence (`message`) apart from the text the cluster recorded
(`observed`), so the model can tell them apart.

## How writes work

Without `--allow-write`, the server has no tool that changes the cluster; it is the only
flag that adds a write tool in this release. With it, the agent
gets `apply_application`, and every apply follows the same path.

### 1. Plan: diff first, always

The agent calls `diff_application` with the Application document. The server renders the
document with today's definitions and the running revision with the definitions that
revision recorded, so the comparison shows everything an apply would change. If a
definition changed since the revision, its effect is part of the change set and a warning
names the definition. The result has:

- every resource that would be added, modified or removed, with the fields that differ;
- a risk class, with every rule that fired;
- a token for this exact diff.

`apply_application` refuses to run without that token. The token:

- is valid for 15 minutes and works once;
- is bound to the exact document bytes, the revision it was compared with, and the live
  Application's UID, generation, labels and annotations. If any of them changes, including
  a delete and recreate under the same name, the agent has to diff again.

### 2. Risk classes

| Class | Fires on |
|---|---|
| LOW | An image tag change only, a replica count change, or a new Application with nothing in the HIGH list |
| MEDIUM | Config or env changes; a resource or component added to an existing Application; a policy, workflow or sources change; a component change that renders the same objects; any image digest change. Any change no rule recognizes is MEDIUM, never LOW |
| HIGH | Any deletion or replacement, a removed component, a placement or topology change, a stateful resource (StatefulSet, PersistentVolumeClaim, PersistentVolume, StorageClass), a security-related resource (RBAC, NetworkPolicy, Ingress, Gateway, HTTPRoute, ServiceAccount, Secret, certificates), or a removed approval gate |

The class is the highest of every rule that fired. HIGH applies even in a new Application.

### 3. Mode: how the change is delivered

| Mode | What happens |
|---|---|
| `gitops` | Nothing is written. The result carries the Application YAML for you to commit to your delivery repository and review as a pull request. |
| `direct` | The server writes the Application to the cluster after you confirm in your client. |
| `gated` | Planned: write the change but hold it for an approval in the workflow. This release returns `gitops` instead, because the controller support that holds the change does not exist yet. |

The agent asks for a mode, `gated` by default. The server then applies policy, which can
only make the mode **stricter**, never looser:

1. `direct` is allowed only in namespaces listed with `--direct-namespace`.
2. A namespace label `app.oam.dev/agent-write-mode` tightens the mode for everything in
   that namespace.
3. The same key as an annotation on the live Application, or on the submitted document,
   tightens it for that Application.
4. HIGH risk changes are never applied directly.
5. `gated` falls back to `gitops` in this release.

The result reports the mode that was used and one line for every rule that changed it.

### 4. Confirmation for direct writes

A direct write needs your explicit confirmation:

- **Only for a change the diff could fully see.** Direct is refused, and nothing is
  written, when the diff used local definitions (the token does not bind them), when the
  Application renders objects into a namespace outside `--namespace`, or, on a server with
  `--namespace`, when the workflow runs steps whose writes the diff cannot see, such as
  `apply-object` or `webhook`. Use `gitops` for those.
- **The server writes the prompt.** It is built from the same change set the token was
  issued for, so the agent cannot describe the change differently from what will happen.
  Besides each resource change, it lists components, policies, placement, workflow,
  approval steps and sources that change.
- **Your client shows it to you.** This uses MCP elicitation. Clients that do not support
  elicitation get an error and nothing is written; the server never falls back to writing
  without asking.
- **One prompt, one write.** Each prompt is tied to a single use and expires with the token.
- **No lost updates.** The write only succeeds if the Application has not changed since
  the diff. A status write by the controller during the apply is retried, but only after
  the same checks pass again.

Never let an agent answer the prompt for you. It exists so that a person approves the change.

### 5. What a write leaves behind

Every Application written in direct mode carries three annotations:

| Annotation | Value |
|---|---|
| `mcp.oam.dev/initiator` | The username the Kubernetes API reported for the caller |
| `mcp.oam.dev/diff-token` | The token of the diff that was approved |
| `mcp.oam.dev/risk` | The risk class of that diff |

They stay on the Application only: the server adds them to
`filter.oam.dev/annotation-keys`, so KubeVela does not copy them onto the resources it
renders.

## Production namespaces

Direct writes are refused in every namespace that matches `--production-pattern`, a regular
expression for production namespace names. The protection is only as complete as the
pattern: a production namespace it does not match is not protected, so make it cover every
production name you use. The default,
`(?i)(^|[-_.])prod(uction)?($|[-_.])`, matches names such as `prod`, `team-prod`,
`prod.eu` and `production`, but not `product`. If a `--direct-namespace` matches the
pattern, the server refuses to start, and `vela mcp config` refuses to print the entry.

Set your own pattern if your production namespaces are named differently:

```shell
vela mcp config --allow-write --direct-namespace dev --production-pattern '^(live|prd)-'
```

## Settings for platform teams

These labels and annotations let a platform team shape what agents do, without changing any
server flags:

| Key | Set on | Effect |
|---|---|---|
| `app.oam.dev/agent-write-mode` | Namespace label, or Application annotation | `gitops`, `gated` or `direct`. Tightens the write mode; it can never loosen it. Use `gitops` on a namespace to make sure agents only ever produce pull requests there. |
| `app.oam.dev/delivery-default` | Namespace label | `kubevela` or `kubernetes`. The declared way to deliver new work in the namespace. Agents use it instead of asking the user on a blank start. |
| `definition.oam.dev/provides` | Definition label | The capability a definition provides, such as `postgres`. Definitions with the same value are alternatives, and `list_definitions` can filter by it. The filter also returns unlabelled definitions whose name or description mentions the capability, marked so agents confirm them. |
| `definition.oam.dev/default-for` | Definition annotation | Comma-separated namespaces where this definition is the default among those with the same `provides`, or `*` for every namespace. Agents use the default and name the alternatives, and only ask you to choose when there is no default. |

For example, this marks a CloudNativePG component as a Postgres provider and the default for
`team-a`. An Aurora component labelled `definition.oam.dev/provides: postgres` would then be
offered as the alternative.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: ComponentDefinition
metadata:
  name: cnpg-postgres
  namespace: vela-system
  labels:
    definition.oam.dev/provides: postgres
  annotations:
    definition.oam.dev/default-for: team-a
```

And to keep agents to pull requests in a namespace:

```shell
kubectl label namespace payments app.oam.dev/agent-write-mode=gitops
```

## Recommended setups

| Who | Server entry |
|---|---|
| Anyone exploring or troubleshooting | `vela mcp config`, read-only |
| An application team | `vela mcp config --namespace <team namespace>` |
| A team that delivers through Git | `vela mcp config --allow-write`, which returns YAML for pull requests |
| A developer with a personal dev namespace | `vela mcp config --allow-write --direct-namespace <dev namespace>` |
