---
title: "LFX Mentorship: Secret-Sourced HTTP Headers and CRD-Based Config Management"
author: Anish Bista
author_title: KubeVela Contributor
author_url: https://github.com/anishbista60
author_image_url: /img/blog/lfx-secure-config/anish-bista.png
tags: [ KubeVela, LFX, Mentorship, CNCF, Secrets, Config, CRD, Workflow ]
description: "My LFX Mentorship term with KubeVela: reading request headers from Secrets, and rebuilding Config Management on ConfigTemplate and Config CRDs for KubeVela 1.12."
image: https://raw.githubusercontent.com/oam-dev/KubeVela.io/main/docs/resources/KubeVela-03.png
hide_table_of_contents: false
---

Hi, I'm [Anish Bista](https://github.com/anishbista60). In this post I want to share what I built as an LFX Mentee with KubeVela, mentored by [Chaitanya Reddy](https://github.com/Chaitanyareddy0702) and [Jerrin Francis](https://github.com/jerrinfrancis). My project, [Secret-Sourced HTTP Headers and CRD-Based Config Management](https://mentorship.lfx.linuxfoundation.org/project/5af163e9-b465-45d5-8f14-c18421e66e07) ([#7104](https://github.com/kubevela/kubevela/issues/7104)), was about how KubeVela handles sensitive data: I gave the `request` workflow step a way to read header values from Secrets, and I moved Config Management onto real Kubernetes CRDs. Header secrets are available from KubeVela v1.11.1, and the Config CRDs are the headline feature of KubeVela v1.12.

<!--truncate-->

## The problem

KubeVela's handling of secrets and configuration had two gaps:

1. **The `request` step could not read a Secret.** To call an authenticated endpoint, you had to write the token in plain text in the `Application` spec. Anyone could then read it with `kubectl get`, in Git history and in audit logs. The same provider already read Secrets for `tlsConfig`, but not for headers.
2. **Config Management had no API.** Templates and configs were stored as labelled ConfigMaps and Secrets that only the `vela` CLI understood. There was no Kubernetes type, no server-side validation, and the CLI, the workflow engine and VelaUX each applied the rules in their own way.

The project tackled them as two tracks, each with its own design, implementation and tests.

## Track 1: `headersFromSecret` on the `request` step

The `request` step now takes a `headersFromSecret` list. Each entry names a header, a Secret and a key in that Secret. When the step runs, it reads the value from the Secret in the Application's namespace and sets it as the header:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: call-protected-api
  namespace: default
spec:
  components: []
  workflow:
    steps:
      - name: call-api
        type: request
        properties:
          url: https://api.example.com/v1/validate
          method: GET
          headersFromSecret:
            - header: Authorization
              secret: api-creds   # Secret in the Application's namespace
              key: token          # its value becomes the header value
```

The token never appears in the Application, so `kubectl get app -o yaml` shows only the Secret's name. A few details of how it works:

- The Secret is read in Go, after CUE evaluation. The value never goes through the CUE template, which avoids the interpolation problems you get when you try to build a header from a Secret in CUE.
- A header from `headersFromSecret` replaces a plain `header` entry with the same name.
- If the Secret or the key is missing, the step fails with an error that names both, instead of sending the request without the header.

The provider change is in [kubevela/workflow#229](https://github.com/kubevela/workflow/pull/229), and [kubevela/kubevela#7292](https://github.com/kubevela/kubevela/pull/7292) exposes the field on the `request` step definition. It was backported, so it's available from KubeVela v1.11.1.

## Track 2: `ConfigTemplate` and `Config` CRDs

Before writing code for this track I wrote a design proposal, [kubevela/kubevela#7308](https://github.com/kubevela/kubevela/pull/7308), so the API could be reviewed before anything was built. The implementation, [kubevela/kubevela#7211](https://github.com/kubevela/kubevela/pull/7211), adds the `config.oam.dev/v1alpha1` API group:

- **`ConfigTemplate`** holds the CUE template, plus its `scope` (`system` or `namespace`) and whether it is `sensitive`.
- **`Config`** fills a template in, with inline `properties` or with `propertiesFrom`, which reads them from a Secret.
- **Controllers** render each `Config` into a Secret that the `Config` owns, and render it again when the template or the source Secret changes.
- **Validating webhooks** check CUE syntax, schema conformance, and that `properties` and `propertiesFrom` are not both set. Every entry point (CLI, workflow, VelaUX or a plain `kubectl apply`) now goes through the same checks.
- **CLI support** in `vela config-template` and `vela config`.

Here is a sensitive, cluster-wide template for database credentials, and a `Config` in another namespace that uses it:

```yaml
apiVersion: config.oam.dev/v1alpha1
kind: ConfigTemplate
metadata:
  name: db-credentials
  namespace: vela-system
spec:
  scope: system        # usable from any namespace
  sensitive: true      # values are never returned by read operations
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
---
apiVersion: v1
kind: Secret
metadata:
  name: raw-db-creds
  namespace: default
stringData:
  properties: '{"username": "alice", "password": "s3cr3t-pass"}'   # read from the "properties" key by default
---
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
```

The controller reads `raw-db-creds`, renders it against the template and writes the result to a `prod-db` Secret in `default`. It renders again when `raw-db-creds` changes, and Kubernetes garbage-collects `prod-db` when you delete the `Config`.

The CLI does the same without any YAML. The template file carries the same settings in a `metadata` block:

```cue title="db-credentials.cue"
metadata: {
	name:      "db-credentials"
	scope:     "system"
	sensitive: true
}
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

```bash
vela config-template apply -f db-credentials.cue
vela config create prod-db --template=db-credentials -n default \
  username=alice password=s3cr3t-pass
```

Because the template is sensitive, `vela config create` doesn't put the values in the `Config`. It stores them in a `prod-db-properties` Secret and points `propertiesFrom` at it for you.

## After the merge

When #7211 merged, the new API worked, but clusters that already had legacy configs had no upgrade path yet. Once the CRDs were installed, `vela config list` only showed CRs, so configs made by older CLIs, addons or VelaUX disappeared from the CLI. A global `--config-mode auto|legacy|crd` flag also left two write paths in use. My mentor [Jerrin Francis](https://github.com/jerrinfrancis) tracked the remaining work in [#7410](https://github.com/kubevela/kubevela/issues/7410) and finished it in an eight-part series before the release:

- **Both backends, one write path** ([#7439](https://github.com/kubevela/kubevela/pull/7439)). The CLI reads and deletes both legacy objects and CRs, and writes only CRs. `vela config list` gets a `SOURCE` column, and `--config-mode` now only filters the two `list` commands. [#7420](https://github.com/kubevela/kubevela/pull/7420) by Abhishek Prasad fixed template listing to include CRs.
- **Migration** ([#7449](https://github.com/kubevela/kubevela/pull/7449), [#7453](https://github.com/kubevela/kubevela/pull/7453)). `vela config-template migrate` adopts legacy templates and configs into CRs and deletes nothing, so a downgrade keeps working. The `AutoMigrateLegacyConfigs` feature gate (Alpha, off by default) runs the same migration once when the controller starts.
- **Controller parity** ([#7457](https://github.com/kubevela/kubevela/pull/7457), [#7470](https://github.com/kubevela/kubevela/pull/7470)). The `Config` controller now publishes to Nacos, and the `create-config`, `read-config`, `list-config` and `delete-config` workflow steps work with `Config` CRs.
- **Tighter API contracts** ([#7481](https://github.com/kubevela/kubevela/pull/7481), [#7501](https://github.com/kubevela/kubevela/pull/7501)). A `system` template must live in `vela-system`. Using a namespace-scoped template from another namespace needs `get` permission on that `ConfigTemplate`. `sensitive` can be turned on but never off, and a `Config` that uses `propertiesFrom` is always treated as sensitive.
- **GitOps and upgrade e2e tests** ([#7518](https://github.com/kubevela/kubevela/pull/7518)).

All of this ships in [KubeVela v1.12.0](https://github.com/kubevela/kubevela/releases/tag/v1.12.0). To upgrade an existing cluster, see [Migrate Configs to ConfigTemplate and Config](/docs/upgrade-guides/v1.12/config-migration), and for the full API see the [Config Template reference](/docs/reference/config-template).

## Beyond the mentorship

Alongside the mentorship, I also worked on:

- **Kubernetes dependency upgrade** ([#7238](https://github.com/kubevela/kubevela/issues/7238)). I mapped which KubeVela repos had to move, and in what order, to get off the end-of-life Kubernetes v1.31, and did the initial upgrade across [terraform-controller](https://github.com/kubevela/terraform-controller/pull/401), [pkg](https://github.com/kubevela/pkg/pull/134), [workflow](https://github.com/kubevela/workflow/pull/241), [prism](https://github.com/kubevela/prism/pull/68), [kube-trigger](https://github.com/kubevela/kube-trigger/pull/58), [kubevela-core-api](https://github.com/kubevela/kubevela-core-api/pull/19) and [kubevela](https://github.com/kubevela/kubevela/pull/7252). Along the way I found that six of these repos depended on `kmodules/apiserver-runtime`, a fork of the long-unmaintained `kubernetes-sigs/apiserver-runtime`. I raised it with the community, and as part of the bump I replaced it with the canonical `k8s.io/apiserver` library. Other KubeVela maintainers then took the upgrade the rest of the way, building on top of my commits.
- **terraform-controller fixes** ([#403](https://github.com/kubevela/terraform-controller/pull/403)): git-over-SSH clones no longer hang on a read-only `ssh-agent` socket, and a `Configuration` no longer stays stuck in `ProvisioningAndChecking` after `terraform apply` succeeds.
- **Enhancement issue template** ([#7242](https://github.com/kubevela/kubevela/pull/7242)) for the main repo.

## Thank you

Working across two repositories, a Go provider, CUE definitions, CRDs, controllers and webhooks gave me a much better picture of how KubeVela fits together. Thank you to my mentors [Chaitanya Reddy](https://github.com/Chaitanyareddy0702) and [Jerrin Francis](https://github.com/jerrinfrancis). It was great working with you.
