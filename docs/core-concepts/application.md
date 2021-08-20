---
title:  Application
---

KubeVela takes Application as the basis of modeling, uses Components and Traits to complete a set of application deployment plans. After you are familiar with these core concepts, you can develop in accordance with the user manual and administrator manual according to your needs.

In modeling, the YAML file is the bearer of the application deployment plan. A typical YAML example is as follows:

```
# sample.yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: website
spec:
  components:
    - name: frontend              # This is the component I want to deploy
      type: webservice
      properties:
        image: nginx
      traits:
        - type: cpuscaler         # Automatically scale the component by CPU usage after deployed
          properties:
            min: 1
            max: 10
            cpuPercent: 60
        - type: sidecar           # Inject a fluentd sidecar before applying the component to runtime cluster
          properties:
            name: "sidecar-test"
            image: "fluentd"
    - name: backend
      type: worker
      properties:
        image: busybox
        cmd:
          - sleep
          - '1000'
```

The fields here correspond to:

- apiVersion: The OAM API version used.
- kind: of CRD Resourse Type. The one we use most often is Pod.
- metadata: business-related information. For example, this time I want to create a website.
- Spec: Describe what we need to deliver and tell Kubernetes what to make. Here we put the components of KubeVela.
- components: KubeVela's component system.
- Traits: KubeVela's operation and maintenance feature system.