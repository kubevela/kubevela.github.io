---
title:  Version Control for Definition
---

When the capabilities(Component or Trait) changes, KubeVela will generate a definition revision automatically.

* Check ComponentDefinition Revision

```shell
$  kubectl get definitionrevision -l="componentdefinition.oam.dev/name=webservice" -n vela-system
NAME            REVISION   HASH               TYPE
webservice-v1   1          3f6886d9832021ba   Component
webservice-v2   2          b3b9978e7164d973   Component
```

* Check TraitDefinition Revision

```shell
$ kubectl get definitionrevision -l="trait.oam.dev/name=rollout" -n vela-system
NAME         REVISION   HASH               TYPE
rollout-v1   1          e441f026c1884b14   Trait
```

The best way to control version is using a new name for every definition version.

## Specify Component/Trait Capability Revision in Application

Users can specify the revision with `@version` approach, for example, if a user want to stick to using the `v1` revision of `webservice` component.

System admin can also write a webhook to inject the version automatically.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: myapp
spec:
  components:
  - name: express-server
    type: webservice@v1
    properties:
      image: stefanprodan/podinfo:4.0.3
```

In this way, if system admin changes the ComponentDefinition, it won't affect your application. 

If no revision specified, KubeVela will always use the latest revision when you upgrade your application.
