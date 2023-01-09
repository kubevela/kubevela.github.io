---
title: "云边协同下的统一应用管理 基于 OpenYurt 和 KubeVela 的解决方案"
author: 乔中沛
author_title: KubeVela 团队
author_url: https://github.com/chivalryq
author_image_url: https://avatars.githubusercontent.com/u/47812250?v=4
tags: [ KubeVela, OpenYurt, edge, "use-case" ]
description: "本文将介绍 KubeVela 和 OpenYurt, 并在实际的 Helm Chart 交付场景中介绍云边缘协作解决方案。"
image: https://raw.githubusercontent.com/oam-dev/KubeVela.io/main/docs/resources/KubeVela-03.png
hide_table_of_contents: false
---

## 背景
随着万物互联场景的逐渐普及，边缘设备的算力也不断增强，如何借助云计算的优势满足复杂多样化的边缘应用场景，让云原生技术延伸到端和边缘成为了新的技术挑战，“云边协同”正在逐渐成为新的技术焦点。本文将围绕 CNCF 的两大开源项目 KubeVela 和 OpenYurt，以一个实际的 Helm 应用交付的场景，为大家介绍云边协同的解决方案。
OpenYurt 专注于以无侵入的方式将 Kubernetes 扩展到边缘计算领域。OpenYurt 依托原生 Kubernetes 的容器编排、调度能力，将边缘算力纳入到 Kubernetes 基础设施中统一管理，提供了诸如边缘自治、高效运维通道、边缘单元化管理、边缘流量拓扑、安全容器、边缘 Serverless/FaaS、异构资源支持等能力。以 Kubernetes 原生的方式为云边协同构建了统一的基础设施。
KubeVela 孵化于 OAM 模型，专注于帮助企业构建统一的应用交付和管理能力，为业务开发者屏蔽底层基础设施复杂度，提供灵活的扩展能力，并提供开箱即用的微服务容器管理、云资源管理、版本化和灰度发布、扩缩容、可观测性、资源依赖编排和数据传递、多集群、CI 对接、GitOps 等特性。最大化的提升开发者自助式应用管理的研发效能，提升也满足平台长期演进的扩展性诉求。

## OpenYurt 与 KubeVela 结合能解决什么问题？
如上所述，OpenYurt 满足了边缘节点的接入，让用户可以通过操作原生 Kubernetes 的方式管理边缘节点。边缘节点通常用来表示距离用户更近的计算资源，比如某个就近机房中的虚拟机或物理服务器等，通过 OpenYurt 加入后，这些边缘节点会转化为 Kubernetes 中可以使用的节点（Node）。OpenYurt 用节点池（NodePool）来描述同一地域的一组边缘节点。在满足了基本的资源管理后，针对应用如何编排部署到一个集群中的不同节点池，我们通常会有如下核心需求：

1. **统一配置**: 如果对每一份要下发的资源做手动修改，需要很多人工介入，非常容易出错和遗漏。我们需要统一的方式来做参数配置，不仅可以方便地做批量管理操作，还可以对接安全和审计，满足企业风险控制与合规需求。
2. **差异部署**: 部署到不同节点池的工作负载有大部分属性相同，然而总有个性化的配置差异。关键在于如何设置和节点选择相关的参数，例如`NodeSelector`可以指示 Kubernetes 调度器将工作负载调度到不同的节点池。
3. **可扩展性**: 云原生生态繁荣，无论是工作负载种类还是不同的运维功能都在不断增长，为了更灵活地满足业务需求，我们需要整体的应用架构是可扩展的，能够充分享受云原生生态的红利。

而 KubeVela 在应用层与 OpenYurt 可以很好的互补，满足上述三个核心需求。接下来，我们结合实际的操作流程来展示这些功能点。
## 将应用部署到边缘
我们将以 Ingress 控制器为例，展示如何使用 Kubevela 将应用程序部署到边缘。在这种情况下，我们希望将Nginx Ingress 控制器部署到多个节点池中，以实现通过边缘 Ingress 访问指定节点池提供的服务，某个 Ingress 仅能由所在节点池的 Ingress 控制器处理。
示意图的集群中有两个节点池：北京和上海，他们之间的网络不互通。我们希望再其中每个节点池都部署一个Nginx Ingress Controller，并作为各自节点池的网络流量入口。一个靠近北京的客户端，可以通过访问北京节点池的Ingress Controller，访问北京节点池内提供的服务，且不会访问到上海节点池提供的服务。

![image.png](/img/blog/yurt/nodepool.png)

### Demo 的基础环境
我们将使用 Kubernetes 集群模拟边缘场景。群集有 3 个节点，它们的角色分别是：

- 节点 1：master节点，云端节点
- 节点 2：worker节点，边缘节点，在节点池 `beijing` 中
- 节点 3：worker节点，边缘节点，在节点池 `shanghai` 中
### 准备工作

1. **安装 YurtAppManager**
> YurtAppManager 是 OpenYurt 的核心组件。它提供节点池 CRD 和控制器。OpenYurt 中还有其他组件，但在本教程中我们只需要 YurtAppManager.

```shell
git clone https://github.com/openyurtio/yurt-app-manager
cd yurt-app-manager && helm install yurt-app-manager -n kube-system ./charts/yurt-app-manager/
```

2. **安装 Kubevela，启用 FluxCD 插件。**

安装 Vela 命令行工具，并在集群中安装 KubeVela。
```yaml
curl -fsSl https://kubevela.net/script/install.sh | bash
vela install
```
在本案例中，为了复用社区提供的成熟的 Helm Chart，我们用 Helm 类型的组件来安装 Nginx Ingress Controller。在微内核设计的 KubeVela 中，Helm 类型的组件是由 FluxCD 插件提供的，下面启用 [FluxCD 插件](https://kubevela.net/zh/docs/reference/addons/fluxcd)。
```shell
vela addon enable fluxcd
```

3. **准备节点池**

创建两个节点池：北京节点池和上海节点池。在实际的边缘场景中，以地域划分节点池是常见的模式。不同分组的节点间往往存在网络不互通、资源不共享、资源异构、应用独立等明显的隔离属性。这也是节点池概念的由来。在OpenYurt中，通过节点池、服务拓扑等功能帮助用户处理上述问题。今天的例子中我们将使用节点池来描述和管理节点。
```shell
kubectl apply -f - <<EOF
apiVersion: apps.openyurt.io/v1beta1
kind: NodePool
metadata:
  name: beijing
spec:
  type: Edge
  annotations:
    apps.openyurt.io/example: test-beijing
  taints:
    - key: apps.openyurt.io/example
      value: beijing
      effect: NoSchedule
---
apiVersion: apps.openyurt.io/v1beta1
kind: NodePool
metadata:
  name: shanghai
spec:
  type: Edge
  annotations:
    apps.openyurt.io/example: test-shanghai
  taints:
    - key: apps.openyurt.io/example
      value: shanghai
      effect: NoSchedule
EOF
```
将节点添加到各自的节点池
```shell
kubectl label node <node1> apps.openyurt.io/desired-nodepool=beijing
kubectl label node <node2> apps.openyurt.io/desired-nodepool=shanghai
```
```shell
kubectl get nodepool
```
预期输出
```shell
NAME       TYPE   READYNODES   NOTREADYNODES   AGE
beijing    Edge   1            0               6m2s
shanghai   Edge   1            0               6m1s
```
### 批量部署边缘应用
在我们深入细节之前，让我们看看 KubeVela 是如何描述部署到边缘的应用的。通过下面这个应用，我们可以将Nginx Ingress Controller部署多份到各自的边缘节点池。使用同一个应用来**统一配置 **Nginx Ingress 可以**消除重复，降低管理负担，也方便后续对集群内的组件统一进行发布运维等常见操作**。
```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: edge-ingress
spec:
  components:
    - name: ingress-nginx
      type: helm
      properties:
        chart: ingress-nginx
        url: https://kubernetes.github.io/ingress-nginx
        repoType: helm
        version: 4.3.0
        values:
          controller:
            service:
              type: NodePort
            admissionWebhooks:
              enabled: false
      traits:
        - type: edge-nginx
  policies:
    - name: replication
      type: replication
      properties:
        selector: [ "ingress-nginx" ]
        keys: [ "beijing","shanghai" ]
  workflow:
    steps:
      - name: deploy
        type: deploy
        properties:
          policies: ["replication"]
```

一个 KubeVela Application 有 3 个部分：

1. 一个 `helm` 类型组件。它描述了我们想要安装到集群的 Helm 包版本。此外，我们给这个组件附加了一个运维特征（trait）`edge-nginx` 。我们稍后将展示这个运维特征的具体情况，现在你可以将其视为一个包含不同节点池的属性的补丁。
2. 一个 `replication` （组件分裂）策略。它描述了如何将组件复制到不同的节点池。该 `selector` 字段用于选择需要复制的组件。它的 `keys` 字段将把一个组件转换为具有不同 key 的两个组件。（“beijing”和“shanghai”）
3. `deploy` 工作流步骤。它描述了如何部署应用程序。它指定 `replication` 策略执行复制工作的策略。
> 注意：
> 1. 如果你希望此应用程序正常工作，请先在集群下发在下文介绍的 `edge-ingress` 特性。
> 2. `deploy` 是一个 KubeVela 内置的工作流程步骤。它还可以在[多集群场景](../case-studies/multi-cluster)中与`override`、`topology` 策略一起使用 。

现在，我们可以将应用下发到集群。
```shell
vela up -f app.yaml
```
检查应用状态和 Kubevela 创建的资源。
```shell
vela status edge-ingress --tree --detail
```
预期输出
```shell
CLUSTER       NAMESPACE     RESOURCE                           STATUS    APPLY_TIME          DETAIL
local  ─── default─┬─ HelmRelease/ingress-nginx-beijing  updated   2022-11-02 12:00:24 Ready: True  Status: Release reconciliation succeeded  Age: 153m
                   ├─ HelmRelease/ingress-nginx-shanghai updated   2022-11-02 12:00:24 Ready: True  Status: Release reconciliation succeeded  Age: 153m
                   └─ HelmRepository/ingress-nginx       updated   2022-11-02 12:00:24 URL: https://kubernetes.github.io/ingress-nginx  Age: 153m
                                                                                         Ready: True
                                                                                         Status: stored artifact for revision '7bce426c58aee962d479ca84e5c
                                                                                         fc6931c19c8995e31638668cb958d4a3486c2'
```
Vela CLI 不仅可以站在较高层次统一汇集展示应用健康状态，当需要的时候，Vela CLI 也可以帮助你穿透应用，直达底层工作负载，并提供丰富的观测和 Debug 能力，例如，你可以通过`vela logs`把打印应用的日志；可以通过`vela port-forward`把部署应用的端口转发到本地；可以通过 `vela exec` 命令，深入到边缘的容器中执行 Shell 命令排查问题。
如果你想更直观地了解应用去情况，KubeVela 官方还提供了 Web 控制台插件 VelaUX。[启用 VelaUX 插件](https://kubevela.net/zh/docs/reference/addons/velaux)，你可以查看更详细的资源拓扑。
```shell
vela addon enable velaux
```

![image.png](/img/blog/yurt/velaux.png)

正如你所看到的，Kubevela 创建了两个 `HelmRelease` 资源，把 Nginx Ingress Controller 的 Helm Chart 交付到两个节点池。`HelmRelease`资源被上述 FluxCD 插件处理并在集群**两个节点池中**分别安装了 Nginx Ingress。通过以下命令，检查是否在北京节点池中创建了 Ingress Controller 的 Pod，上海节点池同理。
```shell
$ kubectl get node -l  apps.openyurt.io/nodepool=beijing                               
NAME                      STATUS   ROLES    AGE   VERSION
iz0xi0r2pe51he3z8pz1ekz   Ready    <none>   23h   v1.24.7+k3s1

$ kubectl get pod ingress-nginx-beijing-controller-c4c7cbf64-xthlp -oyaml|grep iz0xi0r2pe51he3z8pz1ekz
  nodeName: iz0xi0r2pe51he3z8pz1ekz
```
### 差异化部署
KubeVela 应用交付过程中如何实现了同一个组件的差异化部署？让我们继续深入了解支撑应用的 Trait（运维特征）和 Policy（应用策略）。上文提到我们在工作流中使用了 KubeVela 内置的组件分裂（replication） Policy，给 ingress-nginx 组件附加了一个自定义的 `edge-nginx` Trait。

- 组件分裂 Policy 将组件**拆为两个组件**，带有不同的 `context.replicaKey`。
- `edge-nginx` Trait 使用不同的 `context.replicaKey` ，将带有不同配置值的 Helm Chart 交付到集群中。让两个 Nginx Ingress Controller 运行在不同的节点池，监听具有不同 ingressClass 的 Ingress 资源。具体的方式是 Patch 了 Helm Chart 的 Values 配置，修改了和**节点选择**、**亲和性**以及 **ingressClass** 相关的字段。
- 在 Patch 不同字段时，使用了不同的 [Patch 策略](https://kubevela.net/zh/docs/platform-engineers/traits/patch-trait#patch-strategy)（PatchStrategy），例如使用`retainKeys`策略能够覆盖原本的值，使用`jsonMergePatch`策略则会和原本的值合并。
 
```json
"edge-nginx": {
	type: "trait"
	annotations: {}
	attributes: {
		podDisruptive: true
		appliesToWorkloads: ["helm"]
	}
}
template: {
	patch: {
		// +patchStrategy=retainKeys
		metadata: {
			name: "\(context.name)-\(context.replicaKey)"
		}
		// +patchStrategy=jsonMergePatch
		spec: values: {
			ingressClassByName: true
			controller: {
				ingressClassResource: {
					name:            "nginx-" + context.replicaKey
					controllerValue: "openyurt.io/" + context.replicaKey
				}
				_selector
			}
			defaultBackend: {
				_selector
			}
		}
	}
	_selector: {
		tolerations: [
			{
				key:      "apps.openyurt.io/example"
				operator: "Equal"
				value:    context.replicaKey
			},
		]
		nodeSelector: {
			"apps.openyurt.io/nodepool": context.replicaKey
		}
	}
	parameter: null
}
```
### 当更多应用走向边缘
可以看到，为了将 Nginx Ingress 部署到不同节点池，我们仅自定义了一个四十余行的 Trait 并充分利用了 KubeVela 内置的能力。在云原生生态愈加繁荣和云边协同的趋势下，**更多的应用**都可能走向边缘部署。当新场景中需要一个新的应用部署在边缘节点池时，也无需烦恼，因为在 KubeVela 的帮助下，仿照该模式扩展出一个新的边缘应用部署 Trait 也很容易，**无需编写代码**。
例如，我们希望将 K8s 社区近期的演进热点 [Gateway API](https://gateway-api.sigs.k8s.io/) 的实现也部署到边缘，通过 Gateway API 增强边缘节点池暴露服务的表达能力、扩展性，在边缘节点使用基于角色的网络 API 等。对于这种场景，我们也可以基于上述扩展方式轻松完成部署任务，只需要定义如下的一个新 Trait。
```yaml
"gateway-nginx": {
	type: "trait"
	annotations: {}
	attributes: {
		podDisruptive: true
		appliesToWorkloads: ["helm"]
	}
}

template: {
	patch: {
		// +patchStrategy=retainKeys
		metadata: {
			name: "\(context.name)-\(context.replicaKey)"
		}
		// +patchStrategy=jsonMergePatch
		spec: values: {
			_selector
			fullnameOverride: "nginx-gateway-nginx-" + context.replicaKey
			gatewayClass: {
				name:           "nginx" + context.replicaKey
				controllerName: "k8s-gateway-nginx.nginx.org/nginx-gateway-nginx-controller-" + context.replicaKey
			}
		}
	}
	_selector: {
		tolerations: [
			{
				key:      "apps.openyurt.io/example"
				operator: "Equal"
				value:    context.replicaKey
			},
		]
		nodeSelector: {
			"apps.openyurt.io/nodepool": context.replicaKey
		}
	}
	parameter: null
}
```
这个 Trait 和前文提到的部署 Nginx Ingress 使用的 Trait 非常相似，其中，我们也同样对 Nginx Gateway Chart 的 Values 做了一些相似的 Patch，包括节点选择、亲和性、资源名称。和前文 Trait 的区别是该 Trait 指定了 gatewayClass 而非 IngressClass。该案例的 Trait 和应用文件详见 [GitHub 仓库](https://github.com/chivalryq/yurt-vela-example/tree/main/gateway-nginx)。通过自定义这样一个 Trait，我们就给集群扩展了部署一种新应用到边缘的能力。
如果我们无法预知未来边缘计算的发展带来的更多应用部署需求，至少我们可以通过这种更容易扩展的方式不断适应新的场景。
## KubeVela 如何解决了边缘部署难题
回顾 Kubevela 是如何解决文章开始提出的关键问题的。

1. **统一配置**：我们使用一个组件来描述要部署的 ingress-nginx Helm Chart 的通用的属性例如 Helm 仓库、Chart 名称、版本等统一配置。
2. **属性差异**：Kubevela 使用了一个用户自定义的运维特征定义，它描述下发到不同的节点池的 Helm 配置差异。该运维特征可以重复用于部署相同的 Helm Chart。
3. **可扩展性**：Kubevela 可以为常见的工作负载（如 Deployment/StatefulSet）或其他打包方式（如 Helm/Kustomize/...）以可编程的方式进行扩展，只需若干行的代码，即可将一种新应用推向边缘场景。

这些得益于 KubeVela 在应用交付和管理领域提供的强大功能，KubeVela 除了能在单个集群内部解决应用的定义、交付、运维和可观测问题，还原生支持了**多集群模式**的应用发布和管理。目前适合边缘计算场景的 Kubernetes 部署模式并无定式，无论单集群+边缘节点池的架构，还是多边缘集群架构，KubeVela 都能胜任其中的应用管理任务。
在 OpenYurt 和 KubeVela 的配合下，云边应用以统一方式部署，共享相同的抽象、运维、可观测能力，避免了在不同场景中割裂的体验。并且云端应用和边端应用都得以使用 KubeVela 以插件形式不断集成的云原生生态的优秀实践。未来 KubeVela 社区还将不断丰富开箱即用的系统插件，持续交付更好用、更易用的应用交付和管理能力。
如果想了解更多应用部署、管理的能力，可以阅读 [KubeVela 官方文档](https://kubevela.net)，想要了解 KubeVela [社区](https://github.com/kubevela/community)的最新动态，欢迎来到 KubeVela 社区（钉钉群 23310022）参与讨论！若你对 OpenYurt 感兴趣，也欢迎来到 OpenYurt 社区（钉钉群 31993519）参与讨论。
