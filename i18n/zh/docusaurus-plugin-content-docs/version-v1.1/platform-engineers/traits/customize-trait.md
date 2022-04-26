---
title:  自定义运维特征
---


本节介绍如何自定义运维特征，为用户的组件增添任何需要的运维特征能力。

### 开始之前

请先阅读和理解 [运维特征定义](../oam/x-definition#运维特征定义（TraitDefinition）)

### 如何使用

我们首先为你展示一个简单的示例，比如直接引用已有的 Kubernetes API 资源 Ingress。来编写一个下面这样的 YAML 文件：


```yaml
apiVersion: core.oam.dev/v1beta1
kind: TraitDefinition
metadata:
  name: customize-ingress
spec:
  definitionRef:
    name: ingresses.networking.k8s.io
```

为了和我们已经内置的 ingress 有所区分，我们将其命名为 `customize-ingress`。然后我们部署到运行时集群：

```
$ kubectl apply -f customize-ingress.yaml 
traitdefinition.core.oam.dev/customize-ingress created
```

创建成功。这时候，你的用户可以通过 `vela traits` 查看到这个能力：

```
$ vela traits
NAME             	NAMESPACE  	APPLIES-TO       	CONFLICTS-WITH	POD-DISRUPTIVE	DESCRIPTION                                          
customize-ingress	default    	                 	              	false         	description not defined                              
ingress          	default    	                 	              	false         	description not defined                              
annotations      	vela-system	deployments.apps 	              	true          	Add annotations for your Workload.                   
configmap        	vela-system	deployments.apps 	              	true          	Create/Attach configmaps to workloads.               
cpuscaler        	vela-system	deployments.apps 	              	false         	Automatically scale the component based on CPU usage.
expose           	vela-system	deployments.apps 	              	false         	Expose port to enable web traffic for your component.
hostalias        	vela-system	deployment.apps  	              	false         	Add host aliases to workloads.                       
labels           	vela-system	deployments.apps 	              	true          	Add labels for your Workload.                        
lifecycle        	vela-system	deployments.apps 	              	true          	Add lifecycle hooks to workloads.                    
resource         	vela-system	deployments.apps 	              	true          	Add resource requests and limits to workloads.       
rollout          	vela-system	                 	              	false         	rollout the component                                
scaler           	vela-system	deployments.apps 	              	false         	Manually scale the component.                        
service-binding  	vela-system	webservice,worker	              	false         	Binding secrets of cloud resources to component env  
sidecar          	vela-system	deployments.apps 	              	true          	Inject a sidecar container to the component.         
volumes          	vela-system	deployments.apps 	              	true          	Add volumes for your Workload.      
```

最后用户只需要把这个自定义的运维特征，放入一个与之匹配的组件中进行使用即可：


```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: testapp
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        cmd:
          - node
          - server.js
        image: oamdev/testapp:v1
        port: 8080
      traits:
        - type: customize-ingress
          properties:
            rules:
            - http:
                paths:
                - path: /testpath
                  pathType: Prefix
                  backend:
                    service:
                      name: test
                      port:
                        number: 80
```

参照上面的开发过程，你可以继续自定义其它需要的 Kubernetes 资源来提供给你的用户。

请注意：这种自定义运维特征的方式中，是无法设置诸如 `annotations` 这样的元信息(metadata)，来作为运维特征属性的。也就是说，当你只想简单引入自己的 CRD 资源或者控制器作为运维特征时，可以遵循这种做法。

#### 使用 CUE 来自定义运维特征

我们更推荐你使用 CUE 模版来自定义运维特征。这种方法给你可以模版化任何资源和资源的灵活性。比如，我们可以组合自定义 `Service` 和 `ingeress` 成为一个运维特征来使用。

在用法上，你需要把所有的运维特征定义在 `outputs` 里(注意，不是 `output`)，格式如下：


```cue
outputs: <unique-name>: 
  <full template data>
```

我们下面同样使用一个 `ingress` 和 `Service` 的示例进行讲解：


```yaml
apiVersion: core.oam.dev/v1beta1
kind: TraitDefinition
metadata:
  name: cue-ingress
spec:
  podDisruptive: false
  schematic:
    cue:
      template: |
        parameter: {
        	domain: string
        	http: [string]: int
        }

        // 我们可以在一个运维特征 CUE 模版定义多个 outputs
        outputs: service: {
        	apiVersion: "v1"
        	kind:       "Service"
          metadata: {
            annotations: {
              address-type: "intranet"
            }
          }
        	spec: {
        		selector:
        			app: context.name
        		ports: [
        			for k, v in parameter.http {
        				port:       v
        				targetPort: v
        			},
        		]

            type: "LoadBalancer"
        	}
        }

        outputs: ingress: {
        	apiVersion: "networking.k8s.io/v1beta1"
        	kind:       "Ingress"
        	metadata:
        		name: context.name
        	spec: {
        		rules: [{
        			host: parameter.domain
        			http: {
        				paths: [
        					for k, v in parameter.http {
        						path: k
        						backend: {
        							serviceName: context.name
        							servicePort: v
        						}
        					},
        				]
        			}
        		}]
        	}
        }
```

可以看到，`parameter` 字段让我们可以自由自定义和传递业务参数。同时在 `metadata` 的 `annotations` 里可以标记任何你们需要的信息，我们上文的例子里标记了 `Service` 是一个给内网使用的负载均衡。

接下来我们把这个 cue-ingress YMAL 部署到运行时集群，成功之后用户同样可以通过 `vela traits` 命令，查看到这个新生成的运维特征：

```shell
$ kubectl apply -f cue-ingress.yaml                
traitdefinition.core.oam.dev/cue-ingress created
$ vela traits                      
NAME           	NAMESPACE  	APPLIES-TO       	CONFLICTS-WITH	POD-DISRUPTIVE	DESCRIPTION                                          
cue-ingress    	default    	                 	              	false         	description not defined                              
ingress        	default    	                 	              	false         	description not defined                              
annotations    	vela-system	deployments.apps 	              	true          	Add annotations for your Workload.                   
configmap      	vela-system	deployments.apps 	              	true          	Create/Attach configmaps to workloads.               
cpuscaler      	vela-system	deployments.apps 	              	false         	Automatically scale the component based on CPU usage.
expose         	vela-system	deployments.apps 	              	false         	Expose port to enable web traffic for your component.
hostalias      	vela-system	deployment.apps  	              	false         	Add host aliases to workloads.                       
labels         	vela-system	deployments.apps 	              	true          	Add labels for your Workload.                        
lifecycle      	vela-system	deployments.apps 	              	true          	Add lifecycle hooks to workloads.                    
resource       	vela-system	deployments.apps 	              	true          	Add resource requests and limits to workloads.       
rollout        	vela-system	                 	              	false         	rollout the component                                
scaler         	vela-system	deployments.apps 	              	false         	Manually scale the component.                        
service-binding	vela-system	webservice,worker	              	false         	Binding secrets of cloud resources to component env  
sidecar        	vela-system	deployments.apps 	              	true          	Inject a sidecar container to the component.         
volumes        	vela-system	deployments.apps 	              	true          	Add volumes for your Workload.        
```

最后用户将这个运维特征放入对应组件，通过应用部署计划完成交付:


```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: testapp
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        cmd:
          - node
          - server.js
        image: oamdev/testapp:v1
        port: 8080
      traits:
        - type: cue-ingress
          properties:
            domain: test.my.domain
            http:
              "/api": 8080
```

基于 CUE 的运维特征定义方式，也提供了满足于更多业务场景的用法，比如给运维特征打补丁、传递数据等等。后面的文档将进一步介绍相关内容。