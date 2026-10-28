---
title: vela mcp tool reference
---

This page lists every tool that `vela mcp` serves, with its inputs and the top-level
fields of its result. Agents read the same descriptions and full JSON schemas from the
server when they connect, so this page is for people: to see what an agent can do and
what it gets back. To set the server up, see [AI agents with vela mcp](../tutorials/vela-mcp.md).

Tools come in three classes:

- **Read** tools are always registered and never change the cluster.
- **Plan** tools render or compare an Application without saving it.
- **Write** tools exist only when the server is started with a flag that enables them.

| Tool | Class | Summary |
|---|---|---|
| [`get_platform_info`](#get_platform_info) | read | Report the KubeVela versions and configuration this session runs against: vela CLI version, vela-core version and health, Kubernetes server version, enabled feature gates, and any version skew. |
| [`list_definitions`](#list_definitions) | read | List the KubeVela definitions (components, traits, policies, workflow steps) available on this cluster, with their type, namespace, version, one-line description, the capability each provides and whether it is the platform default for the namespace. |
| [`describe_definition`](#describe_definition) | read | Return one KubeVela definition's parameter schema as JSON Schema, with required fields, defaults and description, plus its current revision. |
| [`list_applications`](#list_applications) | read | List KubeVela Applications with phase, health, components, workflow state and whether the recorded status is stale. |
| [`get_application`](#get_application) | read | Read one Application live: its declared components, traits, policies and workflow with secret-like values removed, plus the controller's status for every service, the conditions, applied resources and the workflow steps. |
| [`get_workflow`](#get_workflow) | read | Read an Application's workflow: declared steps, each step's phase, reason, message and timing, which steps are suspended or failed, and the exact vela command that moves it forward. |
| [`get_managed_resource`](#get_managed_resource) | read | Read the objects an Application manages, from its ResourceTrackers, with the live resource tree and health of each (Deployment, ReplicaSet, Pod and so on) in the cluster where it runs. |
| [`get_logs`](#get_logs) | read | Return a bounded, redacted tail of container logs for an Application's pods, found through its managed resources. |
| [`explain_definition`](#explain_definition) | read | Explain one KubeVela definition from its live object: what kinds its template produces, which parameters flow into which fields, its parameter schema, health and custom status rules, trait behaviour and restrictions, revision history, and how many Applications use it. |
| [`explain_application`](#explain_application) | read | Explain an Application end to end: each component with its definition, declared dependencies and data flow, recorded status per cluster, live managed resources with unhealthy descendants and pod phases, workflow state, recent events, and a list of findings ordered by severity, each citing the object it came from. |
| [`list_clusters`](#list_clusters) | read | List the clusters KubeVela can deploy to, with alias, credential type, endpoint and labels. |
| [`list_addons`](#list_addons) | read | List the addons enabled on this control plane with version, registry, phase, health and the clusters they reach, read from the Applications the addons installed. |
| [`dryrun_application`](#dryrun_application) | plan | Render an Application document the way vela dry-run does, without saving it: every Kubernetes object each component and trait would produce, plus policy objects. |
| [`diff_application`](#diff_application) | plan | Compare an Application document with what runs: renders both, lists every resource added, modified or removed with the fields that differ, flags placement, policy, component and approval-gate changes, and classifies risk LOW, MEDIUM or HIGH with every rule that fired. |
| [`apply_application`](#apply_application) | write | Deliver an Application after diff_application, using the token it returned for the same document. |

## The meta block

Every result carries a `meta` block that says which system the data came from and when it was read.

| Field | Type | Description |
|---|---|---|
| `featureGates` | object | vela-core feature gates set to a value other than their default. Absent gates are at their defaults; get_platform_info lists every gate set on the controller. |
| `kubernetes` | object | Kubernetes API server version per cluster name. |
| `observedAt` | string | When the data in this response was read, UTC. |
| `source` | string | live for an API server read, rendered for dry-run or diff output, cached for served data. |
| `truncated` | boolean | True when a size or count limit cut the data; narrow the request to see the rest. |
| `velaCLI` | string | Version of the vela binary serving this session. |
| `velaCore` | string | vela-core controller version found on the cluster, or unknown. |
| `warnings` | array of string | Version skew, identity and completeness notes that apply to this response. |


## get_platform_info

Read. Always registered.

Report the KubeVela versions and configuration this session runs against: vela CLI version, vela-core version and health, Kubernetes server version, enabled feature gates, and any version skew. Call once per session before other tools so explanations match the running system. Pass the namespace the user is working in to learn how it delivers workloads today, so new work follows that practice.

### Input

| Field | Type | Required | Description |
|---|---|---|---|
| `namespace` | string | no | Namespace the user is about to work in. When set, the result reports how that namespace delivers workloads today. |

### Result

| Field | Type | Description |
|---|---|---|
| `clusterGateway` | object | Whether cluster-gateway was found and whether it forwards the caller's identity to other clusters. |
| `controller` | object | Whether the vela-core Deployment was found, with its image and ready replicas. |
| `featureGates` | object | Feature gates set on the vela-core controller's --feature-gates flag, with their values. |
| `gitRevision` | string | Git revision the vela binary was built from. |
| `kubernetes` | object | Kubernetes API server version per cluster name. |
| `meta` | object | Versions and read time for this result. See [the meta block](#the-meta-block). |
| `practice` | object | How the namespace delivers workloads today. Follow it: keep existing workloads in their form and match it for new work unless the user asks otherwise. |
| `velaCLI` | string | Version of the vela binary serving this session. |
| `velaCore` | string | vela-core controller version found on the cluster, or unknown. |
| `warnings` | array of string | Version skew and other notes about this platform. |


## list_definitions

Read. Always registered.

List the KubeVela definitions (components, traits, policies, workflow steps) available on this cluster, with their type, namespace, version, one-line description, the capability each provides and whether it is the platform default for the namespace. Filter by provides to compare alternatives; when several fit and none is default, ask the user to choose.

### Input

| Field | Type | Required | Description |
|---|---|---|---|
| `namespace` | string | no | Namespace to list in addition to the system namespace. Empty lists every namespace the caller can read. Also decides which definition is marked default. |
| `provides` | string | no | Keep only definitions the platform labels as providing this capability, such as postgres, to compare alternatives. |
| `type` | string | no | Limit to one definition type: component, trait, policy or workflow-step. Empty lists all four. |

### Result

| Field | Type | Description |
|---|---|---|
| `definitions` | array of object | Definitions sorted by type, namespace and name. |
| `meta` | object | Versions and read time for this result. See [the meta block](#the-meta-block). |


## describe_definition

Read. Always registered.

Return one KubeVela definition's parameter schema as JSON Schema, with required fields, defaults and description, plus its current revision. Use the returned schema as the only source of parameter names.

### Input

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | yes | Definition name as returned by list_definitions. |
| `namespace` | string | no | Namespace to look in before the system namespace. |
| `type` | string | no | Definition type: component, trait, policy or workflow-step. When empty every type is tried in that order. |

### Result

| Field | Type | Description |
|---|---|---|
| `default` | boolean | True when this is the platform default for the namespace in the request. Use it and name the alternatives; ask the user only when no option is default and they differ materially. |
| `defaultFor` | array of string | Namespaces where the platform made this the default among definitions providing the same capability; * means every namespace. |
| `description` | string | One-line description the definition declares. |
| `latestRevision` | string | Name of the definition's latest DefinitionRevision. |
| `meta` | object | Versions and read time for this result. See [the meta block](#the-meta-block). |
| `name` | string | Name of the object this result describes. |
| `namespace` | string | Namespace of the object this result describes. |
| `parameters` | object | The definition's parameters as JSON Schema. |
| `provides` | string | Capability the platform labels this definition as providing, such as postgres. Definitions with the same value are alternatives. |
| `required` | array of string | Parameter names the definition requires. |
| `type` | string | Definition type: component, trait, policy or workflow-step. |
| `version` | string | Version the definition declares, if any. |


## list_applications

Read. Always registered.

List KubeVela Applications with phase, health, components, workflow state and whether the recorded status is stale. Namespace narrows the list; the server's namespace restriction always applies.

### Input

| Field | Type | Required | Description |
|---|---|---|---|
| `namespace` | string | no | Namespace to list. Empty lists every namespace the server allows. |

### Result

| Field | Type | Description |
|---|---|---|
| `applications` | array of object | Applications the server may read, sorted by namespace and name. |
| `meta` | object | Versions and read time for this result. See [the meta block](#the-meta-block). |


## get_application

Read. Always registered.

Read one Application live: its declared components, traits, policies and workflow with secret-like values removed, plus the controller's status for every service, the conditions, applied resources and the workflow steps. Use get_managed_resource for the live objects and get_workflow for step detail.

### Input

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | yes | Application name. |
| `namespace` | string | yes | Application namespace. |

### Result

| Field | Type | Description |
|---|---|---|
| `annotations` | object | Application annotations. Values that embed a serialized object are dropped. |
| `components` | array of object | Components with their types. |
| `createdAt` | string | When the Application was created, UTC. |
| `evidence` | array of string | Objects this answer was derived from. |
| `healthy` | boolean | False when the phase or a workflow step failed, or when no service has reported status yet. |
| `labels` | object | Application labels. |
| `meta` | object | Versions and read time for this result. See [the meta block](#the-meta-block). |
| `name` | string | Name of the object this result describes. |
| `namespace` | string | Namespace of the object this result describes. |
| `phase` | string | Application phase as the controller recorded it, such as running or runningWorkflow. |
| `revision` | string | Latest ApplicationRevision name. |
| `spec` | object | Declared components, traits, policies and workflow, with secret-like values removed. |
| `status` | object | Status as the controller last wrote it: services, conditions, applied resources and workflow. |
| `statusStale` | boolean | True when the controller has not observed the latest spec, so status describes an older generation. |
| `workflow` | object | Workflow progress: mode, phase, and whether it is suspended, terminated or finished. |


## get_workflow

Read. Always registered.

Read an Application's workflow: declared steps, each step's phase, reason, message and timing, which steps are suspended or failed, and the exact vela command that moves it forward. The server never resumes.

### Input

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | yes | Application name. |
| `namespace` | string | yes | Application namespace. |

### Result

| Field | Type | Description |
|---|---|---|
| `application` | string | Application name. |
| `evidence` | array of string | Objects this answer was derived from. |
| `meta` | object | Versions and read time for this result. See [the meta block](#the-meta-block). |
| `namespace` | string | Namespace of the object this result describes. |
| `spec` | object | Workflow steps as the Application declares them. |
| `status` | object | Each step's recorded phase, reason, message and timing, and the vela command that moves the workflow forward. |


## get_managed_resource

Read. Always registered.

Read the objects an Application manages, from its ResourceTrackers, with the live resource tree and health of each (Deployment, ReplicaSet, Pod and so on) in the cluster where it runs. Narrow by component, cluster, kind and resourceName; a single match also returns the live object. Secrets return metadata only and objects the Application does not manage are refused.

### Input

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | yes | Application name. |
| `namespace` | string | yes | Application namespace. |
| `cluster` | string | no | Only resources in this cluster. Use local for the control plane. |
| `component` | string | no | Only resources created by this component. |
| `kind` | string | no | Only resources of this kind, for example Deployment. |
| `resourceName` | string | no | Only the resource with this name. With kind this selects one object and returns its live content. |

### Result

| Field | Type | Description |
|---|---|---|
| `application` | string | Application name. |
| `evidence` | array of string | Objects this answer was derived from. |
| `meta` | object | Versions and read time for this result. See [the meta block](#the-meta-block). |
| `namespace` | string | Namespace of the object this result describes. |
| `resources` | array of object | Managed objects with cluster, health and the live resource tree. A single match also carries the live object. |


## get_logs

Read. Always registered.

Return a bounded, redacted tail of container logs for an Application's pods, found through its managed resources. Narrow by component, cluster, pod and container; use previous for crash loops. Default 200 lines per pod, at most five pods per call.

### Input

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | yes | Application name. |
| `namespace` | string | yes | Application namespace. |
| `cluster` | string | no | Only pods in this cluster. Use local for the control plane. |
| `component` | string | no | Only pods of this component. |
| `container` | string | no | Container name. Empty uses the first container and lists the others. |
| `pod` | string | no | One pod by name. Empty tails up to five pods. |
| `previous` | boolean | no | Read the previous container instance, for crash loops. |
| `sinceSeconds` | integer | no | Only lines newer than this many seconds. |
| `tailLines` | integer | no | Lines per pod from the end. Default 200, maximum 2000. |

### Result

| Field | Type | Description |
|---|---|---|
| `application` | string | Application name. |
| `evidence` | array of string | Objects this answer was derived from. |
| `meta` | object | Versions and read time for this result. See [the meta block](#the-meta-block). |
| `namespace` | string | Namespace of the object this result describes. |
| `pods` | array of object | One entry per pod read, with its lines and whether they were cut. |


## explain_definition

Read. Always registered.

Explain one KubeVela definition from its live object: what kinds its template produces, which parameters flow into which fields, its parameter schema, health and custom status rules, trait behaviour and restrictions, revision history, and how many Applications use it. Static inspection; nothing is rendered or applied.

### Input

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | yes | Definition name as returned by list_definitions. |
| `namespace` | string | no | Namespace to look in before the system namespace. |
| `type` | string | no | Definition type: component, trait, policy or workflow-step. When empty every type is tried in that order. |

### Result

| Field | Type | Description |
|---|---|---|
| `abstract` | boolean | True when the definition is abstract and is only extended, never used directly. |
| `alias` | string | Short alias the definition declares. |
| `consumers` | object | Applications that use this definition, within the namespaces the server may read. |
| `default` | boolean | True when this is the platform default for the namespace in the request. Use it and name the alternatives; ask the user only when no option is default and they differ materially. |
| `defaultFor` | array of string | Namespaces where the platform made this the default among definitions providing the same capability; * means every namespace. |
| `deprecated` | boolean | True when the definition is marked deprecated. |
| `description` | string | One-line description the definition declares. |
| `evidence` | array of string | Objects this answer was derived from. |
| `extends` | string | Definition this one extends, if any. |
| `health` | object | Health and custom status rules, verbatim CUE. |
| `hidden` | boolean | True when the definition asks to be hidden from listings. |
| `inspectionError` | string | Set when the template could not be parsed; the schema and metadata are still valid. |
| `latestRevision` | string | Name of the definition's latest DefinitionRevision. |
| `meta` | object | Versions and read time for this result. See [the meta block](#the-meta-block). |
| `name` | string | Name of the object this result describes. |
| `namespace` | string | Namespace of the object this result describes. |
| `parameterUsage` | array of object | Which template fields each parameter flows into. |
| `parameters` | object | JSON Schema of the parameter block. |
| `produces` | array of object | Kinds the template emits, read from the template without rendering. |
| `provides` | string | Capability the platform labels this definition as providing, such as postgres. Definitions with the same value are alternatives. |
| `required` | array of string | Top-level parameters with no default, which must be supplied. |
| `restrictedToNamespaces` | array of string | Namespaces the definition may be used in, when the platform restricts it. |
| `revisions` | array of object | DefinitionRevisions, newest first. |
| `trait` | object | For traits: the workloads it applies to, what it conflicts with, and whether it restarts pods or manages the workload. |
| `type` | string | Definition type: component, trait, policy or workflow-step. |
| `version` | string | Version the definition declares, if any. |
| `workload` | object | For components: the workload type, apiVersion and kind the template declares. |


## explain_application

Read. Always registered.

Explain an Application end to end: each component with its definition, declared dependencies and data flow, recorded status per cluster, live managed resources with unhealthy descendants and pod phases, workflow state, recent events, and a list of findings ordered by severity, each citing the object it came from. Start here when asked why an application is not working.

### Input

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | yes | Application name. |
| `namespace` | string | yes | Application namespace. |

### Result

| Field | Type | Description |
|---|---|---|
| `components` | array of object | Each component joined with its definition, status and live resources. |
| `createdAt` | string | When the Application was created, UTC. |
| `events` | array of object | Recent events on the Application or its resources, newest first. |
| `evidence` | array of string | Objects this answer was derived from. |
| `findings` | array of object | Observations ordered error, warning, info, each citing an object. |
| `handles` | object | Exact identifiers for queries to other tools: clusters, namespace, pods, labels and the time window. Use them verbatim; do not guess label names or time ranges. |
| `healthy` | boolean | False when the phase or a workflow step failed, or when no service has reported status yet. |
| `meta` | object | Versions and read time for this result. See [the meta block](#the-meta-block). |
| `name` | string | Name of the object this result describes. |
| `namespace` | string | Namespace of the object this result describes. |
| `phase` | string | Application phase as the controller recorded it, such as running or runningWorkflow. |
| `policies` | array of object | Policies the Application declares, with their types and properties. |
| `revision` | string | Latest ApplicationRevision name. |
| `statusStale` | boolean | True when the controller has not observed the latest spec, so status describes an older generation. |
| `unknowns` | array of string | What could not be read. Report these as unknown rather than guessing. |
| `workflow` | object | Workflow state with suspended and failed steps and the next command. |


## list_clusters

Read. Always registered.

List the clusters KubeVela can deploy to, with alias, credential type, endpoint and labels. Credentials are never returned.

### Input

This tool takes no input.

### Result

| Field | Type | Description |
|---|---|---|
| `clusters` | array of object | Clusters with alias, credential type, endpoint and labels. |
| `evidence` | array of string | Objects this answer was derived from. |
| `meta` | object | Versions and read time for this result. See [the meta block](#the-meta-block). |


## list_addons

Read. Always registered.

List the addons enabled on this control plane with version, registry, phase, health and the clusters they reach, read from the Applications the addons installed. Registry catalogues are not queried.

### Input

This tool takes no input.

### Result

| Field | Type | Description |
|---|---|---|
| `addons` | array of object | Enabled addons. |
| `evidence` | array of string | Objects this answer was derived from. |
| `meta` | object | Versions and read time for this result. See [the meta block](#the-meta-block). |


## dryrun_application

Plan. Always registered; renders and compares without writing.

Render an Application document the way vela dry-run does, without saving it: every Kubernetes object each component and trait would produce, plus policy objects. Pass local definitions to render against definitions not yet on the cluster. Use it until the draft renders clean, then diff_application.

### Input

| Field | Type | Required | Description |
|---|---|---|---|
| `application` | string | yes | The Application as YAML or JSON, exactly as it would be applied. |
| `definitions` | array of string | no | Optional local definitions as YAML, each one document, used instead of the cluster's copy of the same name. |
| `namespace` | string | no | Namespace to render in when the document has none. The document's own namespace wins. |

### Result

| Field | Type | Description |
|---|---|---|
| `application` | string | Application name. |
| `components` | array of object | Components in the document, with their types. |
| `evidence` | array of string | What was rendered and with which definitions. |
| `meta` | object | Versions and read time for this result. See [the meta block](#the-meta-block). |
| `namespace` | string | Namespace of the object this result describes. |
| `policies` | array of object | Objects rendered by policies. |
| `resources` | array of object | Every object the components and traits would create. |


## diff_application

Plan. Always registered; renders and compares without writing.

Compare an Application document with what runs: renders both, lists every resource added, modified or removed with the fields that differ, flags placement, policy, component and approval-gate changes, and classifies risk LOW, MEDIUM or HIGH with every rule that fired. Returns a token that apply_application requires, so show this result to the user before any apply.

### Input

| Field | Type | Required | Description |
|---|---|---|---|
| `application` | string | yes | The Application as YAML or JSON, exactly as it would be applied. |
| `definitions` | array of string | no | Optional local definitions as YAML, each one document, used instead of the cluster's copy of the same name. |
| `namespace` | string | no | Namespace to render in when the document has none. The document's own namespace wins. |
| `revision` | string | no | ApplicationRevision to compare against. Empty uses the latest revision; a missing Application compares against nothing. |

### Result

| Field | Type | Description |
|---|---|---|
| `application` | string | Application name. |
| `base` | string | ApplicationRevision the document was compared with, or new when the Application does not exist. |
| `changeSet` | object | Everything that would change, computed from both renders. |
| `evidence` | array of string | Objects and renders this answer was derived from. |
| `expiresAt` | string | When the token stops being accepted, UTC. |
| `meta` | object | Versions and read time for this result. See [the meta block](#the-meta-block). |
| `namespace` | string | Namespace of the object this result describes. |
| `risk` | object | Risk class with the rules that fired. Show it to the user with the change set. |
| `token` | string | Required by apply_application. Binds this exact document to the base revision; it does not record that anyone reviewed the diff. |


## apply_application

Write. Registered only when the server starts with `--allow-write`.

Deliver an Application after diff_application, using the token it returned for the same document. Policy decides the mode and can only make it stricter: gitops returns YAML to commit and writes nothing; direct asks the user to confirm in their client with a prompt the server writes, and writes only after they accept. Never answer that prompt for the user. Report the mode used.

### Input

| Field | Type | Required | Description |
|---|---|---|---|
| `application` | string | yes | The same Application document that was passed to diff_application, byte for byte. |
| `token` | string | yes | The token diff_application returned for this document. |
| `mode` | string | no | Requested write mode: gitops, gated or direct. Default gated. Policy may make it stricter, never looser. |
| `namespace` | string | no | Namespace when the document has none, as for diff_application. |

### Result

| Field | Type | Description |
|---|---|---|
| `application` | string | Application name. |
| `applied` | boolean | True only when the Application was written to the cluster. |
| `declined` | boolean | True when the user declined the confirmation prompt; nothing was written. |
| `evidence` | array of string | Objects this answer was derived from. |
| `generation` | integer | Generation of the Application as written. Empty when nothing was written. |
| `meta` | object | Versions and read time for this result. See [the meta block](#the-meta-block). |
| `mode` | string | The mode actually used after policy: gitops or direct. Report it to the user. |
| `modeReasons` | array of string | Why the mode differs from the one requested, one line per policy that applied. |
| `namespace` | string | Namespace of the object this result describes. |
| `next` | string | What to do next, such as open a pull request or poll get_application. |
| `resourceVersion` | string | resourceVersion of the Application as written. Empty when nothing was written. |
| `risk` | object | Risk class and rules from the diff this token was issued for. |
| `yaml` | string | In gitops mode, the Application to commit to the delivery repository. Nothing was written to the cluster. |


###### Auto generated by [hack/docgen/mcp](https://github.com/kubevela/kubevela/tree/master/hack/docgen/mcp) in KubeVela.
