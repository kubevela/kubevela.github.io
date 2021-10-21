---
title: Introduction
---

This and next documentation will explain Open Application Model (OAM) and how to extend this model in detail.

## An Abstraction to Model Application Deployment Process

OAM allows end users to work with a simple artifact to capture the complete application deployment workflow with easier primitives. This provides a simpler path for on-boarding end users to the platform without leaking low level details in runtime infrastructure and allows users to fully focus on the application delivery itself.

![alt](../../resources/model.png)

Every application deployment plan can be composed by multiple components with attachable operational behaviors (traits), the deployment policy and workflow. For example:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: <name>
spec:
  components:
    - name: <component name>
      type: <component type>
      properties:
        <parameter values>
      traits:
        - type: <trait type>
          properties:
            <traits parameter values>
    - name: <component name>
      type: <component type>
      properties:
        <parameter values>
  policies:
  - name: <policy name>
    type: <policy type>
    properties:
      <policy parameter values>
  workflow:
    - name: <step name>
      type: <step type>
      properties:
        <step parameter values>   
```

This `Application` entity will reference component, trait, policy and workflow step types which are essentially programmable modules that are maintained by platform team. Hence, this abstraction is highly extensible and can be customized in-place at ease.

Please check the next section ([X-Definition](./x-definition.md)) to learn how this programmable capability is achieved.

## No Configuration Drift

Despite the efficiency and extensibility in abstracting application deployment, programmable (Infrastructure-as-Code) approach may lead to an issue called *Infrastructure/Configuration Drift*, i.e. the rendered component instances are not in line with the expected configuration. This could be caused by incomplete coverage, less-than-perfect processes or emergency changes. This makes them can be barely used as a platform level building block.

Hence, KubeVela is designed to maintain all these programmable capabilities with [Kubernetes Control Loop](https://kubernetes.io/docs/concepts/architecture/controller/) and leverage Kubernetes control plane to eliminate the issue of configuration drifting, while still keeps the flexibly and velocity enabled by IaC.
