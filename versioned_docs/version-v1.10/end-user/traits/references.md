---
title: Built-in Trait Type
---

This documentation will walk through all the built-in trait types sorted alphabetically.

> It was generated automatically by [scripts](../../contributor/cli-ref-doc.md), please don't update manually, last updated at 2023-07-28T09:33:26+08:00.

## Affinity

### Description

Affinity specifies affinity and toleration K8s pod for your workload which follows the pod spec in path 'spec.template'.

> For now this trait is hidden from the VelaUX. Available when using CLI

### Apply To Component Types

Component based on the following kinds of resources:
- deployments.apps
- statefulsets.apps
- daemonsets.apps
- jobs.batch



### Examples (affinity)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: busybox
spec:
  components:
    - name: busybox
      type: webservice
      properties:
        image: busybox
        cmd: ["sleep", "86400"]
        labels:
          label-key: label-value
          to-delete-label-key: to-delete-label-value
      traits:
        - type: affinity
          properties:
            podAffinity:
              preferred:
                - weight: 1
                  podAffinityTerm:
                    labelSelector:
                      matchExpressions:
                        - key: "secrity"
                          values: ["S1"]
                    namespaces: ["default"]
                    topologyKey: "kubernetes.io/hostname"
```

### Specification (affinity)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 podAffinity | Specify the pod affinity scheduling rules. | [podAffinity](#podaffinity-affinity) | false |  
 podAntiAffinity | Specify the pod anti-affinity scheduling rules. | [podAntiAffinity](#podantiaffinity-affinity) | false |  
 nodeAffinity | Specify the node affinity scheduling rules for the pod. | [nodeAffinity](#nodeaffinity-affinity) | false |  
 tolerations | Specify tolerant taint. | [[]tolerations](#tolerations-affinity) | false |  


#### podAffinity (affinity)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 required | Specify the required during scheduling ignored during execution. | [[]required](#required-affinity) | false |  
 preferred | Specify the preferred during scheduling ignored during execution. | [[]preferred](#preferred-affinity) | false |  


##### required (affinity)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 labelSelector |  | [labelSelector](#labelselector-affinity) | false |  
 namespaces |  | []string | false |  
 topologyKey |  | string | true |  
 namespaceSelector |  | [namespaceSelector](#namespaceselector-affinity) | false |  


##### labelSelector (affinity)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 matchLabels |  | map[string]string | false |  
 matchExpressions |  | [[]matchExpressions](#matchexpressions-affinity) | false |  


##### matchExpressions (affinity)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 key |  | string | true |  
 operator |  | "In" or "NotIn" or "Exists" or "DoesNotExist" | false | In 
 values |  | []string | false |  


##### namespaceSelector (affinity)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 matchLabels |  | map[string]string | false |  
 matchExpressions |  | [[]matchExpressions](#matchexpressions-affinity) | false |  


##### matchExpressions (affinity)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 key |  | string | true |  
 operator |  | "In" or "NotIn" or "Exists" or "DoesNotExist" | false | In 
 values |  | []string | false |  


##### preferred (affinity)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 weight | Specify weight associated with matching the corresponding podAffinityTerm. | int | true |  
 podAffinityTerm | Specify a set of pods. | [podAffinityTerm](#podaffinityterm-affinity) | true |  


##### podAffinityTerm (affinity)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 labelSelector |  | [labelSelector](#labelselector-affinity) | false |  
 namespaces |  | []string | false |  
 topologyKey |  | string | true |  
 namespaceSelector |  | [namespaceSelector](#namespaceselector-affinity) | false |  


##### labelSelector (affinity)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 matchLabels |  | map[string]string | false |  
 matchExpressions |  | [[]matchExpressions](#matchexpressions-affinity) | false |  


##### matchExpressions (affinity)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 key |  | string | true |  
 operator |  | "In" or "NotIn" or "Exists" or "DoesNotExist" | false | In 
 values |  | []string | false |  


##### namespaceSelector (affinity)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 matchLabels |  | map[string]string | false |  
 matchExpressions |  | [[]matchExpressions](#matchexpressions-affinity) | false |  


##### matchExpressions (affinity)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 key |  | string | true |  
 operator |  | "In" or "NotIn" or "Exists" or "DoesNotExist" | false | In 
 values |  | []string | false |  


#### podAntiAffinity (affinity)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 required | Specify the required during scheduling ignored during execution. | [[]required](#required-affinity) | false |  
 preferred | Specify the preferred during scheduling ignored during execution. | [[]preferred](#preferred-affinity) | false |  


##### required (affinity)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 labelSelector |  | [labelSelector](#labelselector-affinity) | false |  
 namespaces |  | []string | false |  
 topologyKey |  | string | true |  
 namespaceSelector |  | [namespaceSelector](#namespaceselector-affinity) | false |  


##### labelSelector (affinity)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 matchLabels |  | map[string]string | false |  
 matchExpressions |  | [[]matchExpressions](#matchexpressions-affinity) | false |  


##### matchExpressions (affinity)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 key |  | string | true |  
 operator |  | "In" or "NotIn" or "Exists" or "DoesNotExist" | false | In 
 values |  | []string | false |  


##### namespaceSelector (affinity)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 matchLabels |  | map[string]string | false |  
 matchExpressions |  | [[]matchExpressions](#matchexpressions-affinity) | false |  


##### matchExpressions (affinity)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 key |  | string | true |  
 operator |  | "In" or "NotIn" or "Exists" or "DoesNotExist" | false | In 
 values |  | []string | false |  


##### preferred (affinity)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 weight | Specify weight associated with matching the corresponding podAffinityTerm. | int | true |  
 podAffinityTerm | Specify a set of pods. | [podAffinityTerm](#podaffinityterm-affinity) | true |  


##### podAffinityTerm (affinity)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 labelSelector |  | [labelSelector](#labelselector-affinity) | false |  
 namespaces |  | []string | false |  
 topologyKey |  | string | true |  
 namespaceSelector |  | [namespaceSelector](#namespaceselector-affinity) | false |  


##### labelSelector (affinity)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 matchLabels |  | map[string]string | false |  
 matchExpressions |  | [[]matchExpressions](#matchexpressions-affinity) | false |  


##### matchExpressions (affinity)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 key |  | string | true |  
 operator |  | "In" or "NotIn" or "Exists" or "DoesNotExist" | false | In 
 values |  | []string | false |  


##### namespaceSelector (affinity)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 matchLabels |  | map[string]string | false |  
 matchExpressions |  | [[]matchExpressions](#matchexpressions-affinity) | false |  


##### matchExpressions (affinity)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 key |  | string | true |  
 operator |  | "In" or "NotIn" or "Exists" or "DoesNotExist" | false | In 
 values |  | []string | false |  


#### nodeAffinity (affinity)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 required | Specify the required during scheduling ignored during execution. | [required](#required-affinity) | false |  
 preferred | Specify the preferred during scheduling ignored during execution. | [[]preferred](#preferred-affinity) | false |  


##### required (affinity)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 nodeSelectorTerms | Specify a list of node selector. | [[]nodeSelectorTerms](#nodeselectorterms-affinity) | true |  


##### nodeSelectorTerms (affinity)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 matchExpressions |  | [[]matchExpressions](#matchexpressions-affinity) | false |  
 matchFields |  | [[]matchFields](#matchfields-affinity) | false |  


##### matchExpressions (affinity)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 key |  | string | true |  
 operator |  | "In" or "NotIn" or "Exists" or "DoesNotExist" or "Gt" or "Lt" | false | In 
 values |  | []string | false |  


##### matchFields (affinity)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 key |  | string | true |  
 operator |  | "In" or "NotIn" or "Exists" or "DoesNotExist" or "Gt" or "Lt" | false | In 
 values |  | []string | false |  


##### preferred (affinity)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 weight | Specify weight associated with matching the corresponding nodeSelector. | int | true |  
 preference | Specify a node selector. | [preference](#preference-affinity) | true |  


##### preference (affinity)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 matchExpressions |  | [[]matchExpressions](#matchexpressions-affinity) | false |  
 matchFields |  | [[]matchFields](#matchfields-affinity) | false |  


##### matchExpressions (affinity)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 key |  | string | true |  
 operator |  | "In" or "NotIn" or "Exists" or "DoesNotExist" or "Gt" or "Lt" | false | In 
 values |  | []string | false |  


##### matchFields (affinity)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 key |  | string | true |  
 operator |  | "In" or "NotIn" or "Exists" or "DoesNotExist" or "Gt" or "Lt" | false | In 
 values |  | []string | false |  


#### tolerations (affinity)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 key |  | string | false |  
 operator |  | "Equal" or "Exists" | false | Equal 
 value |  | string | false |  
 effect |  | "NoSchedule" or "PreferNoSchedule" or "NoExecute" | false |  
 tolerationSeconds | Specify the period of time the toleration. | int | false |  


## Annotations

### Description

Add annotations on your workload. if it generates pod, add same annotations for generated pods.

### Apply To Component Types

All Component Types


### Examples (annotations)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: myapp
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        image: crccheck/hello-world
        port: 8000
      traits:
        - type: labels
          properties:
            "release": "stable"
        - type: annotations
          properties:
            "description": "web application"
```

### Specification (annotations)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 \- |  | map[string]:(null&#124;string) | true |  


## Command

### Description

Add command on K8s pod for your workload which follows the pod spec in path 'spec.template'.

### Apply To Component Types

Component based on the following kinds of resources:
- deployments.apps
- statefulsets.apps
- daemonsets.apps
- jobs.batch



### Examples (command)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: busybox
spec:
  components:
    - name: busybox
      type: webservice
      properties:
        image: busybox
        cmd: ["sleep", "86400"]
      traits:
        - type: sidecar
          properties:
            name: sidecar-nginx
            image: nginx
        - type: command
          properties:
            # you can use command to control multiple containers by filling `containers`
            # NOTE: in containers, you must set the container name for each container
            containers:
              - containerName: busybox
                command: ["sleep", "8640000"]
              - containerName: sidecar-nginx
                args: ["-q"]
```

### Specification (command)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
  |  | [PatchParams](#patchparams-command) or [type-option-2](#type-option-2-command) | false |  


#### PatchParams (command)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 containerName | Specify the name of the target container, if not set, use the component name. | string | false | empty 
 command | Specify the command to use in the target container, if not set, it will not be changed. | null | true |  
 args | Specify the args to use in the target container, if set, it will override existing args. | null | true |  
 addArgs | Specify the args to add in the target container, existing args will be kept, cannot be used with `args`. | null | true |  
 delArgs | Specify the existing args to delete in the target container, cannot be used with `args`. | null | true |  


#### type-option-2 (command)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 containers | Specify the commands for multiple containers. | [[]containers](#containers-command) | true |  


##### containers (command)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 containerName | Specify the name of the target container, if not set, use the component name. | string | false | empty 
 command | Specify the command to use in the target container, if not set, it will not be changed. | null | true |  
 args | Specify the args to use in the target container, if set, it will override existing args. | null | true |  
 addArgs | Specify the args to add in the target container, existing args will be kept, cannot be used with `args`. | null | true |  
 delArgs | Specify the existing args to delete in the target container, cannot be used with `args`. | null | true |  


## Container-Image

### Description

Set the image of the container.

### Apply To Component Types

Component based on the following kinds of resources:
- deployments.apps
- statefulsets.apps
- daemonsets.apps
- jobs.batch



### Examples (container-image)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: busybox
spec:
  components:
    - name: busybox
      type: webservice
      properties:
        image: busybox
        cmd: ["sleep", "86400"]
      traits:
        - type: sidecar
          properties:
            name: sidecar-nginx
            image: nginx
        - type: container-image
          properties:
            # you can use container-image to control multiple containers by filling `containers`
            # NOTE: in containers, you must set the container name for each container
            containers:
              - containerName: busybox
                image: busybox-1.34.0
                imagePullPolicy: IfNotPresent
              - containerName: sidecar-nginx
                image: nginx-1.20
```

### Specification (container-image)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
  |  | [PatchParams](#patchparams-container-image) or [type-option-2](#type-option-2-container-image) | false |  


#### PatchParams (container-image)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 containerName | Specify the name of the target container, if not set, use the component name. | string | false | empty 
 image | Specify the image of the container. | string | true |  
 imagePullPolicy | Specify the image pull policy of the container. | "" or "IfNotPresent" or "Always" or "Never" | false | empty 


#### type-option-2 (container-image)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 containers | Specify the container image for multiple containers. | [[]containers](#containers-container-image) | true |  


##### containers (container-image)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 containerName | Specify the name of the target container, if not set, use the component name. | string | false | empty 
 image | Specify the image of the container. | string | true |  
 imagePullPolicy | Specify the image pull policy of the container. | "" or "IfNotPresent" or "Always" or "Never" | false | empty 


## Container-Ports

### Description

Expose on the host and bind the external port to host to enable web traffic for your component.

### Apply To Component Types

Component based on the following kinds of resources:
- deployments.apps
- statefulsets.apps
- daemonsets.apps
- jobs.batch



### Examples (container-ports)

It's used to define Pod networks directly. hostPort routes the container's port directly to the port on the scheduled node, so that you can access the Pod through the host's IP plus hostPort.
Don't specify a hostPort for a Pod unless it is absolutely necessary(run `DaemonSet` service). When you bind a Pod to a hostPort, it limits the number of places the Pod can be scheduled, because each &lt;hostIP, hostPort, protocol&gt; combination must be unique. If you don't specify the hostIP and protocol explicitly, Kubernetes will use 0.0.0.0 as the default hostIP and TCP as the default protocol.
If you explicitly need to expose a Pod's port on the node, consider using `expose` or `gateway` trait, or exposeType and ports parameter of `webservice` component before resorting to `container-ports` trait.
```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: busybox
spec:
  components:
    - name: busybox
      type: webservice
      properties:
        cpu: "0.5"
        exposeType: ClusterIP
        image: busybox
        memory: 1024Mi
        ports:
          - expose: false
            port: 80
            protocol: TCP
          - expose: false
            port: 801
            protocol: TCP
      traits:
        - type: container-ports
          properties:
            # you can use container-ports to control multiple containers by filling `containers`
            # NOTE: in containers, you must set the container name for each container
            containers:
              - containerName: busybox
                ports:
                  - containerPort: 80
                    protocol: TCP
                    hostPort: 8080
```

### Specification (container-ports)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
  |  | [PatchParams](#patchparams-container-ports) or [type-option-2](#type-option-2-container-ports) | false |  


#### PatchParams (container-ports)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 containerName | Specify the name of the target container, if not set, use the component name. | string | false | empty 
 ports | Specify ports you want customer traffic sent to. | [[]ports](#ports-container-ports) | true |  


##### ports (container-ports)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 containerPort | Number of port to expose on the pod's IP address. | int | true |  
 protocol | Protocol for port. Must be UDP, TCP, or SCTP. | "TCP" or "UDP" or "SCTP" | false | TCP 
 hostPort | Number of port to expose on the host. | int | false |  
 hostIP | What host IP to bind the external port to. | string | false |  


#### type-option-2 (container-ports)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 containers | Specify the container ports for multiple containers. | [[]containers](#containers-container-ports) | true |  


##### containers (container-ports)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 containerName | Specify the name of the target container, if not set, use the component name. | string | false | empty 
 ports | Specify ports you want customer traffic sent to. | [[]ports](#ports-container-ports) | true |  


##### ports (container-ports)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 containerPort | Number of port to expose on the pod's IP address. | int | true |  
 protocol | Protocol for port. Must be UDP, TCP, or SCTP. | "TCP" or "UDP" or "SCTP" | false | TCP 
 hostPort | Number of port to expose on the host. | int | false |  
 hostIP | What host IP to bind the external port to. | string | false |  


## Cpuscaler

### Description

Automatically scale the component based on CPU usage.

### Apply To Component Types

Component based on the following kinds of resources:
- deployments.apps
- statefulsets.apps



### Examples (cpuscaler)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: website
spec:
  components:
    - name: frontend
      type: webservice
      properties:
        image: nginx
      traits:
        - type: cpuscaler
          properties:
            min: 1
            max: 10
            cpuUtil: 60
```

### Specification (cpuscaler)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 min | Specify the minimal number of replicas to which the autoscaler can scale down. | int | false | 1 
 max | Specify the maximum number of of replicas to which the autoscaler can scale up. | int | false | 10 
 cpuUtil | Specify the average cpu utilization, for example, 50 means the CPU usage is 50%. | int | false | 50 
 targetAPIVersion | Specify the apiVersion of scale target. | string | false | apps/v1 
 targetKind | Specify the kind of scale target. | string | false | Deployment 


## Env

### Description

Add env on K8s pod for your workload which follows the pod spec in path 'spec.template'.

### Apply To Component Types

Component based on the following kinds of resources:
- deployments.apps
- statefulsets.apps
- daemonsets.apps
- jobs.batch



### Examples (env)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: busybox
spec:
  components:
    - name: busybox
      type: webservice
      properties:
        image: busybox
        cmd: ["sleep", "86400"]
      traits:
        - type: sidecar
          properties:
            name: sidecar-nginx
            image: nginx
        - type: env
          properties:
            # you can use env to control multiple containers by filling `containers`
            # NOTE: in containers, you must set the container name for each container
            containers:
              - containerName: busybox
                env:
                  key_for_busybox_first: value_first
                  key_for_busybox_second: value_second
              - containerName: sidecar-nginx
                env:
                  key_for_nginx_first: value_first
                  key_for_nginx_second: value_second
```

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: busybox
spec:
  components:
    - name: busybox
      type: webservice
      properties:
        image: busybox
        cmd: ["sleep", "86400"]
      traits:
        - type: sidecar
          properties:
            name: sidecar-nginx
            image: nginx
        - type: env
          properties:
            # you can use env to control one container, if containerName not specified, it will patch on the first index container 
            containerName: busybox
            env:
              key_for_busybox_first: value_first
              key_for_busybox_second: value_second
```

### Specification (env)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
  |  | [PatchParams](#patchparams-env) or [type-option-2](#type-option-2-env) | false |  


#### PatchParams (env)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 containerName | Specify the name of the target container, if not set, use the component name. | string | false | empty 
 replace | Specify if replacing the whole environment settings for the container. | bool | false | false 
 env | Specify the  environment variables to merge, if key already existing, override its value. | map[string]string | true |  
 unset | Specify which existing environment variables to unset. | []string | true |  


#### type-option-2 (env)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 containers | Specify the environment variables for multiple containers. | [[]containers](#containers-env) | true |  


##### containers (env)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 containerName | Specify the name of the target container, if not set, use the component name. | string | false | empty 
 replace | Specify if replacing the whole environment settings for the container. | bool | false | false 
 env | Specify the  environment variables to merge, if key already existing, override its value. | map[string]string | true |  
 unset | Specify which existing environment variables to unset. | []string | true |  


## Expose

### Description

Expose port to enable web traffic for your component.

### Apply To Component Types

Component based on the following kinds of resources:
- deployments.apps
- statefulsets.apps



### Examples (expose)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: test-app
spec:
  components:
    - name: hello-world
      type: webservice
      properties:
        image: crccheck/hello-world
      traits:
        - type: expose
          properties:
            port: [8000]
```

### Specification (expose)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 port | Deprecated, the old way to specify the exposion ports. | []int | false |  
 ports | Specify portsyou want customer traffic sent to. | [[]ports](#ports-expose) | false |  
 annotations | Specify the annotations of the exposed service. | map[string]string | true |  
 matchLabels |  | map[string]string | false |  
 type | Specify what kind of Service you want. options: "ClusterIP","NodePort","LoadBalancer","ExternalName". | "ClusterIP" or "NodePort" or "LoadBalancer" or "ExternalName" | false | ClusterIP 


#### ports (expose)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 port | Number of port to expose on the pod's IP address. | int | true |  
 name | Name of the port. | string | false |  
 protocol | Protocol for port. Must be UDP, TCP, or SCTP. | "TCP" or "UDP" or "SCTP" | false | TCP 
 nodePort | exposed node port. Only Valid when exposeType is NodePort. | int | false |  


## Gateway

### Description

Enable public web traffic for the component, the ingress API matches K8s v1.20+.

### Apply To Component Types

Component based on the following kinds of resources:
- deployments.apps
- statefulsets.apps



### Examples (gateway)

```yaml
# vela-app.yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: first-vela-app
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        image: oamdev/hello-world
        port: 8000
      traits:
        - type: gateway
          properties:
            domain: testsvc.example.com
            http:
              "/": 8000
```

### Specification (gateway)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 domain | Specify the domain you want to expose. | string | false |  
 http | Specify the mapping relationship between the http path and the workload port. | map[string]int | true |  
 class | Specify the class of ingress to use. | string | false | nginx 
 classInSpec | Set ingress class in '.spec.ingressClassName' instead of 'kubernetes.io/ingress.class' annotation. | bool | false | false 
 secretName | Specify the secret name you want to quote to use tls. | string | false |  
 gatewayHost | Specify the host of the ingress gateway, which is used to generate the endpoints when the host is empty. | string | false |  
 name | Specify a unique name for this gateway, required to support multiple gateway traits on a component. | string | false |  
 pathType | Specify a pathType for the ingress rules, defaults to "ImplementationSpecific". | "ImplementationSpecific" or "Prefix" or "Exact" | false | ImplementationSpecific 


## Hostalias

### Description

Add host aliases on K8s pod for your workload which follows the pod spec in path 'spec.template'.

### Apply To Component Types

Component based on the following kinds of resources:
- deployments.apps
- statefulsets.apps
- daemonsets.apps
- jobs.batch



### Examples (hostalias)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: application-with-hostalias
spec:
  components:
    - name: busybox-runner
      type: worker
      properties:
        image: busybox
        cmd:
          - sleep
          - '1000'
      traits:
        - type: hostalias
          properties:
            hostAliases:
              - ip: 127.0.0.1
                hostnames:
                  - localname
                  - locals
```

### Specification (hostalias)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 hostAliases | Specify the hostAliases to add. | [[]hostAliases](#hostaliases-hostalias) | true |  


#### hostAliases (hostalias)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 ip |  | string | true |  
 hostnames |  | []string | true |  


## Hpa

### Description

Configure k8s HPA for Deployment or Statefulsets.

### Apply To Component Types

Component based on the following kinds of resources:
- deployments.apps
- statefulsets.apps



### Examples (hpa)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: helloworld
spec:
  components:
    - name: helloworld
      type: webservice
      properties:
        cpu: "0.5"
        exposeType: ClusterIP
        image: oamdev/hello-world
        memory: 1024Mi
        ports:
          - expose: true
            port: 80
            protocol: TCP
      traits:
        - type: scaler
          properties:
            replicas: 1
        - type: hpa
          properties:
            targetAPIVersion: apps/v1
            targetKind: Deployment
            max: 10
            min: 1
            cpu:
              type: Utilization
              value: 80
            mem:
              type: AverageValue
              value: 90
            podCustomMetrics:
              # here are custom metric names and values. Please replace them to be your metrics
              - name: pod_net_received_rate
                value: "77"
              - name: pod_net_transmitted_rate
                value: "88"
              - name: pod_net_received_packets_rate
                value: "95"
              - name: pod_net_transmitted_packets_rate
                value: "99"
  policies:
    - name: apply-once
      type: apply-once
      properties:
        enable: true
        rules:
          - strategy:
              path: ["spec.replicas"]
            selector:
              resourceTypes: ["Deployment","StatefulSet"]
```

### Specification (hpa)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 min | Specify the minimal number of replicas to which the autoscaler can scale down. | int | false | 1 
 max | Specify the maximum number of of replicas to which the autoscaler can scale up. | int | false | 10 
 targetAPIVersion | Specify the apiVersion of scale target. | string | false | apps/v1 
 targetKind | Specify the kind of scale target. | string | false | Deployment 
 cpu |  | [cpu](#cpu-hpa) | true |  
 mem |  | [mem](#mem-hpa) | false |  
 podCustomMetrics | Specify custom metrics of pod type. | [[]podCustomMetrics](#podcustommetrics-hpa) | false |  


#### cpu (hpa)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 type | Specify resource metrics in terms of percentage("Utilization") or direct value("AverageValue"). | "Utilization" or "AverageValue" | false | Utilization 
 value | Specify the value of CPU utilization or averageValue. | int | false | 50 


#### mem (hpa)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 type | Specify resource metrics in terms of percentage("Utilization") or direct value("AverageValue"). | "Utilization" or "AverageValue" | false | Utilization 
 value | Specify  the value of MEM utilization or averageValue. | int | false | 50 


#### podCustomMetrics (hpa)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name | Specify name of custom metrics. | string | true |  
 value | Specify target value of custom metrics. | string | true |  


## Init-Container

### Description

add an init container and use shared volume with pod.

### Apply To Component Types

Component based on the following kinds of resources:
- deployments.apps
- statefulsets.apps
- daemonsets.apps
- jobs.batch



### Examples (init-container)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: busybox
spec:
  components:
    - name: busybox
      type: webservice
      properties:
        image: busybox
        cmd: ["sleep", "86400"]
      traits:
        - type: init-container
          properties:
            name: init-busybox
            image: busybox
            cmd: ["echo", "hello"]
            initMountPath: /data
            appMountPath: /data-initialized
```

### Specification (init-container)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name | Specify the name of init container. | string | true |  
 image | Specify the image of init container. | string | true |  
 imagePullPolicy | Specify image pull policy for your service. | "IfNotPresent" or "Always" or "Never" | false | IfNotPresent 
 cmd | Specify the commands run in the init container. | []string | false |  
 args | Specify the args run in the init container. | []string | false |  
 env | Specify the env run in the init container. | [[]env](#env-init-container) | false |  
 mountName | Specify the mount name of shared volume. | string | false | workdir 
 appMountPath | Specify the mount path of app container. | string | true |  
 initMountPath | Specify the mount path of init container. | string | true |  
 extraVolumeMounts | Specify the extra volume mounts for the init container. | [[]extraVolumeMounts](#extravolumemounts-init-container) | true |  


#### env (init-container)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name | Environment variable name. | string | true |  
 value | The value of the environment variable. | string | false |  
 valueFrom | Specifies a source the value of this var should come from. | [valueFrom](#valuefrom-init-container) | false |  


##### valueFrom (init-container)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 secretKeyRef | Selects a key of a secret in the pod's namespace. | [secretKeyRef](#secretkeyref-init-container) | false |  
 configMapKeyRef | Selects a key of a config map in the pod's namespace. | [configMapKeyRef](#configmapkeyref-init-container) | false |  


##### secretKeyRef (init-container)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name | The name of the secret in the pod's namespace to select from. | string | true |  
 key | The key of the secret to select from. Must be a valid secret key. | string | true |  


##### configMapKeyRef (init-container)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name | The name of the config map in the pod's namespace to select from. | string | true |  
 key | The key of the config map to select from. Must be a valid secret key. | string | true |  


#### extraVolumeMounts (init-container)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name | The name of the volume to be mounted. | string | true |  
 mountPath | The mountPath for mount in the init container. | string | true |  


## Json-Merge-Patch

### Description

Patch the output following Json Merge Patch strategy, following RFC 7396.

> For now this trait is hidden from the VelaUX. Available when using CLI

### Apply To Component Types

All Component Types


### Examples (json-merge-patch)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: busybox
spec:
  components:
    - name: busybox
      type: webservice
      properties:
        image: busybox
        cmd: ["sleep", "86400"]
        labels:
          pod-label-key: pod-label-value
          to-delete-label-key: to-delete-label-value
      traits:
        # the json merge patch can be used to add, replace and delete fields
        # the following part will
        # 1. add `deploy-label-key` to deployment labels
        # 2. set deployment replicas to 3
        # 3. set `pod-label-key` to `pod-label-modified-value` in pod labels
        # 4. delete `to-delete-label-key` in pod labels
        # 5. reset `containers` for pod
        - type: json-merge-patch
          properties:
            metadata:
              labels:
                deploy-label-key: deploy-label-added-value
            spec:
              replicas: 3
              template:
                metadata:
                  labels:
                    pod-label-key: pod-label-modified-value
                    to-delete-label-key: null
                spec:
                  containers:
                    - name: busybox-new
                      image: busybox:1.34
                      command: ["sleep", "864000"]
```

### Specification (json-merge-patch)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 \- |  | {} | true |  


## Json-Patch

### Description

Patch the output following Json Patch strategy, following RFC 6902.

> For now this trait is hidden from the VelaUX. Available when using CLI

### Apply To Component Types

All Component Types


### Examples (json-patch)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: busybox
spec:
  components:
    - name: busybox
      type: webservice
      properties:
        image: busybox
        cmd: ["sleep", "86400"]
        labels:
          pod-label-key: pod-label-value
          to-delete-label-key: to-delete-label-value
      traits:
        # the json patch can be used to add, replace and delete fields
        # the following part will
        # 1. add `deploy-label-key` to deployment labels
        # 2. set deployment replicas to 3
        # 3. set `pod-label-key` to `pod-label-modified-value` in pod labels
        # 4. delete `to-delete-label-key` in pod labels
        # 5. add sidecar container for pod
        - type: json-patch
          properties:
            operations:
              - op: add
                path: "/spec/replicas"
                value: 3
              - op: replace
                path: "/spec/template/metadata/labels/pod-label-key"
                value: pod-label-modified-value
              - op: remove
                path: "/spec/template/metadata/labels/to-delete-label-key"
              - op: add
                path: "/spec/template/spec/containers/1"
                value:
                  name: busybox-sidecar
                  image: busybox:1.34
                  command: ["sleep", "864000"]
```

### Specification (json-patch)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 operations |  | [[]operations](#operations-json-patch) | true |  


#### operations (json-patch)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 \- |  | {} | true |  


## K8s-Update-Strategy

### Description

Set k8s update strategy for Deployment/DaemonSet/StatefulSet.

### Apply To Component Types

Component based on the following kinds of resources:
- deployments.apps
- statefulsets.apps
- daemonsets.apps



### Examples (k8s-update-strategy)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: application-with-update-strategy
spec:
  components:
    - name: helloworld
      type: webservice
      properties:
        cpu: "0.5"
        exposeType: ClusterIP
        image: oamdev/hello-world:latest
        memory: 1024Mi
        ports:
          - expose: true
            port: 80
            protocol: TCP
      traits:
        - type: scaler
          properties:
            replicas: 5
        - type: k8s-update-strategy
          properties:
            targetAPIVersion: apps/v1
            targetKind: Deployment
            strategy:
              type: RollingUpdate
              rollingStrategy:
                maxSurge: 20%
                maxUnavailable: 30%
---
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: application-node-exporter
spec:
  components:
    - name: node-exporter
      type: daemon
      properties:
        image: prom/node-exporter
        imagePullPolicy: IfNotPresent
        volumeMounts:
          hostPath:
            - mountPath: /host/sys
              mountPropagation: HostToContainer
              name: sys
              path: /sys
              readOnly: true
            - mountPath: /host/root
              mountPropagation: HostToContainer
              name: root
              path: /
              readOnly: true
      traits:
        - properties:
            args:
              - --path.sysfs=/host/sys
              - --path.rootfs=/host/root
              - --no-collector.wifi
              - --no-collector.hwmon
              - --collector.filesystem.ignored-mount-points=^/(dev|proc|sys|var/lib/docker/.+|var/lib/kubelet/pods/.+)($|/)
              - --collector.netclass.ignored-devices=^(veth.*)$
          type: command
        - properties:
            annotations:
              prometheus.io/path: /metrics
              prometheus.io/port: "8080"
              prometheus.io/scrape: "true"
            port:
              - 9100
          type: expose
        - properties:
            cpu: 0.1
            memory: 250Mi
          type: resource
        - type: k8s-update-strategy
          properties:
            targetAPIVersion: apps/v1
            targetKind: DaemonSet
            strategy:
              type: RollingUpdate
              rollingStrategy:
                maxSurge: 20%
                maxUnavailable: 30%




```

### Specification (k8s-update-strategy)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 targetAPIVersion | Specify the apiVersion of target. | string | false | apps/v1 
 targetKind | Specify the kind of target. | "Deployment" or "StatefulSet" or "DaemonSet" | false | Deployment 
 strategy | Specify the strategy of update. | [strategy](#strategy-k8s-update-strategy) | true |  


#### strategy (k8s-update-strategy)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 type | Specify the strategy type. | "RollingUpdate" or "Recreate" or "OnDelete" | false | RollingUpdate 
 rollingStrategy | Specify the parameters of rollong update strategy. | [rollingStrategy](#rollingstrategy-k8s-update-strategy) | false |  


##### rollingStrategy (k8s-update-strategy)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 maxSurge |  | string | false | 25% 
 maxUnavailable |  | string | false | 25% 
 partition |  | int | false | 0 


## Labels

### Description

Add labels on your workload. if it generates pod, add same label for generated pods.

### Apply To Component Types

All Component Types


### Examples (labels)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: myapp
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        image: crccheck/hello-world
        port: 8000
      traits:
        - type: labels
          properties:
            "release": "stable"
        - type: annotations
          properties:
            "description": "web application"
```

### Specification (labels)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 \- |  | map[string]:(null&#124;string) | true |  


## Lifecycle

### Description

Add lifecycle hooks for every container of K8s pod for your workload which follows the pod spec in path 'spec.template'.

### Apply To Component Types

Component based on the following kinds of resources:
- deployments.apps
- statefulsets.apps
- daemonsets.apps
- jobs.batch



### Examples (lifecycle)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: application-with-lifecycle
spec:
  components:
    - name: busybox-runner
      type: worker
      properties:
        image: busybox
        cmd:
          - sleep
          - '1000'
      traits:
        - type: lifecycle
          properties:
            postStart:
              exec:
                command:
                  - echo
                  - 'hello world'
            preStop:
              httpGet:
                host: "www.aliyun.com"
                scheme: "HTTPS"
                port: 443
```

### Specification (lifecycle)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 postStart |  | [postStart](#poststart-lifecycle) | false |  
 preStop |  | [preStop](#prestop-lifecycle) | false |  


#### postStart (lifecycle)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 exec |  | [exec](#exec-lifecycle) | false |  
 httpGet |  | [httpGet](#httpget-lifecycle) | false |  
 tcpSocket |  | [tcpSocket](#tcpsocket-lifecycle) | false |  


##### exec (lifecycle)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 command |  | []string | true |  


##### httpGet (lifecycle)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 path |  | string | false |  
 port |  | int | true |  
 host |  | string | false |  
 scheme |  | "HTTP" or "HTTPS" | false | HTTP 
 httpHeaders |  | [[]httpHeaders](#httpheaders-lifecycle) | false |  


##### httpHeaders (lifecycle)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name |  | string | true |  
 value |  | string | true |  


##### tcpSocket (lifecycle)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 port |  | int | true |  
 host |  | string | false |  


#### preStop (lifecycle)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 exec |  | [exec](#exec-lifecycle) | false |  
 httpGet |  | [httpGet](#httpget-lifecycle) | false |  
 tcpSocket |  | [tcpSocket](#tcpsocket-lifecycle) | false |  


##### exec (lifecycle)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 command |  | []string | true |  


##### httpGet (lifecycle)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 path |  | string | false |  
 port |  | int | true |  
 host |  | string | false |  
 scheme |  | "HTTP" or "HTTPS" | false | HTTP 
 httpHeaders |  | [[]httpHeaders](#httpheaders-lifecycle) | false |  


##### httpHeaders (lifecycle)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name |  | string | true |  
 value |  | string | true |  


##### tcpSocket (lifecycle)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 port |  | int | true |  
 host |  | string | false |  


## Nocalhost

### Description

nocalhost develop configuration.

> For now this trait is hidden from the VelaUX. Available when using CLI

### Apply To Component Types

Component based on the following kinds of resources:
- deployments.apps
- statefulsets.apps
- daemonsets.apps
- jobs.batch



### Examples (nocalhost)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: bookinfo
spec:
  components:
    - name: productpage
      type: webservice
      properties:
        image: nocalhost-docker.pkg.coding.net/nocalhost/bookinfo/productpage:latest
        port: 9080
      traits:
        - type: nocalhost
          properties:
            port: 9080
            gitUrl: https://github.com/nocalhost/bookinfo-productpage.git
            image: nocalhost-docker.pkg.coding.net/nocalhost/dev-images/python:3.7.7-slim-productpage-with-pydevd
            shell: "bash"
            workDir: "/opt/work"
            resources:
              limits:
                memory: 1Gi
                cpu: "1"
              requests:
                memory: 512Mi
                cpu: "0.5"
            debug:
              remoteDebugPort: 9009
            hotReload: true
            sync:
              type: send
              filePattern:
                - ./
              ignoreFilePattern:
                - .git
                - .idea
            command:
              run:
                - sh
                - run.sh
              debug:
                - sh
                - debug.sh
            env:
              - name: "foo"
                value: "bar"
            portForward:
              - 39080:9080
```

### Specification (nocalhost)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 port |  | int | true |  
 serviceType |  | string | false | deployment 
 gitUrl |  | string | false |  
 image |  | string | true |  
 shell |  | string | false | bash 
 workDir |  | string | false | /home/nocalhost-dev 
 storageClass |  | string | false |  
 command |  | [command](#command-nocalhost) | true |  
 debug |  | [debug](#debug-nocalhost) | false |  
 hotReload |  | bool | false | true 
 sync |  | [sync](#sync-nocalhost) | true |  
 env |  | [[]env](#env-nocalhost) | false |  
 portForward |  | []string | false |  
 persistentVolumeDirs |  | [[]persistentVolumeDirs](#persistentvolumedirs-nocalhost) | false |  
 resources |  | [resources](#resources-nocalhost) | true |  


#### command (nocalhost)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 run |  | []string | true |  
 debug |  | []string | true |  


#### debug (nocalhost)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 remoteDebugPort |  | int | false |  


#### sync (nocalhost)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 type |  | string | false | send 
 filePattern |  | []string | true |  
 ignoreFilePattern |  | []string | true |  


#### env (nocalhost)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name |  | string | true |  
 value |  | string | true |  


#### persistentVolumeDirs (nocalhost)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 path |  | string | true |  
 capacity |  | string | true |  


#### resources (nocalhost)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 limits |  | [limits](#limits-nocalhost) | true |  
 requests |  | [requests](#requests-nocalhost) | true |  


##### limits (nocalhost)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 memory |  | string | false | 2Gi 
 cpu |  | string | false | 2 


##### requests (nocalhost)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 memory |  | string | false | 512Mi 
 cpu |  | string | false | 0.5 


## Resource

### Description

Add resource requests and limits on K8s pod for your workload which follows the pod spec in path 'spec.template.'.

### Apply To Component Types

Component based on the following kinds of resources:
- deployments.apps
- statefulsets.apps
- daemonsets.apps
- jobs.batch



### Examples (resource)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: resource-app
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        image: crccheck/hello-world
        ports:
          - port: 8000
      traits:
        - type: resource
          properties:
            cpu: 2
            memory: 2Gi
            requests:
              cpu: 2
              memory: 2Gi
            limits:
              cpu: 4
              memory: 4Gi
```

### Specification (resource)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 cpu | Specify the amount of cpu for requests and limits. | number | false | 1 
 memory | Specify the amount of memory for requests and limits. | string | false | 2048Mi 
 requests | Specify the resources in requests. | [requests](#requests-resource) | false |  
 limits | Specify the resources in limits. | [limits](#limits-resource) | false |  


#### requests (resource)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 cpu | Specify the amount of cpu for requests. | number | false | 1 
 memory | Specify the amount of memory for requests. | string | false | 2048Mi 


#### limits (resource)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 cpu | Specify the amount of cpu for limits. | number | false | 1 
 memory | Specify the amount of memory for limits. | string | false | 2048Mi 


## Scaler

### Description

Manually scale K8s pod for your workload which follows the pod spec in path 'spec.template'.

### Apply To Component Types

Component based on the following kinds of resources:
- deployments.apps
- statefulsets.apps



### Examples (scaler)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: website
spec:
  components:
    - name: frontend
      type: webservice
      properties:
        image: nginx
      traits:
        - type: scaler
          properties:
            replicas: 2
        - type: sidecar
          properties:
            name: "sidecar-test"
            image: "fluentd"
    - name: backend
      type: worker
      properties:
        image: busybox
        cmd:
          - sleep
          - '1000'
```

### Specification (scaler)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 replicas | Specify the number of workload. | int | false | 1 


## Service-Account

### Description

Specify serviceAccount for your workload which follows the pod spec in path 'spec.template'.

### Apply To Component Types

Component based on the following kinds of resources:
- deployments.apps
- statefulsets.apps
- daemonsets.apps
- jobs.batch



### Examples (service-account)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: vela-doc
  namespace: vela-system
spec:
  components:
    - name: frontend
      type: webservice
      properties:
        image: oamdev/vela-cli:v1.5.0-beta.1
        cmd: ["/bin/vela","show"]
        ports:
          - port: 18081
            expose: true
      traits:
        - type: service-account
          properties:
            name: kubevela-vela-core
```

### Specification (service-account)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name | Specify the name of ServiceAccount. | string | true |  
 create | Specify whether to create new ServiceAccount or not. | bool | false | false 
 privileges | Specify the privileges of the ServiceAccount, if not empty, RoleBindings(ClusterRoleBindings) will be created. | [[]privileges](#privileges-service-account) | false |  


#### privileges (service-account)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 verbs | Specify the verbs to be allowed for the resource. | []string | true |  
 apiGroups | Specify the apiGroups of the resource. | []string | false |  
 resources | Specify the resources to be allowed. | []string | false |  
 resourceNames | Specify the resourceNames to be allowed. | []string | false |  
 nonResourceURLs | Specify the resource url to be allowed. | []string | false |  
 scope | Specify the scope of the privileges, default to be namespace scope. | "namespace" or "cluster" | false | namespace 


## Service-Binding

### Description

Binding secrets of cloud resources to component env. This definition is DEPRECATED, please use 'storage' instead.

> For now this trait is hidden from the VelaUX. Available when using CLI

### Apply To Component Types

Component based on the following kinds of resources:
- deployments.apps
- statefulsets.apps
- daemonsets.apps
- jobs.batch



### Examples (service-binding)

1. Prepare a Kubernetes Secret

The secret can be manually created, or generated by other component or external system.

For example, we have a secret `db-conn-example` whose data is as below:

```yaml
endpoint: https://xxx.com
password: 123
username: myname
```

2. Bind the Secret into your component by `service-binding` trait

For example, we have a webservice component who needs to consume a database. The database connection string should be set
to Pod environments: `endpoint`, `username` and `DB_PASSWORD`.

We can set the properties for envMappings as below. For each environment, `secret` represents the secret name, and `key`
represents the key of the secret.

Here is the complete properties for the trait.

```yaml
traits:
- type: service-binding
  properties:
    envMappings:
      DB_PASSWORD:
        secret: db-conn-example
        key: password            
      endpoint:
        secret: db-conn-example
        key: endpoint
      username:
        secret: db-conn-example
        key: username
```

In particular, if the environment name, like `endpoint`, is same to the `key` of the secret, we can omit the `key`.
So we can simplify the properties as below.

```yaml
traits:
- type: service-binding
  properties:
    envMappings:
      DB_PASSWORD:
        secret: db-conn-example
        key: password            
      endpoint:
        secret: db-conn-example
      username:
        secret: db-conn-example
```

We can finally prepare an Application for the business component `binding-test-comp` to consume the secret, which is a
representative of a database cloud resource.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: webapp
spec:
  components:
    - name: binding-test-comp
      type: webservice
      properties:
        image: zzxwill/flask-web-application:v0.3.1-crossplane
        ports: 80
      traits:
        - type: service-binding
          properties:
            envMappings:
              # environments refer to db-conn secret
              DB_PASSWORD:
                secret: db-conn-example
                key: password            
              endpoint:
                secret: db-conn-example
              username:
                secret: db-conn-example
```

Deploy this YAML and the Secret `db-conn-example` will be binding into environment of workload.

### Specification (service-binding)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 envMappings | The mapping of environment variables to secret. | map[string]KeySecret(#keysecret-service-binding) | true |  


#### KeySecret (service-binding)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 key |  | string | false |  
 secret |  | string | true |  


## Sidecar

### Description

Inject a sidecar container to K8s pod for your workload which follows the pod spec in path 'spec.template'.

### Apply To Component Types

Component based on the following kinds of resources:
- deployments.apps
- statefulsets.apps
- daemonsets.apps
- jobs.batch



### Examples (sidecar)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: vela-app-with-sidecar
spec:
  components:
    - name: log-gen-worker
      type: worker
      properties:
        image: busybox
        cmd:
          - /bin/sh
          - -c
          - >
            i=0;
            while true;
            do
              echo "$i: $(date)" >> /var/log/date.log;
              i=$((i+1));
              sleep 1;
            done
        volumes:
          - name: varlog
            mountPath: /var/log
            type: emptyDir
      traits:
        - type: sidecar
          properties:
            name: count-log
            image: busybox
            cmd: [ /bin/sh, -c, 'tail -n+1 -f /var/log/date.log']
            volumes:
              - name: varlog
                path: /var/log
```

### Specification (sidecar)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name | Specify the name of sidecar container. | string | true |  
 image | Specify the image of sidecar container. | string | true |  
 cmd | Specify the commands run in the sidecar. | []string | false |  
 args | Specify the args in the sidecar. | []string | false |  
 env | Specify the env in the sidecar. | [[]env](#env-sidecar) | false |  
 volumes | Specify the shared volume path. | [[]volumes](#volumes-sidecar) | false |  
 livenessProbe | Instructions for assessing whether the container is alive. | [livenessProbe](#livenessprobe-sidecar) | false |  
 readinessProbe | Instructions for assessing whether the container is in a suitable state to serve traffic. | [readinessProbe](#readinessprobe-sidecar) | false |  


#### env (sidecar)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name | Environment variable name. | string | true |  
 value | The value of the environment variable. | string | false |  
 valueFrom | Specifies a source the value of this var should come from. | [valueFrom](#valuefrom-sidecar) | false |  


##### valueFrom (sidecar)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 secretKeyRef | Selects a key of a secret in the pod's namespace. | [secretKeyRef](#secretkeyref-sidecar) | false |  
 configMapKeyRef | Selects a key of a config map in the pod's namespace. | [configMapKeyRef](#configmapkeyref-sidecar) | false |  
 fieldRef | Specify the field reference for env. | [fieldRef](#fieldref-sidecar) | false |  


##### secretKeyRef (sidecar)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name | The name of the secret in the pod's namespace to select from. | string | true |  
 key | The key of the secret to select from. Must be a valid secret key. | string | true |  


##### configMapKeyRef (sidecar)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name | The name of the config map in the pod's namespace to select from. | string | true |  
 key | The key of the config map to select from. Must be a valid secret key. | string | true |  


##### fieldRef (sidecar)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 fieldPath | Specify the field path for env. | string | true |  


#### volumes (sidecar)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name |  | string | true |  
 path |  | string | true |  


#### livenessProbe (sidecar)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 exec | Instructions for assessing container health by executing a command. Either this attribute or the httpGet attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the httpGet attribute and the tcpSocket attribute. | [exec](#exec-sidecar) | false |  
 httpGet | Instructions for assessing container health by executing an HTTP GET request. Either this attribute or the exec attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the tcpSocket attribute. | [httpGet](#httpget-sidecar) | false |  
 tcpSocket | Instructions for assessing container health by probing a TCP socket. Either this attribute or the exec attribute or the httpGet attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the httpGet attribute. | [tcpSocket](#tcpsocket-sidecar) | false |  
 initialDelaySeconds | Number of seconds after the container is started before the first probe is initiated. | int | false | 0 
 periodSeconds | How often, in seconds, to execute the probe. | int | false | 10 
 timeoutSeconds | Number of seconds after which the probe times out. | int | false | 1 
 successThreshold | Minimum consecutive successes for the probe to be considered successful after having failed. | int | false | 1 
 failureThreshold | Number of consecutive failures required to determine the container is not alive (liveness probe) or not ready (readiness probe). | int | false | 3 


##### exec (sidecar)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 command | A command to be executed inside the container to assess its health. Each space delimited token of the command is a separate array element. Commands exiting 0 are considered to be successful probes, whilst all other exit codes are considered failures. | []string | true |  


##### httpGet (sidecar)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 path | The endpoint, relative to the port, to which the HTTP GET request should be directed. | string | true |  
 port | The TCP socket within the container to which the HTTP GET request should be directed. | int | true |  
 httpHeaders |  | [[]httpHeaders](#httpheaders-sidecar) | false |  


##### httpHeaders (sidecar)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name |  | string | true |  
 value |  | string | true |  


##### tcpSocket (sidecar)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 port | The TCP socket within the container that should be probed to assess container health. | int | true |  


#### readinessProbe (sidecar)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 exec | Instructions for assessing container health by executing a command. Either this attribute or the httpGet attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the httpGet attribute and the tcpSocket attribute. | [exec](#exec-sidecar) | false |  
 httpGet | Instructions for assessing container health by executing an HTTP GET request. Either this attribute or the exec attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the tcpSocket attribute. | [httpGet](#httpget-sidecar) | false |  
 tcpSocket | Instructions for assessing container health by probing a TCP socket. Either this attribute or the exec attribute or the httpGet attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the httpGet attribute. | [tcpSocket](#tcpsocket-sidecar) | false |  
 initialDelaySeconds | Number of seconds after the container is started before the first probe is initiated. | int | false | 0 
 periodSeconds | How often, in seconds, to execute the probe. | int | false | 10 
 timeoutSeconds | Number of seconds after which the probe times out. | int | false | 1 
 successThreshold | Minimum consecutive successes for the probe to be considered successful after having failed. | int | false | 1 
 failureThreshold | Number of consecutive failures required to determine the container is not alive (liveness probe) or not ready (readiness probe). | int | false | 3 


##### exec (sidecar)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 command | A command to be executed inside the container to assess its health. Each space delimited token of the command is a separate array element. Commands exiting 0 are considered to be successful probes, whilst all other exit codes are considered failures. | []string | true |  


##### httpGet (sidecar)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 path | The endpoint, relative to the port, to which the HTTP GET request should be directed. | string | true |  
 port | The TCP socket within the container to which the HTTP GET request should be directed. | int | true |  
 httpHeaders |  | [[]httpHeaders](#httpheaders-sidecar) | false |  


##### httpHeaders (sidecar)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name |  | string | true |  
 value |  | string | true |  


##### tcpSocket (sidecar)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 port | The TCP socket within the container that should be probed to assess container health. | int | true |  


## Startup-Probe

### Description

Add startup probe hooks for the specified container of K8s pod for your workload which follows the pod spec in path 'spec.template'.

### Apply To Component Types

Component based on the following kinds of resources:
- deployments.apps
- statefulsets.apps
- daemonsets.apps
- jobs.batch



### Examples (startup-probe)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: application-with-startup-probe
spec:
  components:
    - name: busybox-runner
      type: worker
      properties:
        image: busybox
        cmd:
          - sleep
          - '1000'
      traits:
      - type: sidecar
        properties:
          name: nginx
          image: nginx
      # This startup-probe is blocking the startup of the main container 
      # as the URL has a typo '.comm' vs '.com'
      - type: startup-probe
        properties:
          containerName: "busybox-runner"
          httpGet:
            host: "www.guidewire.comm"
            scheme: "HTTPS"
            port: 443
          periodSeconds: 4
          failureThreshold: 4  
      # This startup probe targets the nginx sidecar
      - type: startup-probe
        properties:
          containerName: nginx
          httpGet:
            host: "www.guidewire.com"
            scheme: "HTTPS"
            port: 443
          periodSeconds: 5
          failureThreshold: 5           
```

### Specification (startup-probe)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
  |  | [StartupProbeParams](#startupprobeparams-startup-probe) or [type-option-2](#type-option-2-startup-probe) | false |  


#### StartupProbeParams (startup-probe)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 containerName | Specify the name of the target container, if not set, use the component name. | string | false | empty 
 initialDelaySeconds | Number of seconds after the container has started before liveness probes are initiated. Minimum value is 0. | int | false | 0 
 periodSeconds | How often, in seconds, to execute the probe. Minimum value is 1. | int | false | 10 
 timeoutSeconds | Number of seconds after which the probe times out. Minimum value is 1. | int | false | 1 
 successThreshold | Minimum consecutive successes for the probe to be considered successful after having failed.  Minimum value is 1. | int | false | 1 
 failureThreshold | Minimum consecutive failures for the probe to be considered failed after having succeeded. Minimum value is 1. | int | false | 3 
 terminationGracePeriodSeconds | Optional duration in seconds the pod needs to terminate gracefully upon probe failure. Set this value longer than the expected cleanup time for your process. | int | false |  
 exec | Instructions for assessing container startup status by executing a command. Either this attribute or the httpGet attribute or the grpc attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with the httpGet attribute and the tcpSocket attribute and the gRPC attribute. | [exec](#exec-startup-probe) | false |  
 httpGet | Instructions for assessing container startup status by executing an HTTP GET request. Either this attribute or the exec attribute or the grpc attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with the exec attribute and the tcpSocket attribute and the gRPC attribute. | [httpGet](#httpget-startup-probe) | false |  
 grpc | Instructions for assessing container startup status by probing a gRPC service. Either this attribute or the exec attribute or the grpc attribute or the httpGet attribute MUST be specified. This attribute is mutually exclusive with the exec attribute and the httpGet attribute and the tcpSocket attribute. | [grpc](#grpc-startup-probe) | false |  
 tcpSocket | Instructions for assessing container startup status by probing a TCP socket. Either this attribute or the exec attribute or the tcpSocket attribute or the httpGet attribute MUST be specified. This attribute is mutually exclusive with the exec attribute and the httpGet attribute and the gRPC attribute. | [tcpSocket](#tcpsocket-startup-probe) | false |  


##### exec (startup-probe)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 command | A command to be executed inside the container to assess its health. Each space delimited token of the command is a separate array element. Commands exiting 0 are considered to be successful probes, whilst all other exit codes are considered failures. | []string | true |  


##### httpGet (startup-probe)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 path | The endpoint, relative to the port, to which the HTTP GET request should be directed. | string | false |  
 port | The port numer to access on the host or container. | int | true |  
 host | The hostname to connect to, defaults to the pod IP. You probably want to set "Host" in httpHeaders instead. | string | false |  
 scheme | The Scheme to use for connecting to the host. | "HTTP" or "HTTPS" | false | HTTP 
 httpHeaders | Custom headers to set in the request. HTTP allows repeated headers. | [[]httpHeaders](#httpheaders-startup-probe) | false |  


##### httpHeaders (startup-probe)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name | The header field name. | string | true |  
 value | The header field value. | string | true |  


##### grpc (startup-probe)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 port | The port number of the gRPC service. | int | true |  
 service | The name of the service to place in the gRPC HealthCheckRequest. | string | false |  


##### tcpSocket (startup-probe)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 port | Number or name of the port to access on the container. | string | true |  
 host | Host name to connect to, defaults to the pod IP. | string | false |  


#### type-option-2 (startup-probe)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 probes | Specify the startup probe for multiple containers. | [[]probes](#probes-startup-probe) | true |  


##### probes (startup-probe)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 containerName | Specify the name of the target container, if not set, use the component name. | string | false | empty 
 initialDelaySeconds | Number of seconds after the container has started before liveness probes are initiated. Minimum value is 0. | int | false | 0 
 periodSeconds | How often, in seconds, to execute the probe. Minimum value is 1. | int | false | 10 
 timeoutSeconds | Number of seconds after which the probe times out. Minimum value is 1. | int | false | 1 
 successThreshold | Minimum consecutive successes for the probe to be considered successful after having failed.  Minimum value is 1. | int | false | 1 
 failureThreshold | Minimum consecutive failures for the probe to be considered failed after having succeeded. Minimum value is 1. | int | false | 3 
 terminationGracePeriodSeconds | Optional duration in seconds the pod needs to terminate gracefully upon probe failure. Set this value longer than the expected cleanup time for your process. | int | false |  
 exec | Instructions for assessing container startup status by executing a command. Either this attribute or the httpGet attribute or the grpc attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with the httpGet attribute and the tcpSocket attribute and the gRPC attribute. | [exec](#exec-startup-probe) | false |  
 httpGet | Instructions for assessing container startup status by executing an HTTP GET request. Either this attribute or the exec attribute or the grpc attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with the exec attribute and the tcpSocket attribute and the gRPC attribute. | [httpGet](#httpget-startup-probe) | false |  
 grpc | Instructions for assessing container startup status by probing a gRPC service. Either this attribute or the exec attribute or the grpc attribute or the httpGet attribute MUST be specified. This attribute is mutually exclusive with the exec attribute and the httpGet attribute and the tcpSocket attribute. | [grpc](#grpc-startup-probe) | false |  
 tcpSocket | Instructions for assessing container startup status by probing a TCP socket. Either this attribute or the exec attribute or the tcpSocket attribute or the httpGet attribute MUST be specified. This attribute is mutually exclusive with the exec attribute and the httpGet attribute and the gRPC attribute. | [tcpSocket](#tcpsocket-startup-probe) | false |  


##### exec (startup-probe)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 command | A command to be executed inside the container to assess its health. Each space delimited token of the command is a separate array element. Commands exiting 0 are considered to be successful probes, whilst all other exit codes are considered failures. | []string | true |  


##### httpGet (startup-probe)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 path | The endpoint, relative to the port, to which the HTTP GET request should be directed. | string | false |  
 port | The port numer to access on the host or container. | int | true |  
 host | The hostname to connect to, defaults to the pod IP. You probably want to set "Host" in httpHeaders instead. | string | false |  
 scheme | The Scheme to use for connecting to the host. | "HTTP" or "HTTPS" | false | HTTP 
 httpHeaders | Custom headers to set in the request. HTTP allows repeated headers. | [[]httpHeaders](#httpheaders-startup-probe) | false |  


##### httpHeaders (startup-probe)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name | The header field name. | string | true |  
 value | The header field value. | string | true |  


##### grpc (startup-probe)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 port | The port number of the gRPC service. | int | true |  
 service | The name of the service to place in the gRPC HealthCheckRequest. | string | false |  


##### tcpSocket (startup-probe)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 port | Number or name of the port to access on the container. | string | true |  
 host | Host name to connect to, defaults to the pod IP. | string | false |  


## Storage

### Description

Add storages on K8s pod for your workload which follows the pod spec in path 'spec.template'.

### Apply To Component Types

Component based on the following kinds of resources:
- deployments.apps
- statefulsets.apps
- daemonsets.apps
- jobs.batch



### Examples (storage)

```yaml
# sample.yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: storage-app
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        image: oamdev/hello-world
        ports:
          - port: 8000
      traits:
        - type: storage
          properties:
            # PVC type storage
            pvc:
              - name: test1
                mountPath: /test/mount/pvc
            # EmptyDir type storage
            emptyDir:
              - name: test1
                mountPath: /test/mount/emptydir
            # ConfigMap type storage
            configMap:
              - name: test1
                mountPath: /test/mount/cm
                # Mount ConfigMap to Env
                mountToEnv:
                  envName: TEST_ENV
                  configMapKey: key1
                data:
                  key1: value1
                  key2: value2
            # Secret type storage
            secret:
              - name: test1
                mountPath: /test/mount/secret
                # Mount Secret to Env
                mountToEnv:
                  envName: TEST_SECRET
                  secretKey: key1
                data:
                  key1: dmFsdWUx
                  key2: dmFsdWUy
```

### Specification (storage)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 pvc | Declare pvc type storage. | [[]pvc](#pvc-storage) | false |  
 configMap | Declare config map type storage. | [[]configMap](#configmap-storage) | false |  
 secret | Declare secret type storage. | [[]secret](#secret-storage) | false |  
 emptyDir | Declare empty dir type storage. | [[]emptyDir](#emptydir-storage) | false |  
 hostPath | Declare host path type storage. | [[]hostPath](#hostpath-storage) | false |  


#### pvc (storage)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name |  | string | true |  
 mountOnly |  | bool | false | false 
 mountPath |  | string | true |  
 subPath |  | string | false |  
 volumeMode |  | string | false | Filesystem 
 volumeName |  | string | false |  
 accessModes |  | []string | true |  
 storageClassName |  | string | false |  
 resources |  | [resources](#resources-storage) | false |  
 dataSourceRef |  | [dataSourceRef](#datasourceref-storage) | false |  
 dataSource |  | [dataSource](#datasource-storage) | false |  
 selector |  | [selector](#selector-storage) | false |  


##### resources (storage)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 requests |  | [requests](#requests-storage) | true |  
 limits |  | [limits](#limits-storage) | false |  


##### requests (storage)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 storage |  | string | true |  


##### limits (storage)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 storage |  | string | true |  


##### dataSourceRef (storage)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name |  | string | true |  
 kind |  | string | true |  
 apiGroup |  | string | true |  


##### dataSource (storage)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name |  | string | true |  
 kind |  | string | true |  
 apiGroup |  | string | true |  


##### selector (storage)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 matchLabels |  | map[string]string | false |  
 matchExpressions |  | [matchExpressions](#matchexpressions-storage) | false |  


##### matchExpressions (storage)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 key |  | string | true |  
 values |  | []string | true |  
 operator |  | string | true |  


#### configMap (storage)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name |  | string | true |  
 mountOnly |  | bool | false | false 
 mountToEnv |  | [mountToEnv](#mounttoenv-storage) | false |  
 mountToEnvs |  | [[]mountToEnvs](#mounttoenvs-storage) | false |  
 mountPath |  | string | false |  
 subPath |  | string | false |  
 defaultMode |  | int | false | 420 
 readOnly |  | bool | false | false 
 data |  | map[string]_ | false |  
 items |  | [[]items](#items-storage) | false |  


##### mountToEnv (storage)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 envName |  | string | true |  
 configMapKey |  | string | true |  


##### mountToEnvs (storage)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 envName |  | string | true |  
 configMapKey |  | string | true |  


##### items (storage)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 key |  | string | true |  
 path |  | string | true |  
 mode |  | int | false | 511 


#### secret (storage)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name |  | string | true |  
 mountOnly |  | bool | false | false 
 mountToEnv |  | [mountToEnv](#mounttoenv-storage) | false |  
 mountToEnvs |  | [[]mountToEnvs](#mounttoenvs-storage) | false |  
 mountPath |  | string | true |  
 subPath |  | string | false |  
 defaultMode |  | int | false | 420 
 readOnly |  | bool | false | false 
 stringData |  | map[string]_ | false |  
 data |  | map[string]_ | false |  
 items |  | [[]items](#items-storage) | false |  


##### mountToEnv (storage)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 envName |  | string | true |  
 secretKey |  | string | true |  


##### mountToEnvs (storage)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 envName |  | string | true |  
 secretKey |  | string | true |  


##### items (storage)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 key |  | string | true |  
 path |  | string | true |  
 mode |  | int | false | 511 


#### emptyDir (storage)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name |  | string | true |  
 mountPath |  | string | true |  
 subPath |  | string | false |  
 medium |  | "" or "Memory" | false | empty 


#### hostPath (storage)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name |  | string | true |  
 path |  | string | true |  
 mountPath |  | string | true |  
 type |  | "Directory" or "DirectoryOrCreate" or "FileOrCreate" or "File" or "Socket" or "CharDevice" or "BlockDevice" | false | Directory 


## Topologyspreadconstraints

### Description

Add topology spread constraints hooks for every container of K8s pod for your workload which follows the pod spec in path 'spec.template'.

### Apply To Component Types

Component based on the following kinds of resources:
- deployments.apps
- statefulsets.apps
- daemonsets.apps
- jobs.batch



### Examples (topologyspreadconstraints)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: application-with-topologyspreadconstraints
spec:
  components:
    - name: busybox-runner
      type: worker
      properties:
        image: busybox
        cmd:
          - sleep
          - '1000'
      traits:
      - type: topologyspreadconstraints
        properties:
          constraints: 
          - topologyKey: zone
            labelSelector:
              matchLabels: 
                zone: us-east-1a
            maxSkew: 1
            whenUnsatisfiable: DoNotSchedule
            minDomains: 1
            nodeAffinityPolicy: Ignore
            nodeTaintsPolicy: Ignore
          - topologyKey: node
            labelSelector:
              matchExpressions:
                - key: foo 
                  operator: In
                  values: 
                  - abc
            maxSkew: 1
            whenUnsatisfiable: ScheduleAnyway 
            minDomains: 1
            nodeAffinityPolicy: Ignore
            nodeTaintsPolicy: Ignore
```

### Specification (topologyspreadconstraints)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 constraints |  | [[]constraints](#constraints-topologyspreadconstraints) | true |  


#### constraints (topologyspreadconstraints)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 maxSkew | Describe the degree to which Pods may be unevenly distributed. | int | true |  
 topologyKey | Specify the key of node labels. | string | true |  
 whenUnsatisfiable | Indicate how to deal with a Pod if it doesn't satisfy the spread constraint. | "DoNotSchedule" or "ScheduleAnyway" | false | DoNotSchedule 
 labelSelector | labelSelector to find matching Pods. | [labelSelector](#labelselector-topologyspreadconstraints) | true |  
 minDomains | Indicate a minimum number of eligible domains. | int | false |  
 matchLabelKeys | A list of pod label keys to select the pods over which spreading will be calculated. | []string | false |  
 nodeAffinityPolicy | Indicate how we will treat Pod's nodeAffinity/nodeSelector when calculating pod topology spread skew. | "Honor" or "Ignore" | false | Honor 
 nodeTaintsPolicy | Indicate how we will treat node taints when calculating pod topology spread skew. | "Honor" or "Ignore" | false | Honor 


##### labelSelector (topologyspreadconstraints)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 matchLabels |  | map[string]string | false |  
 matchExpressions |  | [[]matchExpressions](#matchexpressions-topologyspreadconstraints) | false |  


##### matchExpressions (topologyspreadconstraints)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 key |  | string | true |  
 operator |  | "In" or "NotIn" or "Exists" or "DoesNotExist" | false | In 
 values |  | []string | false |  


