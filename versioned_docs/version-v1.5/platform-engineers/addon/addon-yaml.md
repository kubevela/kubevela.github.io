---
title: Write application description files with YAML
---

[Make Your Own Addon] introduces the basic structure of an addon, and illustrate that any Kubernetes operator need to be installed of an addon should be defined in a KubeVela application. This doc will discuss all the details of writing the application description file with YAML.

Application description files contain two parts: application template file and resource files (files under the `resources/` folder).

## Application template file (template.yaml)

The YAML typed application template file must define a KubeVela application that can contain components, policies or workflow. A simple example is as follows: 

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: velaux
  namespace: vela-system
spec:
  components:
    - name: namespace
      type: k8s-objects
      properties:
        objects:
        - apiVersion: v1
          kind: Namespace
          metadata:
            name: my-namespace
```

In this example, we define the skeleton of an application. This application contains a `k8s-objects` typed component that contains one `namespace` typed resource. After the addon is enabled, this namespace will be applied to the clusters by KubeVela.

## Resource files (YAML files in `resources/` folder)

In case your template file is too large, you can split the entire content of the application into multiple files under the `resources/` folder.

YAML file in`resources/` folder must be Kubernetes objects, you can define many objects one by one in a file. These objects will be directly added to the application as a `K8s-object` typed component during rendering. An example as follows:

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: my-service-account
  namespace: default
secrets:
- name: my-secret
```

In this example, we define a ServiceAccount resource. The rendering result is:

```yaml
kind: Application
metadata:
  name: example
  namespace: vela-system
spec:
  components:
    -
    #   ...
    #   other contents defined in template file
    #   ...
    - name: namespace
      type: k8s-objects
      components:
        objects:
        -  apiVersion: v1
           kind: ServiceAccount
           metadata:
            name: my-service-account
            namespace: default
            secrets:
            - name: my-secret
```

## Example

An example is [OCM](https://github.com/kubevela/catalog/tree/master/addons/ocm-hub-control-plane). All files included in this addon are all YAML typed.
