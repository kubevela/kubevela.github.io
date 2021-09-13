---
title:  Data Pass Between Components 
---

This section will introduce how to pass data between components.

## Inputs and Outputs

In KubeVela, we can use inputs and outputs in Components to pass data.

### Outputs

```go
type Outputs []outputItem

type outputItem struct {
	ValueFrom string `json:"valueFrom"`
	Name      string `json:"name"`
}
```

Outputs is made of `name` and `valueFrom`. Input will use `name` to reference output.

We can write `valueFrom` in the following ways:
1. Use string, eg. `valueFrom: testString`
2. Use expression, eg. `valueFrom: output.metadata.name`. Note that `output` is a built-in field referring to the resource in the component that is deployed to the cluster.
3. Use `+` to combine above two ways, eg. `valueFrom: output.metadata.name + "testString"`

### Inputs

```go
type Inputs []inputItem

type inputItem struct {
	ParameterKey string `json:"parameterKey"`
	Name         string `json:"name"`
}
```

Inputs is made of `name` and `parameterKey`. Input uses `name` to reference output, `parameterKey` is a expression that assigns the value of the input to the corresponding field.

eg.

1. Specify inputs:

```yaml
...
- name: wordpress
  type: helm
  inputs:
    - from: mysql-svc
```

2. The field `properties.values.externalDatabase.host` in component will be assigned after rendering:

```yaml
...
- name: wordpress
  type: helm
  inputs:
    - from: mysql-svc
      parameterKey: properties.values.externalDatabase.host
  properties:
    values:
      externalDatabase:
        host: "value"
```

## How to use

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
          exportKey: output.metadata.name + ".default.svc.cluster.local"
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

## Expected Outcome

The WordPress with MySQL has been successfully applied.