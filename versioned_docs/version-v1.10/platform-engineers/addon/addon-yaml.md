---
title: YAML based Addon Application
---

[Make Your Own Addon](./intro.md) introduces the basic structure of an addon, and illustrate that any Kubernetes operator to be installed of an addon should be defined in a KubeVela [application](../../getting-started/core-concept.md). This doc will guide you with all the details of writing the application description file with YAML.

Application description files contain two parts: application template file and resource files (files under the `resources/` folder).

## Application template file (template.yaml)

The YAML typed application template file only accepts a KubeVela [application](../../getting-started/core-concept.md) that can contain components, policies or workflow. A simple example is as follows: 

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

YAML file in`resources/` folder must be Kubernetes objects, you can define many objects one by one in a file. These objects will be directly added to the application as a `K8s-objects` typed component during rendering. An example as follows:

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: my-service-account
  namespace: default
secrets:
- name: my-secret
```

In this example, we define a ServiceAccount resource. KubeVela collects every object under `resources/` into one `k8s-objects` component named `<addon name>-resources`, and adds it to the application from the template. For an addon named `my-addon`, the rendered application is:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: addon-my-addon
  namespace: vela-system
spec:
  components:
    # ...the components defined in template.yaml, for example:
    - name: namespace
      type: k8s-objects
      properties:
        objects:
          - apiVersion: v1
            kind: Namespace
            metadata:
              name: my-namespace
    # ...then one component holding the objects from resources/:
    - name: my-addon-resources
      type: k8s-objects
      properties:
        objects:
          - apiVersion: v1
            kind: ServiceAccount
            metadata:
              name: my-service-account
              namespace: default
            secrets:
              - name: my-secret
```

KubeVela names the application `addon-<addon name>`, whatever the template's `metadata.name` says.

We just use namespace and serviceAccount resources as an example here, other resources of an operator can also be defined in KubeVela application in the same way.

## Example

An example is [OCM](https://github.com/kubevela/catalog/tree/master/addons/ocm-hub-control-plane). All files included in this addon are all YAML coded.
