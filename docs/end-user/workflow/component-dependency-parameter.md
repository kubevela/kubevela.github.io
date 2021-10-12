---
title:  Dependency and Data Passing
---

This section will introduce the dependencies in components and how to pass data between components.

> We use helm in the examples, make sure you enable the fluxcd addon:
> ```shell
> vela addon enable fluxcd
> ```

## Dependency

We can use `dependsOn` to specify the dependencies between components.

For example, component A depends on component B:

```yaml
...
components:
  - name: A
    type: helm
    dependsOn:
      - B
  - name: B
    type: helm
```

In this case, KubeVela will deploy B first, and then deploy A when the component B is running.

### How to use

If we want to apply a MySQL cluster, we need:

1. Apply MySQL controller.
2. Apply a secret for MySQL password.
3. Apply MySQL cluster.

Apply the following file:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: mysql
  namespace: default
spec:
  components:
    - name: mysql-controller
      type: helm
      properties:
        repoType: helm
        url: https://presslabs.github.io/charts
        chart: mysql-operator
        version: "0.4.0"
    - name: mysql-secret
      type: raw
      properties:
        apiVersion: v1
        kind: Secret
        metadata:
          name: mysql-secret
        type: kubernetes.io/opaque
        stringData:
          ROOT_PASSWORD: test
    - name: mysql-cluster
      type: raw
      dependsOn:
        - mysql-controller
        - mysql-secret
      properties:
        apiVersion: mysql.presslabs.org/v1alpha1
        kind: MysqlCluster
        metadata:
          name: mysql-cluster
        spec:
          replicas: 1
          secretName: mysql-secret
```

### Expected Outcome

Check the application in the cluster:

```shell
$ vela ls
APP  	COMPONENT       	TYPE	TRAITS	PHASE  	HEALTHY	STATUS	CREATED-TIME
mysql	mysql-controller	helm	      	running	healthy	      	2021-10-12 17:52:34 +0800 CST
├─ 	mysql-secret    	raw 	      	running	healthy	      	2021-10-12 17:52:34 +0800 CST
└─ 	mysql-cluster   	raw 	      	running	healthy 	     	2021-10-12 17:52:34 +0800 CST
```

All components is running successfully.


## Inputs and Outputs

In KubeVela, we can use inputs and outputs in Components to pass data.

### Outputs

Outputs is made of `name` and `valueFrom`. Input will use `name` to reference output.

We can write `valueFrom` in the following ways:
1. Fill string value in the field, eg. `valueFrom: testString`.
2. Use expression, eg. `valueFrom: output.metadata.name`. Note that `output` is a built-in field referring to the resource in the component that is rendered and deployed to the cluster.
3. Use `+` to combine above two ways, the computed value will be the result, eg. `valueFrom: output.metadata.name + "testString"`.

### Inputs

Inputs is made of `from` and `parameterKey`. Input uses `from` to reference output, `parameterKey` is a expression that assigns the value of the input to the corresponding field.

eg.

1. Specify inputs:

```yaml
...
- name: wordpress
  type: helm
  inputs:
    - from: mysql-svc
      parameterKey: properties.values.externalDatabase.host
```

2. The field parameterKey specifies the field path of the parameter key in component to be assigned after rendering:

Which means the input value will be passed into the below properties:

```yaml
...
- name: wordpress
  type: helm
  properties:
    values:
      externalDatabase:
        host: <input value>
```

### How to use

In the following we will apply a WordPress server with the MySQL address passed from a MySQL component:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: wordpress-with-mysql
  namespace: default
spec:
  components:
    - name: mysql
      type: helm
      outputs:
        # the output is the mysql service address
        - name: mysql-svc
          valueFrom: output.metadata.name + ".default.svc.cluster.local"
      properties:
        repoType: helm
        url: https://charts.bitnami.com/bitnami
        chart: mysql
        version: "8.8.2"
        values:
          auth:
            rootPassword: mypassword
    - name: wordpress
      type: helm
      inputs:
        # set the host to mysql service address
        - from: mysql-svc
          parameterKey: properties.values.externalDatabase.host
      properties:
        repoType: helm
        url: https://charts.bitnami.com/bitnami
        chart: wordpress
        version: "12.0.3"
        values:
          mariadb:
            enabled: false
          externalDatabase:
            user: root
            password: mypassword
            database: mysql
            port: 3306
```

### Expected Outcome

Check the application in the cluster:

```shell
$ vela ls

APP                 	COMPONENT	TYPE	TRAITS	PHASE          	HEALTHY	STATUS	CREATED-TIME
wordpress-with-mysql	mysql    	helm	running	                healthy	        2021-10-12 18:04:10 +0800 CST
└─                	    wordpress	helm	running	                healthy	       	2021-10-12 18:04:10 +0800 CST
```

The WordPress with MySQL has been successfully applied.