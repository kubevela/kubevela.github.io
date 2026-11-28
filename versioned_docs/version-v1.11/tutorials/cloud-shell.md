---
title: Cloud Shell
---

Cloud Shell opens a terminal in the browser with `vela` and `kubectl` set up for your VelaUX user. You can use it to:

* Create applications in batches from YAML.
* Follow an application's logs.
* Open a shell in an application's container.
* Upload files to the shell environment and download them from it.

### Enable the addon

This operation needs to have the permission of the addon management.

```bash
vela addon enable cloudshell
```

### Open the cloud shell environment

![open-cloud-shell](https://kubevela.io/images/1.5/cloud-shell.jpg)

Click the cloud shell button at the top right of VelaUX to open it.

Every VelaUX user can open Cloud Shell unless a platform role with **Disable CloudShell** is bound to them. The shell's Kubernetes permissions follow the user's VelaUX roles:

| VelaUX permission ([RBAC](../how-to/dashboard/user/rbac.md#built-in-permissions)) | Kubernetes permissions in the shell |
| --- | --- |
| `admin` | Anything. |
| **App Management** in a project, or any permission that allows `deploy` on its applications | Full access to Applications in the project's namespaces. |
| Any other project role, such as **Project View** | Read access to Applications in the project's namespaces. |

![cloud shell environment](https://kubevela.io/images/1.5/cloud-shell-environment.jpg)

Run `vela --help` to see what the CLI can do.

The shell's `vela` CLI comes from the cloudshell addon's image (`oamdev/cloudshell:v1.7.2`), so it is version 1.7.2, whatever version of KubeVela you run, and commands added since are missing. Use a current `vela` on your own machine for those.

### Open the console of the application containers

![container](https://kubevela.io/images/1.5/container-console.jpg)

When you want to debug the application runtime, using the container console could be pretty helpful. In KubeVela, this feature is one of the common use cases of the cloud shell. After clicking the button, you will open a dialog window and see the command line. You can copy the commands and execute them in the cloud shell.
