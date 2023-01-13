---
title:  Version Control for Definitions
---

When an [OAM definition](../getting-started/definition) is updated, KubeVela will automatically generate a new revision of this definition.

To list the revisions of the `webservice` Component, run:

```bash
$ vela def get webservice --revisions
NAME      	REVISION	TYPE     	HASH            
webservice	1       	Component	dfa072dac5088ed8
webservice	2       	Component	519e11eb7cbe9cdd
```


To list the revisions of the `affinity` Trait, run:

```shell
$ vela def get affinity --revisions  
NAME            REVISION        TYPE    HASH            
affinity        1               Trait   9db54dd8d5314bd5
affinity        2               Trait   8bf3e82a6884db2c
```

To list the revisions of the `override` Policy, run:

```shell
$ vela def get override --revisions
NAME            REVISION        TYPE    HASH
override        1               Policy  f6f87a5eb2271b8a
```

> Note: there is only one revision of a definition if the definition has never been updated

To list the revisions of the `deploy` WorkflowStep, run:

```shell
$ vela def get deploy --revisions
NAME    REVISION        TYPE            HASH
deploy  1               WorkflowStep    2ea741dae457850b
```

## Specifing a Specific Definition Revision in an Application

Users can specify the revision of a definition they would like to use by specifying definition types in the form `<definition-name>@<definition-revision>`.

For example, if a user wanted to use the `v3` revision of `webservice` Component, they would use `webservice@v3` as the `type` in their
component specification.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: myapp
spec:
  components:
  - name: express-server
    type: webservice@v3
    properties:
      image: stefanprodan/podinfo:4.0.3
```

This ensures that if an administrator of your KubeVela instance modifies the `webservice` definition, your application will not be
affected.

If no revision is specified for a definition, KubeVela will use the latest revision available at evaluation time.
This will usually be the next time you upgrade your application.

:::tip
Cluster administrators can create admission webhooks that will set a definition revision if the field is not set
:::
