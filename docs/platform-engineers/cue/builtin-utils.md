---
title: Built-in CUE packages
---

KubeVela compiles a set of CUE packages into `vela-core`. A definition template imports them by path, with nothing to install:

```cue
import "vela/util"
```

:::tip
These ship with KubeVela. To add your own functions, served over HTTP and registered with a `Package` resource, see [External CUE Packages](./external-packages.md).
:::

## Which definitions can import which package

The packages a template can import depend on the kind of definition, because each kind is rendered by its own compiler:

| Package | Functions | Component, Trait, Policy | Application-scoped Policy | Source |
| --- | --- | --- | --- | --- |
| `vela/base64` | `#Encode`, `#Decode` | yes | yes | yes |
| `vela/cue` | `#StrategyUnify` | yes | yes | yes |
| `vela/http` | `#Do`, `#Get`, `#Post`, `#Put`, `#Patch`, `#Delete` | yes | yes | yes |
| `vela/kube` | `#Apply`, `#Get`, `#List`, `#Patch` | yes | yes | `#Get` and `#List` only |
| `vela/util` | `#Truncate` | yes | yes | no |
| `vela/config` | `#ImageRegistry`, `#HelmRepository` | yes | no | no |
| `vela/helm` | `#Render` | yes | no | no |
| `vela/addon` | `#Render` | yes | no | no |
| `vela/module` | `#Render` | yes | no | no |
| `vela/registry` | `#ReadFile`, `#MustReadFile` | yes | no | yes |
| `vela/velaconfig` | `#Read`, `#ObjectRef` | yes | no | yes |

"Policy" here means a PolicyDefinition with the default scope. One with `scope: Application` changes the Application before its components render, and has the smaller set in its own column. Workflow steps have their own packages, including a different `vela/util`; see [Workflow step actions](../workflow/cue-actions.md).

The rest of this page documents `vela/util`.

## #Truncate

Fits a value inside a length cap without ever mapping two different inputs onto
the same result.

### Why you need it

Nearly every system a definition touches enforces a hard length limit on
identifiers, and they disagree about what that limit is.

Kubernetes caps label *values* and RFC 1123 *label* names (Service names
among them) at 63 characters, and most object names at 253. Cloud providers are
frequently stricter: an AWS load balancer or target group name cannot exceed 32
characters. That matters most when a definition provisions an external resource,
because the limit is enforced by the provider's API rather than by the cluster,
so an over-long name is accepted at apply time and only fails later, during
provisioning, where it is much harder to trace back to the definition that
generated it.

A definition that composes an identifier out of several parts, such as
`<app>-<component>-<env>-<region>`, will eventually exceed one of those caps.

`#Truncate` is not specific to Kubernetes names, which is why the parameter is
`value`, not `name`. It fits any string into any cap.

Cutting the string yourself is worse than failing. These two component names:

```
checkout-payment-gateway-frontend-canary-eu-west-1-production
checkout-payment-gateway-backend-canary-eu-west-1-production
```

are distinct, but they share a 24-character prefix: `checkout-payment-gateway`.
Cut either one at 25 characters or fewer and they become the same string, and
trimming back to a whole segment, which is what it takes to fit a 40-character
cap without ending mid-word, lands on exactly that shared prefix. At that point
two components silently write to one resource.

`#Truncate` cuts the value to fit and appends a short hash **of the original
value**, so distinct inputs always produce distinct results.

### Parameters

```cue
#Truncate: {
	#do:       "truncate"
	#provider: "util"

	$params: {
		// +usage=The raw desired value
		value: string
		// +usage=The hard length cap (counted in runes), applied to the whole result
		maxLength: int
		// +usage=Delimiter joining the prefix, truncated base, and hash suffix
		delimiter: *"-" | string
		// +usage=Number of hex chars in the uniqueness suffix, at most 64 (the width of a sha256 digest)
		hashLength: *8 | int & <=64
		// +usage=Prefix always preserved verbatim and counted against maxLength
		prefix: *"" | string
		// +usage=Trim the base back to the last delimiter so it never ends in a partial segment
		preserveSegments: *false | bool
	}

	// +usage=The result of this action, filled in after the action is executed
	$returns: {
		// +usage=The value, guaranteed <= maxLength runes
		value?: string
		...
	}
}
```

The result is read from `$returns.value` and is guaranteed to be at most
`maxLength` runes.

### Behavior

- A value that **already fits is returned unchanged**: no hash is appended.
- A value that is too long becomes `<base><delimiter><hash>`, where the hash is
  a SHA-256 digest of the **original** value. This is what makes the result
  collision-safe.
- `maxLength` counts **runes, not bytes**, so multi-byte values are never split
  in the middle of a character.
- The function is **deterministic**: the same inputs always produce the same
  result, so re-rendering on every reconcile is stable.
- `prefix` is emitted verbatim, is **never** truncated, and **counts against**
  `maxLength`.
- `preserveSegments: true` trims the base back to the last delimiter, so the
  result never ends in a half-word. If the kept base contains no delimiter at
  all (one long word), it falls back to a plain character cut rather than
  discarding all readable context.
- Trailing delimiters are trimmed off the base before the hash is joined on. The
  delimiter is treated as a unit, so a multi-character delimiter is never
  partially stripped.

:::caution Always truncate the raw value, never a previous result
Feeding a returned value back into `#Truncate` is only safe when `prefix` is
empty.

With a `prefix` set, passing a previous result back in *along with the same
prefix* applies the prefix twice: `prod-web-a1b2c3d4` becomes
`prod-prod-web-a1b2c3d4`, because a prefix the function added is
indistinguishable from a value that genuinely starts with one.

Render from the raw value every time.
:::

### Example

A `ComponentDefinition` that fits a caller-supplied name into a length cap:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: ComponentDefinition
metadata:
  name: truncate-showcase
  namespace: vela-system
spec:
  workload:
    definition:
      apiVersion: v1
      kind: ConfigMap
  schematic:
    cue:
      template: |
        import "vela/util"

        _fit: util.#Truncate & {
          $params: {
            value:            parameter.value
            maxLength:        parameter.maxLength
            prefix:           parameter.prefix
            preserveSegments: parameter.preserveSegments
          }
        }

        output: {
          apiVersion: "v1"
          kind:       "ConfigMap"
          metadata: name: context.name
          data: {
            original:  parameter.value
            truncated: _fit.$returns.value
          }
        }

        parameter: {
          // +usage=The raw desired value
          value: string
          // +usage=The hard length cap (in runes)
          maxLength: *20 | int
          // +usage=Prefix always preserved and counted against maxLength
          prefix: *"" | string
          // +usage=Trim the base back to the last delimiter
          preserveSegments: *false | bool
        }
```

Applied with these inputs, the definition renders:

| Value | Parameters | Result |
| --- | --- | --- |
| `checkout-payment-gateway-frontend-canary-eu-west-1-production` | `maxLength: 40`, `preserveSegments: true` | `checkout-payment-gateway-761247be` |
| `checkout-payment-gateway-backend-canary-eu-west-1-production` | `maxLength: 40`, `preserveSegments: true` | `checkout-payment-gateway-16808f82` |
| `checkout-payment-gateway-service-orchestrator` | `maxLength: 30`, `prefix: prod`, `preserveSegments: true` | `prod-checkout-012294b3` |
| `api-gateway` | `maxLength: 63` | `api-gateway` |

Look at the first two rows together. Both were trimmed back to the same
24-character base, `checkout-payment-gateway`, yet the results differ, because
the hash is taken from the original value, not from the trimmed base. That is
the guarantee: two components that share a long prefix never collide on the same
name.

The fourth row shows a value that already fits being passed through untouched.

`delimiter` and `hashLength` are useful for less common shapes: `delimiter: "."`
joins DNS-style names on a dot and keeps whole labels, and `hashLength: 16`
buys extra collision margin for generated `ConfigMap` or `Secret` names.

### Errors

`#Truncate` returns an error, which is a **hard render failure** (the
component produces no resource at all), when:

- `maxLength` is too small to fit the prefix, the delimiter, and the hash
  suffix.
- `prefix` plus its delimiter leaves no room for even one rune of the value.
- `hashLength` is greater than 64, the number of hex characters in a SHA-256
  digest.

For example, a 27-rune prefix under a `maxLength` of 10 fails with:

```
prefix "this-prefix-is-way-too-long" (27 runes) plus delimiter "-" leaves no room within maxLength 10
```

:::note Where to find the error
A failing component reports `status: workflowFailed` on the Application, but
**`status.services[]` is empty** and the `Render` condition still shows
`Available: True`. The provider error is reported on the workflow step:

```shell
kubectl get application <app> -o jsonpath='{range .status.workflow.steps[*]}{.name}{": "}{.message}{"\n"}{end}'
```

The message wraps the provider error shown above in renderer context.
:::
