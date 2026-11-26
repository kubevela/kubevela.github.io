---
title: Policy Definition
---

In this section we will introduce how to define a custom policy with CUE. Make sure you've learned the basic knowledge about [Definition Concept](../../getting-started/definition.md) and [how to manage definition](../cue/definition-edit.md).

## Generate Resources by Policy

Generate resources in policy is similar to trait, policy can be used to define things across components.

Let's use `vela def init` to create a basic policy scaffold:

```
vela def init my-plc -t policy --desc "My ingress route policy." > myroute.cue
```

The content of the scaffold expected to be:

```cue
// $ cat myroute.cue
"my-plc": {
	annotations: {}
	attributes: {}
	description: "My ingress route policy."
	labels: {}
	type: "policy"
}

template: {
}
```

The rule is aligned with component definition, you must specify `output`, while you can use `outputs` for more objects, the format as below:

```cue
output: {
    <full template data>
}
outputs: <unique-name>: 
  <full template data>
```

Below is an example that creates a `NetworkPolicy` letting the Application's components talk to each other, and to any namespaces you list, while refusing other traffic into them.

In a policy, `context.name` is the name the Application gives the policy, not the Application's name. Use `context.appName` for the Application and `context.namespace` for its namespace.

```cue
"my-plc": {
	description: "Allow traffic between the Application's components."
	type:        "policy"
}

template: {
	parameter: {
		// +usage=Other namespaces allowed to reach the Application
		allowNamespaces: *[] | [...string]
	}

	output: {
		apiVersion: "networking.k8s.io/v1"
		kind:       "NetworkPolicy"
		metadata: name: context.name
		spec: {
			podSelector: matchLabels: "app.oam.dev/name": context.appName
			policyTypes: ["Ingress"]
			ingress: [{
				from: [
					{podSelector: matchLabels: "app.oam.dev/name": context.appName},
					for ns in parameter.allowNamespaces {
						namespaceSelector: matchLabels: "kubernetes.io/metadata.name": ns
					},
				]
			}]
		}
	}
}
```

Apply to our control plane to make this Policy work:

```
vela def apply myroute.cue
```

Then our end users can discover it immediately and use it in `Application`.

After using `vela up` by the following command:

```shell
cat <<EOF | vela up -f -
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: my-test-2
spec:
  components:
    - name: server-v1
      type: webservice
      properties:
        image: oamdev/hello-world:v1
    - name: server-v2
      type: webservice
      properties:
        image: oamdev/hello-world:v2
  policies:
    - type: my-plc
      name: same-app-only
      properties:
        allowNamespaces: ["monitoring"]
EOF
```

The policy generates this object, named after the policy (`same-app-only`) and selecting the pods of the Application (`my-test-2`):

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: same-app-only
  namespace: default
spec:
  podSelector:
    matchLabels:
      app.oam.dev/name: my-test-2
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app.oam.dev/name: my-test-2
    - namespaceSelector:
        matchLabels:
          kubernetes.io/metadata.name: monitoring
```

Check it with `kubectl get networkpolicy same-app-only -o yaml`. The cluster's network plugin enforces it; one without NetworkPolicy support, such as plain flannel, accepts the object and ignores it.

You can define any Kubernetes API objects in policies if you want.

## Policies that render nothing

Some built-in policies, such as `topology`, `override` and `garbage-collect`, are read by the controller and render nothing. You cannot write one of these as a definition; to change an Application before it renders, write an [Application-scoped policy](./application-scoped-policy.md). The [built-in policy reference](../../end-user/policies/references.md) lists them all.
