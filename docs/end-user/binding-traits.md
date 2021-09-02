---
title:  Binding Traits
---

Traits is also one of the core concepts of the application. It acts on the component level and allows you to freely bind various operation and maintenance actions and strategies to the component. For example, configuration gateway, label management and container injection (Sidecar) at the business level, or flexible scaler at the admin level, gray release, etc.

Similar to Component, KubeVela provides a series of out-of-the-box traits, and also allows you to customize and extend other operation and maintenance capabilities with traits.


## KubeVela's Trait


```
$ vela traits
NAME                    	NAMESPACE  	APPLIES-TO      	CONFLICTS-WITH	POD-DISRUPTIVE	DESCRIPTION
annotations             	vela-system	*               	              	true          	Add annotations on K8s pod for your workload which follows
                        	           	                	              	              	the pod spec in path 'spec.template'.
configmap               	vela-system	*               	              	true          	Create/Attach configmaps on K8s pod for your workload which
                        	           	                	              	              	follows the pod spec in path 'spec.template'.
env                     	vela-system	*               	              	false         	add env on K8s pod for your workload which follows the pod
                        	           	                	              	              	spec in path 'spec.template.'
ingress                 	vela-system	                	              	false         	Enable public web traffic for the component.
ingress-1-20            	vela-system	                	              	false         	Enable public web traffic for the component, the ingress API
                        	           	                	              	              	matches K8s v1.20+.
labels                  	vela-system	*               	              	true          	Add labels on K8s pod for your workload which follows the
                        	           	                	              	              	pod spec in path 'spec.template'.
lifecycle               	vela-system	*               	              	true          	Add lifecycle hooks for the first container of K8s pod for
                        	           	                	              	              	your workload which follows the pod spec in path
                        	           	                	              	              	'spec.template'.
rollout                 	vela-system	                	              	false         	rollout the component
sidecar                 	vela-system	*               	              	true          	Inject a sidecar container to K8s pod for your workload
                        	           	                	              	              	which follows the pod spec in path 'spec.template'.
...
```


Below, we will take a few typical traits as examples to introduce the usage of KubeVela Trait.


## Use Ingress to Configure the Gateway


We will configure a gateway for a Web Service component as an example. This component is pulled from the `crccheck/hello-world` image. After setting the gateway, it provides external access through `testsvc.example.com` plus port 8000.


Please directly copy the following Shell code, which will be applied to the cluster:


```shell
cat <<EOF | kubectl apply -f -
# YAML begins
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: ingress-app
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        image: crccheck/hello-world
        port: 8000
      traits:
        - type: ingress
          properties:
            domain: testsvc.example.com
            http:
              "/": 8000
# YAML ends
EOF
```


You can also save the YAML file as ingerss-app.yaml and use the `kubectl apply -f ingerss-app.yaml` command to deploy.


When we see that the status of the application is running and the service is healthy through `vela ls`, it means that the application is fully effective. At the same time, its TRAITS type is also correctly displayed as ingress.


```shell
$ vela ls
APP                 	COMPONENT     	TYPE       	TRAITS 	PHASE  	HEALTHY	STATUS	CREATED-TIME                 
ingerss-app         	express-server	webservice 	ingress	running	healthy	      	2021-08-28 21:49:44 +0800 CST
```


If the status is displayed as rendering, it means that it is still being rendered, or HEALTHY is always false, you need to use `kubectl get application ingress-app -o yaml` to view the error message in the return.


View the information returned:


```shell
$ kubectl get application ingress-app -o yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  ... # Omit non-critical information
spec:
  ... # Omit non-critical information
status:
  ... # Omit non-critical information
  services:
  - healthy: true
    name: express-server
    traits:
    - healthy: true
      message: |
        No loadBalancer found, visiting by using 'vela port-forward ingress-app'
      type: ingress
    workloadDefinition:
      apiVersion: apps/v1
      kind: Deployment
  status: running
```

Then, it is forwarded to the local processing request through vela port-forward ingress-app:
```shell
vela port-forward ingress-app
Forwarding from 127.0.0.1:8000 -> 8000
Forwarding from [::1]:8000 -> 8000

Forward successfully! Opening browser ...
Handling connection for 8000
```
Access service:
```shell
curl -H "Host:testsvc.example.com" http://127.0.0.1:8000/
Hello World


                                       ##         .
                                 ## ## ##        ==
                              ## ## ## ## ##    ===
                           /""""""""""""""""\___/ ===
                      ~~~ {~~ ~~~~ ~~~ ~~~~ ~~ ~ /  ===- ~~~
                           \______ o          _,/
                            \      \       _,'
                             `'--.._\..--''
```


## Attach Labels and Annotations to Component


Labels and Annotations Trait allow you to attach labels and annotations to components, allowing us to trigger the marked components and obtain annotation information on demand when implementing business logic.

First, we prepare an example of an application, please copy and execute it directly:


```shell
cat <<EOF | kubectl apply -f -
# YAML begins
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: labels-annotations
spec:
  components:
    - name: server
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
# YAML ends
EOF
```


In the above business, we define the component named `server`, specify it for stable release through labels, and annotate it to be a business for web applications through annotations.


On the runtime cluster, use the `vela ls` command to check whether the application has been successfully created:


```shell
$ vela ls
APP                 	COMPONENT     	TYPE       	TRAITS 	PHASE  	HEALTHY	STATUS	CREATED-TIME                 
labels-annotations  	server        	webservice 	labels,annotations	running	healthy	      	2021-08-29 20:55:28 +0800 CST
```

Through Kubernetes commands, we can see that the underlying resources have been labeled accordingly:


```
$ kubectl get deployments server -o jsonpath='{.spec.template.metadata.labels}'
{"app.oam.dev/component":"server","release":"stable"}

$ kubectl get deployments server -o jsonpath='{.spec.template.metadata.annotations}'
{"app.oam.dev/component":"server","release":"stable"}
```




## Inject the Container Into the Component (Sidecar)


As the existence of sidecar container decoupling from business container, it can help us with many auxiliary important tasks, such as common log proxy, used to implement Service Mesh, and so on.


Let's write a `log-gen-worker` component in an application. At the same time, we point the log data directory recorded by the sidecar and the component to the same data storage volume `varlog`.

```shell
cat <<EOF | kubectl apply -f -
# YAML begins
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
# YAML ends
EOF
```


Use `vela ls` to check whether the application is successfully deployed:


```shell
$ vela ls
APP                 	COMPONENT     	TYPE       	TRAITS 	PHASE  	HEALTHY	STATUS	CREATED-TIME                 
vela-app-with-sidecar	log-gen-worker	worker     	sidecar           	running	healthy	      	2021-08-29 22:07:07 +0800 CST
```


After success, first to look out the workload generated by the application:


```
$ kubectl get pods -l app.oam.dev/component=log-gen-worker
NAME                              READY   STATUS    RESTARTS   AGE
log-gen-worker-7bb65dcdd6-tpbdh   2/2     Running   0          45s
```




Finally, check the log output by the sidecar, you can see that the sidecar that reads the log has taken effect.


```
kubectl logs -f log-gen-worker-7bb65dcdd6-tpbdh count-log
```


Above, we took several common traits as examples to introduce how to bind traits. For more trait's functions and parameters, please go to built-in Trait view.

## Custom Trait

When the built-in Trait cannot meet your needs, you can freely customize the maintenance capabilities. Please refer to [Custom Trait](../platform-engineers/traits/customize-trait) in the Admin Guide for implementation.

## Next

- [Integrated Cloud Services](./cloud-services), learn how to integrate cloud services from various cloud vendors
- [Rollout & Scaler](./rollout-scaler)