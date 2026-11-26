---
title: Component Orchestration
---

This section will introduce the dependencies in components and how to pass data between components.

## Dependency

We can use `dependsOn` to specify the dependencies between components.

For example, component `api` depends on component `database`:

```yaml
...
components:
  - name: api
    type: webservice
    dependsOn:
      - database
  - name: database
    type: webservice
```

In this case, KubeVela will deploy `database` first, and then deploy `api` once `database` is healthy.

### How to Use

To run MySQL with its root password in a Secret, you need:

1. The Secret with the password.
2. MySQL, deployed after the Secret exists.

Save the following as `mysql.yaml`:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: mysql
  namespace: default
spec:
  components:
    - name: mysql-secret
      type: k8s-objects
      properties:
        objects:
          - apiVersion: v1
            kind: Secret
            metadata:
              name: mysql-secret
            type: Opaque
            stringData:
              ROOT_PASSWORD: test
    - name: mysql
      type: webservice
      dependsOn:
        - mysql-secret
      properties:
        image: mysql:8.4
        ports:
          - port: 3306
            expose: true
        env:
          - name: MYSQL_ROOT_PASSWORD
            valueFrom:
              secretKeyRef:
                name: mysql-secret
                key: ROOT_PASSWORD
```

Apply it:

```shell
vela up -f mysql.yaml
```

### Expected Outcome

Check the application:

```shell
vela ls
```

While MySQL starts, the application is still running its workflow:

```
APP  	COMPONENT   	TYPE       	TRAITS	PHASE          	HEALTHY  	STATUS   	CREATED-TIME
mysql	mysql-secret	k8s-objects	      	runningWorkflow	healthy  	         	2026-11-20 10:09:55 +0000 UTC
└─   	mysql       	webservice 	      	runningWorkflow	unhealthy	Ready:0/1	2026-11-20 10:09:55 +0000 UTC
```

After a while, both components are running. `mysql` was deployed only after `mysql-secret` was healthy:

```
APP  	COMPONENT   	TYPE       	TRAITS	PHASE  	HEALTHY	STATUS   	CREATED-TIME
mysql	mysql-secret	k8s-objects	      	running	healthy	         	2026-11-20 10:09:55 +0000 UTC
└─   	mysql       	webservice 	      	running	healthy	Ready:1/1	2026-11-20 10:09:55 +0000 UTC
```

:::info
`dependsOn` use `healthy` to check status. If the component is `healthy`, then KubeVela will deploy the next component. If you want to customize the healthy status of the component, please refer to [Status Write Back](../../platform-engineers/traits/status.md)
:::

## Inputs and Outputs

In KubeVela, we can use inputs and outputs in Components to pass data.

### Outputs

Outputs is made of `name` and `valueFrom`. Input will use `name` to reference output.

We can write `valueFrom` in the following ways:
1. Use value expression, eg. `valueFrom: output.metadata.name`. Note that `output` is a built-in field referring to the resource in the component that is rendered and deployed to the cluster.
2. Use CUE expressions, eg. use `+` to combine value and string: `valueFrom: output.metadata.name + "testString"` or you can import built-in packages in CUE like:
```
valueFrom: |
          import "strings"
          strings.Join(["1","2"], ",")
```

### Inputs

Inputs is made of `from` and `parameterKey`. Input uses `from` to reference output. `parameterKey` is the path, relative to the component's `properties`, where the value of the input is written before the component is rendered.

eg.

```yaml
...
- name: wordpress
  type: webservice
  inputs:
    - from: mysql-host
      parameterKey: env[0].value
  properties:
    env:
      - name: WORDPRESS_DB_HOST
```

writes the value of `mysql-host` into the component's properties like this:

```yaml
...
- name: wordpress
  type: webservice
  properties:
    env:
      - name: WORDPRESS_DB_HOST
        value: <input value>
```

### How to Use

The following Application runs WordPress, with the MySQL address passed from the MySQL component. Save it as `wordpress.yaml`:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: wordpress-with-mysql
  namespace: default
spec:
  components:
    - name: wordpress-db
      type: webservice
      outputs:
        # the address of the Service in front of MySQL
        - name: mysql-host
          valueFrom: output.metadata.name + ".default.svc.cluster.local"
      properties:
        image: mysql:8.4
        ports:
          - port: 3306
            expose: true
        env:
          - name: MYSQL_ROOT_PASSWORD
            value: mypassword
          - name: MYSQL_DATABASE
            value: wordpress
    - name: wordpress
      type: webservice
      inputs:
        # set WORDPRESS_DB_HOST to the MySQL address
        - from: mysql-host
          parameterKey: env[0].value
      properties:
        image: wordpress:6.8-apache
        ports:
          - port: 80
            expose: true
        env:
          - name: WORDPRESS_DB_HOST
          - name: WORDPRESS_DB_USER
            value: root
          - name: WORDPRESS_DB_PASSWORD
            value: mypassword
          - name: WORDPRESS_DB_NAME
            value: wordpress
```

`output` here is the MySQL Deployment, and the Service that `expose: true` creates has the same name, so the output is the Service's address.

Apply it:

```shell
vela up -f wordpress.yaml
```

### Expected Outcome

Check the application:

```shell
vela ls
```

```
APP                 	COMPONENT   	TYPE      	TRAITS	PHASE  	HEALTHY	STATUS   	CREATED-TIME
wordpress-with-mysql	wordpress-db	webservice	      	running	healthy	Ready:1/1	2026-11-20 10:04:10 +0000 UTC
└─                  	wordpress   	webservice	      	running	healthy	Ready:1/1	2026-11-20 10:04:10 +0000 UTC
```

WordPress has its database address:

```shell
kubectl get deployment wordpress -o jsonpath='{.spec.template.spec.containers[0].env[0]}'
```

```
{"name":"WORDPRESS_DB_HOST","value":"wordpress-db.default.svc.cluster.local"}
```

## Multi-cluster Orchestration

The same `dependsOn`, `inputs` and `outputs` work when components go to several clusters.

### How to Use

:::note
The environment in example have one managed cluster named `cluster-worker`.
:::

Deploy the following application, which will dispatch a Deployment and a Service. Then deploy a ConfigMap with some status information. 

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: cm-with-message
spec:
  components:
    - name: podinfo
      outputs:
        - name: message
          valueFrom: output.status.conditions[0].message
        - name: ip
          valueFrom: outputs.service.spec.clusterIP
      properties:
        image: stefanprodan/podinfo:4.0.3
      type: webservice
      traits:
        - type: expose
          properties:
            port: [ 80 ]
    - name: configmap
      type: k8s-objects
      inputs:
        - from: message
          parameterKey: objects[0].data.msg
        - from: ip
          parameterKey: objects[0].data.ip
      properties:
        objects:
          - apiVersion: v1
            kind: ConfigMap
            metadata:
              name: deployment-msg
            data: {}
  policies:
    - name: topo
      properties:
        clusters: [ "local","cluster-worker" ]
      type: topology
    - name: override
      properties:
        selector:
          - configmap
          - podinfo
      type: override
```

### Expected Outcome

```shell
$ vela status cm-with-message --tree                  
CLUSTER            NAMESPACE     RESOURCE                 STATUS    
cluster-worker─── default    ─┬─ ConfigMap/deployment-msg updated   
                              ├─ Service/podinfo          updated   
                              └─ Deployment/podinfo       updated   
local       ─── default      ─┬─ ConfigMap/deployment-msg updated   
                              ├─ Service/podinfo          updated   
                              └─ Deployment/podinfo       updated   
```


Check the ConfigMap in the cluster. The same to the other cluster.

```shell
$ kubectl get cm deployment-msg -oyaml |grep -C3 ^data
apiVersion: v1
data:
  ip: 10.43.223.14
  msg: Deployment has minimum availability.
kind: ConfigMap
```
