---
title:  自定义运维特征
---

本节，我们将为作为平台管理员的你，介绍如何自定义运维特征，为用户的组件增添任何需要的运维特征能力。

### 开始之前

请先阅读和理解 [运维特征定义](../oam/x-definition.md#运维特征定义（traitdefinition）)

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

创建成功。这时候，你的用户可以通过 `vela traits` 查看到这个能力：

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

最后只需要把这个自定义的运维特征，放入一个应用部署计划（Application）进行部署，就完成了应用交付的整个流程：

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
        - type: ingress
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

以上是一个示例，你可以继续自定义其它需要的 Kubernetes 资源来提供给你的用户。

请注意：这种自定义运维特征的方式中，是无法设置诸如 `annotations` 这样的元信息(metadata)，来作为运维特征属性的。也就是说，当你只想直接引入自己的 CRD 资源或者控制器作为运维特征时，可以遵循这种做法。

#### 使用 CUE 来自定义运维特征

The recommended approach is defining a CUE based schematic for trait as well. In this case, it comes with abstraction and you have full flexibility to templating any resources and fields as you want. Note that KubeVela requires all traits MUST be defined in `outputs` section (not `output`) in CUE template with format as below:

```cue
outputs: <unique-name>: 
  <full template data>
```

Below is an example for `ingress` trait.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: TraitDefinition
metadata:
  name: ingress
spec:
  podDisruptive: false
  schematic:
    cue:
      template: |
        parameter: {
        	domain: string
        	http: [string]: int
        }

        // trait template can have multiple outputs in one trait
        outputs: service: {
        	apiVersion: "v1"
        	kind:       "Service"
        	spec: {
        		selector:
        			app: context.name
        		ports: [
        			for k, v in parameter.http {
        				port:       v
        				targetPort: v
        			},
        		]
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

Let's attach this trait to a component instance in `Application`:

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
        - type: ingress
          properties:
            domain: test.my.domain
            http:
              "/api": 8080
```

CUE based trait definitions can also enable many other advanced scenarios such as patching and data passing. They will be explained in detail in the following documentations.