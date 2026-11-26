---
title: Built-in Components Type
---

This documentation will walk through all the built-in component types sorted alphabetically.

> It was generated automatically by [scripts](../../contributor/cli-ref-doc.md), please don't update manually, last updated at 2026-11-17T15:13:44+05:30.

## Addon

### Description

Install an addon as a component; the addon's Application is tracked by this Application.

### Examples (addon)

Requires the `EnableAddonComponent` feature gate. Install or upgrade the chart with
`--set featureGates.enableAddonComponent=true`. With the gate disabled the
ComponentDefinition is still installed, but rendering a `type: addon` component fails
with a message naming the gate.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: comp-fluxcd
  namespace: vela-system
spec:
  components:
    - name: fluxcd
      type: addon
      properties:
        # addon: fluxcd        # optional, defaults to the component name
        version: "3.0.2"       # optional, empty means the latest stable version
        registry: KubeVela     # optional, empty means the configured default registry
        skipVersionValidation: false
        properties:            # optional, the addon's own parameters
          {}
```

### Specification (addon)
 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 addon | Addon name; defaults to the component name. | string | false |  
 version | Exact version; empty means the latest stable version. | string | false | empty 
 registry | Registry name; empty means the configured default. | string | false | empty 
 properties | The addon's own parameters, passed through to its templates. | map[string]_ | false |  
 skipVersionValidation | Skip the addon's vela and Kubernetes system requirements check. | bool | false | false 
 placement | Where the addon installs. Set `clusters` or `clusterLabelSelector`. Refused for an addon that defines its own topology policy or workflow. | [placement](#placement-addon) | false |  


#### placement (addon)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 clusters | Names of the clusters to install on. | []string | false |  
 clusterLabelSelector | Labels that select the clusters to install on. | map[string]string | false |  
 allowEmpty | Allow an empty `clusterLabelSelector` result. An unknown name in `clusters` still fails. | bool | false |  

## Crate

### Description

Fetch a crate package from an OCI registry and install its definitions and auxiliary objects. The package version is the OCI tag. It is not the API line (`v1`, `v2`). Definitions are created in the namespace of the Application that contains this component. For a crate that an addon installs, they are created in the namespace of the Application that installs the addon.

`EnableCrateComponent` must be true. See [Crates](../../platform-engineers/crate/intro.md) for what a crate is. See [Install and Use a Crate](../../platform-engineers/crate/crate-install.md) for the CLI and for the definitions that a crate adds.

### Examples (crate)

The examples read from a crate registry named `catalog`. Add it first with `vela crate registry add catalog <oci-url>`, or leave out `registry` to use the configured default registry.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: crate-aws-s3-deploy
  namespace: team-a
spec:
  components:
    - name: aws-s3
      type: crate
      properties:
        crate: aws-s3
        registry: catalog
        version: "1.0.0"
```

Send the runtime objects of the crate to managed clusters. Definitions and hub objects stay on the hub.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: crate-aws-s3-deploy
  namespace: team-a
spec:
  components:
    - name: aws-s3
      type: crate
      properties:
        registry: catalog
        version: "1.1.0"
        placement:
          clusterLabelSelector:
            region: east
```

### Specification (crate)
Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 crate | Crate name. Must match `crate` in the package `_crate.cue`. | string | false | the component name |  
 registry | Name from `vela crate registry add`. Admission rejects a name that is not configured: `is not a configured crate registry; configured: [...]`. If admission cannot read the registry ConfigMap, it does not check the name. The workflow step then fails with `crate registry "<name>" not found` for a name that is not configured, or with the read error when the ConfigMap still cannot be read. Empty is resolved when KubeVela fetches the package: the only configured registry, or the registry named `catalog` when several exist. | string | false |  |  
 version | Package version (OCI tag). Empty selects the highest published semver tag when the workflow of the Application runs. A new tag in the registry does not upgrade the installed package, so set `version` on each install and each upgrade. This is not the API line. | string | false |  |  
 placement | Clusters that receive the objects that the crate marks `runtime`. Without `placement`, all objects install on the hub. See [placement](#placement-crate). | [placement](#placement-crate) | false |  |  

`namespace` is not a property. If you set it, admission rejects the Application. The definitions install into the namespace of this Application. That namespace must exist. On a managed cluster, a runtime object with no namespace also goes into this namespace, and the namespace must exist there too. KubeVela does not create it.

#### placement (crate)

Set `clusters` or `clusterLabelSelector`. Do not set both. See [Crate Multi-Cluster Placement](../../platform-engineers/crate/crate-multicluster.md).

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 clusters | Names of the clusters, as `vela cluster list` shows them. The list must contain one or more names. `local` is the hub. | []string | false |  |  
 clusterLabelSelector | Cluster labels to match. All labels must match. An empty map `{}` matches every cluster, including `local`. | map[string]string | false |  |  
 allowEmpty | If true, the install succeeds when `clusterLabelSelector` matches no cluster. If false, the runtime step fails. A name in `clusters` that is not a cluster always fails. | bool | false | false |

## Cron-Task

### Description

Describes cron jobs that run code or a script to completion.

### Examples (cron-task)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: cron-worker
spec:
  components:
    - name: mytask
      type: cron-task
      properties:
        image: perl
        count: 10
        cmd: ["perl",  "-Mbignum=bpi", "-wle", "print bpi(2000)"]
        schedule: "*/1 * * * *"
```

### Specification (cron-task)


 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 labels | Specify the labels in the workload. | map[string]string | false |  |  
 annotations | Specify the annotations in the workload. | map[string]string | false |  |  
 schedule | Specify the schedule in Cron format, see https://en.wikipedia.org/wiki/Cron. | string | true |  |  
 startingDeadlineSeconds | Specify deadline in seconds for starting the job if it misses scheduled. | int | false |  |  
 suspend | suspend subsequent executions. | bool | false | false |  
 concurrencyPolicy | Specifies how to treat concurrent executions of a Job. | "Allow" or "Forbid" or "Replace" | false | Allow |  
 successfulJobsHistoryLimit | The number of successful finished jobs to retain. | int | false | 3 |  
 failedJobsHistoryLimit | The number of failed finished jobs to retain. | int | false | 1 |  
 count | Specify number of tasks to run in parallel. | int | false | 1 |  
 image | Which image would you like to use for your service. | string | true |  |  
 imagePullPolicy | Specify image pull policy for your service. | "Always" or "Never" or "IfNotPresent" | false |  |  
 imagePullSecrets | Specify image pull secrets for your service. | []string | false |  |  
 restart | Define the job restart policy, the value can only be Never or OnFailure. By default, it's Never. | string | false | Never |  
 cmd | Commands to run in the container. | []string | false |  |  
 env | Define arguments by using environment variables. | [[]env](#env-cron-task) | false |  |  
 cpu | Number of CPU units for the service, like `0.5` (0.5 CPU core), `1` (1 CPU core). | string | false |  |  
 memory | Specifies the attributes of the memory resource required for the container. | string | false |  |  
 volumeMounts |  | [volumeMounts](#volumemounts-cron-task) | false |  |  
 volumes | Deprecated field, use volumeMounts instead. | [[]volumes](#volumes-cron-task) | false |  |  
 hostAliases | An optional list of hosts and IPs that will be injected into the pod's hosts file. | [[]hostAliases](#hostaliases-cron-task) | false |  |  
 ttlSecondsAfterFinished | Limits the lifetime of a Job that has finished. | int | false |  |  
 activeDeadlineSeconds | The duration in seconds relative to the startTime that the job may be continuously active before the system tries to terminate it. | int | false |  |  
 backoffLimit | The number of retries before marking this job failed. | int | false | 6 |  
 livenessProbe | Instructions for assessing whether the container is alive. | [livenessProbe](#livenessprobe-cron-task) | false |  |  
 readinessProbe | Instructions for assessing whether the container is in a suitable state to serve traffic. | [readinessProbe](#readinessprobe-cron-task) | false |  |  


#### env (cron-task)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 name | Environment variable name. | string | true |  |  
 value | The value of the environment variable. | string | false |  |  
 valueFrom | Specifies a source the value of this var should come from. | [valueFrom](#valuefrom-cron-task) | false |  |  


##### valueFrom (cron-task)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 secretKeyRef | Selects a key of a secret in the pod's namespace. | [secretKeyRef](#secretkeyref-cron-task) | false |  |  
 configMapKeyRef | Selects a key of a config map in the pod's namespace. | [configMapKeyRef](#configmapkeyref-cron-task) | false |  |  


##### secretKeyRef (cron-task)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 name | The name of the secret in the pod's namespace to select from. | string | true |  |  
 key | The key of the secret to select from. Must be a valid secret key. | string | true |  |  


##### configMapKeyRef (cron-task)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 name | The name of the config map in the pod's namespace to select from. | string | true |  |  
 key | The key of the config map to select from. Must be a valid secret key. | string | true |  |  


#### volumeMounts (cron-task)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 pvc | Mount PVC type volume. | [[]pvc](#pvc-cron-task) | false |  |  
 configMap | Mount ConfigMap type volume. | [[]configMap](#configmap-cron-task) | false |  |  
 secret | Mount Secret type volume. | [[]secret](#secret-cron-task) | false |  |  
 emptyDir | Mount EmptyDir type volume. | [[]emptyDir](#emptydir-cron-task) | false |  |  
 hostPath | Mount HostPath type volume. | [[]hostPath](#hostpath-cron-task) | false |  |  


##### pvc (cron-task)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 name |  | string | true |  |  
 mountPath |  | string | true |  |  
 subPath |  | string | false |  |  
 claimName | The name of the PVC. | string | true |  |  


##### configMap (cron-task)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 name |  | string | true |  |  
 mountPath |  | string | true |  |  
 subPath |  | string | false |  |  
 defaultMode |  | int | false | 420 |  
 cmName |  | string | true |  |  
 items |  | [[]items](#items-cron-task) | false |  |  


##### items (cron-task)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 key |  | string | true |  |  
 path |  | string | true |  |  
 mode |  | int | false | 511 |  


##### secret (cron-task)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 name |  | string | true |  |  
 mountPath |  | string | true |  |  
 subPath |  | string | false |  |  
 defaultMode |  | int | false | 420 |  
 secretName |  | string | true |  |  
 items |  | [[]items](#items-cron-task) | false |  |  


##### items (cron-task)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 key |  | string | true |  |  
 path |  | string | true |  |  
 mode |  | int | false | 511 |  


##### emptyDir (cron-task)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 name |  | string | true |  |  
 mountPath |  | string | true |  |  
 subPath |  | string | false |  |  
 medium |  | "" or "Memory" | false | empty |  


##### hostPath (cron-task)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 name |  | string | true |  |  
 mountPath |  | string | true |  |  
 subPath |  | string | false |  |  
 path |  | string | true |  |  


#### volumes (cron-task)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 name |  | string | true |  |  
 mountPath |  | string | true |  |  
 type | Specify volume type, options: "pvc","configMap","secret","emptyDir", default to emptyDir. | "emptyDir" or "pvc" or "configMap" or "secret" | false | emptyDir |  
 medium |  | "" or "Memory" | false | empty |  


#### hostAliases (cron-task)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 ip |  | string | true |  |  
 hostnames |  | []string | true |  |  


#### livenessProbe (cron-task)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 exec | Instructions for assessing container health by executing a command. Either this attribute or the httpGet attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the httpGet attribute and the tcpSocket attribute. | [exec](#exec-cron-task) | false |  |  
 httpGet | Instructions for assessing container health by executing an HTTP GET request. Either this attribute or the exec attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the tcpSocket attribute. | [httpGet](#httpget-cron-task) | false |  |  
 tcpSocket | Instructions for assessing container health by probing a TCP socket. Either this attribute or the exec attribute or the httpGet attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the httpGet attribute. | [tcpSocket](#tcpsocket-cron-task) | false |  |  
 initialDelaySeconds | Number of seconds after the container is started before the first probe is initiated. | int | false | 0 |  
 periodSeconds | How often, in seconds, to execute the probe. | int | false | 10 |  
 timeoutSeconds | Number of seconds after which the probe times out. | int | false | 1 |  
 successThreshold | Minimum consecutive successes for the probe to be considered successful after having failed. | int | false | 1 |  
 failureThreshold | Number of consecutive failures required to determine the container is not alive (liveness probe) or not ready (readiness probe). | int | false | 3 |  


##### exec (cron-task)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 command | A command to be executed inside the container to assess its health. Each space delimited token of the command is a separate array element. Commands exiting 0 are considered to be successful probes, whilst all other exit codes are considered failures. | []string | true |  |  


##### httpGet (cron-task)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 path | The endpoint, relative to the port, to which the HTTP GET request should be directed. | string | true |  |  
 port | The TCP socket within the container to which the HTTP GET request should be directed. | int | true |  |  
 httpHeaders |  | [[]httpHeaders](#httpheaders-cron-task) | false |  |  


##### httpHeaders (cron-task)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 name |  | string | true |  |  
 value |  | string | true |  |  


##### tcpSocket (cron-task)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 port | The TCP socket within the container that should be probed to assess container health. | int | true |  |  


#### readinessProbe (cron-task)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 exec | Instructions for assessing container health by executing a command. Either this attribute or the httpGet attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the httpGet attribute and the tcpSocket attribute. | [exec](#exec-cron-task) | false |  |  
 httpGet | Instructions for assessing container health by executing an HTTP GET request. Either this attribute or the exec attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the tcpSocket attribute. | [httpGet](#httpget-cron-task) | false |  |  
 tcpSocket | Instructions for assessing container health by probing a TCP socket. Either this attribute or the exec attribute or the httpGet attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the httpGet attribute. | [tcpSocket](#tcpsocket-cron-task) | false |  |  
 initialDelaySeconds | Number of seconds after the container is started before the first probe is initiated. | int | false | 0 |  
 periodSeconds | How often, in seconds, to execute the probe. | int | false | 10 |  
 timeoutSeconds | Number of seconds after which the probe times out. | int | false | 1 |  
 successThreshold | Minimum consecutive successes for the probe to be considered successful after having failed. | int | false | 1 |  
 failureThreshold | Number of consecutive failures required to determine the container is not alive (liveness probe) or not ready (readiness probe). | int | false | 3 |  


##### exec (cron-task)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 command | A command to be executed inside the container to assess its health. Each space delimited token of the command is a separate array element. Commands exiting 0 are considered to be successful probes, whilst all other exit codes are considered failures. | []string | true |  |  


##### httpGet (cron-task)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 path | The endpoint, relative to the port, to which the HTTP GET request should be directed. | string | true |  |  
 port | The TCP socket within the container to which the HTTP GET request should be directed. | int | true |  |  
 httpHeaders |  | [[]httpHeaders](#httpheaders-cron-task) | false |  |  


##### httpHeaders (cron-task)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 name |  | string | true |  |  
 value |  | string | true |  |  


##### tcpSocket (cron-task)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 port | The TCP socket within the container that should be probed to assess container health. | int | true |  |  


## Daemon

### Description

Describes daemonset services in Kubernetes.

### Underlying Kubernetes Resources (daemon)

- daemonsets.apps

### Examples (daemon)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: addon-node-exporter
  namespace: vela-system
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
```

### Specification (daemon)


 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 labels | Specify the labels in the workload. | map[string]string | false |  |  
 annotations | Specify the annotations in the workload. | map[string]string | false |  |  
 image | Which image would you like to use for your service. | string | true |  |  
 imagePullPolicy | Specify image pull policy for your service. | "Always" or "Never" or "IfNotPresent" | false |  |  
 imagePullSecrets | Specify image pull secrets for your service. | []string | false |  |  
 ports | Which ports do you want customer traffic sent to, defaults to 80. | [[]ports](#ports-daemon) | false |  |  
 cmd | Commands to run in the container. | []string | false |  |  
 env | Define arguments by using environment variables. | [[]env](#env-daemon) | false |  |  
 cpu | Number of CPU units for the service, like `0.5` (0.5 CPU core), `1` (1 CPU core). | string | false |  |  
 memory | Specifies the attributes of the memory resource required for the container. | string | false |  |  
 volumeMounts |  | [volumeMounts](#volumemounts-daemon) | false |  |  
 volumes | Deprecated field, use volumeMounts instead. | [[]volumes](#volumes-daemon) | false |  |  
 livenessProbe | Instructions for assessing whether the container is alive. | [livenessProbe](#livenessprobe-daemon) | false |  |  
 readinessProbe | Instructions for assessing whether the container is in a suitable state to serve traffic. | [readinessProbe](#readinessprobe-daemon) | false |  |  
 hostAliases | Specify the hostAliases to add. | [[]hostAliases](#hostaliases-daemon) | false |  |  


#### ports (daemon)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 port | Number of port to expose on the pod's IP address. | int | true |  |  
 name | Name of the port. | string | false |  |  
 protocol | Protocol for port. Must be UDP, TCP, or SCTP. | "TCP" or "UDP" or "SCTP" | false | TCP |  
 expose | Specify if the port should be exposed. | bool | false | false |  


#### env (daemon)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 name | Environment variable name. | string | true |  |  
 value | The value of the environment variable. | string | false |  |  
 valueFrom | Specifies a source the value of this var should come from. | [valueFrom](#valuefrom-daemon) | false |  |  


##### valueFrom (daemon)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 secretKeyRef | Selects a key of a secret in the pod's namespace. | [secretKeyRef](#secretkeyref-daemon) | false |  |  
 configMapKeyRef | Selects a key of a config map in the pod's namespace. | [configMapKeyRef](#configmapkeyref-daemon) | false |  |  


##### secretKeyRef (daemon)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 name | The name of the secret in the pod's namespace to select from. | string | true |  |  
 key | The key of the secret to select from. Must be a valid secret key. | string | true |  |  


##### configMapKeyRef (daemon)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 name | The name of the config map in the pod's namespace to select from. | string | true |  |  
 key | The key of the config map to select from. Must be a valid secret key. | string | true |  |  


#### volumeMounts (daemon)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 pvc | Mount PVC type volume. | [[]pvc](#pvc-daemon) | false |  |  
 configMap | Mount ConfigMap type volume. | [[]configMap](#configmap-daemon) | false |  |  
 secret | Mount Secret type volume. | [[]secret](#secret-daemon) | false |  |  
 emptyDir | Mount EmptyDir type volume. | [[]emptyDir](#emptydir-daemon) | false |  |  
 hostPath | Mount HostPath type volume. | [[]hostPath](#hostpath-daemon) | false |  |  


##### pvc (daemon)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 name |  | string | true |  |  
 mountPath |  | string | true |  |  
 claimName | The name of the PVC. | string | true |  |  


##### configMap (daemon)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 name |  | string | true |  |  
 mountPath |  | string | true |  |  
 defaultMode |  | int | false | 420 |  
 cmName |  | string | true |  |  
 items |  | [[]items](#items-daemon) | false |  |  


##### items (daemon)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 key |  | string | true |  |  
 path |  | string | true |  |  
 mode |  | int | false | 511 |  


##### secret (daemon)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 name |  | string | true |  |  
 mountPath |  | string | true |  |  
 defaultMode |  | int | false | 420 |  
 secretName |  | string | true |  |  
 items |  | [[]items](#items-daemon) | false |  |  


##### items (daemon)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 key |  | string | true |  |  
 path |  | string | true |  |  
 mode |  | int | false | 511 |  


##### emptyDir (daemon)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 name |  | string | true |  |  
 mountPath |  | string | true |  |  
 medium |  | "" or "Memory" | false | empty |  


##### hostPath (daemon)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 name |  | string | true |  |  
 mountPath |  | string | true |  |  
 mountPropagation |  | "None" or "HostToContainer" or "Bidirectional" | false |  |  
 path |  | string | true |  |  
 readOnly |  | bool | false |  |  


#### volumes (daemon)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 name |  | string | true |  |  
 mountPath |  | string | true |  |  
 type | Specify volume type, options: "pvc","configMap","secret","emptyDir", default to emptyDir. | "emptyDir" or "pvc" or "configMap" or "secret" | false | emptyDir |  
 medium |  | "" or "Memory" | false | empty |  


#### livenessProbe (daemon)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 exec | Instructions for assessing container health by executing a command. Either this attribute or the httpGet attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the httpGet attribute and the tcpSocket attribute. | [exec](#exec-daemon) | false |  |  
 httpGet | Instructions for assessing container health by executing an HTTP GET request. Either this attribute or the exec attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the tcpSocket attribute. | [httpGet](#httpget-daemon) | false |  |  
 tcpSocket | Instructions for assessing container health by probing a TCP socket. Either this attribute or the exec attribute or the httpGet attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the httpGet attribute. | [tcpSocket](#tcpsocket-daemon) | false |  |  
 initialDelaySeconds | Number of seconds after the container is started before the first probe is initiated. | int | false | 0 |  
 periodSeconds | How often, in seconds, to execute the probe. | int | false | 10 |  
 timeoutSeconds | Number of seconds after which the probe times out. | int | false | 1 |  
 successThreshold | Minimum consecutive successes for the probe to be considered successful after having failed. | int | false | 1 |  
 failureThreshold | Number of consecutive failures required to determine the container is not alive (liveness probe) or not ready (readiness probe). | int | false | 3 |  


##### exec (daemon)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 command | A command to be executed inside the container to assess its health. Each space delimited token of the command is a separate array element. Commands exiting 0 are considered to be successful probes, whilst all other exit codes are considered failures. | []string | true |  |  


##### httpGet (daemon)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 path | The endpoint, relative to the port, to which the HTTP GET request should be directed. | string | true |  |  
 port | The TCP socket within the container to which the HTTP GET request should be directed. | int | true |  |  
 host |  | string | false |  |  
 scheme |  | string | false | HTTP |  
 httpHeaders |  | [[]httpHeaders](#httpheaders-daemon) | false |  |  


##### httpHeaders (daemon)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 name |  | string | true |  |  
 value |  | string | true |  |  


##### tcpSocket (daemon)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 port | The TCP socket within the container that should be probed to assess container health. | int | true |  |  


#### readinessProbe (daemon)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 exec | Instructions for assessing container health by executing a command. Either this attribute or the httpGet attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the httpGet attribute and the tcpSocket attribute. | [exec](#exec-daemon) | false |  |  
 httpGet | Instructions for assessing container health by executing an HTTP GET request. Either this attribute or the exec attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the tcpSocket attribute. | [httpGet](#httpget-daemon) | false |  |  
 tcpSocket | Instructions for assessing container health by probing a TCP socket. Either this attribute or the exec attribute or the httpGet attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the httpGet attribute. | [tcpSocket](#tcpsocket-daemon) | false |  |  
 initialDelaySeconds | Number of seconds after the container is started before the first probe is initiated. | int | false | 0 |  
 periodSeconds | How often, in seconds, to execute the probe. | int | false | 10 |  
 timeoutSeconds | Number of seconds after which the probe times out. | int | false | 1 |  
 successThreshold | Minimum consecutive successes for the probe to be considered successful after having failed. | int | false | 1 |  
 failureThreshold | Number of consecutive failures required to determine the container is not alive (liveness probe) or not ready (readiness probe). | int | false | 3 |  


##### exec (daemon)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 command | A command to be executed inside the container to assess its health. Each space delimited token of the command is a separate array element. Commands exiting 0 are considered to be successful probes, whilst all other exit codes are considered failures. | []string | true |  |  


##### httpGet (daemon)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 path | The endpoint, relative to the port, to which the HTTP GET request should be directed. | string | true |  |  
 port | The TCP socket within the container to which the HTTP GET request should be directed. | int | true |  |  
 host |  | string | false |  |  
 scheme |  | string | false | HTTP |  
 httpHeaders |  | [[]httpHeaders](#httpheaders-daemon) | false |  |  


##### httpHeaders (daemon)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 name |  | string | true |  |  
 value |  | string | true |  |  


##### tcpSocket (daemon)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 port | The TCP socket within the container that should be probed to assess container health. | int | true |  |  


#### hostAliases (daemon)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 ip |  | string | true |  |  
 hostnames |  | []string | true |  |  


## Helmchart

> **Note:** `pre-delete` and `post-delete` Helm hooks do not execute. KubeVela's GC deletes resources directly via the Kubernetes API and never calls `helm uninstall`, so delete-phase hooks are bypassed entirely. Install and upgrade hooks (`pre-install`, `post-install`, `pre-upgrade`, `post-upgrade`) work correctly.

### Description

Render and deploy Helm charts directly using the Helm Go SDK, without requiring the FluxCD addon. Charts can be sourced from HTTP(S) repositories, OCI registries, or direct `.tgz` URLs, and integrate with KubeVela's standard features including multi-cluster placement, workflow steps, and Application revision tracking.

### Examples (helmchart)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: sample-helmchart
spec:
  components:
    - name: my-chart
      type: helmchart
      properties:
        chart:
          source: oci://ghcr.io/org/charts/app
          version: "1.0.0"
```

After the Application is reconciled you will see a ConfigMap named `{releaseName}-helm-release` in the release namespace. KubeVela creates this as its stable primary output to track release metadata. It is managed by the controller and should not be edited or deleted manually.

Merge values from a ConfigMap and a Secret, with inline values taking precedence over both:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: podinfo-base
  namespace: default
data:
  values.yaml: |
    replicaCount: 3
    resources:
      limits:
        cpu: 100m
        memory: 256Mi
---
apiVersion: v1
kind: Secret
metadata:
  name: podinfo-overrides
  namespace: default
stringData:
  values.yaml: |
    resources:
      limits:
        memory: 512Mi
---
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: podinfo-layered
spec:
  components:
    - name: podinfo
      type: helmchart
      properties:
        chart:
          source: podinfo
          repoURL: https://stefanprodan.github.io/podinfo
          version: "6.11.1"
        release:
          name: podinfo
          namespace: default
        values:
          # Inline values win over everything in valuesFrom.
          replicaCount: 5
        valuesFrom:
          - kind: ConfigMap
            name: podinfo-base
          - kind: Secret
            name: podinfo-overrides
            # key defaults to "values.yaml"; optional defaults to false.
        options:
          createNamespace: true
          skipTests: true
```

The rendered chart sees `replicaCount: 5` (from inline), `resources.limits.memory: 512Mi` (Secret overlay wins over the ConfigMap on the conflict), and `resources.limits.cpu: 100m` (preserved from the ConfigMap; the Secret didn't touch it).

#### Authenticating with private chart registries

Add `chart.auth.secretRef` to point at a Secret in the Application's namespace. You can leave out `secretRef.namespace`. If you set it, it must be the Application's namespace. Any other namespace is refused, the release namespace included, so an Application can't read a shared Secret from `vela-system`. The refusal looks like this:

```text
auth secret reference "<ns>/<name>" rejected: namespace MUST be in the Application namespace "<app-ns>" (the release namespace "<release-ns>" is not a source)
```

Chart and `oci://` pulls go through the same outbound HTTP guard as workflow steps. A registry on a loopback or link-local address is refused. A private address is refused too when `featureGates.blockPrivateHTTPAddresses` is on. The Secret type controls how credentials are extracted:

| Secret type | Keys read | Use case |
|---|---|---|
| `kubernetes.io/basic-auth` | `username`, `password` | HTTPS Helm repo, OCI registry |
| `kubernetes.io/dockerconfigjson` | `.dockerconfigjson` | OCI registry (Docker-format config) |
| `Opaque` with `username`/`password` | `username`, `password` | HTTPS Helm repo, OCI registry |
| `Opaque` with `token` | `token` | Bearer token auth (Nexus, Artifactory) |

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: registry-creds
  namespace: default
type: kubernetes.io/basic-auth
stringData:
  username: my-username
  password: my-password-or-token
---
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: private-chart
  namespace: default
spec:
  components:
    - name: my-app
      type: helmchart
      properties:
        chart:
          source: oci://ghcr.io/my-org/charts/my-app
          version: "1.0.0"
          auth:
            secretRef:
              name: registry-creds
        release:
          name: my-app
          namespace: my-app
```

The Secret is in the Application's namespace, `default`, so `secretRef.namespace` can be left out. The release goes to `my-app`, but the Secret stays with the Application. The same `auth` block works for HTTPS repos (`source` + `repoURL`) and direct `.tgz` URLs. When you rotate the Secret, the cache key updates and the next reconcile pulls a fresh copy of the chart.

#### Multicluster

When the Application has a [topology policy](../policies/references.md#topology), KubeVela installs the Helm release on each selected target cluster. The hub cluster is skipped unless it is one of the targets (for example `clusters: ["local"]`). It reaches the managed cluster through cluster-gateway, as it does for the Application's other resources.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: podinfo-on-worker
spec:
  components:
    - name: podinfo
      type: helmchart
      properties:
        chart:
          source: podinfo
          repoURL: https://stefanprodan.github.io/podinfo
          version: "6.7.1"
        release:
          name: podinfo
          namespace: podinfo
  policies:
    - name: topology-worker
      type: topology
      properties:
        clusters: ["cluster-worker"]
```

- **Release location.** `helm list -n podinfo` on the managed cluster shows the release. The hub cluster has no release for the component.
- **Hooks.** A chart hook that sets no namespace goes to the release namespace.
- **What stays on the hub cluster.** KubeVela reads `valuesFrom` sources and chart credentials (`chart.auth.secretRef`) on the hub cluster, not on the managed cluster. Create those ConfigMaps and Secrets on the hub cluster, in the Application's namespace.
- **Permissions.** The install runs as an identity, and that identity needs RBAC for every resource in the chart. This includes creating the release namespace, unless you set `options.createNamespace` to `false`. The identity depends on the `AuthenticateApplication` feature gate:
  - **Gate off (the default).** The install uses the controller's own permissions. If the Application sets `app.oam.dev/service-account-name`, it installs as that ServiceAccount instead.
  - **Gate on** (`authentication.enabled: true` in the chart). If `authentication.withUser` is false (flag `--authentication-with-user`), the install always uses `authentication.defaultUser` (flag `--authentication-default-user`). If it is true, the install uses the Application's user, else the ServiceAccount from the annotation, else `defaultUser`. The chart sets `withUser` to `true` by default. The bare flag defaults to `false`.

  The Application's groups (`app.oam.dev/group`) are impersonated in both cases, so you can grant RBAC to a group. Grant these rights on every cluster the topology places the component on, because the install impersonates on the managed cluster as well. See [Underlying Mechanism](../../platform-engineers/auth/advance.md) for the identity settings.

:::note
In KubeVela v1.11 and earlier, a `helmchart` component with a topology policy installed its release on the hub cluster, and only the chart's resources reached the managed cluster. On the first successful workflow run after the upgrade, KubeVela installs the release on the managed cluster and uninstalls the copy on the hub. An Application you don't edit keeps its hub copy until its next run. To move it now, run `vela workflow restart <app> -n <namespace>`. The uninstall runs as the same identity as the install (see Permissions above), so that identity needs rights to delete the chart's resources on the hub.
:::

### Specification (helmchart)


 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 chart | Chart source configuration | [chart](#chart-helmchart) | true |  
 release | Release configuration (optional - uses context defaults) | [release](#release-helmchart) | false |  
 values | Inline values merged with the highest priority; override everything in valuesFrom. | map[string]interface{} | false |  
 valuesFrom | Additional values sources merged in array order. Later entries override earlier ones on conflict, and inline `values` override everything in valuesFrom. Deep-merges map keys; arrays are replaced (not concatenated); null is preserved. On every reconcile the controller computes a content fingerprint over all referenced sources; an external edit to a referenced ConfigMap or Secret triggers a `helm upgrade` automatically on the next reconcile (default resync ~5 min). Sources are read from the control-plane cluster regardless of where the chart is deployed. | [[]valuesFrom](#valuesfrom-helmchart) | false |  
 healthStatus | Criteria for declaring the component healthy. Each entry names a resource kind and a condition to check. When all entries pass, the workflow step is marked complete. If omitted, KubeVela uses its default readiness heuristic. | [[]healthStatus](#healthstatus-helmchart) | false |  
 options | Rendering options | [options](#options-helmchart) | false |  


#### chart (helmchart)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 source | Chart location - automatically detected based on format (OCI, Direct URL, Repo chart) | string | true |  
 repoURL | Repository URL for repository-based charts | string | false |  
 version | Version/tag for repository and OCI charts (ignored for direct URLs) | string | false | "latest" 
 auth | Credentials for private chart sources | [auth](#auth-helmchart) | false |  


#### auth (helmchart)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 secretRef | Reference to the Secret holding credentials | [secretRef](#secretref-helmchart) | true |  


#### secretRef (helmchart)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name | Name of the Secret | string | true |  
 namespace | Namespace of the Secret. Defaults to the Application's namespace, which is the only namespace allowed. Any other namespace, the release namespace included, is rejected. | string | false |  

Supported Secret types:

| Secret type | Credentials read | Use case |
|---|---|---|
| `kubernetes.io/basic-auth` | `username` + `password` keys | HTTPS Helm repo, OCI registry username/password |
| `kubernetes.io/dockerconfigjson` | `.dockerconfigjson` key (standard Docker config) | OCI registry with Docker-format credentials |
| `kubernetes.io/tls` | `tls.crt`, `tls.key`, optional `ca.crt` | Mutual TLS client authentication |
| `Opaque` with `username`/`password` | `username` + `password` keys | HTTPS Helm repo, OCI registry |
| `Opaque` with `token` | `token` key | Bearer token auth (HTTPS Helm repos and direct `.tgz` URLs only; see note below) |

An `Opaque` Secret can also include these optional TLS fields: `caFile` (custom CA bundle), `certFile` + `keyFile` (client certificate), `insecureSkipTLS` (skip server certificate verification), and `insecurePlainHTTP` (OCI sources only; use plain HTTP instead of HTTPS).

> **Note on Bearer tokens:** Bearer tokens work on HTTPS Helm repositories and direct `.tgz` URLs only. They must not be used with OCI registries (OCI performs its own Basic-to-Bearer exchange per the Distribution Spec). They must not be combined with `insecureSkipTLS` (RFC 6750 requires TLS) and must not appear alongside `username`/`password` keys in the same Secret.


#### valuesFrom (helmchart)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 kind | Source kind. Only `Secret` and `ConfigMap` are supported. `OCIRepository` is not yet supported. | "Secret" or "ConfigMap" | true |  
 name | Name of the Secret or ConfigMap. | string | true |  
 namespace | Namespace of the Secret or ConfigMap. Defaults to the Application's namespace, which is the only namespace allowed. Any other namespace, the release namespace included, is rejected, so one tenant can't read another's data through the controller's cluster-wide RBAC. | string | false |  
 key | Key inside `.data` whose value is parsed as YAML. Only `.data` is read; `ConfigMap.binaryData` is rejected. | string | false | "values.yaml" 
 optional | If true, a missing Secret/ConfigMap or missing key is skipped silently. Parse errors and permission errors still fail the render. | bool | false | false 


#### release (helmchart)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 name | Release name (defaults to component name) | string | false |  
 namespace | Target namespace. Defaults to the component's namespace: the Application's namespace, or the topology policy's `namespace` when one is set. | string | false |  

**Release ownership.** A Helm release belongs to the Application that installed it. KubeVela won't take over a release that another Application owns. Two Applications with a component of the same name in one namespace will hit this, and the install fails with:

```text
helm release <ns>/<name> belongs to Application <ns>/<app> (component <c>); set release.name to give this component its own release
```

Set `release.name` on one of the components to give it a separate release. If the owning Application no longer exists, KubeVela adopts the release.

#### healthStatus (helmchart)

Each entry in the `healthStatus` array names one Kubernetes resource and the condition that must be `True` for that resource to be considered healthy. All entries must pass for the component to be marked healthy. If omitted, the component is considered healthy immediately after dispatch.

Only use resource kinds that expose `.status.conditions` (Deployment, StatefulSet, Job, Pod, Node, and most CRD-based resources). Resources that do not expose conditions such as Service or ConfigMap will always evaluate to unhealthy.

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 resource | Resource to check | [resource](#resource-helmchart) | true |  
 condition | Condition to evaluate | [condition](#condition-helmchart) | true |  


##### resource (helmchart)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 kind | Kubernetes resource kind (e.g. `Deployment`, `StatefulSet`) | string | true |  
 name | Resource name. If omitted, any resource of the matching kind satisfies the check. | string | false |  


##### condition (helmchart)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 type | Condition type to check. Accepts any Kubernetes condition string. Common values: `Available` and `Progressing` for Deployments; `Available` for StatefulSets; `Ready` for Pods; `Complete` or `Failed` for Jobs. | string | true |  
 status | Expected condition status. Use `"False"` for conditions like `Progressing` where the healthy state is `False`. | "True" or "False" | false | "True" 


#### options (helmchart)

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 includeCRDs | Install CRDs from the chart's `crds/` directory. Set to `false` to skip CRD installation on both install and upgrade. | bool | false | true 
 skipTests | Skip test resources | bool | false | true 
 skipHooks | Skip hook resources | bool | false | false 
 createNamespace | Create namespace if it doesn't exist | bool | false | true 
 timeout | Rendering and wait timeout (Helm SDK uses one value for both) | string | false | "5m" 
 maxHistory | Revisions to keep (upgrade-only; ignored on first install). | int | false | 10 
 atomic | Rollback on failure | bool | false | false 
 wait | Wait for resources to become ready before marking the workflow step complete. See the note below on single-replica deployments. | bool | false | false 
 force | Force resource updates | bool | false | false 
 recreatePods | Recreate pods (upgrade-only; ignored on first install). | bool | false | false 
 cleanupOnFail | Cleanup on failure (upgrade-only; ignored on first install). | bool | false | false 
 cache | Chart cache tuning | [cache](#cache-helmchart) | false |  

> **Note on `wait` and `atomic` with single-replica deployments.** The Helm SDK's readiness probe for a Deployment checks `status.readyReplicas >= spec.replicas - maxUnavailable`. When a chart pins `strategy.rollingUpdate.maxUnavailable: 1` (common for staging/dev defaults) and `replicas: 1`, the right-hand side resolves to `0` and the probe is trivially satisfied even when the pod is broken. Consequence: `wait: true` returns immediately, and `atomic: true` never triggers a rollback on broken pods. The arithmetic only kicks in once `replicas > maxUnavailable`. For single-replica workloads where you actually want the wait/atomic safety net, either raise `replicas` to at least 2, lower `maxUnavailable` to `0`, or use a KubeVela `healthStatus` policy (see [healthStatus (helmchart)](#healthstatus-helmchart)) to gate the workflow step on a specific resource condition.


#### cache (helmchart)

The chart cache is in-memory and scoped to the vela-core controller pod. It resets on controller restart. By default each Application component gets its own cache namespace; set `key` to share a cache entry across components that use the same chart.

 Name | Description | Type | Required | Default 
 ---- | ----------- | ---- | -------- | ------- 
 key | Cache key prefix. Defaults to `{appName}-{componentName}`. Set a shared value to reuse a cached chart across multiple components. | string | false |  
 ttl | TTL for all versions, overriding the automatic immutable/mutable detection. Set to `"0"` to disable caching entirely. | string | false |  
 immutableTTL | TTL for pinned (immutable) versions such as `1.2.3` or `v2.0.0`. Falls back to the cluster-wide `immutableTTL` (`24h` by default). | string | false |  
 mutableTTL | TTL for floating versions such as `latest`, `dev`, or `-SNAPSHOT`. Falls back to the cluster-wide `mutableTTL` (`5m` by default). | string | false |  


#### Cluster-wide cache

The component-level `options.cache` settings apply to one component. An operator can also set cache defaults for the whole cluster. Set them as vela-core chart values, or pass the matching flags to the controller. A value of `0` selects the built-in default.

| vela-core chart value | Controller flag | Default | Description |
|---|---|---|---|
| `helmCache.maxBytes` | `--helm-cache-max-bytes` | `268435456` (256MiB) | Maximum size of the chart cache. When the cache is full, KubeVela evicts the least recently used charts. Lower it on controllers with little memory. |
| `helmCache.sweepInterval` | `--helm-cache-sweep-interval` | `60s` | How often the cache removes expired entries. A very small interval increases lock contention. |
| `helmCache.immutableTTL` | `--helm-cache-immutable-ttl` | `24h` | Default TTL for pinned (immutable) chart versions. |
| `helmCache.mutableTTL` | `--helm-cache-mutable-ttl` | `5m` | Default TTL for floating (mutable) chart tags. |

The component's `options.cache` values override the cluster-wide TTLs. The cluster-wide `immutableTTL` and `mutableTTL` apply only to components that do not set their own.

```shell
helm upgrade kubevela kubevela/vela-core -n vela-system --reuse-values \
  --set helmCache.maxBytes=134217728 \
  --set helmCache.mutableTTL=1m
```

#### Cache metrics

The controller exposes these Prometheus metrics for the chart cache:

| Metric | Type | Description |
|---|---|---|
| `kubevela_helm_chart_cache_hits_total` | Counter | Chart fetches served from the cache. |
| `kubevela_helm_chart_cache_misses_total` | Counter | Chart fetches that missed the cache. The `reason` label is `absent`, `expired`, `evicted` or `corrupt`. |
| `kubevela_helm_chart_cache_evictions_total` | Counter | Entries removed from the cache. The `reason` label is `capacity`, `ttl`, `delete`, `replace`, `purge` or `unknown`. |
| `kubevela_helm_chart_cache_bytes` | Gauge | Bytes now stored in the cache. |

A value of `kubevela_helm_chart_cache_bytes` that stays near `helmCache.maxBytes`, together with a rising count of `capacity` evictions, means the charts in use are larger than the cache. Raise `helmCache.maxBytes`.


### Known limitations (helmchart)

**Delete hooks do not fire**

`pre-delete` and `post-delete` Helm hooks are never executed. KubeVela's GC deletes resources individually via the Kubernetes API without calling `helm uninstall`. Charts that rely on cleanup Jobs (database migrations, deregistration webhooks) will not run them on Application deletion. As a workaround, run those Jobs manually before deleting the Application.

**CRDs from the `crds/` directory are not cleaned up on deletion**

Helm never deletes CRDs installed from a chart's `crds/` directory. This is Helm's own design to prevent data loss. When you delete a helmchart Application, any CRDs that came from the `crds/` directory are left behind and must be cleaned up manually. CRDs that a chart ships as regular template resources are tracked by KubeVela and deleted with the Application.

**Chart cache is in-memory only**

The chart cache lives in the vela-core controller pod's memory. A controller restart clears it, causing the next reconcile for each component to re-fetch its chart. This produces a short burst of chart downloads after a controller upgrade or pod eviction.


## K8s-Objects

### Description

K8s-objects allow users to specify raw K8s objects in properties.

### Examples (k8s-objects)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: app-raw
spec:
  components:
    - name: myjob
      type: k8s-objects
      properties:
        objects:
        - apiVersion: batch/v1
          kind: Job
          metadata:
            name: pi
          spec:
            template:
              spec:
                containers:
                - name: pi
                  image: perl
                  command: ["perl",  "-Mbignum=bpi", "-wle", "print bpi(2000)"]
                restartPolicy: Never
            backoffLimit: 4
```

### Specification (k8s-objects)
|  NAME   | DESCRIPTION  |        TYPE          | REQUIRED | DEFAULT |
|---------|-------------|-----------------------|----------|---------|
| objects | A slice of Kubernetes resource manifests   | [][Kubernetes-Objects](https://kubernetes.io/docs/concepts/overview/working-with-objects/kubernetes-objects/) | true     |         |

## Statefulset

### Description

Describes long-running, scalable, containerized services used to manage stateful application, like database.

### Underlying Kubernetes Resources (statefulset)

- statefulsets.apps

### Examples (statefulset)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: postgres
spec:
  components:
    - name: postgres
      type: statefulset
      properties:
        cpu: "1"
        exposeType: ClusterIP
        # see https://hub.docker.com/_/postgres
        image: docker.io/library/postgres:16.4
        memory: 2Gi
        ports:
          - expose: true
            port: 5432
            protocol: TCP
        env:
        - name: POSTGRES_DB
          value: mydb
        - name: POSTGRES_USER
          value: postgres
        - name: POSTGRES_PASSWORD
          value: kvsecretpwd123
      traits:
        - type: scaler
          properties:
            replicas: 1
        - type: storage
          properties:
            pvc:
              - name: "postgresdb-pvc"
                storageClassName: local-path
                resources:
                  requests:
                    storage: "2Gi"
                mountPath: "/var/lib/postgresql/data"
```

### Specification (statefulset)


 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 labels | Specify the labels in the workload. | map[string]string | false |  |  
 annotations | Specify the annotations in the workload. | map[string]string | false |  |  
 image | Which image would you like to use for your service. | string | true |  |  
 imagePullPolicy | Specify image pull policy for your service. | "Always" or "Never" or "IfNotPresent" | false |  |  
 imagePullSecrets | Specify image pull secrets for your service. | []string | false |  |  
 ports | Which ports do you want customer traffic sent to, defaults to 80. | [[]ports](#ports-statefulset) | false |  |  
 cmd | Commands to run in the container. | []string | false |  |  
 args | Arguments to the entrypoint. | []string | false |  |  
 env | Define arguments by using environment variables. | [[]env](#env-statefulset) | false |  |  
 cpu | Number of CPU units for the service, like `0.5` (0.5 CPU core), `1` (1 CPU core). | string | false |  |  
 memory | Specifies the attributes of the memory resource required for the container. | string | false |  |  
 volumeMounts |  | [volumeMounts](#volumemounts-statefulset) | false |  |  
 volumes | Deprecated field, use volumeMounts instead. | [[]volumes](#volumes-statefulset) | false |  |  
 livenessProbe | Instructions for assessing whether the container is alive. | [livenessProbe](#livenessprobe-statefulset) | false |  |  
 readinessProbe | Instructions for assessing whether the container is in a suitable state to serve traffic. | [readinessProbe](#readinessprobe-statefulset) | false |  |  
 hostAliases | Specify the hostAliases to add. | [[]hostAliases](#hostaliases-statefulset) | false |  |  


#### ports (statefulset)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 port | Number of port to expose on the pod's IP address. | int | true |  |  
 containerPort | Number of container port to connect to, defaults to port. | int | false |  |  
 name | Name of the port. | string | false |  |  
 protocol | Protocol for port. Must be UDP, TCP, or SCTP. | "TCP" or "UDP" or "SCTP" | false | TCP |  
 expose | Specify if the port should be exposed. | bool | false | false |  
 nodePort | exposed node port. Only Valid when exposeType is NodePort. | int | false |  |  


#### env (statefulset)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 name | Environment variable name. | string | true |  |  
 value | The value of the environment variable. | string | false |  |  
 valueFrom | Specifies a source the value of this var should come from. | [valueFrom](#valuefrom-statefulset) | false |  |  


##### valueFrom (statefulset)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 secretKeyRef | Selects a key of a secret in the pod's namespace. | [secretKeyRef](#secretkeyref-statefulset) | false |  |  
 configMapKeyRef | Selects a key of a config map in the pod's namespace. | [configMapKeyRef](#configmapkeyref-statefulset) | false |  |  


##### secretKeyRef (statefulset)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 name | The name of the secret in the pod's namespace to select from. | string | true |  |  
 key | The key of the secret to select from. Must be a valid secret key. | string | true |  |  


##### configMapKeyRef (statefulset)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 name | The name of the config map in the pod's namespace to select from. | string | true |  |  
 key | The key of the config map to select from. Must be a valid secret key. | string | true |  |  


#### volumeMounts (statefulset)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 pvc | Mount PVC type volume. | [[]pvc](#pvc-statefulset) | false |  |  
 configMap | Mount ConfigMap type volume. | [[]configMap](#configmap-statefulset) | false |  |  
 secret | Mount Secret type volume. | [[]secret](#secret-statefulset) | false |  |  
 emptyDir | Mount EmptyDir type volume. | [[]emptyDir](#emptydir-statefulset) | false |  |  
 hostPath | Mount HostPath type volume. | [[]hostPath](#hostpath-statefulset) | false |  |  


##### pvc (statefulset)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 name |  | string | true |  |  
 mountPath |  | string | true |  |  
 subPath |  | string | false |  |  
 claimName | The name of the PVC. | string | true |  |  


##### configMap (statefulset)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 name |  | string | true |  |  
 mountPath |  | string | true |  |  
 subPath |  | string | false |  |  
 defaultMode |  | int | false | 420 |  
 cmName |  | string | true |  |  
 items |  | [[]items](#items-statefulset) | false |  |  


##### items (statefulset)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 key |  | string | true |  |  
 path |  | string | true |  |  
 mode |  | int | false | 511 |  


##### secret (statefulset)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 name |  | string | true |  |  
 mountPath |  | string | true |  |  
 subPath |  | string | false |  |  
 defaultMode |  | int | false | 420 |  
 secretName |  | string | true |  |  
 items |  | [[]items](#items-statefulset) | false |  |  


##### items (statefulset)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 key |  | string | true |  |  
 path |  | string | true |  |  
 mode |  | int | false | 511 |  


##### emptyDir (statefulset)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 name |  | string | true |  |  
 mountPath |  | string | true |  |  
 subPath |  | string | false |  |  
 medium |  | "" or "Memory" | false | empty |  


##### hostPath (statefulset)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 name |  | string | true |  |  
 mountPath |  | string | true |  |  
 subPath |  | string | false |  |  
 path |  | string | true |  |  


#### volumes (statefulset)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 name |  | string | true |  |  
 mountPath |  | string | true |  |  
 type | Specify volume type, options: "pvc","configMap","secret","emptyDir", default to emptyDir. | "emptyDir" or "pvc" or "configMap" or "secret" | false | emptyDir |  
 medium |  | "" or "Memory" | false | empty |  


#### livenessProbe (statefulset)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 exec | Instructions for assessing container health by executing a command. Either this attribute or the httpGet attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the httpGet attribute and the tcpSocket attribute. | [exec](#exec-statefulset) | false |  |  
 httpGet | Instructions for assessing container health by executing an HTTP GET request. Either this attribute or the exec attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the tcpSocket attribute. | [httpGet](#httpget-statefulset) | false |  |  
 tcpSocket | Instructions for assessing container health by probing a TCP socket. Either this attribute or the exec attribute or the httpGet attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the httpGet attribute. | [tcpSocket](#tcpsocket-statefulset) | false |  |  
 initialDelaySeconds | Number of seconds after the container is started before the first probe is initiated. | int | false | 0 |  
 periodSeconds | How often, in seconds, to execute the probe. | int | false | 10 |  
 timeoutSeconds | Number of seconds after which the probe times out. | int | false | 1 |  
 successThreshold | Minimum consecutive successes for the probe to be considered successful after having failed. | int | false | 1 |  
 failureThreshold | Number of consecutive failures required to determine the container is not alive (liveness probe) or not ready (readiness probe). | int | false | 3 |  


##### exec (statefulset)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 command | A command to be executed inside the container to assess its health. Each space delimited token of the command is a separate array element. Commands exiting 0 are considered to be successful probes, whilst all other exit codes are considered failures. | []string | true |  |  


##### httpGet (statefulset)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 path | The endpoint, relative to the port, to which the HTTP GET request should be directed. | string | true |  |  
 port | The TCP socket within the container to which the HTTP GET request should be directed. | int | true |  |  
 host |  | string | false |  |  
 scheme |  | string | false | HTTP |  
 httpHeaders |  | [[]httpHeaders](#httpheaders-statefulset) | false |  |  


##### httpHeaders (statefulset)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 name |  | string | true |  |  
 value |  | string | true |  |  


##### tcpSocket (statefulset)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 port | The TCP socket within the container that should be probed to assess container health. | int | true |  |  


#### readinessProbe (statefulset)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 exec | Instructions for assessing container health by executing a command. Either this attribute or the httpGet attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the httpGet attribute and the tcpSocket attribute. | [exec](#exec-statefulset) | false |  |  
 httpGet | Instructions for assessing container health by executing an HTTP GET request. Either this attribute or the exec attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the tcpSocket attribute. | [httpGet](#httpget-statefulset) | false |  |  
 tcpSocket | Instructions for assessing container health by probing a TCP socket. Either this attribute or the exec attribute or the httpGet attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the httpGet attribute. | [tcpSocket](#tcpsocket-statefulset) | false |  |  
 initialDelaySeconds | Number of seconds after the container is started before the first probe is initiated. | int | false | 0 |  
 periodSeconds | How often, in seconds, to execute the probe. | int | false | 10 |  
 timeoutSeconds | Number of seconds after which the probe times out. | int | false | 1 |  
 successThreshold | Minimum consecutive successes for the probe to be considered successful after having failed. | int | false | 1 |  
 failureThreshold | Number of consecutive failures required to determine the container is not alive (liveness probe) or not ready (readiness probe). | int | false | 3 |  


##### exec (statefulset)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 command | A command to be executed inside the container to assess its health. Each space delimited token of the command is a separate array element. Commands exiting 0 are considered to be successful probes, whilst all other exit codes are considered failures. | []string | true |  |  


##### httpGet (statefulset)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 path | The endpoint, relative to the port, to which the HTTP GET request should be directed. | string | true |  |  
 port | The TCP socket within the container to which the HTTP GET request should be directed. | int | true |  |  
 host |  | string | false |  |  
 scheme |  | string | false | HTTP |  
 httpHeaders |  | [[]httpHeaders](#httpheaders-statefulset) | false |  |  


##### httpHeaders (statefulset)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 name |  | string | true |  |  
 value |  | string | true |  |  


##### tcpSocket (statefulset)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 port | The TCP socket within the container that should be probed to assess container health. | int | true |  |  


#### hostAliases (statefulset)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 ip |  | string | true |  |  
 hostnames |  | []string | true |  |  


## Task

### Description

Describes jobs that run code or a script to completion.

### Underlying Kubernetes Resources (task)

- jobs.batch

### Examples (task)

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: app-worker
spec:
  components:
    - name: mytask
      type: task
      properties:
        image: perl
	    count: 10
	    cmd: ["perl",  "-Mbignum=bpi", "-wle", "print bpi(2000)"]
```

### Specification (task)


 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 labels | Specify the labels in the workload. | map[string]string | false |  |  
 annotations | Specify the annotations in the workload. | map[string]string | false |  |  
 count | Specify number of tasks to run in parallel. | int | false | 1 |  
 image | Which image would you like to use for your service. | string | true |  |  
 imagePullPolicy | Specify image pull policy for your service. | "Always" or "Never" or "IfNotPresent" | false |  |  
 imagePullSecrets | Specify image pull secrets for your service. | []string | false |  |  
 restart | Define the job restart policy, the value can only be Never or OnFailure. By default, it's Never. | string | false | Never |  
 cmd | Commands to run in the container. | []string | false |  |  
 env | Define arguments by using environment variables. | [[]env](#env-task) | false |  |  
 cpu | Number of CPU units for the service, like `0.5` (0.5 CPU core), `1` (1 CPU core). | string | false |  |  
 memory | Specifies the attributes of the memory resource required for the container. | string | false |  |  
 volumes | Declare volumes and volumeMounts. | [[]volumes](#volumes-task) | false |  |  
 livenessProbe | Instructions for assessing whether the container is alive. | [livenessProbe](#livenessprobe-task) | false |  |  
 readinessProbe | Instructions for assessing whether the container is in a suitable state to serve traffic. | [readinessProbe](#readinessprobe-task) | false |  |  


#### env (task)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 name | Environment variable name. | string | true |  |  
 value | The value of the environment variable. | string | false |  |  
 valueFrom | Specifies a source the value of this var should come from. | [valueFrom](#valuefrom-task) | false |  |  


##### valueFrom (task)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 secretKeyRef | Selects a key of a secret in the pod's namespace. | [secretKeyRef](#secretkeyref-task) | false |  |  
 configMapKeyRef | Selects a key of a config map in the pod's namespace. | [configMapKeyRef](#configmapkeyref-task) | false |  |  


##### secretKeyRef (task)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 name | The name of the secret in the pod's namespace to select from. | string | true |  |  
 key | The key of the secret to select from. Must be a valid secret key. | string | true |  |  


##### configMapKeyRef (task)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 name | The name of the config map in the pod's namespace to select from. | string | true |  |  
 key | The key of the config map to select from. Must be a valid secret key. | string | true |  |  


#### volumes (task)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 name |  | string | true |  |  
 mountPath |  | string | true |  |  
 type | Specify volume type, options: "pvc","configMap","secret","emptyDir", default to emptyDir. | "emptyDir" or "pvc" or "configMap" or "secret" | false | emptyDir |  
 medium |  | "" or "Memory" | false | empty |  


#### livenessProbe (task)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 exec | Instructions for assessing container health by executing a command. Either this attribute or the httpGet attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the httpGet attribute and the tcpSocket attribute. | [exec](#exec-task) | false |  |  
 httpGet | Instructions for assessing container health by executing an HTTP GET request. Either this attribute or the exec attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the tcpSocket attribute. | [httpGet](#httpget-task) | false |  |  
 tcpSocket | Instructions for assessing container health by probing a TCP socket. Either this attribute or the exec attribute or the httpGet attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the httpGet attribute. | [tcpSocket](#tcpsocket-task) | false |  |  
 initialDelaySeconds | Number of seconds after the container is started before the first probe is initiated. | int | false | 0 |  
 periodSeconds | How often, in seconds, to execute the probe. | int | false | 10 |  
 timeoutSeconds | Number of seconds after which the probe times out. | int | false | 1 |  
 successThreshold | Minimum consecutive successes for the probe to be considered successful after having failed. | int | false | 1 |  
 failureThreshold | Number of consecutive failures required to determine the container is not alive (liveness probe) or not ready (readiness probe). | int | false | 3 |  


##### exec (task)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 command | A command to be executed inside the container to assess its health. Each space delimited token of the command is a separate array element. Commands exiting 0 are considered to be successful probes, whilst all other exit codes are considered failures. | []string | true |  |  


##### httpGet (task)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 path | The endpoint, relative to the port, to which the HTTP GET request should be directed. | string | true |  |  
 port | The TCP socket within the container to which the HTTP GET request should be directed. | int | true |  |  
 httpHeaders |  | [[]httpHeaders](#httpheaders-task) | false |  |  


##### httpHeaders (task)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 name |  | string | true |  |  
 value |  | string | true |  |  


##### tcpSocket (task)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 port | The TCP socket within the container that should be probed to assess container health. | int | true |  |  


#### readinessProbe (task)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 exec | Instructions for assessing container health by executing a command. Either this attribute or the httpGet attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the httpGet attribute and the tcpSocket attribute. | [exec](#exec-task) | false |  |  
 httpGet | Instructions for assessing container health by executing an HTTP GET request. Either this attribute or the exec attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the tcpSocket attribute. | [httpGet](#httpget-task) | false |  |  
 tcpSocket | Instructions for assessing container health by probing a TCP socket. Either this attribute or the exec attribute or the httpGet attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the httpGet attribute. | [tcpSocket](#tcpsocket-task) | false |  |  
 initialDelaySeconds | Number of seconds after the container is started before the first probe is initiated. | int | false | 0 |  
 periodSeconds | How often, in seconds, to execute the probe. | int | false | 10 |  
 timeoutSeconds | Number of seconds after which the probe times out. | int | false | 1 |  
 successThreshold | Minimum consecutive successes for the probe to be considered successful after having failed. | int | false | 1 |  
 failureThreshold | Number of consecutive failures required to determine the container is not alive (liveness probe) or not ready (readiness probe). | int | false | 3 |  


##### exec (task)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 command | A command to be executed inside the container to assess its health. Each space delimited token of the command is a separate array element. Commands exiting 0 are considered to be successful probes, whilst all other exit codes are considered failures. | []string | true |  |  


##### httpGet (task)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 path | The endpoint, relative to the port, to which the HTTP GET request should be directed. | string | true |  |  
 port | The TCP socket within the container to which the HTTP GET request should be directed. | int | true |  |  
 httpHeaders |  | [[]httpHeaders](#httpheaders-task) | false |  |  


##### httpHeaders (task)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 name |  | string | true |  |  
 value |  | string | true |  |  


##### tcpSocket (task)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 port | The TCP socket within the container that should be probed to assess container health. | int | true |  |  


## Webservice

### Description

Describes long-running, scalable, containerized services that have a stable network endpoint to receive external network traffic from customers.

### Underlying Kubernetes Resources (webservice)

- deployments.apps

### Examples (webservice)

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
        image: oamdev/testapp:v1
        cmd: ["node", "server.js"]
        ports:
          - port: 8080
            expose: true
        cpu: "0.1"
        env:
          - name: FOO
            value: bar
          - name: FOO
            valueFrom:
              secretKeyRef:
                name: bar
                key: bar
```

### Specification (webservice)


 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 labels | Specify the labels in the workload. | map[string]string | false |  |  
 annotations | Specify the annotations in the workload. | map[string]string | false |  |  
 image | Which image would you like to use for your service. | string | true |  |  
 imagePullPolicy | Specify image pull policy for your service. | "Always" or "Never" or "IfNotPresent" | false |  |  
 imagePullSecrets | Specify image pull secrets for your service. | []string | false |  |  
 ports | Which ports do you want customer traffic sent to, defaults to 80. | [[]ports](#ports-webservice) | false |  |  
 cmd | Commands to run in the container. | []string | false |  |  
 args | Arguments to the entrypoint. | []string | false |  |  
 env | Define arguments by using environment variables. | [[]env](#env-webservice) | false |  |  
 cpu | Number of CPU units for the service, like `0.5` (0.5 CPU core), `1` (1 CPU core). | string | false |  |  
 memory | Specifies the attributes of the memory resource required for the container. | string | false |  |  
 limit |  | [limit](#limit-webservice) | false |  |  
 volumeMounts |  | [volumeMounts](#volumemounts-webservice) | false |  |  
 volumes | Deprecated field, use volumeMounts instead. | [[]volumes](#volumes-webservice) | false |  |  
 livenessProbe | Instructions for assessing whether the container is alive. | [livenessProbe](#livenessprobe-webservice) | false |  |  
 readinessProbe | Instructions for assessing whether the container is in a suitable state to serve traffic. | [readinessProbe](#readinessprobe-webservice) | false |  |  
 hostAliases | Specify the hostAliases to add. | [[]hostAliases](#hostaliases-webservice) | false |  |  


#### ports (webservice)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 port | Number of port to expose on the pod's IP address. | int | true |  |  
 containerPort | Number of container port to connect to, defaults to port. | int | false |  |  
 name | Name of the port. | string | false |  |  
 protocol | Protocol for port. Must be UDP, TCP, or SCTP. | "TCP" or "UDP" or "SCTP" | false | TCP |  
 expose | Specify if the port should be exposed. | bool | false | false |  
 nodePort | exposed node port. Only Valid when exposeType is NodePort. | int | false |  |  


#### env (webservice)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 name | Environment variable name. | string | true |  |  
 value | The value of the environment variable. | string | false |  |  
 valueFrom | Specifies a source the value of this var should come from. | [valueFrom](#valuefrom-webservice) | false |  |  


##### valueFrom (webservice)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 secretKeyRef | Selects a key of a secret in the pod's namespace. | [secretKeyRef](#secretkeyref-webservice) | false |  |  
 configMapKeyRef | Selects a key of a config map in the pod's namespace. | [configMapKeyRef](#configmapkeyref-webservice) | false |  |  


##### secretKeyRef (webservice)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 name | The name of the secret in the pod's namespace to select from. | string | true |  |  
 key | The key of the secret to select from. Must be a valid secret key. | string | true |  |  


##### configMapKeyRef (webservice)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 name | The name of the config map in the pod's namespace to select from. | string | true |  |  
 key | The key of the config map to select from. Must be a valid secret key. | string | true |  |  


#### limit (webservice)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 cpu |  | string | false |  |  
 memory |  | string | false |  |  


#### volumeMounts (webservice)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 pvc | Mount PVC type volume. | [[]pvc](#pvc-webservice) | false |  |  
 configMap | Mount ConfigMap type volume. | [[]configMap](#configmap-webservice) | false |  |  
 secret | Mount Secret type volume. | [[]secret](#secret-webservice) | false |  |  
 emptyDir | Mount EmptyDir type volume. | [[]emptyDir](#emptydir-webservice) | false |  |  
 hostPath | Mount HostPath type volume. | [[]hostPath](#hostpath-webservice) | false |  |  


##### pvc (webservice)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 name |  | string | true |  |  
 mountPath |  | string | true |  |  
 subPath |  | string | false |  |  
 claimName | The name of the PVC. | string | true |  |  


##### configMap (webservice)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 name |  | string | true |  |  
 mountPath |  | string | true |  |  
 subPath |  | string | false |  |  
 defaultMode |  | int | false | 420 |  
 cmName |  | string | true |  |  
 items |  | [[]items](#items-webservice) | false |  |  


##### items (webservice)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 key |  | string | true |  |  
 path |  | string | true |  |  
 mode |  | int | false | 511 |  


##### secret (webservice)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 name |  | string | true |  |  
 mountPath |  | string | true |  |  
 subPath |  | string | false |  |  
 defaultMode |  | int | false | 420 |  
 secretName |  | string | true |  |  
 items |  | [[]items](#items-webservice) | false |  |  


##### items (webservice)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 key |  | string | true |  |  
 path |  | string | true |  |  
 mode |  | int | false | 511 |  


##### emptyDir (webservice)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 name |  | string | true |  |  
 mountPath |  | string | true |  |  
 subPath |  | string | false |  |  
 medium |  | "" or "Memory" | false | empty |  


##### hostPath (webservice)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 name |  | string | true |  |  
 mountPath |  | string | true |  |  
 subPath |  | string | false |  |  
 path |  | string | true |  |  


#### volumes (webservice)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 name |  | string | true |  |  
 mountPath |  | string | true |  |  
 type | Specify volume type, options: "pvc","configMap","secret","emptyDir", default to emptyDir. | "emptyDir" or "pvc" or "configMap" or "secret" | false | emptyDir |  
 medium |  | "" or "Memory" | false | empty |  


#### livenessProbe (webservice)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 exec | Instructions for assessing container health by executing a command. Either this attribute or the httpGet attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the httpGet attribute and the tcpSocket attribute. | [exec](#exec-webservice) | false |  |  
 httpGet | Instructions for assessing container health by executing an HTTP GET request. Either this attribute or the exec attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the tcpSocket attribute. | [httpGet](#httpget-webservice) | false |  |  
 tcpSocket | Instructions for assessing container health by probing a TCP socket. Either this attribute or the exec attribute or the httpGet attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the httpGet attribute. | [tcpSocket](#tcpsocket-webservice) | false |  |  
 initialDelaySeconds | Number of seconds after the container is started before the first probe is initiated. | int | false | 0 |  
 periodSeconds | How often, in seconds, to execute the probe. | int | false | 10 |  
 timeoutSeconds | Number of seconds after which the probe times out. | int | false | 1 |  
 successThreshold | Minimum consecutive successes for the probe to be considered successful after having failed. | int | false | 1 |  
 failureThreshold | Number of consecutive failures required to determine the container is not alive (liveness probe) or not ready (readiness probe). | int | false | 3 |  


##### exec (webservice)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 command | A command to be executed inside the container to assess its health. Each space delimited token of the command is a separate array element. Commands exiting 0 are considered to be successful probes, whilst all other exit codes are considered failures. | []string | true |  |  


##### httpGet (webservice)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 path | The endpoint, relative to the port, to which the HTTP GET request should be directed. | string | true |  |  
 port | The TCP socket within the container to which the HTTP GET request should be directed. | int | true |  |  
 host |  | string | false |  |  
 scheme |  | string | false | HTTP |  
 httpHeaders |  | [[]httpHeaders](#httpheaders-webservice) | false |  |  


##### httpHeaders (webservice)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 name |  | string | true |  |  
 value |  | string | true |  |  


##### tcpSocket (webservice)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 port | The TCP socket within the container that should be probed to assess container health. | int | true |  |  


#### readinessProbe (webservice)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 exec | Instructions for assessing container health by executing a command. Either this attribute or the httpGet attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the httpGet attribute and the tcpSocket attribute. | [exec](#exec-webservice) | false |  |  
 httpGet | Instructions for assessing container health by executing an HTTP GET request. Either this attribute or the exec attribute or the tcpSocket attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the tcpSocket attribute. | [httpGet](#httpget-webservice) | false |  |  
 tcpSocket | Instructions for assessing container health by probing a TCP socket. Either this attribute or the exec attribute or the httpGet attribute MUST be specified. This attribute is mutually exclusive with both the exec attribute and the httpGet attribute. | [tcpSocket](#tcpsocket-webservice) | false |  |  
 initialDelaySeconds | Number of seconds after the container is started before the first probe is initiated. | int | false | 0 |  
 periodSeconds | How often, in seconds, to execute the probe. | int | false | 10 |  
 timeoutSeconds | Number of seconds after which the probe times out. | int | false | 1 |  
 successThreshold | Minimum consecutive successes for the probe to be considered successful after having failed. | int | false | 1 |  
 failureThreshold | Number of consecutive failures required to determine the container is not alive (liveness probe) or not ready (readiness probe). | int | false | 3 |  


##### exec (webservice)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 command | A command to be executed inside the container to assess its health. Each space delimited token of the command is a separate array element. Commands exiting 0 are considered to be successful probes, whilst all other exit codes are considered failures. | []string | true |  |  


##### httpGet (webservice)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 path | The endpoint, relative to the port, to which the HTTP GET request should be directed. | string | true |  |  
 port | The TCP socket within the container to which the HTTP GET request should be directed. | int | true |  |  
 host |  | string | false |  |  
 scheme |  | string | false | HTTP |  
 httpHeaders |  | [[]httpHeaders](#httpheaders-webservice) | false |  |  


##### httpHeaders (webservice)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 name |  | string | true |  |  
 value |  | string | true |  |  


##### tcpSocket (webservice)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 port | The TCP socket within the container that should be probed to assess container health. | int | true |  |  


#### hostAliases (webservice)

 Name | Description | Type | Required | Default | Immutable 
 ---- | ----------- | ---- | -------- | ------- | --------- 
 ip |  | string | true |  |  
 hostnames |  | []string | true |  |  


