---
title: "LFX Mentorship, Secret-Sourced HTTP Headers and CRD-Based Config Management"
author: Anish Bista
author_title: KubeVela Contributor
author_url: https://github.com/anishbista60
author_image_url: https://avatars.githubusercontent.com/u/108048384?v=4
tags: [ KubeVela, LFX, Mentorship, CNCF, Secrets, Config, CRD, Workflow ]
description: "How I spent my LFX Mentorship term hardening secret handling in KubeVela's request workflow step and rebuilding Config Management as first-class Kubernetes CRDs."
image: https://raw.githubusercontent.com/oam-dev/KubeVela.io/main/docs/resources/KubeVela-03.png
hide_table_of_contents: false
---

Hi, I'm Anish Bista (GitHub: [anishbista60](https://github.com/anishbista60)). In this post I want to share what I worked on during my second term as an LFX Mentorship mentee with the KubeVela community: closing a real credential-leakage gap in the workflow engine, and replacing KubeVela's Config Management system with proper Kubernetes CRDs.

<!--truncate-->

## What is LFX Mentorship?

![LFX Mentorship](/img/blog/lfx-cue-generator/lfx-mentorship.svg)

[LFX Mentorship](https://lfx.linuxfoundation.org/tools/mentorship) is the Linux Foundation's program connecting open-source projects with mentees for a fixed-term, structured contribution period. CNCF projects like KubeVela use it every term to turn scoped, real problems in the codebase into mentee projects guided by maintainers.

## What is KubeVela?

![KubeVela](/img/blog/lfx-cue-generator/kubevela-logo.png)

[KubeVela](https://kubevela.io/) is a modern software delivery and management control plane built on the [Open Application Model (OAM)](https://oam.dev/). It gives platform teams a consistent way to define, deploy, and operate applications across hybrid and multi-cloud Kubernetes environments, and it has been a CNCF incubating project since 2023.

## Project Details

**Project Name:** Secure secret handling for the `request` workflow step, and CRD-native Config Management

**Project Description:** Two related gaps in how KubeVela handles sensitive data:

1. The `request` workflow step had no way to source HTTP header values (bearer tokens, API keys) from Kubernetes Secrets, forcing users to hardcode credentials directly into `Application`/`WorkflowRun` specs.
2. KubeVela's Config Management represented config templates and config instances as labeled `ConfigMap`s and `Secret`s, with no real Kubernetes API type, no server-side schema validation, and inconsistent enforcement across the CLI, workflow engine, and VelaUX.

**Project Outcome:** A `headersFromSecret` field on the `request` step so header values resolve from Secrets at runtime, and a new `config.oam.dev/v1alpha1` API group (`ConfigTemplate`, `Config` CRDs) with controllers and validating webhooks, fully backward-compatible with the legacy ConfigMap/Secret convention.

**Project Mentors:** [Chaitanya Reddy](https://github.com/Chaitanyareddy0702), [Jerrin Francis](https://github.com/jerrinfrancis)

**Tracking Issue:** [kubevela/kubevela#7104](https://github.com/kubevela/kubevela/issues/7104)

**Project Link:** https://mentorship.lfx.linuxfoundation.org/project/5af163e9-b465-45d5-8f14-c18421e66e07

## Application and Development

I came into this term already familiar with KubeVela's workflow engine, and the mentorship issue ([#7104](https://github.com/kubevela/kubevela/issues/7104)) laid out two coordinated tracks rather than one: harden the `request` step's handling of credentials, and separately rebuild Config Management on proper CRDs. Both tracks shared the same underlying theme, KubeVela had places where secrets were either hardcoded in plaintext or stored in untyped, unvalidated Kubernetes objects, and both needed a design that didn't break any existing user.

**Track 1** started in the `kubevela/workflow` repo, since the `request` provider's Go implementation lives there. The `http` provider already had a precedent to follow: `tlsConfig` resolves a Secret via `params.KubeClient` for TLS material. I extended that same pattern to headers, adding a `headersFromSecret` list to the CUE schema and Go `Request` struct, each entry naming a header, a Secret, and a key. At runtime, the provider resolves the Secret in the process context's namespace and sets the header, with clear errors if the Secret or key is missing ([kubevela/workflow#229](https://github.com/kubevela/workflow/pull/229)). Because the `request` definition is vendored into `kubevela/kubevela` in two more places (the CUE template and the Helm chart), a short follow-up PR ([kubevela/kubevela#7292](https://github.com/kubevela/kubevela/pull/7292)) ported the same schema field there.

**Track 2** was the larger piece of work: a new `config.oam.dev/v1alpha1` API group with `ConfigTemplate` and `Config` CRDs, backed by controllers and validating webhooks ([kubevela/kubevela#7211](https://github.com/kubevela/kubevela/pull/7211)). The hard constraint was backward compatibility, every existing `config-template-*` ConfigMap and labeled config Secret had to keep working untouched, so the design had to let the two storage layers coexist and let callers (CLI, workflow, VelaUX) choose which one to talk to, rather than forcing a hard migration.

## Project Outcomes

### 1. `headersFromSecret` on the `request` step

Before this change, calling an authenticated HTTP endpoint from a workflow meant putting the token directly in the `Application`/`WorkflowRun` spec, visible in `kubectl get`, Git history, and any audit log. Now the token is pulled from a Secret at runtime:

```yaml
apiVersion: core.oam.dev/v1alpha1
kind: WorkflowRun
metadata:
  name: call-external-api
  namespace: default
spec:
  workflowSpec:
    steps:
      - name: call-api
        type: request
        properties:
          url: https://api.example.com/v1/validate
          method: GET
          headersFromSecret:
            - header: Authorization   # HTTP header to set
              secret: api-creds       # name of the Secret
              key: token               # key inside Secret.Data
```

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: api-creds
  namespace: default
stringData:
  token: "Bearer sk-supersecret-12345"
```

The `request` step resolves `token` from `api-creds` in the workflow's own namespace and sets it as the `Authorization` header on the outgoing call. The schema addition, mirrored in `pkg/providers/http/http.cue` (workflow repo) and the `request` definition (kubevela repo), looks like this:

```cue
// +usage=Headers whose values are resolved from Kubernetes Secrets
headersFromSecret?: [...{
	header: string  // The HTTP header name to set
	secret: string  // The name of the Kubernetes Secret
	key:    string  // The key within Secret.Data whose value becomes the header value
}]
```

### 2. Config CRDs, sourcing username/password from an existing Secret

The `Config` CRD's `spec.propertiesFrom.secretRef` lets a config's input properties come from a Secret you already manage, useful for credentials like a database username and password that shouldn't be typed inline anywhere. First, a `ConfigTemplate` that expects both fields:

```yaml
apiVersion: config.oam.dev/v1alpha1
kind: ConfigTemplate
metadata:
  name: db-credentials
  namespace: vela-system
spec:
  scope: namespace
  template: |
    template: {
      parameter: {
        username: string
        password: string
      }
      output: {
        apiVersion: "v1"
        kind:       "Secret"
        stringData: {
          username: parameter.username
          password: parameter.password
        }
      }
    }
```

An existing Secret holding the raw properties as JSON (the key defaults to `properties` if you omit it):

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: raw-db-creds
  namespace: default
stringData:
  properties: |
    {"username": "alice", "password": "s3cr3t-pass"}
```

And a `Config` that points at both, instead of inlining the values:

```yaml
apiVersion: config.oam.dev/v1alpha1
kind: Config
metadata:
  name: prod-db
  namespace: default
spec:
  templateRef:
    name: db-credentials
    namespace: vela-system
  propertiesFrom:
    secretRef:
      name: raw-db-creds
      key: properties
```

The `Config` controller reads `raw-db-creds`, renders it against `db-credentials`, and materializes a new, owned `Secret` named `prod-db` containing the rendered `username`/`password`, reconciled automatically if the source Secret changes, and garbage-collected with the `Config` object since it's set as the owner.

### 3. Creating the same CRDs through the CLI, no YAML required

`vela config` and `vela config-template` didn't gain new subcommands; they gained a second storage backend that the existing commands talk to automatically. `--config-mode` (default `auto`) probes the API server for the `config.oam.dev` CRDs and uses them if installed:

```bash
# apply the template (auto-detects the CRD and creates a ConfigTemplate)
vela config-template apply -f db-credentials.cue --name db-credentials -n vela-system

# create a config from it, dot notation sets nested fields
vela config create prod-db --template=vela-system/db-credentials \
  username=alice password=s3cr3t-pass

vela config list
vela config-template list -A
```

If the `ConfigTemplate` is marked `sensitive: true`, `vela config create` writes the properties into a companion `prod-db-properties` Secret and wires up `propertiesFrom` for you automatically. Pointing a `Config` at a Secret you *already* created yourself (as in the example above) is, for now, only expressible by applying the `Config` YAML directly, the CLI's `create` command doesn't yet have a `--from-secret` flag for that specific path.

### 4. The old ConfigMap/Secret convention still works, unmodified

Nothing is forced. `--config-mode` is a persistent flag available on every `vela` command:

```bash
# default: use the CRDs if the cluster has them installed, else fall back
vela config list

# force the legacy behavior: config-template-<name> ConfigMaps + labeled Secrets
vela config list --config-mode=legacy
vela config-template apply -f db-credentials.cue --config-mode=legacy

# force CRD-backed storage even if auto-detection would say otherwise
vela config list --config-mode=crd
```

`legacy` mode ignores the new CRDs entirely and keeps reading/writing `config-template-*` ConfigMaps and labeled Secrets exactly as before this project, which matters for clusters running an older `vela-core` release or mid-upgrade, where the CRDs aren't installed yet.

## Current Status

The `headersFromSecret` work is merged in both repos ([workflow#229](https://github.com/kubevela/workflow/pull/229), [kubevela#7292](https://github.com/kubevela/kubevela/pull/7292)). The Config/ConfigTemplate CRD work ([kubevela#7211](https://github.com/kubevela/kubevela/pull/7211)) is the larger of the two tracks, new API types, two controllers, two validating webhooks, CLI integration, and unit/envtest/e2e coverage across ~30 files, and is still going through review as of this writing.

## Future Outlook

Once the Config CRDs land, the natural next steps are a `kubectl` migration helper to convert existing `config-template-*` ConfigMaps into `ConfigTemplate` CRDs for anyone who wants to drop the legacy path entirely, and extending the `Config` controller to support the `outputs`/expanded-writer features that the legacy `ConfigFactory` already has (multi-secret templates, Nacos distribution) which the CRD controller doesn't cover yet. On the secrets side, the same `headersFromSecret` pattern is a natural fit for other providers in `kubevela/workflow` that still take raw string configuration.

This term reinforced something I already suspected: the interesting problems in a mature project aren't "add a feature," they're "add a feature without breaking anyone who's already relying on the thing you're replacing." Both tracks here were as much about designing the compatibility fallback as about the feature itself. Thanks to my mentors, Chaitanya Reddy and Jerrin Francis, and the KubeVela maintainers, for the review and guidance through both tracks.
