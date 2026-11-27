---
title: Quick Start
description: Install VelaUX, deploy a web service from it, check it's running, and clean up.
---

This walks through one complete first run: enable VelaUX, create the administrator, deploy a web service to the `default` environment, see it running, and remove it again. It takes about five minutes on a cluster that already runs KubeVela.

You need a cluster with KubeVela 1.9 or later installed and the `vela` CLI pointing at it; see [Install KubeVela](/docs/installation/kubernetes). A local [k3d](https://k3d.io) cluster is plenty.

## 1. Enable VelaUX

```shell
vela addon enable velaux
vela status addon-velaux -n vela-system
```

Wait until the status reads `running`. Then port-forward it, and leave this running:

```shell
vela port-forward -n vela-system addon-velaux 8000:8000
```

## 2. Create the administrator

Open [http://127.0.0.1:8000](http://127.0.0.1:8000). The first time, VelaUX asks you to create the administrator account. Enter:

| Field | Value |
| --- | --- |
| Username | `admin` |
| Password | `VelaUX12345` (8 to 16 characters, at least one letter and one digit) |
| Email | `admin@example.com` |

Then sign in with that username and password. VelaUX has created the `default` project for you, with a `default` environment whose `default` target deploys to the `default` namespace of this cluster.

## 3. Create the application

1. Open **Applications** and click **New Application**.
2. Fill in the first step:

   | Field | Value |
   | --- | --- |
   | Name | `first-app` |
   | Project | `default` |
   | Main Component Type | `webservice` |
   | Bind Environments | `default` |

3. Click **Next Step**. In the `webservice` form, set **Image** to `oamdev/hello-world` and add a port: **Port** `8000`, **Expose** on.
4. Click **Create**. VelaUX opens the application's **Application Config** page. Nothing is deployed yet.

## 4. Deploy it

Click **Deploy** at the top right of the application's page. In **Select Workflow**, pick the `default` environment and click **Deploy**. VelaUX opens the environment's **Workflow** tab on the new run; it has one `deploy` step, which turns green once the web service is running.

VelaUX has created a KubeVela Application, named after the application, in the environment's namespace. Check it from the CLI:

```shell
vela status first-app -n default
```

## 5. Look around

On the **default** environment tab:

- **Status** shows each component's health and the resources the application applied.
- **Instances** lists the pod, with its node and status. Expand it for its containers and events.
- **Logs** shows the container's logs.

The **Revisions** tab of **Application Config** keeps every deploy, and each one can be rolled back to.

## 6. Clean up

On the environment's **Status** view, click **Recycle** and confirm: that deletes what was deployed. Then open **Application Config**, click **Remove** beside **Edit**, and confirm. To remove VelaUX itself:

```shell
vela addon disable velaux
```

## Next steps

- [Deploy with the API](../examples/deploy-with-the-api.md) does the same from the shell, step by step.
- [UI Console Operations](../guides/applications/operations.md) covers the rest of the application pages: traits, more components, workflows and rollback.
- [Projects](../guides/users/projects.md) and [Targets](../guides/delivery/targets.md) set up environments beyond `default`.
