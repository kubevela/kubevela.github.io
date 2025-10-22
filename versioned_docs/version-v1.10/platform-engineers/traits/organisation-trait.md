# Organisation Trait

Say that in our organisation, we want to sets up os and arch node affinity on the main component

This can be achieved with a "myorgsetup" trait which is added to an application as follows:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: arch.test
spec:
  components:
    - name: arch.test
      type: webservice
      properties:
        image: myimage:1.0.0
      traits:
        - type: myorgsetup
```

### Trait definition

We can add a trait definition `myorgsetup.cue` as follows:

```yaml
myorgsetup: {
        alias: ""
        annotations: {}
        attributes: {
                appliesToWorkloads: ["*"]
                podDisruptive: true
        }
        description: "Add myorg default affinity"
        labels: {}
        type: "trait"
}

template: {
        // +patchStrategy=jsonMergePatch
        patch: {
            spec: template: spec: {
                affinity: {
                  nodeAffinity: {
                    requiredDuringSchedulingIgnoredDuringExecution: {
                      nodeSelectorTerms: [{
                        matchExpressions: [{
                            key: "kubernetes.io/os"
                            operator: "In"
                            values: [ parameter.os ]
                          },
                          {
                            key: "kubernetes.io/arch"
                            operator: "In"
                            values: [ parameter.arch ]
                          }
                        ]
                      }]
                    }
                  }
                }
              }
        }

        parameter: {
            // +usage=The os for the node affinity
            os: *"linux" | string

            // +usage=The arch for the node affinity
            arch: *"arm64" | string
        }
}
```

We can apply this to the cluster with `vela def apply -f myorgsetup.cue` then apply the application on the cluster.

Or to try it out locally first if we have the application as `app.yml` in a new dir and `myorgsetup.cue` in a subdir called kubevela:

- add the webservice definition from the cluster with `vela def get webservice > kubevela/webservice.cue`
- run the following command to see the rendered deployment : `vela dry-run -d kubevela -f app.yml --offline`

(although "--offline" you will need to have a valid KUBECONFIG to a running cluster)


This should produce:

```yaml
---
# Application(arch.test) -- Component(arch.test)
---

apiVersion: apps/v1
kind: Deployment
metadata:
  annotations: {}
  labels:
    app.oam.dev/appRevision: ""
    app.oam.dev/component: arch.test
    app.oam.dev/name: arch.test
    app.oam.dev/namespace: default
    app.oam.dev/resourceType: WORKLOAD
    workload.oam.dev/type: webservice
  name: arch.test
  namespace: default
spec:
  selector:
    matchLabels:
      app.oam.dev/component: arch.test
  template:
    metadata:
      labels:
        app.oam.dev/component: arch.test
        app.oam.dev/name: arch.test
    spec:
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
            - matchExpressions:
              - key: kubernetes.io/os
                operator: In
                values:
                - linux
              - key: kubernetes.io/arch
                operator: In
                values:
                - arm64
      containers:
      - image: myimage:1.0.0
        name: arch.test
```

**Note** : you can change the os and/or arch with trait properties, e.g.:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: arch.test
spec:
  components:
    - name: arch.test
      type: webservice
      properties:
        image: myimage:1.0.0
      traits:
        - type: myorgsetup
          properties:
            os: windows
            arch: amd64
```

But in our trait definition we've defaulted them to `linux` and `arm64`, so they do not have to be specified if this meets the requirements for the org.

Each `app.yml` does need to have the

```yaml
      traits:
        - type: myorgsetup
```

added, but then you've then got a touchpoint to add anything else your org needs with minimal noise in the application definition.

The trait would need a bit of refinement to correctly deal with e.g. cronjobs as they have a slightly different yaml format, but hopefully this demonstrates that it's pretty simple to get started with custom traits to simply add standard behaviours for your org.


#### Refs

This example was first posted in [a thread on the Kubevela slack channel](https://cloud-native.slack.com/archives/C01BLQ3HTJA/p1744896773522679)
