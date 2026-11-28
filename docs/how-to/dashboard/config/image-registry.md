---
title: Connect Image Registry
description: Configure an image registry
---

In this guide, we will introduce how to create a private image registry and how to create an application whose image locates in the registry.

Check that the [config template](../../../reference/config-template.md) exists:

```bash
vela config-template list | grep image-registry
```

## Create an Image Registry config

Create the config in **Admin Dashboard > Global Configs** to share it with every project, or in the **Configs** panel of a project's **Summary** page for that project only. Choose the **Image Registry** template and fill in these fields:

* Registry

Your image registry domain, such as `index.docker.io`. Please make sure this domain could be accessed from all cluster nodes.

* Insecure

If your registry server uses the self-signed certificate, you should enable this field. This only means KubeVela could trust your registry. You also need to make sure the `dockerd` or `containerd` in your cluster node trust this registry. refer to: [Test an insecure registry with docker](https://docs.docker.com/registry/insecure/).

* UseHTTP

If your registry with the HTTP protocol to provide the service, you should enable this field. You also need to make sure the `dockerd` or `containerd` in your cluster node trust this registry. refer to: [Test an insecure registry with docker](https://docs.docker.com/registry/insecure/).

* Auth

If your registry needs authentication, you must set the username and password. KubeVela writes them into the config's Secret, which then has the type `kubernetes.io/dockerconfigjson`.

![config](https://kubevela.io/images/1.4/create-image-registry.jpg)

You can also create the config with the CLI. It creates a `Config` resource, and the config controller renders its Secret (see [Config Template](../../../reference/config-template.md)):

```bash
vela config create <Config Name> -t image-registry registry=<Registry Domain>
```
:::caution
With VelaUX 1.9.5 on KubeVela 1.12, edit configs made by the CLI with `vela config create` or `kubectl`, not in VelaUX: VelaUX accepts the edit and shows the new values, but the Config and its Secret stay as they were. Configs you create in VelaUX are stored the legacy way, as a Secret, until you run [`vela config-template migrate`](../../../upgrade-guides/v1.12/config-migration.md).
:::


List all Image registries:

```bash
vela config list -t image-registry
```

## Distribute the config

A config's Secret lives in one namespace of the hub cluster. A workload that pulls from the registry needs that Secret (of type `kubernetes.io/dockerconfigjson`) in its own namespace and cluster, so it must exist for every target the application deploys to. Distributing the config copies it there.

Let's go to the project summary page for which you want to create the Application.

![project summary](https://kubevela.io/images/1.6/project-summary.jpg)

Click the `Distribute` button and select the targets that you want to distribute the config.

Also, you could distribute the config via CLI:

```bash
vela config distribute <Config Name> --target <cluster/namespace>
```

## How to use the image registry

Let's follow the [Deploy Container Image](../../../tutorials/webservice.mdx) to create an application. After you input the image name, KubeVela will automatically identify the matched registries.
