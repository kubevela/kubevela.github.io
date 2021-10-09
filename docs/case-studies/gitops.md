---
title:  GitOps with Workflow
---

This section will introduce how to use KubeVela in GitOps environment and why.

## Introduction

GitOps is a continuous delivery method that allows developers to automatically deploy applications by changing code and declarative configurations in a Git repository, with Git-centric operations such as PR and commit. For detailed benefits of GitOps, please check [this article](https://www.weave.works/blog/what-is-gitops-really).

KubeVela as an declarative application delivery control plane can be naturally used in GitOps approach, and this will provide below extra bonus to end users alongside with GitOps benefits:
- application delivery workflow (CD pipeline)
  - i.e. KubeVela supports pipeline style application delivery process in GitOps, instead of simply declaring final status;
- handling deployment dependencies and designing typologies (DAG);
- unified higher level abstraction atop various GitOps tools' primitives;
- declare, provision and consume cloud resources in unified application definition;
- various out-of-box deployment strategies (Canary, Blue-Green ...);
- various out-of-box hybrid/multi-cloud deployment policies (placement rule, cluster selectors etc.);
- Kustomize-style patch for multi-env deployment without the need to learn Kustomize at all;
- ... and much more.


In this section, we will introduce steps of using KubeVela directly in GitOps approach.

This article will separate into two perspectives:

1. For platform administrators/SREs, they can update the config in Git repo. It will trigger automated re-deployment.

2. For developers, they can update the app source code and then push it to Git. It will trigger building latest image and re-deployment.

> Note: you can also use it with existing tools such as ArgoCD with similar steps, detailed guides will be added in following releases.

## For platform administrators/SREs

![alt](../resources/ops-flow.jpg)

Platform administrators/SREs prepares the Git repo for operational config. Every config config change will be traceable by that. KubeVela will watch the repo and apply changes to the clusters.

## Setup Config Repository

> The configuration files are from the [Example Repo](https://github.com/oam-dev/samples/tree/master/9.GitOps_Demo).

The structure of the config repository looks below:

* The `clusters/` contains the GitOps config. It will command KubeVela to watch the specified repo and apply latest changes.
* The `apps/` contains the Application yaml for deploying the user-facing app.
* The `infrastructure/` contains infrastructure tools, i.e. MySQL database.

```shell
├── apps
│   └── my-app.yaml
├── clusters
│   ├── apps.yaml
│   └── infra.yaml
└── infrastructure
    └── mysql.yaml
```

> KubeVela recommends using the directory structure above to manage your GitOps repository. `clusters/` holds the associated KubeVela configuration that need to be applied to cluster manually, `apps/` holds your application and `infrastructure/` holds your base configuration. Application-related configurations can be bound with traits. By separating applications from basic configurations, you can manage your deployment environment more reasonably and isolate application changes.

#### Directory `clusters/`

`apps.yaml` and `infra.yaml` in `clusters/` are similar. Their difference is to watch different directories.

Apply the files in `clusters/` manually. They will sync the files in `infrastructure/` and `apps/` dir of the Git repo.

Below is how the infra.yaml looks like:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: infra
spec:
  components:
  - name: database-config
    type: kustomize
    properties:
      repoType: git
      # replace it with your repo url
      url: https://github.com/FogDong/KubeVela-GitOps-Infra-Demo
      # replace it with your git secret if it's a private repo
      # secretRef: git-secret
      # the pull interval time, set to 10m since the infrastructure is steady
      pullInterval: 10m
      git:
        # the branch name
        branch: main
      # the path to sync
      path: ./infrastructure
```

#### Directory `apps/`

The file in `apps` is a simple application with database information and Ingress. The app serves HTTP service and connects to a MySQL database. In the '/' path, it will display the version in the code; in the `/db` path, it will list the data in database.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: my-app
  namespace: default
spec:
  components:
    - name: my-server
      type: webservice
      properties:
        image: <your image address> # {"$imagepolicy": "default:apps"}
        port: 8088
        env:
          - name: DB_HOST
            value: mysql-cluster-mysql.default.svc.cluster.local:3306
          - name: DB_PASSWORD
            valueFrom:
              secretKeyRef:
                name: mysql-secret
                key: ROOT_PASSWORD
      traits:
        - type: ingress
          properties:
            domain: testsvc.example.com
            http:
              /: 8088
```

#### Directory `infrastructure/`

The `infrastructure/` contains the config of some infrastructures like database. In the following, we will use [MySQL operator](https://github.com/bitpoke/mysql-operator) to deploy a MySQL cluster.

> Notice that there must be a secret in your cluster with MySQL password specified in key `ROOT_PASSWORD`.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: mysql
  namespace: default
spec:
  components:
    - name: mysql-controller
      type: helm
      properties:
        repoType: helm
        url: https://presslabs.github.io/charts
        chart: mysql-operator
        version: "0.4.0"
    - name: mysql-cluster
      type: raw
      properties:
        apiVersion: mysql.presslabs.org/v1alpha1
        kind: MysqlCluster
        metadata:
          name: mysql-cluster
        spec:
          replicas: 1
          # replace it with your secret
          secretName: mysql-secret
  
  workflow:
    steps:
      - name: deploy-operator
        type: apply-component
        properties:
          component: mysql-controller
      - name: deploy-mysql
        type: apply-component
        properties:
          component: mysql-cluster
```

#### Apply the files in `clusters/`

Apply the `infra.yaml` to cluster, we can see that the MySQL in `infrastructure/` is automatically deployed:

```shell
kubectl apply -f clusters/infra.yaml
```

```shell
$ vela ls

APP   	COMPONENT       	TYPE      	TRAITS 	PHASE  	HEALTHY	STATUS	CREATED-TIME
infra 	database-config 	kustomize 	       	running	healthy	      	2021-09-26 20:48:09 +0800 CST
mysql 	mysql-controller	helm      	       	running	healthy	      	2021-09-26 20:48:11 +0800 CST
└─  	mysql-cluster   	raw       	       	running	healthy	      	2021-09-26 20:48:11 +0800 CST
```

Apply the `apps.yaml` to cluster, we can see that the application in `apps/` is automatically deployed:

```shell
kubectl apply -f clusters/apps.yaml
```

```shell
APP   	COMPONENT       	TYPE      	TRAITS 	PHASE  	HEALTHY	STATUS	CREATED-TIME
apps  	apps            	kustomize 	       	running	healthy	      	2021-09-27 16:55:53 +0800 CST
infra 	database-config 	kustomize 	       	running	healthy	      	2021-09-26 20:48:09 +0800 CST
my-app	my-server       	webservice	ingress	running	healthy	      	2021-09-27 16:55:55 +0800 CST
mysql 	mysql-controller	helm      	       	running	healthy	      	2021-09-26 20:48:11 +0800 CST
└─  	mysql-cluster   	raw       	       	running	healthy	      	2021-09-26 20:48:11 +0800 CST
```

`curl` the Ingress of the app, we can see that the current version is `0.1.5` and the application is connected to the database successfully:

```shell
$ kubectl get ingress
NAME        CLASS    HOSTS                 ADDRESS         PORTS   AGE
my-server   <none>   testsvc.example.com   <ingress-ip>    80      162m

$ curl -H "Host:testsvc.example.com" http://<ingress-ip>
Version: 0.1.5

$ curl -H "Host:testsvc.example.com" http://<ingress-ip>/db
User: KubeVela
Description: It's a test user
```

## Modify the config for GitOps trigger

After the first deployment, we can modify the files in config repo to update the applications in the cluster.

Modify the domain of the application's Ingress:

```yaml
...
      traits:
        - type: ingress
          properties:
            domain: kubevela.example.com
            http:
              /: 8089
```

Check the Ingress in cluster after a while:

```shell
NAME        CLASS    HOSTS                 ADDRESS         PORTS   AGE
my-server   <none>   kubevela.example.com  <ingress-ip>    80      162m
```

The host of the Ingress has been updated successfully!

## For developers

![alt](../resources/dev-flow.jpg)

Developers writes the application source code and push it to a Git repo (aka app repo). Once app repo updates, the CI will build the image and push it to the image registry. KubeVela watches the image registry, and updates the image in config repo. Finally, it will apply the config to the cluster.

User can update the configuration in the cluster automatically when the code is updated.

### Setup App Code Repository

Setup a Git repository with source code and Dockerfile.

The app serves HTTP service and connects to a MySQL database. In the '/' path, it will display the version in the code; in the `/db` path, it will list the data in database.

```go
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		_, _ = fmt.Fprintf(w, "Version: %s\n", VERSION)
	})
	http.HandleFunc("/db", func(w http.ResponseWriter, r *http.Request) {
		rows, err := db.Query("select * from userinfo;")
		if err != nil {
			_, _ = fmt.Fprintf(w, "Error: %v\n", err)
		}
		for rows.Next() {
			var username string
			var desc string
			err = rows.Scan(&username, &desc)
			if err != nil {
				_, _ = fmt.Fprintf(w, "Scan Error: %v\n", err)
			}
			_, _ = fmt.Fprintf(w, "User: %s \nDescription: %s\n\n", username, desc)
		}
	})

	if err := http.ListenAndServe(":8088", nil); err != nil {
		panic(err.Error())
	}
```

In this tutorial, we will setup a CI pipeline using GitHub Actions to build the image and push it to a registry. The code and configuration files are from the [Example Repo](https://github.com/oam-dev/samples/tree/master/9.GitOps_Demo).

## Create Git Secret for KubeVela committing to Config Repo

After the new image is pushed to the image registry, KubeVela will be notified and update the `Application` file in the Git repository and cluster. Therefore, we need a secret with Git information for KubeVela to commit to the Git repository. Fill the following yaml files with your password and apply it to the cluster:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: my-secret
type: kubernetes.io/basic-auth
stringData:
  username: <your username>
  password: <your password>
```

## Setup Config Repository

The configuration repository is almost the same as the previous configuration, you only need to add the image registry config to the file. For more details, please refer to [Example Repository](https://github.com/oam-dev/samples/tree/master/9.GitOps_Demo).

Modify the image field in `my-app` and add annotation `# {"$imagepolicy": "default:apps"}`.
Notice that KubeVela will only be able to modify the image field if the annotation is added after the field. `default:apps` is `namespace:application-name` of the application config file.

```yaml
spec:
  components:
    - name: my-server
      type: webservice
      properties:
        image: ghcr.io/fogdong/test-fog:master-cba5605f-1632714412 # {"$imagepolicy": "default:apps"}
```

Add the config of image registry in `apps`, it listens for image updates in the image registry:

```yaml
...
  imageRepository:
    image: <your image>
    # if it's a private image registry, use `kubectl create secret docker-registry` to create the secret
    # secretRef: imagesecret
    filterTags:
      # filter the image tag
      pattern: '^master-[a-f0-9]+-(?P<ts>[0-9]+)'
      extract: '$ts'
    # use the policy to sort the latest image tag and update
    policy:
      numerical:
        order: asc
    # add more commit message
    commitMessage: "Image: {{range .Updated.Images}}{{println .}}{{end}}"
```

After update the files in `clusters/` to cluster, we can then update the application by modifying the code.

## Modify the code

Change the `Version` to `0.1.6` and modify the data in database:

```go
const VERSION = "0.1.6"

...

func InsertInitData(db *sql.DB) {
	stmt, err := db.Prepare(insertInitData)
	if err != nil {
		panic(err)
	}
	defer stmt.Close()

	_, err = stmt.Exec("KubeVela2", "It's another test user")
	if err != nil {
		panic(err)
	}
}
```

Commit the change to the Git Repository, we can see that our CI pipelines has built the image and push it to the image registry.

KubeVela will listen to the image registry and update the `Application` in Git Repository with the latest image tag.

We can see that there is a commit form `kubevelabot`, the commit message is always with a prefix `Update image automatically.` You can use format like `{{range .Updated.Images}}{{println .}}{{end}}` to specify the image name in the `commitMessage` field.

![alt](../resources/gitops-commit.png)

> Note that if you want to put the code and config in the same repository, you need to filter out the commit from KubeVela in CI configuration like below to avoid the repeat build of pipeline.
> 
> ```shell
> jobs:
>  publish:
>    if: "!contains(github.event.head_commit.message, 'Update image automatically')"
> ```

Re-check the `Application` in cluster, we can see that the image of the `Application` has been updated after a while.

> KubeVela polls the latest information from the code and image repo periodically (at an interval that can be customized):
> * When the `Application` file in the Git repository is updated, KubeVela will update the `Application` in the cluster based on the latest configuration.
> * When a new tag is added to the image registry, KubeVela will filter out the latest tag based on your policy and update it to Git repository. When the files in the repository are updated, KubeVela repeats the first step and updates the files in the cluster, thus achieving automatic deployment.

We can `curl` to `Ingress` to see the current version and data:

```shell
$ kubectl get ingress
NAME        CLASS    HOSTS                 ADDRESS         PORTS   AGE
my-server   <none>   kubevela.example.com  <ingress-ip>    80      162m

$ curl -H "Host:kubevela.example.com" http://<ingress-ip>
Version: 0.1.6

$ curl -H "Host:kubevela.example.com" http://<ingress-ip>/db
User: KubeVela
Description: It's a test user

User: KubeVela2
Description: It's another test user
```

The `Version` has been updated successfully! Now we're done with everything from changing the code to automatically applying to the cluster.

## Summary

For platform admins/SREs, they update the config repo to operate the application and infrastructure. KubeVela will synchronize the config to the cluster, simplifying the deployment process.

For end users/developers, they write the source code, push it to Git, and then re-deployment will happen. It will make CI to build the image. KubeVela will then update the image field and apply the deployment config.

By integrating with GitOps, KubeVela helps users speed up deployment and simplify continuous deployment.