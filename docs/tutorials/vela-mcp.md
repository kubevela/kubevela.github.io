---
title: AI Agents with vela mcp
---

`vela mcp` lets an AI agent work with KubeVela the way you would with the `vela` CLI. You
add it to an MCP client such as Claude Code, Cursor, Codex or Gemini CLI, then ask
questions in plain language:

- "Why is the `checkout` application in `team-a` not healthy?"
- "What does the `webservice` component do, and which parameters does it take?"
- "Add a Redis cache to my app and show me what would change before anything is applied."

The agent answers from the live cluster, not from what it remembers about KubeVela. Every
result says which vela-core and Kubernetes versions it came from and when it was read, and
every finding names the object it came from, so you can check the answer yourself.

`vela mcp` implements the [Model Context Protocol](https://modelcontextprotocol.io) (MCP),
the open standard most AI clients use to call external tools.

## How it works

```
 MCP client (Claude Code, Cursor, ...)
        |  starts the process, talks over stdin/stdout
        v
 vela mcp  --- your kubeconfig and RBAC --->  Kubernetes API (control plane)
                                                   |
                                                   +-- cluster-gateway --> managed clusters
```

- **Your client runs `vela mcp` as a child process.** There is no network port and nothing
  to deploy in the cluster.
- **It acts as you.** The server uses the kubeconfig and context of the process that starts
  it, so it can read only what your RBAC allows.
- **It is read-only by default.** Tools that change the cluster are only available when
  you start the server with a flag that enables them. See
  [Security and writes](./vela-mcp-security.md).

## Before you start

You need:

- A Kubernetes cluster with KubeVela installed. See [Installation](../installation/kubernetes.mdx).
- A `vela` CLI that includes the `mcp` command. Check with `vela mcp --help`. Use the same
  minor version as vela-core; if they differ, every result carries a version skew warning.
- A kubeconfig context that can read the namespaces you want to ask about.
- An MCP client. This guide covers Claude Code, Cursor, Codex, Gemini CLI and Claude
  Desktop. Any client that can start a local (stdio) MCP server works the same way.

## Step 1: Point your shell at the cluster

The server uses whichever cluster your shell points at when the client starts it. Check that
first:

```shell
kubectl config current-context
vela ls -A
```

If `vela ls` lists your Applications, the server will see the same ones.

## Step 2: Print the server entry

`vela mcp config` prints what a client needs to start the server. It writes nothing; you
paste or run the output in your client's own setup.

```shell
vela mcp config
```

```json
{
  "mcpServers": {
    "kubevela": {
      "args": [
        "mcp"
      ],
      "command": "/usr/local/bin/vela"
    }
  }
}
```

The `command` is the absolute path of the `vela` binary you ran, so the client starts that
exact binary. Server flags you add to `vela mcp config` end up in `args`. For example, to
restrict the server to one namespace:

```shell
vela mcp config --namespace team-a
```

For clients that register servers with their own `mcp add` command, print the server
command and arguments that go after it:

```shell
vela mcp config --format command
```

```
/usr/local/bin/vela mcp
```

## Step 3: Add the server to your client

### Claude Code

```shell
claude mcp add kubevela -- $(vela mcp config --format command)
```

Run it in a shell pointed at the right cluster. Add `--scope user` to make the server
available in every project. Inside a session, `/mcp` shows whether `kubevela` connected.

### Cursor

Merge the `kubevela` entry printed by `vela mcp config` into the `mcpServers` object of
`~/.cursor/mcp.json`, or `.cursor/mcp.json` in a project.

### Codex

Put the printed `command` and `args` into `~/.codex/config.toml`:

```toml
[mcp_servers.kubevela]
command = "/usr/local/bin/vela"
args = ["mcp"]
```

### Gemini CLI

Merge the printed `kubevela` entry into the `mcpServers` object of `~/.gemini/settings.json`.

### Claude Desktop and other desktop apps

Merge the printed entry into the app's MCP configuration file. For Claude Desktop that is
`claude_desktop_config.json`, which you can open from **Settings > Developer > Edit Config**.

Apps started from a dock or start menu do not inherit your shell's environment, so tell the
server which kubeconfig to use:

```json
{
  "mcpServers": {
    "kubevela": {
      "command": "/usr/local/bin/vela",
      "args": ["mcp"],
      "env": {
        "KUBECONFIG": "/Users/you/.kube/config"
      }
    }
  }
}
```

Restart the app after you change the file.

## Step 4: Check the connection

Ask your agent:

> What version of KubeVela is this cluster running?

The agent calls `get_platform_info` and answers with the vela CLI, vela-core and Kubernetes
versions, the feature gates set on the controller, and any version skew. If the versions
are the ones you expect, you are connected to the right cluster.

## Step 5: Put it to work

You do not need to name tools. Describe what you want and the agent picks them. These are
the common tasks and the tools behind them:

| You ask | The agent uses |
|---|---|
| Which applications are running, and are they healthy? | `list_applications` |
| Why is this application not working? | `explain_application`, then `get_logs` and `get_managed_resource` |
| Where is my workflow stuck? | `get_workflow` |
| Which components, traits and policies can I use? | `list_definitions` |
| What does this definition do and which parameters does it take? | `explain_definition`, `describe_definition` |
| Write an Application for me and check it renders | `describe_definition`, `dryrun_application` |
| What would change if I applied this? | `diff_application` |
| Which clusters and addons does the platform have? | `list_clusters`, `list_addons` |

The [tool reference](../reference/vela-mcp-tools.md) lists every tool with its inputs and results.

### Example: troubleshooting an application

> Why is the `broken` application in `team-a` not healthy?

The agent calls `explain_application`. Its findings come back ordered by severity, each
naming the object it came from:

```
error    component "broken": Deployment broken is UnHealthy
         observed: 1 of 1 pods are not healthy; the object's own health check reported Healthy
error    component "broken" in local/team-a reports unhealthy
         observed: Ready:0/1
warning  component "broken": pods under Deployment broken have restarted 43 times
warning  warning event BackOff on Pod/broken-d598f4ccc-fbrnn, seen 872 times
info     application phase is runningWorkflow
```

It then reads the logs of the previous, crashed container with `get_logs`:

```
DB_URL not set
```

From that it can tell you the container exits because `DB_URL` is missing, the workflow is
waiting for the component to become healthy, and which property to set to fix it.

`explain_application` also returns a `handles` block: the exact clusters, namespace, pod
names, label selector and time window of the latest deployment. If your client also has
an observability MCP server, such as Grafana or Datadog, the agent can use those handles to
query the matching metrics and traces without guessing label names.

### Example: writing a new application

> Deploy nginx 1.27 in `team-a` with two replicas.

A well-behaved agent:

1. Calls `get_platform_info` with the namespace, to learn how the namespace delivers
   workloads today. If it already uses plain Kubernetes manifests, the agent should keep
   doing that unless you ask for KubeVela.
2. Calls `list_definitions` to find a component that fits, and `describe_definition` for
   its parameters.
3. Drafts the Application and checks it with `dryrun_application` until it renders cleanly.
4. Calls `diff_application` and shows you every resource that would change and the risk class.

Nothing is applied. Applying needs a server started with `--allow-write`, covered in
[Security and writes](./vela-mcp-security.md).

## Choose what the server may do

Server flags go after `vela mcp config` so they are part of the printed entry:

| Flag | Effect |
|---|---|
| (none) | Read and plan tools only. Nothing in the cluster can change. |
| `--namespace team-a` | Read Applications, resources and logs only in `team-a`. Repeat the flag for more namespaces. Definitions, addons and clusters stay readable. |
| `--allow-write` | Add `apply_application`. On its own it never writes: it returns the Application YAML for you to commit to your delivery repository. |
| `--allow-write --direct-namespace dev` | Also allow writes straight to the cluster in `dev`, each one confirmed by you in the client. |
| `--production-pattern <regex>` | Namespaces that match never allow direct writes. The default matches names such as `prod`, `team-prod` and `production`. |
| `--allow-resume` | Reserved for `resume_workflow`, which is not available yet. It has no effect in this release. |

See [vela mcp](../cli/vela_mcp.md) and [vela mcp config](../cli/vela_mcp_config.md) for the
full flag reference.

## Work with several clusters

The server talks to one control plane: the one in its kubeconfig context. To switch between
control planes, register one server entry per context, each with its own name and kubeconfig:

```shell
claude mcp add kubevela-staging -e KUBECONFIG=$HOME/.kube/staging -- $(vela mcp config --format command)
claude mcp add kubevela-prod -e KUBECONFIG=$HOME/.kube/prod -- $(vela mcp config --format command --namespace team-a)
```

For JSON-configured clients, use `vela mcp config --name kubevela-staging` and add an `env`
block with `KUBECONFIG`, as shown for desktop apps.

Clusters managed by one control plane need no extra entries: the server reaches them
through cluster-gateway, just like `vela status` does.

## Add the KubeVela skills (optional)

The [kubevela/skills](https://github.com/kubevela/skills) repository has skills for
developers, SREs, platform engineers and definition authors. They teach the agent the
procedures for each role, such as following the namespace's existing delivery practice and
always showing a diff before an apply. Its `clients` folder explains how to install them for
each client.

## Troubleshooting

**The client says the server failed to start.**
Run the printed command yourself, for example `/usr/local/bin/vela mcp`. A working server
prints nothing and waits for input; stop it with Ctrl+C. If it exits with an error, the
message says why, for example a flag the server refuses. A cluster that cannot be reached
shows up later, as an error on the first tool call.

**The agent sees the wrong cluster, or none.**
The server uses the kubeconfig of the process that started it. Start the client from a
shell pointed at the right context, or set `KUBECONFIG` in the server entry.

**`velaCore` is `unknown`.**
The server could not find the vela-core Deployment, either because KubeVela is not installed
in that cluster or because your identity cannot read Deployments in `vela-system`.

**Results include a version skew warning.**
The vela CLI and vela-core are on different minor versions. Install the CLI that matches
the controller.

**A result says `truncated: true`.**
A size or count limit cut the data. Ask about a single namespace, component or resource.

**Direct mode is refused with "needs a client that can ask the user to confirm".**
Direct writes need a client that supports MCP elicitation, so you can confirm the change
yourself. Use a client that supports it, or let the server return YAML for a pull request.

**The server refuses to start with a `--direct-namespace` error.**
Either `--allow-write` is missing, or the namespace matches `--production-pattern`. Direct
writes are never allowed in production namespaces.

**Results from a managed cluster carry an identity warning.**
cluster-gateway is not forwarding your identity, so reads in that cluster run as the
credential stored for it. Enable the gateway's `ClientIdentityPenetration` feature gate to
read as yourself.

## Learn more

- [Security and writes](./vela-mcp-security.md): what the server can see, what it never returns, and how writes are controlled.
- [Tool reference](../reference/vela-mcp-tools.md): every tool, its inputs and its results.
- [vela mcp](../cli/vela_mcp.md) and [vela mcp config](../cli/vela_mcp_config.md): command reference.
