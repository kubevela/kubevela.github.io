---
title:  Version Control for Definition
---

When the capabilities(Component or Trait) changes, KubeVela will generate a definition revision automatically.

* Check ComponentDefinition Revision

> Note: there are only one revision of definition if you never update it.

```bash
$ vela def get webservice --revisions
NAME      	REVISION	TYPE     	HASH            
webservice	1       	Component	dfa072dac5088ed8
webservice	2       	Component	519e11eb7cbe9cdd
```

* Check TraitDefinition Revision

```shell
$ vela def get affinity --revisions  
NAME            REVISION        TYPE    HASH            
affinity        1               Trait   9db54dd8d5314bd5
affinity        2               Trait   8bf3e82a6884db2c
```

* Check PolicyDefinition Revision

```shell
$ vela def get override --revisions
NAME            REVISION        TYPE    HASH
override        1               Policy  f6f87a5eb2271b8a
```

* Check WorkflowStepDefinition Revision

```shell
$ vela def get deploy --revisions
NAME    REVISION        TYPE            HASH
deploy  1               WorkflowStep    2ea741dae457850b
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
