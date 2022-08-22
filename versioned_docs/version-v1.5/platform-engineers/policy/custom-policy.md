---
title: Policy Definition
---

In this section we will introduce how to define a custom policy with CUE. Make sure you've learned the basic knowledge about [Definition Concept](../../getting-started/definition) and [how to manage definition](../cue/definition-edit).

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

The rule is align with component definition, you must specify `output`, while you can use `outputs` for more objects, the format as below:

```cue
output: {
    <full template data>
}
outputs: <unique-name>: 
  <full template data>
```

Below is an example that we create a traffic split service mesh object in policy.

```cue
"my-plc": {
	description: "My service mesh policy."
	type:        "policy"
}

template: {
	#ServerWeight: {
		service: string
		weight:  int
	}
	parameter: {
		weights: [...#ServerWeight]
	}

	output: {
		apiVersion: "split.smi-spec.io/v1alpha3"
		kind:       "TrafficSplit"
		metadata: name: context.name
		spec: {
			service:  context.name
			backends: parameter.weights
		}
	}
}
```

Apply to our control plane to make this trait work:

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
      name: unified
      properties:
        weights:
          - service: server-v1
            weight: 80
          - service: server-v2
            weight: 20
EOF
```

The policy will generate Kubernetes resources by KubeVela like below:

```
apiVersion: split.smi-spec.io/v1alpha3
kind: TrafficSplit
metadata:
  name: unified
  namespace: default
spec:
  backends:
  - service: server-v1
    weight: 80
  - service: server-v2
    weight: 20
  service: unified
```

You can define any Kubernetes API objects in policies if you want.

## Special Policy

Not all policies generate resources, there're several [built-in policies](../../end-user/policies/references) which are used to control the whole delivery precess and workflows. These special polices are usually coded in the application controller.

## What's Next

* Learn how to [define health check and custom status](../traits/status) of Trait.
* Learn how to [define workflow step](../workflow/workflow) in CUE.