---
title: Vela CLI Docker Image
---

This topic describes how to run, version control, and configure the Vela CLI on Docker. For more information on how to use Docker, see [Docker's documentation](https://docs.docker.com/).

Official Docker images provide isolation, portability, and security that KubeVela Community directly supports and maintains. This enables you to use the KubeVela CLI in a container-based environment without having to manage the installation yourself.

## Prerequisites

You must have Docker installed. For installation instructions, see the [Docker website](https://docs.docker.com/install/).

To verify your installation of Docker, run the following command and confirm there is an output.

```
docker --version
Docker version 20.10.13, build a224086
```

## Run the official KubeVela CLI Docker image

The official KubeVela CLI Docker image is hosted on DockerHub in the `oamdev/vela-cli` repository. The first time you use the docker run command, the latest Docker image is downloaded to your computer. Each subsequent use of the docker run command runs from your local copy.

To run the KubeVela CLI Docker image, use the `docker run` command.

```
$ docker run --rm -it -v ~/.kube:/root/.kube oamdev/vela-cli <command>
```

This is how the command functions:

* `docker run --rm -it -v ~/.kube:/root/.kube oamdev/vela-cli` – The equivalent of the `vela` executable. Each time you run this command, Docker spins up a container of your downloaded `oamdev/vela-cli` image, and executes your `vela` command. By default, the Docker image uses the latest version of the KubeVela CLI.

    For example, to call the `vela version` command in Docker, you run the following.
    ```
    $ docker run --rm -it -v ~/.kube:/root/.kube oamdev/vela-cli version
    CLI Version: master
    Core Version:
    GitRevision: git-1d823780
    GolangVersion: go1.17.10
    ```

* `--rm` – Specifies to clean up the container after the command exits.

* `-it` – Specifies to open a pseudo-TTY with stdin. This enables you to provide input to the KubeVela CLI while it's running in a container, for example, by using the `vela port-forward` commands. 

* `-v ~/.kube:/root/.kube` - Specifies the kube config in your environment and mount it into the container. Vela CLI requires a Kubernetes environment for running.

For more information about the docker run command, see the [Docker reference guide](https://docs.docker.com/engine/reference/run/).

## Shorten the Docker command

To shorten the Docker `vela` command, we suggest you use your operating system's ability to create a [symbolic link](https://www.linux.com/tutorials/understanding-linux-links/) (symlink) or [alias](https://www.linux.com/tutorials/aliases-diy-shell-commands/) in Linux and macOS, or [doskey](https://docs.microsoft.com/en-us/windows-server/administration/windows-commands/doskey) in Windows. To set the `vela` alias, you can run one of the following commands.

```
alias vela='docker run --rm -it -v ~/.kube:/root/.kube oamdev/vela-cli'
```

After setting your alias, you can run the Vela CLI from within a Docker container as if it's installed on your host system.

```
$ vela version
CLI Version: master
```

## Integrate Vela CLI Image with Kubernetes

With the help of vela CLI image, you can integrate with Kubernetes API. For example, we can use Kubernetes Job for installing addon:

```
apiVersion: batch/v1
kind: Job
metadata:
  namespace: vela-system
  name: install-addon
  labels:
    app: vela-cli
spec:
  ttlSecondsAfterFinished: 0
  template:
    metadata:
      name: install-addon
      labels:
        app: vela-cli
    spec:
      containers:
      - name: install
        image: oamdev/vela-cli:latest
        imagePullPolicy: IfNotPresent
        args:
          - addon
          - enable
          - velaux
      restartPolicy: OnFailure
      serviceAccountName: kubevela-vela-core
```

There're some prerequisites:

* the service account should have enough privileges to access addon and install it, the easiest way is to use the same one with the vela-core just like the example.
* the namespace should align with your service account.

You can change the args to install other addons or execute other commands, they share the same mechanism.

The work flow could like below:

1. Apply the above yaml file:

```
$ kubectl apply -f install-velaux.yaml
job.batch/install-addon created
```

2. Check pods the job is running:

```
$ kubectl get pods -n vela-system -l app=vela-cli
NAMESPACE     NAME                                        READY   STATUS      RESTARTS   AGE
vela-system   install-addon-zg6lx                         1/1     Running     0          4s
```

3. Check the logs:

```
$ kubectl -n vela-system logs -f install-addon-zg6lx
I0525 05:47:25.788947       1 apply.go:107] "creating object" name="component-uischema-task" resource="/v1, Kind=ConfigMap"

...snip...

To check the initialized admin user name and password by:
    vela logs -n vela-system --name apiserver addon-velaux | grep "initialized admin username"
To open the dashboard directly by port-forward:
    vela port-forward -n vela-system addon-velaux 9082:80
Select "Cluster: local | Namespace: vela-system | Kind: Service | Name: velaux" from the prompt.
Please refer to https://kubevela.io/docs/reference/addons/velaux for more VelaUX addon installation and visiting method.
```

