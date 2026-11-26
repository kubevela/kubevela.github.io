---
title: Order Components and Pass Data Between Them
---

This page shows how to make one component wait for another with `dependsOn`, and how to pass a value from one component to another with `outputs` and `inputs`. Both work in the default workflow, with no workflow steps to write.

:::tip
Components and workflow steps each have their own `dependsOn`, `inputs` and `outputs`:

- Use the **component** fields on this page when the order or the data is between the things you deploy: deploy the database before the app that connects to it.
- Use the **workflow step** fields when the order or the data is between steps you write yourself, such as a notification after a deploy. See [Order Steps](./step-group.md) and [Data Passing](./inputs-outputs.md).
:::

## Dependency

Use `dependsOn` to make a component wait for others. For example, `api` depends on `database`:

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

KubeVela deploys `database` first, and deploys `api` once `database` is healthy.

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
`dependsOn` waits for the component to be `healthy`. To change what healthy means for a component type, see [Health and Status](../../platform-engineers/status/definition_health_status.md).
:::

## Inputs and Outputs

A component can publish values with `outputs`, and another component can read them with `inputs`. A component with inputs waits for the components whose outputs it reads, so you don't need a `dependsOn` as well.

### Outputs

An output has a `name` and a `valueFrom`. Inputs refer to the output by its `name`.

`valueFrom` is an expression over what the component deployed:

- `output` is the component's main resource, for example the Deployment of a `webservice`.
- `outputs.<name>` are the extra resources the component and its traits add. The `expose` trait adds `service`, so `outputs.service.spec.clusterIP` is the IP of its Service. Run `vela show <type>`, or see the [component](../components/references.md) and [trait](../traits/references.md) references, to find these names.

You can write it as:

1. A path: `valueFrom: output.metadata.name`.
2. A CUE expression, for example joining a value and a string: `valueFrom: output.metadata.name + "testString"`. You can also import built-in CUE packages:
    ```
    valueFrom: |
      import "strings"
      strings.Join(["1","2"], ",")
    ```

### Inputs

An input has a `from` and a `parameterKey`. `from` names the output to read. `parameterKey` is the path, relative to the component's `properties`, where the value is written before the component is rendered.

For example, this input:

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

:::tip
To deploy a Helm chart as a component, use the built-in `helmchart` type. It counts as healthy once the chart is installed, unless you set its `healthStatus`, so set `healthStatus` on a component that others depend on.
:::

## Multi-cluster Orchestration

The same `dependsOn`, `inputs` and `outputs` work when components go to several clusters.

### How to Use

:::note
This example needs one managed cluster named `cluster-worker`, besides the `local` one. See [Multi-cluster Application Delivery](../policies/multi-cluster.md) to join one.
:::

The following Application deploys podinfo, with a Deployment and a Service, to both clusters. Then, in each cluster, it deploys a ConfigMap holding the Deployment's status message and the Service's IP in that cluster.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: cm-with-message
spec:
  components:
    - name: podinfo
      type: webservice
      outputs:
        - name: message
          valueFrom: output.status.conditions[0].message
        - name: ip
          valueFrom: outputs.service.spec.clusterIP
      properties:
        image: stefanprodan/podinfo:4.0.3
      traits:
        - type: expose
          properties:
            port: [80]
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
      type: topology
      properties:
        clusters: ["local", "cluster-worker"]
```

### Expected Outcome

```shell
vela status cm-with-message --tree
```

```
CLUSTER            NAMESPACE     RESOURCE                 STATUS
cluster-worker─── default    ─┬─ ConfigMap/deployment-msg updated
                              ├─ Service/podinfo          updated
                              └─ Deployment/podinfo       updated
local       ─── default      ─┬─ ConfigMap/deployment-msg updated
                              ├─ Service/podinfo          updated
                              └─ Deployment/podinfo       updated
```

Check the ConfigMap. Each cluster has its own, with the values from that cluster:

```shell
kubectl get cm deployment-msg -o yaml | grep -C3 ^data
```

```
apiVersion: v1
data:
  ip: 10.43.223.14
  msg: Deployment has minimum availability.
kind: ConfigMap
```
