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

![open-cloud-shell](https://static.kubevela.net/images/1.5/cloud-shell.jpg)

On the UI top right, there is a cloud shell button, user clicks it will open the cloud shell environment. By default, all users have permission to open the cloud shell. If you want to disable this feature for some users, you could create a new platform role that has `Disable CloudShell` permission. Bind this role to the user, who you want to disable.

![cloud shell environment](https://static.kubevela.net/images/1.5/cloud-shell-environment.jpg)

Connect to the cloud shell environment, you could exec `vela --help` to get the help message. In the console, users have some permissions(Kubernetes RBAC) that auto grant base the permission in the UI. there are some rules:

1. If you have the `admin` permission, do any thins in the cloud shell environment.
2. If you have the `deploy application` permission in the projects, you could have the all permissions of the Application in the namespace that belongs to the project.
3. If you have the `project view` permission in the projects, you only have the read permission of the Application in the namespace that belongs to the project.

### Open the console of the application containers

![container](https://static.kubevela.net/images/1.5/container-console.jpg)

When you want to debug the application runtime, a useful way is open the container console. In KubeVela, this feature is the use case of the cloud shell. After you click the button, will open a dialog window and show the command. You only need to copy the command and open the cloud shell and execute it.
