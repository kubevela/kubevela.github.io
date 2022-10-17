---
title: "An Introduction to KubeVela Addons: Build Your Own Addon"
authors:
- name: Charlie Chiang
  title: KubeVela Team
  url: https://github.com/charlie0129
  image_url: https://github.com/charlie0129.png
tags: [ "KubeVela", "addon", "extensibility" ]
description: Introduction to Building Addons
image: https://raw.githubusercontent.com/oam-dev/KubeVela.io/main/docs/resources/KubeVela-03.png
hide_table_of_contents: false
---

As we all know, KubeVela is a highly extensible platform, on which users can build their own customizations using [Definitions](https://kubevela.io/docs/platform-engineers/oam/x-definition). KubeVela addons are a convenient way to package all these customizations and their dependencies together, to extend the capabilities of KubeVela.

This blog introduces the main concepts of an addon and guides you to quickly start building an addon.

<!--truncate-->

## Why use addons

We typically use addons with [addon catalog](https://github.com/kubevela/catalog), which contains addons with all kinds of customizations that the KubeVela community carefully crafted. You can download and install these addons with just one click. For example, you can provide the ability to run Helm Components in your KubeVela Application to your cluster by installing FluxCD addon.

Contrary to the convenience of one-key installation, without KubeVela addons, you have to install FluxCD in this way:

> Actually, this is how we install FluxCD before KubeVela v1.1

1. Install FluxCD using Helm Charts or downloaded yaml manifests
2. Manually download FluxCD-related Definition manifests and apply them

Although it seems like only 2 steps is needed, we found it to be quite troublesome:

1. Complicated installation: users are required to refer to documentations to manually install FluxCD and tackle possible errors
2. Scattered resources: users need to obtain different resource files from different places
3. Hard distribution: users having to download manifests manually makes it hard to distribute all these resources in a uniformed way
4. No multi-cluster support: KubeVela emphasizes multi-cluster delivery a lot. However, manual installation makes multi-cluster support hard to carry out.

KubeVela addons are born to solve these problems.

## How KubeVela addons work

**KubeVela addons are intrinsically OAM Applications** plus Definitions and other extensions. Since Definitions usually depend on other resources (e.g. certain operators), these dependencies are described as OAM Applications and stored in files called *Application description files*.

Let's assume we want to build a Redis addon, which makes it possible to use Redis Components in Applications, to create a Redis cluster. Such addon will at least include a Redis Operator (to create Redis clusters) and a ComponentDefinition (to define what is a `redis` Component).

The installation process of an addon includes installing Applications (which includes a Redis Operator), Definitions and etc.

![](../docs/resources/addon-mechanism.jpg)

## Create your own addon

> Note: this guide only applies to KubeVela v1.5 and later

We will take Redis addon as an example, and guide you through the whole process of making an addon. The full source code of this guide is located at [catalog/redis-operator](https://github.com/kubevela/catalog/tree/master/experimental/addons/redis-operator). As an introduction, we will not dive too deep into the details. If you are interested in official documentations, refer to [Make Your Own Addon](https://kubevela.io/docs/platform-engineers/addon/intro).

**First, we will need to consider what our addon can do for users.** Let's say our Redis addon can provide a Component called `redis-failover`, which will create a whole Redis cluster with just one Component. **Then we will figure out how to achieve this.** To define a `redis-failover` Component, we write a ComponentDefinition. To be able to create a Redis Cluster, we use a [Redis Operator](https://github.com/spotahome/redis-operator).

Now the goals are clear:

- Write an OAM Application, which includes a Redis Operator. (refer to `template.cue` and `resources` directory in the full source code)
- Write a ComponentDefinition, which defines Components called `redis-failover`. (refer to `definitions` directory in the full source code)

But before we start coding, we need to understand the directory structure of an addon (`vela addon init` can help you create the directories and files). We will describe each file later, just have a basic understanding of what files are needed for now.

```shell
redis-operator/            # directory name is the same as the addon name
├── definitions            # stores Definitions, including TraitDefinition, ComponentDefinition, and etc.
│   └── redis-failover.cue # ComponentDefinition that defines `redis-failover` Components
├── resources              # resource files, we will refer to them template.cue
│   ├── crd.yaml           # CRD that comes with Redis Operator (yaml file will be applied directly)
│   ├── redis-operator.cue # a web-service Component, which installs a Redis Operator
│   └── topology.cue       # (Optional) to help KubeVela build the relationships of Application resources
├── metadata.yaml          # addon metadata, including addon name, version, and etc.
├── parameter.cue          # addon parameters, which users can use to customize their addon installation
├── README.md              # guides the user to quickly start using your addon
└── template.cue           # Application description file, which defines an OAM Application
```

> We will use CUE extensively when writing addons, so [CUE Basic](https://kubevela.io/docs/platform-engineers/cue/basic) might be useful.

### parameter.cue

```cue
parameter: {
	//+usage=Redis Operator image.
	image: *"quay.io/spotahome/redis-operator:v1.1.0" | string
	// ...omitted
```

The parameters defined in `parameter.cue` are customizable by users when installing addons, just like Helm Values. You can access the values of these parameters in CUE later by `parameter.<parameter-name>`. In our example, `image` is provided to let the user customize Redis Operator image and can be accessed in `redis-operator.cue` by `parameter.image`.

When you design what parameters are provided to the user, there are several things to consider:

- Do not provide every possible parameter to your user and let them figure out how to dial dozens of knobs by themselves. Abstract fine-grained knobs into some broad parameters, so that the user can input a few parameters and get a usable but customized addon.
- Decide on sane defaults for starters. Let the user get started with your addon
  even if they don't provide parameters (if possible).
- Provide usage for each parameter.
- Keep parameters consistent across versions to avoid incompatibilities during upgrades.

### template.cue and resources directory

OAM Application is stored here. In our case, we will create an Application that includes a Redis Operator to give our cluster the ability to create Redis clusters.

template.cue and resources directory both serve the same purpose -- to define an Application. Aside from historical reasons, the reason why we split it into two places is readability. When we have a ton of resource in template.cue, it will eventually be too long to read. So we typically put the Application scaffold in `template.cue`, and Application Components in `resources` directory.

#### template.cue


```cue
// template.cue contains the main Application

// package name should be the same as the CUE files in resources directory,
// so that we can refer to the files in resources/.
package main

// Most of the contents here are boilerplates, you only need to pay attention to spec.components

output: {
	// This is just a plain old OAM Application
	apiVersion: "core.oam.dev/v1beta1"
	kind:       "Application"
	// No metadata required
	spec: {
		components: [
			// Create a component that includes a Redis Operator
			redisOperator // defined in resources/redis-operator.cue
		]
		policies: [
		// What namespace to install, whether install to sub-clusters
		// Again, these are boilerplates. No need to remember them. Just refer to the full source code.
		// https://github.com/kubevela/catalog/blob/master/experimental/addons/redis-operator/template.cue
		// Documentation: https://kubevela.io/docs/end-user/policies/references
		]
	}
}
// Resource topology. We will discuss this in detail later.
outputs: topology: resourceTopology // defined in resources/topology.cue
```

#### resources directory

Here we define Application Components that will be referred to in `template.cue`. We will use a `web-service` Component to install Redis Operator. Of course, if you are comfortable with extra dependencies (FluxCD addon), you can use `helm` Components to install the Redis Operator Helm Chart directly. But one of the principles of writing an addon is to reduce external dependencies, so we use the `web-service` Component, which is a built-in Component of KubeVela, instead of `helm`.

```cue
// resources/redis-operator.cue

// package name is the same as the one in template.cue. So we can use `redisOperator` below in template.cue
package main

redisOperator: {
	// an OAM Application Component, which will create a Redis Operator
	// https://kubevela.io/docs/end-user/components/references
	name: "redis-operator"
	type: "webservice"
	properties: {
		// Redis Operator container image (parameter.image is defined in parameter.cue)
		image:           parameter.image
		imagePullPolicy: "IfNotPresent"
	}
	traits: [
		// ...omitted
	]
}
```

#### Other enhancements

One of the notable features is [*Topology Rules*](https://kubevela.io/docs/reference/topology-rule) (or Resource Topologies, Resource Relationships). Although not required, it can help KubeVela build the topological relationships of the resources managed by a KubeVela Application. It is especially helpful when we use CRs (which is the case in the example).

In our case, the `redis-failover` Component will create a CR, named `RedisFailover`. If we don't have *Topology Rules*, although we know `RedisFailover` is managing several Deployments, KubeVela doesn't know this. So we can *tell* KubeVela our understanding by *Topology Rules*. Once KubeVela know what's inside a `RedisFailover`, it will know the relationships of all the resources inside an Application. So what's the benefits? For example: (refer to [Run our addon](#Run our addon))

- Resource topology graphs in VelaUX
- Execute commands in containers of an Application using `vela exec`
- Forward ports of containers of an Application using `vela port-forward`
- Get log of containers of an Application using `vela log`
- Get Pods or endpoints in an Application using `vela status --pod/--endpoint`

```cue
// resources/topology.cue

package main

import "encoding/json"

resourceTopology: {
	apiVersion: "v1"
	kind:       "ConfigMap"
	metadata: {
		name:      "redis-operator-topology"
		namespace: "vela-system"
		labels: {
			"rules.oam.dev/resources":       "true"
			"rules.oam.dev/resource-format": "json"
		}
	}
	data: rules: json.Marshal([{
		parentResourceType: {
			group: "databases.spotahome.com"
			kind:  "RedisFailover"
		}
		// RedisFailover CR manages the three resource below
		childrenResourceType: [
			{
				apiVersion: "apps/v1"
				kind:  "StatefulSet"
			},
			// Topologies of Deployment and etc. are built-in.
			// So we don't need to go deeper to Pods.
			{
				apiVersion: "apps/v1"
				kind:  "Deployment"
			},
			{
				apiVersion: "v1"
				kind:  "Service"
			},
		]
	}])
}
```

### definitions directory

Definitions directory contains KubeVela Definitions, including ComponentDefinitions, TraitDefinitions, and etc.

Writing Definitions for an addon is the same as writing regular Definitions. We will refer to [Component Definition](https://kubevela.io/docs/platform-engineers/components/custom-component) and [Redis Operator](https://github.com/spotahome/redis-operator/blob/master/README.md) to write our ComponentDefinition.

The ComponentDefinition we are going to write is called `redis-failover`. It will create a CR called RedisFailover. So the Redis Operator in our addon Application will create a Redis cluster for us. You can refer to the [source code](https://github.com/kubevela/catalog/blob/master/experimental/addons/redis-operator/definitions/redis-failover.cue).

### metadata.yaml

Just the name implies, these are all metadata of an addon, including addon name, version, system requirements, and etc. (per [documentation](https://kubevela.net/docs/platform-engineers/addon/intro#basic-information-file)). One thing to notice: we are focusing on the new addon format introduced in KubeVela v1.5, so you should avoid using old incompatible fields. The fields listed below contain all the fields available to you.

> For example, the old `deployTo.runtimeCluster` has an alternative in the new addon format (using topology Policy) and should be avoided. You can refer to `template.cue` in the full source code.


```yaml
# addon name, the same as our directory name
name: redis-operator
# addon description
description: Redis Operator creates/configures/manages high availability redis with sentinel automatic failover atop Kubernetes.
# tags to show in VelaUX
tags:
  - redis
# addon version
version: 0.0.1
# addon icon
icon: https://xxx.com
# the webpage of this addon
url: https://github.com/spotahome/redis-operator
# other addon dependencies, e.g. fluxcd
dependencies: []

# system version requirements
system:
  vela: ">=v1.5.0"
  kubernetes: ">=1.19"
```

## Run our addon

Now we have finished most of our work. It is time to run it! However, there is still some details that we skipped, so you can download the full [source code](https://github.com/kubevela/catalog/tree/master/experimental/addons/redis-operator) to complete them.

After we get the full `redis-operator` directory, executing `vela addon enable redis-operator` will enable the addon inside our downloaded directory. Then, we can refer the [README](https://github.com/kubevela/catalog/tree/master/experimental/addons/redis-operator/README.md) to start using the addon.

> The README.md is very important as it guides users to start using an unfamiliar addon.

By using this addon, users only need to write **4** lines of yaml to get a Redis cluster with 3 nodes! Contrary to manually installing Redis Operator, even manually managing Redis instances, the use of an addon greatly improves user experience.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: redis-operator-sample
spec:
  components:
    # This component is provided by redis-operator addon.
    # In this example, 2 redis instance and 2 sentinel instance
    # will be created.
    - type: redis-failover
      name: ha-redis
      properties:
        # You can increase/decrease this later to add/remove instances.
        replicas: 3
```

A whole tree of complicated resources are created with just a few lines of yaml, as shown in the figure below. Since we have written *Topology Rules* for our addon, users can easily see the topology of all the resources (Pods, Services) of a Redis Cluster. They are now not limited to the level of observability of KubeVela Applications, instead, they can have a glance on the statuses of low-level resource. For example, we can see certain Redis Pods are still not ready in our figure:

![redis-operator-sample-topology-graph](/img/blog-addon/redis-operator-sample-topology-graph.png)

Users can also choose the low-level resources of our sample Application, i.e., 3 Redis Pods and 3 Sentinal Pods, when executing `vela exec/log/port-forward`:

![redis-operator-sample-pod-topology](/img/blog-addon/redis-operator-sample-pod-topology.png)

`vela status` can get the status of an Application. With `Topology Rules`, we can take one step further -- find out endpoints in an Application directly. In our example, users can get endpoints of Redis Sentinel to connect to by:

![redis-operator-sample-endpoint](/img/blog-addon/redis-operator-sample-endpoint.png)

## Wrap up

By the end of this guide, you probably already have a good grasp of what addons do and how to make addons. If you actually built your own addon, everyone is welcomed to contribute their addon to [addon catalog](https://github.com/kubevela/catalog). So everyone else can discover your addon and use it!
