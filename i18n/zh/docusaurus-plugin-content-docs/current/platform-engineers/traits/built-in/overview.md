---
title: 特征总览
---

```
$ vela traits
NAME                    	NAMESPACE  	APPLIES-TO      	CONFLICTS-WITH	POD-DISRUPTIVE	DESCRIPTION
annotations             	vela-system	*               	              	true          	Add annotations on K8s pod for your workload which follows
                        	           	                	              	              	the pod spec in path 'spec.template'.
configmap               	vela-system	*               	              	true          	Create/Attach configmaps on K8s pod for your workload which
                        	           	                	              	              	follows the pod spec in path 'spec.template'.
cpuscaler               	vela-system	deployments.apps	              	false         	Automatically scale the component based on CPU usage.
env                     	vela-system	*               	              	false         	add env on K8s pod for your workload which follows the pod
                        	           	                	              	              	spec in path 'spec.template.'
expose                  	vela-system	                	              	false         	Expose port to enable web traffic for your component.
hostalias               	vela-system	*               	              	false         	Add host aliases on K8s pod for your workload which follows
                        	           	                	              	              	the pod spec in path 'spec.template'.
ingress                 	vela-system	                	              	false         	Enable public web traffic for the component.
ingress-1-20            	vela-system	                	              	false         	Enable public web traffic for the component, the ingress API
                        	           	                	              	              	matches K8s v1.20+.
init-container          	vela-system	deployments.apps	              	true          	add an init container and use shared volume with pod
kustomize-json-patch    	vela-system	                	              	false         	A list of JSON6902 patch to selected target
kustomize-patch         	vela-system	                	              	false         	A list of StrategicMerge or JSON6902 patch to selected
                        	           	                	              	              	target
kustomize-strategy-merge	vela-system	                	              	false         	A list of strategic merge to kustomize config
labels                  	vela-system	*               	              	true          	Add labels on K8s pod for your workload which follows the
                        	           	                	              	              	pod spec in path 'spec.template'.
lifecycle               	vela-system	*               	              	true          	Add lifecycle hooks for the first container of K8s pod for
                        	           	                	              	              	your workload which follows the pod spec in path
                        	           	                	              	              	'spec.template'.
node-affinity           	vela-system	*               	              	true          	affinity specify node affinity and toleration on K8s pod for
                        	           	                	              	              	your workload which follows the pod spec in path
                        	           	                	              	              	'spec.template'.
pvc                     	vela-system	deployments.apps	              	true          	Create a Persistent Volume Claim and mount the PVC as volume
                        	           	                	              	              	to the  first container in the pod
resource                	vela-system	*               	              	true          	Add resource requests and limits on K8s pod for your
                        	           	                	              	              	workload which follows the pod spec in path 'spec.template.'
rollout                 	vela-system	                	              	false         	rollout the component
scaler                  	vela-system	*               	              	false         	Manually scale K8s pod for your workload which follows the
                        	           	                	              	              	pod spec in path 'spec.template'.
service-binding         	vela-system	*               	              	false         	Binding secrets of cloud resources to component env
sidecar                 	vela-system	*               	              	true          	Inject a sidecar container to K8s pod for your workload
                        	           	                	              	              	which follows the pod spec in path 'spec.template'.
volumes                 	vela-system	deployments.apps	              	true          	Add volumes on K8s pod for your workload which follows the
                        	           	                	              	              	pod spec in path 'spec.template'.
```