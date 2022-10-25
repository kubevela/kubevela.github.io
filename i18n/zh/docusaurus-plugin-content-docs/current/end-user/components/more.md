---
title:  获得更多？
---

KubeVela 是可编程的，你可以通过自定义模块轻松地扩展它，主流的方式是通过以下的途径发现、安装新的扩展能力：

## 了解内置的模块能力

KubeVela 安装时就自带了很多开箱即用的功能，可以查看如下手册了解详情：

  - [内置组件](./references)
  - [内置运维特征](../traits/references)
  - [内置策略](../policies/references)
  - [内置工作流步骤](../workflow/built-in-workflow-defs)

## 管理插件

你可以通过安装 KubeVela 的插件（Addon）获取更多的扩展能力。

### 查看所有插件

KubeVela 官方团队维护了一个默认的插件仓库 (https://addons.kubevela.net) ，默认情况下会从这个仓库实时发现。

```shell
vela addon list
```

<details>
<summary>该命令会输出所有插件版本以及你安装的版本</summary>

```
NAME                            REGISTRY        DESCRIPTION                                                                                             AVAILABLE-VERSIONS              STATUS          
ocm-gateway-manager-addon       KubeVela        ocm-gateway-manager-addon is the OCM addon automates the cluster-gateway apiserver.                     [1.3.2, 1.3.0, 1.1.11]          disabled        
rollout                         KubeVela        Provides basic batch publishing capability.                                                             [1.3.0, 1.2.4, 1.2.3]           disabled        
terraform-baidu                 KubeVela        Kubernetes Terraform Controller Provider for Baidu Cloud                                                [1.0.1, 1.0.0]                  disabled        
terraform-tencent               KubeVela        Kubernetes Terraform Controller Provider for Tencent Cloud                                              [1.0.1, 1.0.0]                  disabled        
model-serving                   KubeVela        Enable serving for models                                                                               [1.0.0]                         disabled        
model-training                  KubeVela        Enable training for models                                                                              [1.0.0]                         disabled        
terraform                       KubeVela        Terraform Controller is a Kubernetes Controller for Terraform.                                          [1.0.6]                         disabled        
terraform-aws                   KubeVela        Kubernetes Terraform Controller for AWS                                                                 [1.0.1, 1.0.0]                  disabled        
terraform-azure                 KubeVela        Kubernetes Terraform Controller for Azure                                                               [1.0.1, 1.0.0]                  disabled        
terraform-gcp                   KubeVela        Kubernetes Terraform Controller Provider for Google Cloud Platform                                      [1.0.1, 1.0.0]                  disabled        
dex                             KubeVela        Enable dex for login                                                                                    [0.6.5]                         disabled        
ocm-hub-control-plane           KubeVela        ocm-hub-control-plane can install OCM hub control plane to the central cluster.                         [0.6.0]                         disabled        
terraform-ucloud                KubeVela        Kubernetes Terraform Controller Provider for UCloud                                                     [1.0.1, 1.0.0]                  disabled        
fluxcd                          KubeVela        Extended workload to do continuous and progressive delivery                                             [1.1.0, 1.0.0]                  disabled
velaux                          KubeVela        KubeVela User Experience (UX). An extensible, application-oriented delivery and management Dashboard.   [v1.3.0, v1.3.0-beta.2, 1.2.4]  enabled (v1.3.0)
terraform-alibaba               KubeVela        Kubernetes Terraform Controller for Alibaba Cloud                                                       [1.0.2, 1.0.1]                  disabled    
```
</details>

### 安装插件

#### 命令行安装

最简单的安装命令如下：

```
vela addon enable fluxcd
```

<details>
<summary>期望输出</summary>

```
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

#### 安装特定版本的插件

你可以通过通过设置 `--version` 启动参数，来指定安装插件的某个特定版本。例如：

```shell
vela addon enable fluxcd --version=1.0.0
```

如果不指定该参数，默认会安装此插件的最新版本。

启用一个插件时，默认会在所有子集群中安装该插件，你也可以通过设置 `--cluster` 启动参数选择安装在某些集群当中。例如：

```shell
vela addon enable <addon-name> --clusters={cluster1,cluster2}
```

某些插件支持在启用时设置一些参数。例如 `velaux` 插件支持通过设置  `repo` 参数使用其他的镜像仓库。你就可以通过以下命令设置使用你自己的镜像仓库：

```shell
vela addon enable velaux repo=<your repo address>
```

#### 离线安装插件

如果因为某些原因，你的环境无法通过访问插件包仓库，你可以通过指定本地的插件包目录来进行离线安装。如下所示：

```
$ ls
README.md           fluxcd              ocm-cluster-manager terraform           terraform-alibaba   terraform-aws       terraform-azure     velaux

$ vela addon enable velaux/
Addon: velaux enabled Successfully
```

需要注意的是，在安装插件过程当中，仍可能需要从网络中拉取镜像或者 helm chart，如果你的网络环境同样无法访问这些地址，请参考[文档](../../platform-engineers/system-operation/enable-addon-offline)进行完整的离线安装。

#### 通过 UI 安装插件

具有插件管理权限的用户可以进入插件管理页面，进行插件启用/停用等操作。

![addon list](https://static.kubevela.net/images/1.3/addon-list.jpg)

如上图所示，在插件列表中，你可以查看到插件启用状态和其他基础信息。点击插件名称可以进入到插件详情页面，你可以查询到插件的版本列表，提供的扩展类型和介绍信息。

![addon detail](https://static.kubevela.net/images/1.3/addon-detail.jpg)

选择一个部署版本（默认为最新），设置需要部署的集群后，你可以点击 启用 按钮安装该插件。对于已启用的插件，如果没有应用使用该插件提供的扩展，你可以点击禁用按钮来卸载它。

#### 通过 YAML 或 kubectl 命令行安装插件

如果你想通过 Kubernetes YAML 的方式安装插件或者使用 kubectl 命令行安装插件，你可以通过如下命令将 addon 变成 YAML 渲染出来。

```shell
vela addon enable velaux --dry-run
```

<details>
<summary>期望输出</summary>

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

可以直接通过下面一行命令直接部署验证：

```
vela addon enable velaux --dry-run | kubectl apply -f -
```

:::caution
使用 dry-run 生成的 YAML 虽然可以直接部署，但是会损失 addon 命令行中对版本的检验和依赖检查等保护，请确保你使用的是合适的插件版本。
:::

### 获取插件详情

如果你想获取插件的详细信息，或者查看插件支持哪些启用参数等其他信息，你就可以用 `addon status` 的命令。 例如：

```shell
vela addon enable velaux --verbose
```

<details>
<summary>期望输出</summary>

```
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

如上所示， 命令结果包含了一个插件的参数详细信息，可用版本，依赖的其他的插件等信息。

安装完成后，插件中的功能会以组件，运维特征，工作流步骤等形式呈现，你可以通过 `vela component`，`vela trait` 等命令查看新增的能力，也可以在[插件的参考文档](../../reference/addons/overview)中查看每个官方插件对应的能力.

### 删除/卸载已安装的插件

:::caution
删除前请确认插件对应的能力没有被任何应用使用。
:::

```
$ vela addon disable fluxcd
Successfully disable addon:fluxcd
```

### 查看插件的下载仓库

```
vela addon registry list 
```

<details>
<summary>期望输出</summary>

```
Name            Type    URL                        
KubeVela        helm    https://addons.kubevela.net
```
</details>

KubeVela 社区在 Github 上维护了一个官方的[正式插件包仓库](https://github.com/kubevela/catalog/tree/master/addons) 和一个[试验阶段插件包仓库](https://github.com/kubevela/catalog/tree/master/experimental) 。你在相应的仓库中找到插件包的定义文件。

同时这些文件会被同步到 [对象存储](https://addons.kubevela.net) 当中，以加快下载速度。

### 添加插件包仓库

你可以添加自己的插件包仓库，目前支持 OSS 和 Github 两种仓库类型。

```
vela addon registry add experimental --type OSS --endpoint=https://addons.kubevela.net --path=experimental/
```

<details>
<summary>期望输出</summary>

```
Successfully add an addon registry experimental
```
</details>

### 删除一个插件包仓库

```
vela addon registry delete experimental
```

<details>
<summary>期望输出</summary>

```
Successfully delete an addon registry experimental
```
</details>

### 多集群环境中启用插件包

如果你的环境中添加了若干个子集群，启用插件包时会默认在管控集群和所有子集群中安装此插件包。但如果子集群在某个插件包启用之后加入环境当中，则需要通过升级操作在新加入集群中安装此插件包。如下所示

```
vela addon upgrade velaux
```

<details>
<summary>期望输出</summary>

```
Addon: 
 enabled Successfully
```
</details>



### 编写自己的插件包

- 参考博客教程[手把手教你制作一个 Redis 插件](/zh/blog/2022/10/18/building-addon-introduction)。
- 参考[插件包制作文档](../../platform-engineers/addon/intro)了解插件的功能细节。

## 作为开发者自定义和扩展

如果你对 KubeVela 扩展很感兴趣，你也可以了解 [CUE 体系](../../platform-engineers/cue/basic)开始自定义扩展能力，KubeVela 具备非常灵活的扩展能力。

非常欢迎广大开发者们阅读[开发者手册](../../contributor/overview)，了解更多的 KubeVela 细节，参与到社区的贡献中来。
 