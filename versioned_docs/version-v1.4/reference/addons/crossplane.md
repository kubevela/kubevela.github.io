---
title: Cloud Resources orchestrated by Crossplane
---


## Crossplane addon

```shell
$ vela addon enable crossplane
```

## Enable a Crossplane Provider addon

KubeVela can support following cloud providers by enabling the Crossplane provider addons.

```shell
$ vela addon list | grep crossplane-
crossplane-aws            	KubeVela	Kubernetes Crossplane Controller for AWS                                                              	[0.0.1]                      	enabled (1.0.0)                     	enabled (1.0.1)
```

To enable one of them, use the following command:

```shell
$ vela addon enable crossplane-xxx
```

You can also disable, upgrade, check status of an addon by command `vela addon`.

## Authenticate Crossplane Provider

Apply the application below. Let's use aws in this example, you can get `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` per [aws secret docs](https://aws.amazon.com/blogs/security/wheres-my-secret-access-key/).

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: aws
  namespace: vela-system
spec:
  components:
    - name: aws
      type: crossplane-aws
      properties:
        name: aws
        AWS_ACCESS_KEY_ID: xxx
        AWS_SECRET_ACCESS_KEY: yyy

```

### Provision cloud resources

After a Crossplane provider is authenticated, you can [provision and/or consume cloud resources](../../end-user/components/cloud-services/cloud-resources-orchestration).
