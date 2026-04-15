---
title: Cloud Shell
---

The cloud shell feature helps you to manage the application via CLI(vela、kubectl). such as:

* Creating applications in batches with the YAML.
* Watch the logs of the application.
* Open the shell TTY of the application instance.
* Upload and download files from the shell environment.
* Others...

### Enable the addon

This operation needs to have the permission of the addon management.

```bash
vela addon enable cloudshell
```

### Open the cloud shell environment

![open-cloud-shell](https://kubevela.io/images/1.5/cloud-shell.jpg)

On the UI top right, there is a cloud shell button. Users can open the cloud shell environment by clicking it. By default, all users have permission to open the cloud shell. If you want to disable this feature for some users, you could create a new platform role that has `Disable CloudShell` permission. Bind this role to the user, who you want to disable.

![cloud shell environment](https://kubevela.io/images/1.5/cloud-shell-environment.jpg)

After connected to the cloud shell environment, you could exec `vela --help` to get the help message. In the console, users have some permissions(Kubernetes RBAC) that auto-grant base the permission in the UI. there are some rules:

1. If you have the `admin` permission, you are allowed to do anything in the cloud shell environment.
2. If you have the `deploy application` permission in the projects, you could have all permissions of the Application in the namespace that belongs to the project.
3. If you have the `project view` permission in the projects, you will only have the read permission of the Application in the namespace that belongs to the project.

### Open the console of the application containers

![container](https://kubevela.io/images/1.5/container-console.jpg)

When you want to debug the application runtime, using the container console could be pretty helpful. In KubeVela, this feature is one of the common use cases of the cloud shell. After clicking the button, you will open a dialog window and see the command line. You can copy the commands and execute them in the cloud shell.
