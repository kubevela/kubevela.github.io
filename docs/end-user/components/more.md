---
title:  Needs More Capabilities？
---

KubeVela is programmable, it can be extended easily with [definition](../../getting-started/definition). You have the following ways to discover and extend the platform.

## Learn more built-in capabilities

There're many out-of-box capabilities installed along with KubeVela controller, refer to the following links to learn more details:

  - [Built-in Component Reference](./references)
  - [Built-in Trait Reference](../traits/references)
  - [Built-in Policy Reference](../policies/references)
  - [Built-in Workflow Step Reference](../workflow/built-in-workflow-defs)

## Extend by Managing Addons

Installing addon from the community is also one of the most important way to discover more capabilities.

### List Addons

KubeVela community has maintained a growing [catalog of addons](https://github.com/kubevela/catalog) which will be synced to the default addon registry (https://addons.kubevela.net). You can use vela command line to list all available addons by:

```shell
vela addon list
```

<details>
<summary>The command will show the basic addon info along with all available versions and installed versions.</summary>

```console
NAME                            REGISTRY        DESCRIPTION                                                                                             AVAILABLE-VERSIONS              STATUS          
rollout                         KubeVela        Provides basic batch publishing capability.                                                             [1.3.0, 1.2.4, 1.2.3]           disabled        
terraform                       KubeVela        Terraform Controller is a Kubernetes Controller for Terraform.                                          [1.0.6]                         disabled        
terraform-aws                   KubeVela        Kubernetes Terraform Controller for AWS                                                                 [1.0.1, 1.0.0]                  disabled        
dex                             KubeVela        Enable dex for login                                                                                    [0.6.5]                         disabled        
fluxcd                          KubeVela        Extended workload to do continuous and progressive delivery                                             [1.1.0, 1.0.0]                  disabled
velaux                          KubeVela        KubeVela User Experience (UX). An extensible, application-oriented delivery and management Dashboard.   [v1.3.0, v1.3.0-beta.2, 1.2.4]  enabled (v1.3.0)
terraform-alibaba               KubeVela        Kubernetes Terraform Controller for Alibaba Cloud                                                       [1.0.2, 1.0.1]                  disabled    
...snip...
```
</details>

* You can refer to [addon reference docs](../../reference/addons/overview) for more details of these community certificated addons.

### Install Addon

#### Install with CLI

The simplest command for installing one addon is:

```shell
vela addon enable fluxcd
```

<details>
<summary>The expected output.</summary>

```console
I0111 21:45:24.553174   89345 apply.go:106] "creating object" name="addon-fluxcd" resource="core.oam.dev/v1beta1, Kind=Application"
I0111 21:45:25.258914   89345 apply.go:106] "creating object" name="helm" resource="core.oam.dev/v1beta1, Kind=ComponentDefinition"
I0111 21:45:25.342731   89345 apply.go:106] "creating object" name="kustomize-json-patch" resource="core.oam.dev/v1beta1, Kind=TraitDefinition"
I0111 21:45:25.382201   89345 apply.go:106] "creating object" name="kustomize-patch" resource="core.oam.dev/v1beta1, Kind=TraitDefinition"
I0111 21:45:25.411723   89345 apply.go:106] "creating object" name="kustomize" resource="core.oam.dev/v1beta1, Kind=ComponentDefinition"
I0111 21:45:25.625815   89345 apply.go:106] "creating object" name="kustomize-strategy-merge" resource="core.oam.dev/v1beta1, Kind=TraitDefinition"
I0111 21:45:25.660129   89345 apply.go:106] "creating object" name="component-uischema-helm" resource="/v1, Kind=ConfigMap"
Addon: fluxcd enabled Successfully.
```
</details>

You can also install addons with some advanced flags.

#### Install addon with specified version

* Choose one specific version by adding `--version` flag in this command. e.g:

```shell
vela addon enable fluxcd --version=1.0.0
```

* Choose specific clusters for installation. You can use `--cluster` flag to choose specific clusters. e.g:

```shell
vela addon enable <addon-name> --clusters={cluster1,cluster2}
```

By default, the place for installation is specified as control plane cluster or managed cluster inside the metadata of addon. 

* Some addons support setting parts of parameter while enabling. For example `velaux` addon supports change image repository by setting `repo` parameter, then you can change the repo address to your own. e.g:

```shell
vela addon enable velaux repo=<your repo address>
```

#### Air-Gapped Installation for Addon

If your cluster network cannot connect to the community addon registry you can: 
- build your custom addon registry. Please refer to [*Build your Own Registry*](../../platform-engineers/addon/addon-registry) for details.
- enable an addon from a local directory. Example:

```shell
$ tree velaux -L 1
velaux
├── metadata.yaml
├── readme_cn.md
├── readme.md
├── resources
├── schemas
└── template.yaml

2 directories, 4 files
```

* Enable the addon from local directory.

```
vela addon enable ./velaux
```

<details>
<summary>expected output</summary>

```
Addon: velaux enabled successfully
```
</details>

:::caution
Please notice that, while an addon is being installed in a cluster, it maybe still need pull some images or Helm Charts. If your cluster cannot reach these resources please refer [docs](../../platform-engineers/system-operation/enable-addon-offline) to complete installation without Internet access.
:::

#### Install addon with UI Console

If you have installed [VelaUX](../../reference/addons/velaux) which is also one of the addon, you can manage it directly on the UI console with admin privileges.

![addon list](https://static.kubevela.net/images/1.3/addon-list.jpg)

In the addon list, you can get the status of the addon and other info. Click the addon name could open the addon detail page, you can get the version list, definitions provided by the addon, and the readme message.

![addon detail](https://static.kubevela.net/images/1.3/addon-detail.jpg)

Select a version and deployed clusters, you can click the enable button to install this addon. You can check detail information in this section include:

- Definitions: The extension capabilities provided by the addon may include component, trait, etc.
- README: Addon description, explain the capabilities and related information.

#### Install addon by kubectl

When you want to deploy addon in the format of YAML or using `kubectl` instead of using vela CLI, you can render the yaml out by:

```shell
vela addon enable velaux --dry-run
```


<details>
<summary>expected output</summary>

```
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  creationTimestamp: null
  labels:
    addons.oam.dev/name: velaux
    addons.oam.dev/registry: KubeVela
    addons.oam.dev/version: v1.5.8
  name: addon-velaux
  namespace: vela-system
spec:
  components:
  - name: apiserver
    properties:
      cmd:
      - apiserver
      - --datastore-type=kubeapi
      image: oamdev/vela-apiserver:v1.5.8
      ports:
      - expose: true
        port: 8000
        protocol: TCP
    traits:
    - properties:
        name: kubevela-vela-core
      type: service-account
    - properties:
        replicas: 1
      type: scaler
    type: webservice
  - dependsOn:
    - apiserver
    name: velaux
    properties:
      env:
      - name: KUBEVELA_API_URL
        value: apiserver.vela-system:8000
      exposeType: ClusterIP
      image: oamdev/velaux:v1.5.8
      ports:
      - expose: true
        port: 80
        protocol: TCP
    traits:
    - properties:
        replicas: 1
      type: scaler
    type: webservice
status: {}

---
apiVersion: v1
data:
  ui-schema: '[{"jsonKey":"pvc","label":"PersistentVolumeClaim","sort":1,"subParameters":[{"jsonKey":"name","sort":1,"validate":{"maxLength":32,"pattern":"^[a-z0-9]([-a-z0-9]*[a-z0-9])$","required":true}},{"jsonKey":"mountPath","sort":3,"validate":{"pattern":"^/(.*)$","required":true}},{"jsonKey":"resources","sort":7,"subParameters":[{"jsonKey":"requests","sort":1,"style":{"colSpan":12},"subParameters":[{"jsonKey":"storage","label":"Request
    Storage","uiType":"DiskNumber","validate":{"immutable":true,"required":true}}],"uiType":"Ignore"},{"jsonKey":"limits","sort":3,"style":{"colSpan":12},"subParameters":[{"jsonKey":"storage","label":"Limit
    Storage","uiType":"DiskNumber","validate":{"immutable":true,"required":true}}],"uiType":"Ignore"}],"validate":{"defaultValue":{"limits":{"storage":"8Gi"},"requests":{"storage":"8Gi"}},"required":true}},{"description":"If
    not specified, the cluster default StorageClass is used.","jsonKey":"storageClassName","sort":9},{"jsonKey":"accessModes","sort":11,"validate":{"defaultValue":["ReadWriteOnce"],"required":false}},{"description":"You
    can set the value of volumeMode to Block to use a volume as a raw block device.","jsonKey":"volumeMode","sort":12,"uiType":"Select","validate":{"defaultValue":"Filesystem","options":[{"label":"Filesystem","value":"Filesystem"},{"label":"Block","value":"Block"}]}},{"description":"The
    VolumeName is the binding reference to the PersistentVolume backing this claim.","jsonKey":"volumeName","sort":14},{"jsonKey":"selector","sort":17},{"description":"It
    will create a new volume based on the contents of the specified data source.","jsonKey":"dataSource","sort":19},{"disable":true,"jsonKey":"dataSourceRef","sort":20},{"disable":true,"jsonKey":"mountOnly"}]},{"disable":true,"jsonKey":"secret","sort":3},{"disable":true,"jsonKey":"configMap","sort":5},{"disable":true,"jsonKey":"emptyDir"}]'
kind: ConfigMap
metadata:
  creationTimestamp: null
  name: trait-uischema-storage
  namespace: vela-system

---
apiVersion: v1
data:
  ui-schema: '[{"jsonKey":"url","label":"URL","sort":1,"subParameters":[{"jsonKey":"value","label":"URL","uiType":"Input","validate":{"required":true}}],"uiType":"Ignore"},{"jsonKey":"data","sort":3}]'
kind: ConfigMap
metadata:
  creationTimestamp: null
  name: workflowstep-uischema-webhook
  namespace: vela-system

---
apiVersion: v1
data:
  ui-schema: '[{"jsonKey":"replicas","validate":{"min":0,"required":true}}]'
kind: ConfigMap
metadata:
  creationTimestamp: null
  name: trait-uischema-scaler
  namespace: vela-system

---
apiVersion: v1
data:
  ui-schema: '[{"jsonKey":"image","label":"Container Image","sort":1,"uiType":"ImageInput"},{"disable":true,"jsonKey":"imagePullSecret","sort":2},{"description":"Specifies
    the memory resource required for the container, If set to 0, there is no limit.","jsonKey":"memory","label":"Memory","sort":4,"style":{"colSpan":12},"uiType":"MemoryNumber","validate":{"defaultValue":"1024Mi","required":true}},{"description":"Specifies
    the cpu resource required for the container, If set to 0, there is no limit.","jsonKey":"cpu","label":"CPU","sort":5,"style":{"colSpan":12},"uiType":"CPUNumber","validate":{"defaultValue":"0.5","required":true}},{"jsonKey":"exposeType","sort":6,"validate":null},{"jsonKey":"ports","label":"Service
    Ports","sort":7,"subParameters":[{"jsonKey":"port","sort":1,"validate":{"min":1,"required":true}},{"jsonKey":"protocol","sort":3},{"disable":true,"jsonKey":"name","sort":4},{"jsonKey":"expose","sort":5}],"validate":{"defaultValue":[{"expose":true,"port":80,"protocol":"TCP"}],"required":true}},{"jsonKey":"cmd","label":"CMD","sort":9},{"jsonKey":"env","label":"ENV","sort":10,"subParameterGroupOption":[{"keys":["name","value"],"label":"Add
    By Value"},{"keys":["name","valueFrom"],"label":"Add By Secret"}],"subParameters":[{"jsonKey":"valueFrom","label":"Secret
    Selector","subParameters":[{"disable":true,"jsonKey":"configMapKeyRef"},{"jsonKey":"secretKeyRef","subParameters":[{"jsonKey":"name","label":"Secret
    Name","sort":1,"uiType":"SecretSelect"},{"jsonKey":"key","label":"Secret Key","sort":3,"uiType":"SecretKeySelect"}],"uiType":"Ignore"}],"uiType":"Ignore"}],"uiType":"Structs"},{"description":"Set
    the path and type that the service needs to persist.","jsonKey":"volumeMounts","label":"Persistent
    Storage","sort":12,"subParameters":[{"disable":true,"jsonKey":"configMap"},{"disable":true,"jsonKey":"secret"},{"jsonKey":"pvc","label":"Storage
    By PVC","sort":1,"subParameters":[{"jsonKey":"name","sort":1,"validate":{"pattern":"^[a-z0-9]([-a-z0-9]*[a-z0-9])$","required":true}},{"jsonKey":"claimName","sort":3},{"jsonKey":"mountPath","sort":5,"validate":{"pattern":"^/(.*)$","required":true}}]},{"jsonKey":"hostPath","label":"Storage
    By HostPath","sort":3,"subParameters":[{"jsonKey":"name","sort":1,"validate":{"pattern":"^[a-z0-9]([-a-z0-9]*[a-z0-9])$","required":true}},{"jsonKey":"path","label":"Host
    Path","sort":3,"validate":{"pattern":"^/(.*)$","required":true}},{"jsonKey":"mountPath","sort":5,"validate":{"pattern":"^/(.*)$","required":true}}]},{"jsonKey":"emptyDir","label":"Temporary
    Storage","sort":5,"subParameters":[{"jsonKey":"name","sort":1,"validate":{"pattern":"^[a-z0-9]([-a-z0-9]*[a-z0-9])$","required":true}},{"jsonKey":"medium","sort":3,"validate":{"options":[{"label":"Memory","value":"memory"},{"label":"Dir","value":""}],"required":false}},{"jsonKey":"mountPath","sort":5,"validate":{"pattern":"^/(.*)$","required":true}}]}],"uiType":"Group"},{"jsonKey":"readinessProbe","label":"ReadinessProbe","sort":13,"subParameters":[{"disable":true,"jsonKey":"hostAliases"},{"jsonKey":"timeoutSeconds","sort":1,"style":{"colSpan":12}},{"jsonKey":"failureThreshold","sort":4,"style":{"colSpan":12}},{"jsonKey":"initialDelaySeconds","sort":7,"style":{"colSpan":12},"validate":{"defaultValue":5,"required":true}},{"jsonKey":"periodSeconds","sort":9,"style":{"colSpan":12}},{"jsonKey":"successThreshold","sort":11,"style":{"colSpan":12}},{"jsonKey":"exec","sort":14},{"jsonKey":"httpGet","sort":19,"subParameters":[{"jsonKey":"port","sort":1,"style":{"colSpan":12},"validate":{"min":1,"required":true}},{"jsonKey":"path","sort":3,"style":{"colSpan":12},"validate":{"pattern":"^/(.*)$","required":true}},{"jsonKey":"httpHeaders","sort":5}]},{"jsonKey":"tcpSocket","sort":19,"subParameters":[{"jsonKey":"port","validate":{"min":1,"required":true}}]}],"uiType":"Group"},{"jsonKey":"livenessProbe","label":"LivenessProbe","sort":15,"subParameters":[{"disable":true,"jsonKey":"hostAliases"},{"jsonKey":"timeoutSeconds","sort":1,"style":{"colSpan":12}},{"jsonKey":"failureThreshold","sort":4,"style":{"colSpan":12}},{"jsonKey":"initialDelaySeconds","sort":7,"style":{"colSpan":12},"validate":{"defaultValue":5,"required":true}},{"jsonKey":"periodSeconds","sort":9,"style":{"colSpan":12}},{"jsonKey":"successThreshold","sort":11,"style":{"colSpan":12}},{"jsonKey":"exec","sort":14},{"jsonKey":"httpGet","sort":19,"subParameters":[{"jsonKey":"port","sort":1,"style":{"colSpan":12},"validate":{"min":1,"required":true}},{"jsonKey":"path","sort":3,"style":{"colSpan":12},"validate":{"pattern":"^/(.*)$","required":true}},{"jsonKey":"httpHeaders","sort":5}]},{"jsonKey":"tcpSocket","sort":19,"subParameters":[{"jsonKey":"port","validate":{"min":1,"required":true}}]}],"uiType":"Group"},{"jsonKey":"annotations","sort":19},{"jsonKey":"labels","sort":21},{"description":"Specify
    image pull policy for your service","jsonKey":"imagePullPolicy","label":"Image
    Pull Policy","sort":24,"uiType":"Select","validate":{"defaultValue":"IfNotPresent","options":[{"label":"IfNotPresent","value":"IfNotPresent"},{"label":"Always","value":"Always"},{"label":"Never","value":"Never"}]}},{"disable":true,"jsonKey":"addRevisionLabel"},{"disable":true,"jsonKey":"port"},{"disable":true,"jsonKey":"volumes"}]'
kind: ConfigMap
metadata:
  creationTimestamp: null
  name: component-uischema-webservice
  namespace: vela-system

---
apiVersion: v1
data:
  ui-schema: '[{"jsonKey":"parallel","sort":5,"validate":{"defaultValue":false}},{"jsonKey":"policy","sort":1},{"jsonKey":"env","sort":3}]'
kind: ConfigMap
metadata:
  creationTimestamp: null
  name: workflowstep-uischema-deploy2env
  namespace: vela-system

---
apiVersion: v1
data:
  ui-schema: '[{"jsonKey":"image","label":"Image","sort":1,"uiType":"ImageInput"},{"disable":true,"jsonKey":"imagePullSecret","sort":2},{"jsonKey":"restart","sort":3,"uiType":"Select","validate":{"defaultValue":"Never","options":[{"label":"Never","value":"Never"},{"label":"OnFailure","value":"OnFailure"}],"required":true}},{"jsonKey":"count","sort":4,"uiType":"Number","validate":{"defaultValue":1,"max":128,"min":0,"required":true}},{"description":"Specifies
    the memory resource required for the container, If set to 0, there is no limit.","jsonKey":"memory","label":"Memory","sort":5,"style":{"colSpan":12},"uiType":"MemoryNumber","validate":{"defaultValue":"1024Mi","required":true}},{"description":"Specifies
    the cpu resource required for the container, If set to 0, there is no limit.","jsonKey":"cpu","label":"CPU","sort":7,"style":{"colSpan":12},"uiType":"CPUNumber","validate":{"defaultValue":"0.5","required":true}},{"jsonKey":"cmd","label":"CMD","sort":9},{"jsonKey":"env","label":"ENV","sort":10,"subParameterGroupOption":[{"keys":["name","value"],"label":"Add
    By Value"},{"keys":["name","valueFrom"],"label":"Add By Secret"}],"subParameters":[{"jsonKey":"valueFrom","label":"Secret
    Selector","subParameters":[{"disable":true,"jsonKey":"configMapKeyRef"},{"jsonKey":"secretKeyRef","subParameters":[{"jsonKey":"name","label":"Secret
    Name","sort":1,"uiType":"SecretSelect"},{"jsonKey":"key","label":"Secret Key","sort":3,"uiType":"SecretKeySelect"}],"uiType":"Ignore"}],"uiType":"Ignore"}],"uiType":"Structs"},{"jsonKey":"readinessProbe","label":"ReadinessProbe","sort":13,"subParameters":[{"disable":true,"jsonKey":"hostAliases"},{"jsonKey":"timeoutSeconds","sort":1,"style":{"colSpan":12}},{"jsonKey":"failureThreshold","sort":4,"style":{"colSpan":12}},{"jsonKey":"initialDelaySeconds","sort":7,"style":{"colSpan":12},"validate":{"defaultValue":5,"required":true}},{"jsonKey":"periodSeconds","sort":9,"style":{"colSpan":12}},{"jsonKey":"successThreshold","sort":11,"style":{"colSpan":12}},{"jsonKey":"exec","sort":14},{"jsonKey":"httpGet","sort":19,"subParameters":[{"jsonKey":"port","sort":1,"style":{"colSpan":12},"validate":{"min":1,"required":true}},{"jsonKey":"path","sort":3,"style":{"colSpan":12},"validate":{"pattern":"^/(.*)$","required":true}},{"jsonKey":"httpHeaders","sort":5}]},{"jsonKey":"tcpSocket","sort":19,"subParameters":[{"jsonKey":"port","validate":{"min":1,"required":true}}]}],"uiType":"Group"},{"jsonKey":"livenessProbe","label":"LivenessProbe","sort":15,"subParameters":[{"disable":true,"jsonKey":"hostAliases"},{"jsonKey":"timeoutSeconds","sort":1,"style":{"colSpan":12}},{"jsonKey":"failureThreshold","sort":4,"style":{"colSpan":12}},{"jsonKey":"initialDelaySeconds","sort":7,"style":{"colSpan":12},"validate":{"defaultValue":5,"required":true}},{"jsonKey":"periodSeconds","sort":9,"style":{"colSpan":12}},{"jsonKey":"successThreshold","sort":11,"style":{"colSpan":12}},{"jsonKey":"exec","sort":14},{"jsonKey":"httpGet","sort":19,"subParameters":[{"jsonKey":"port","sort":1,"style":{"colSpan":12},"validate":{"min":1,"required":true}},{"jsonKey":"path","sort":3,"style":{"colSpan":12},"validate":{"pattern":"^/(.*)$","required":true}},{"jsonKey":"httpHeaders","sort":5}]},{"jsonKey":"tcpSocket","sort":19,"subParameters":[{"jsonKey":"port","validate":{"min":1,"required":true}}]}],"uiType":"Group"},{"jsonKey":"annotations","sort":19},{"jsonKey":"labels","sort":21},{"description":"Specify
    image pull policy for your service","jsonKey":"imagePullPolicy","label":"Image
    Pull Policy","sort":24,"uiType":"Select","validate":{"defaultValue":"IfNotPresent","options":[{"label":"IfNotPresent","value":"IfNotPresent"},{"label":"Always","value":"Always"},{"label":"Never","value":"Never"}]}},{"disable":true,"jsonKey":"volumes"}]'
kind: ConfigMap
metadata:
  creationTimestamp: null
  name: component-uischema-task
  namespace: vela-system

---
apiVersion: v1
data:
  ui-schema: '[{"description":"Support push messages to Dingding Group.","jsonKey":"dingding","sort":1,"subParameters":[{"jsonKey":"url","sort":1,"subParameters":[{"jsonKey":"value","label":"Webhook","uiType":"Input","validate":{"required":true}}],"uiType":"Ignore"},{"description":"Specify
    the message that you want to sent","jsonKey":"message","sort":3,"subParameters":[{"disable":true,"jsonKey":"msgtype"},{"disable":true,"jsonKey":"link"},{"disable":true,"jsonKey":"markdown"},{"disable":true,"jsonKey":"at"},{"disable":true,"jsonKey":"actionCard"},{"disable":true,"jsonKey":"feedCard"},{"jsonKey":"text","subParameters":[{"description":"Specify
    the message that you want to sent","jsonKey":"content","label":"Message"}],"uiType":"Ignore"}],"uiType":"Ignore"}]},{"description":"Support
    push email message.","jsonKey":"email","sort":3,"subParameters":[{"jsonKey":"from","sort":1,"subParameters":[{"jsonKey":"host","sort":1},{"jsonKey":"port","sort":3},{"jsonKey":"address","sort":5},{"jsonKey":"password","sort":7,"subParameters":[{"jsonKey":"value","label":"Password","uiType":"Password","validate":{"required":true}}],"uiType":"Ignore"},{"jsonKey":"alias","sort":9}]},{"jsonKey":"to","sort":3},{"jsonKey":"content","sort":5,"subParameters":[{"jsonKey":"subject","sort":1},{"jsonKey":"body","sort":3}]}]},{"description":"Support
    push messages to slack channel.","jsonKey":"slack","sort":5,"subParameters":[{"jsonKey":"url","sort":1,"subParameters":[{"jsonKey":"value","label":"Webhook","uiType":"Input","validate":{"required":true}}],"uiType":"Ignore"},{"jsonKey":"message","subParameters":[{"disable":true,"jsonKey":"blocks"},{"disable":true,"jsonKey":"attachments"},{"disable":true,"jsonKey":"thread_ts"},{"disable":true,"jsonKey":"mrkdwn"},{"description":"Specify
    the message that you want to sent","jsonKey":"text","label":"Message"}],"uiType":"Ignore"}]}]'
kind: ConfigMap
metadata:
  creationTimestamp: null
  name: workflowstep-uischema-notification
  namespace: vela-system

---
apiVersion: v1
data:
  ui-schema: '[{"jsonKey":"dbType","label":"DBType","sort":1,"validate":{"defaultValue":"kubeapi","options":[{"label":"MongoDB","value":"mongodb"},{"label":"KubeAPI","value":"kubeapi"}],"required":true}},{"conditions":[{"jsonKey":"dbType","op":"==","value":"mongodb"}],"jsonKey":"dbURL","label":"DatabaseURL","sort":3,"validate":{"required":true}},{"jsonKey":"database","sort":7,"validate":{"defaultValue":"kubevela","required":true}},{"disable":true,"jsonKey":"serviceAccountName"},{"jsonKey":"serviceType","sort":8},{"jsonKey":"domain","sort":9},{"jsonKey":"gatewayDriver","sort":10},{"jsonKey":"repo","sort":11},{"jsonKey":"imagePullSecrets","sort":13}]'
kind: ConfigMap
metadata:
  creationTimestamp: null
  name: addon-uischema-velaux
  namespace: vela-system

---
apiVersion: v1
data:
  ui-schema: '[{"jsonKey":"policies","label":"Policies","sort":10,"uiType":"PolicySelect","validate":{"required":true}},{"jsonKey":"parallelism","sort":20,"style":{"colSpan":12}},{"jsonKey":"auto","sort":30,"style":{"colSpan":12}}]'
kind: ConfigMap
metadata:
  creationTimestamp: null
  name: workflowstep-uischema-deploy
  namespace: vela-system

---
apiVersion: v1
data:
  ui-schema: '[{"jsonKey":"objects","uiType":"K8sObjectsCode"}]'
kind: ConfigMap
metadata:
  creationTimestamp: null
  name: component-uischema-k8s-objects
  namespace: vela-system

---
apiVersion: v1
data:
  ui-schema: '[{"jsonKey":"selector","sort":100,"uiType":"ComponentSelect"},{"jsonKey":"components","sort":101,"uiType":"ComponentPatches"}]'
kind: ConfigMap
metadata:
  creationTimestamp: null
  name: policy-uischema-override
  namespace: vela-system

---
apiVersion: v1
data:
  template: "import (\n\t\"vela/ql\"\n)\n\nparameter: {\n\tappName:    string\n\tappNs:
    \     string\n\tcluster?:   string\n\tclusterNs?: string\n}\n\nresources: ql.#ListResourcesInApp
    & {\n\tapp: {\n\t\tname:      parameter.appName\n\t\tnamespace: parameter.appNs\n\t\tfilter:
    {\n\t\t\tif parameter.cluster != _|_ {\n\t\t\t\tcluster: parameter.cluster\n\t\t\t}\n\t\t\tif
    parameter.clusterNs != _|_ {\n\t\t\t\tclusterNamespace: parameter.clusterNs\n\t\t\t}\n\t\t\tapiVersion:
    \"v1\"\n\t\t\tkind:       \"Service\"\n\t\t}\n\t\twithStatus: true\n\t}\n}\nstatus:
    {\n\tif resources.err == _|_ {\n\t\tservices: [ for i, resource in resources.list
    {\n\t\t\tresource.object\n\t\t}]\n\t}\n\tif resources.err != _|_ {\n\t\terror:
    resources.err\n\t}\n}\n"
kind: ConfigMap
metadata:
  creationTimestamp: null
  name: service-view
  namespace: vela-system

---
apiVersion: v1
data:
  template: "import (\n\t\"vela/ql\"\n)\n\nparameter: {\n\tname:       string\n\tnamespace?:
    string\n\tcluster?:   string\n\tkind:       string\n\tapiVersion: string\n}\nresponse:
    ql.#Read & {\n\tvalue: {\n\t\tapiVersion: parameter.apiVersion\n\t\tkind:       parameter.kind\n\t\tmetadata:
    {\n\t\t\tname: parameter.name\n\t\t\tif parameter.namespace != _|_ {\n\t\t\t\tnamespace:
    parameter.namespace\n\t\t\t}\n\t\t}\n\t}\n\tif parameter.cluster != _|_ {\n\t\tcluster:
    parameter.cluster\n\t}\n}\n\nif response.err == _|_ {\n\tstatus: {\n\t\tresource:
    response.value\n\t}\n}\nif response.err != _|_ {\n\tstatus: {\n\t\terror: response.err\n\t}\n}\n"
kind: ConfigMap
metadata:
  creationTimestamp: null
  name: application-resource-detail-view
  namespace: vela-system

---
apiVersion: v1
data:
  template: "import (\n\t\"vela/ql\"\n)\n\nparameter: {\n\tappName:    string\n\tappNs:
    \     string\n\tname?:      string\n\tcluster?:   string\n\tclusterNs?: string\n}\n\nresult:
    ql.#CollectPods & {\n\tapp: {\n\t\tname:      parameter.appName\n\t\tnamespace:
    parameter.appNs\n\t\tfilter: {\n\t\t\tif parameter.cluster != _|_ {\n\t\t\t\tcluster:
    parameter.cluster\n\t\t\t}\n\t\t\tif parameter.clusterNs != _|_ {\n\t\t\t\tclusterNamespace:
    parameter.clusterNs\n\t\t\t}\n\t\t\tif parameter.name != _|_ {\n\t\t\t\tcomponents:
    [parameter.name]\n\t\t\t}\n\t\t}\n\t}\n}\n\nif result.err == _|_ {\n\tstatus:
    {\n\t\tpodList: [ for pod in result.list if pod.object != _|_ {\n\t\t\tcluster:
    \  pod.cluster\n\t\t\tworkload:  pod.workload\n\t\t\tcomponent: pod.component\n\t\t\tmetadata:
    {\n\t\t\t\tname:         pod.object.metadata.name\n\t\t\t\tnamespace:    pod.object.metadata.namespace\n\t\t\t\tcreationTime:
    pod.object.metadata.creationTimestamp\n\t\t\t\tlabels:       pod.object.metadata.labels\n\t\t\t\tversion:
    {\n\t\t\t\t\tif pod.publishVersion != _|_ {\n\t\t\t\t\t\tpublishVersion: pod.publishVersion\n\t\t\t\t\t}\n\t\t\t\t\tif
    pod.deployVersion != _|_ {\n\t\t\t\t\t\tdeployVersion: pod.deployVersion\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t\tstatus:
    {\n\t\t\t\tphase: pod.object.status.phase\n\t\t\t\t// refer to https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#pod-phase\n\t\t\t\tif
    phase != \"Pending\" && phase != \"Unknown\" {\n\t\t\t\t\tpodIP:    pod.object.status.podIP\n\t\t\t\t\thostIP:
    \  pod.object.status.hostIP\n\t\t\t\t\tnodeName: pod.object.spec.nodeName\n\t\t\t\t}\n\t\t\t}\n\t\t}]\n\t}\n}\n\nif
    result.err != _|_ {\n\tstatus: {\n\t\terror: result.err\n\t}\n}\n"
kind: ConfigMap
metadata:
  creationTimestamp: null
  name: component-pod-view
  namespace: vela-system

---
apiVersion: v1
data:
  template: "import (\n\t\"vela/ql\"\n)\n\nparameter: {\n\ttype:      string\n\tnamespace:
    *\"\" | string\n\tcluster:   *\"\" | string\n}\n\nschema: {\n\t\"secret\": {\n\t\tapiVersion:
    \"v1\"\n\t\tkind:       \"Secret\"\n\t}\n\t\"configMap\": {\n\t\tapiVersion: \"v1\"\n\t\tkind:
    \      \"ConfigMap\"\n\t}\n\t\"pvc\": {\n\t\tapiVersion: \"v1\"\n\t\tkind:       \"PersistentVolumeClaim\"\n\t}\n\t\"storageClass\":
    {\n\t\tapiVersion: \"storage.k8s.io/v1\"\n\t\tkind:       \"StorageClass\"\n\t}\n\t\"ns\":
    {\n\t\tapiVersion: \"v1\"\n\t\tkind:       \"Namespace\"\n\t}\n\t\"provider\":
    {\n\t\tapiVersion: \"terraform.core.oam.dev/v1beta1\"\n\t\tkind:       \"Provider\"\n\t}\n}\n\nList:
    ql.#List & {\n\tresource: schema[parameter.type]\n\tfilter: {\n\t\tnamespace:
    parameter.namespace\n\t}\n\tcluster: parameter.cluster\n}\n\nstatus: {\n\tif List.err
    == _|_ {\n\t\tif len(List.list.items) == 0 {\n\t\t\terror: \"failed to list \\(parameter.type)
    in namespace \\(parameter.namespace)\"\n\t\t}\n\t\tif len(List.list.items) !=
    0 {\n\t\t\tlist: List.list.items\n\t\t}\n\t}\n\n\tif List.err != _|_ {\n\t\terror:
    List.err\n\t}\n}\n"
kind: ConfigMap
metadata:
  creationTimestamp: null
  name: resource-view
  namespace: vela-system

---
apiVersion: v1
data:
  template: "import (\n\t\"vela/ql\"\n)\n\ncollectLogs: ql.#CollectLogsInPod & {\n\tcluster:
    \  parameter.cluster\n\tnamespace: parameter.namespace\n\tpod:       parameter.pod\n\toptions:
    {\n\t\tcontainer:     parameter.container\n\t\tprevious?:     parameter.previous\n\t\tsinceSeconds?:
    parameter.sinceSeconds\n\t\tsinceTime?:    parameter.sinceTime\n\t\ttimestamps?:
    \  parameter.timestamps\n\t\ttailLines?:    parameter.tailLines\n\t\tlimitBytes?:
    \  parameter.limitBytes\n\t}\n}\nstatus: collectLogs.outputs\n\nparameter: {\n\t//
    +usage=Specify the cluster of the pod\n\tcluster: string\n\t// +usage=Specify
    the namespace of the pod\n\tnamespace: string\n\t// +usage=Specify the name of
    the pod\n\tpod: string\n\n\t// +usage=Specify the name of the container\n\tcontainer:
    string\n\t// +usage=If true, return previous terminated container logs\n\tprevious:
    *false | bool\n\t// +usage=If set, show logs in relative times\n\tsinceSeconds:
    *null | int\n\t// +usage=RFC3339 timestamp, if set, show logs since this time\n\tsinceTime:
    *null | string\n\t// +usage=If true, add timestamp at the beginning of every line\n\ttimestamps:
    *false | bool\n\t// +usage=If set, return the number of lines from the end of
    logs\n\ttailLines: *null | int\n\t// +usage=If set, limit the size of returned
    bytes\n\tlimitBytes: *null | int\n}\n"
kind: ConfigMap
metadata:
  creationTimestamp: null
  name: collect-logs
  namespace: vela-system

---
apiVersion: v1
data:
  template: "import (\n\t\"vela/ql\"\n)\n\nparameter: {\n\tappName: string\n\tappNs:
    \  string\n}\n\nresources: ql.#ListResourcesInApp & {\n\tapp: {\n\t\tname:      parameter.appName\n\t\tnamespace:
    parameter.appNs\n\t\tfilter: {\n\t\t\t\"apiVersion\": \"terraform.core.oam.dev/v1beta2\"\n\t\t\t\"kind\":
    \      \"Configuration\"\n\t\t}\n\t\twithStatus: true\n\t}\n}\nstatus: {\n\tif
    resources.err == _|_ {\n\t\t\"cloud-resources\": [ for i, resource in resources.list
    {\n\t\t\tresource.object\n\t\t}]\n\t}\n\tif resources.err != _|_ {\n\t\terror:
    resources.err\n\t}\n}\n"
kind: ConfigMap
metadata:
  creationTimestamp: null
  name: cloud-resource-view
  namespace: vela-system

---
apiVersion: v1
data:
  template: "import (\n\t\"vela/ql\"\n)\n\nparameter: {\n\tappName?: string\n\tappNs?:
    \  string\n}\n\nsecretList: ql.#List & {\n\tresource: {\n\t\tapiVersion: \"v1\"\n\t\tkind:
    \      \"Secret\"\n\t}\n\tfilter: {\n\t\tmatchingLabels: {\n\t\t\t\"created-by\":
    \"terraform-controller\"\n\t\t\tif parameter.appName != _|_ && parameter.appNs
    != _|_ {\n\t\t\t\t\"app.oam.dev/name\":      parameter.appName\n\t\t\t\t\"app.oam.dev/namespace\":
    parameter.appNs\n\t\t\t}\n\t\t}\n\t}\n}\n\nstatus: {\n\tif secretList.err == _|_
    {\n\t\tsecrets: secretList.list.items\n\t}\n\tif secretList.err != _|_ {\n\t\terror:
    secretList.err\n\t}\n}\n"
kind: ConfigMap
metadata:
  creationTimestamp: null
  name: cloud-resource-secret-view
  namespace: vela-system

---
apiVersion: v1
data:
  template: "import (\n\t\"vela/ql\"\n)\n\nparameter: {\n\tname:      string\n\tnamespace:
    string\n\tcluster:   *\"\" | string\n}\n\npod: ql.#Read & {\n\tvalue: {\n\t\tapiVersion:
    \"v1\"\n\t\tkind:       \"Pod\"\n\t\tmetadata: {\n\t\t\tname:      parameter.name\n\t\t\tnamespace:
    parameter.namespace\n\t\t}\n\t}\n\tcluster: parameter.cluster\n}\n\neventList:
    ql.#SearchEvents & {\n\tvalue: {\n\t\tapiVersion: \"v1\"\n\t\tkind:       \"Pod\"\n\t\tmetadata:
    \  pod.value.metadata\n\t}\n\tcluster: parameter.cluster\n}\n\npodMetrics: ql.#Read
    & {\n\tcluster: parameter.cluster\n\tvalue: {\n\t\tapiVersion: \"metrics.k8s.io/v1beta1\"\n\t\tkind:
    \      \"PodMetrics\"\n\t\tmetadata: {\n\t\t\tname:      parameter.name\n\t\t\tnamespace:
    parameter.namespace\n\t\t}\n\t}\n}\n\nstatus: {\n\tif pod.err == _|_ {\n\t\tcontainers:
    [ for container in pod.value.spec.containers {\n\t\t\tname:  container.name\n\t\t\timage:
    container.image\n\t\t\tresources: {\n\t\t\t\tif container.resources.limits !=
    _|_ {\n\t\t\t\t\tlimits: container.resources.limits\n\t\t\t\t}\n\t\t\t\tif container.resources.requests
    != _|_ {\n\t\t\t\t\trequests: container.resources.requests\n\t\t\t\t}\n\t\t\t\tif
    podMetrics.err == _|_ {\n\t\t\t\t\tusage: {for containerUsage in podMetrics.value.containers
    {\n\t\t\t\t\t\tif containerUsage.name == container.name {\n\t\t\t\t\t\t\tcpu:
    \   containerUsage.usage.cpu\n\t\t\t\t\t\t\tmemory: containerUsage.usage.memory\n\t\t\t\t\t\t}\n\t\t\t\t\t}}\n\t\t\t\t}\n\t\t\t}\n\t\t\tif
    pod.value.status.containerStatuses != _|_ {\n\t\t\t\tstatus: {for containerStatus
    in pod.value.status.containerStatuses if containerStatus.name == container.name
    {\n\t\t\t\t\tstate:        containerStatus.state\n\t\t\t\t\trestartCount: containerStatus.restartCount\n\t\t\t\t}}\n\t\t\t}\n\t\t}]\n\t\tif
    eventList.err == _|_ {\n\t\t\tevents: eventList.list\n\t\t}\n\t}\n\tif pod.err
    != _|_ {\n\t\terror: pod.err\n\t}\n}\n"
kind: ConfigMap
metadata:
  creationTimestamp: null
  name: pod-view
  namespace: vela-system

---
apiVersion: v1
data:
  template: "import (\n\t\"vela/ql\"\n)\n\nparameter: {\n\tappName:    string\n\tappNs:
    \     string\n\tname?:      string\n\tcluster?:   string\n\tclusterNs?: string\n}\n\nresult:
    ql.#CollectServices & {\n\tapp: {\n\t\tname:      parameter.appName\n\t\tnamespace:
    parameter.appNs\n\t\tfilter: {\n\t\t\tif parameter.cluster != _|_ {\n\t\t\t\tcluster:
    parameter.cluster\n\t\t\t}\n\t\t\tif parameter.clusterNs != _|_ {\n\t\t\t\tclusterNamespace:
    parameter.clusterNs\n\t\t\t}\n\t\t\tif parameter.name != _|_ {\n\t\t\t\tcomponents:
    [parameter.name]\n\t\t\t}\n\t\t}\n\t}\n}\n\nif result.err == _|_ {\n\tstatus:
    {\n\t\tservices: result.list\n\t}\n}\n\nif result.err != _|_ {\n\tstatus: {\n\t\terror:
    result.err\n\t}\n}\n"
kind: ConfigMap
metadata:
  creationTimestamp: null
  name: component-service-view
  namespace: vela-system
```
</details>

You can install the addon by one command like:

```
vela addon enable velaux --dry-run | kubectl apply -f -
```

:::caution
Use dry-run can render YAML results and you will also lose the validation such as vela-core version check, dependency, etc. Make sure the version you used can match to your Kubernetes clusters.
:::

### Get addon info

If you want to check the detail status of an addon, or get more available parameters and other useful info of an addon, you can use command `addon status`. For example:

```shell
vela addon enable velaux --verbose
```

<details>
<summary>expected output</summary>

```shell
velaux: disabled 
KubeVela User Experience (UX). An extensible, application-oriented delivery and management Dashboard.
==> Registry Name
KubeVela
==> Available Versions
[v1.4.3, v1.4.2, v1.4.0, v1.4.0-beta.2, v1.3.6, v1.3.4, v1.3.3, v1.3.2, ...]
==> Dependencies ✔
[]
==> Parameters
-> dbType: Specify the database type, current support KubeAPI(default) and MongoDB.
        default: "kubeapi"
        required: ✔
-> dbURL: Specify the MongoDB URL. it only enabled where DB type is MongoDB.
-> gatewayDriver: Specify the gateway type.
        default: "nginx"
        required: ✔
-> imagePullSecrets: Specify the names of imagePullSecret for private image registry, eg. "{a,b,c}"
-> serviceType: Specify the service type.
        default: "ClusterIP"
        required: ✔
-> database: Specify the database name, for the kubeapi db type, it represents namespace.
-> dex: Specify whether to enable the dex
        default: "false"
        required: ✔
-> domain: Specify the domain, if set, ingress will be created if the gateway driver is nginx.
-> repo: Specify the image hub of velaux, eg. "acr.kubevela.net"
-> serviceAccountName: Specify the serviceAccountName for apiserver
        default: "kubevela-vela-core"
        required: ✔
```
</details>

As above shows, these infos contain the available parameters, available versions, dependent addons and description of and addon.

### Discover the capabilities installed

:::tip
Once addon installed, end user can discover and use these capabilities immediately.
:::

* Generally, end user can list the new component or trait types added by `vela component` or `vela trait`. Refer to [Lifecycle of a Definition](../../getting-started/definition#lifecycle-of-a-definition) for more usage details.

* You can also check the capability details of [community addon docs](../../reference/addons/overview).

### Uninstall Addon

:::danger
Please make sure the addon along with its capabilities is no longer used in any of your applications before uninstalling it.
:::

```shell
vela addon disable fluxcd
```

<details>
<summary>expected output</summary>

```shell
Successfully disable addon:fluxcd
```
</details>

### Manage Addon Registry

You can also manage the addon registries, such as adding/deleting your private addon registry.
Let's take the experimental community registry as example.

* List your current registries

```
vela addon registry list 
```

<details>
<summary>expected output</summary>

```shell
Name            Type    URL                        
KubeVela        helm    https://addons.kubevela.net
```
</details>

* Add a new registry

```
vela addon registry add experimental --type=helm --endpoint=https://addons.kubevela.net/experimental/
```

<details>
<summary>expected output</summary>

```
Successfully add an addon registry experimental
```
</details>

* Delete one registry

```
vela addon registry delete experimental
```

<details>
<summary>expected output</summary>

```
Successfully delete an addon registry experimental
```
</details>

* Build custom registry

  You can use ChartMuseum to build your custom addon registry. We have a ChartMuseum addon available. Please refer to [*Build your Own Registry*](../../platform-engineers/addon/addon-registry) for details.

### Make your own addon

If you're a system infra or operator, you can refer to extension documents to learn how to [make your own addon and registry](../../platform-engineers/addon/intro), including [extend cloud resources by addon](../../platform-engineers/addon/terraform).

:::tip
Here's a blog introduces [how to build addon from scratch using redis operator as example](/blog/2022/10/18/building-addon-introduction), you can read it as an end to end tutorial!
:::


## Extend KubeVela as a Developer

If you're extremely interested in KubeVela, you can also extend more features as a developer.

- KubeVela use CUE as it's core engine, [learn Manage Definition with CUE](../../platform-engineers/cue/basic) and try to extend capabilities with definitions.
- Read the [developer guide](../../contributor/overview) to learn how to contribute and extend capabilities for KubeVela.

Welcome to join the KubeVela community! We're eager to see you to contribute your extension.
