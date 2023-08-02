---
title: CLI Commands
---


## Getting Started

* [vela init](vela_init)	 - Create scaffold for vela application.
* [vela up](vela_up)	 - Deploy one application

 Deploy one application based on local files or re-deploy an existing application. With the -n/--namespace flag, you can choose the location of the target application.

 To apply application from file, use the -f/--file flag to specify the application file location.

 To give a particular version to this deploy, use the -v/--publish-version flag. When you are deploying an existing application, the version name must be different from the current name. You can also use a history revision for the deploy and override the current application by using the -r/--revision flag.
* [vela status](vela_status)	 - Show status of vela application.
* [vela ls](vela_ls)	 - List all vela applications.
* [vela delete](vela_delete)	 - Delete applications

 Delete KubeVela applications. KubeVela application deletion is associated with the recycle of underlying resources. By default, the resources created by the KubeVela application will be deleted once it is not in use or the application is deleted. There is garbage-collect policy in KubeVela application that you can use to configure customized recycle rules.

 This command supports delete application in various modes. Natively, you can use it like "kubectl delete app [app-name]". In the cases you only want to delete the application but leave the resources there, you can use the --orphan parameter. In the cases the server-side controller is uninstalled, or you want to manually skip some errors in the deletion process (like lack privileges or handle cluster disconnection), you can use the --force parameter.
* [vela env](vela_env)	 - Manage environments for vela applications to run.
* [vela show](vela_show)	 - Show the reference doc for component, trait, policy or workflow types. 'vela show' equals with 'vela def show'. 

## Managing Applications

* [vela addon](vela_addon)	 - Manage addons for extension.
* [vela dry-run](vela_dry-run)	 - Dry-run application locally, render the Kubernetes resources as result to stdout.
	vela dry-run -d /definition/directory/or/file/ -f /path/to/app.yaml

You can also specify a remote url for app:
	vela dry-run -d /definition/directory/or/file/ -f https://remote-host/app.yaml

And more, you can specify policy and workflow with application file:
	vela dry-run -d /definition/directory/or/file/ -f /path/to/app.yaml -f /path/to/policy.yaml -f /path/to/workflow.yaml, OR
	vela dry-run -d /definition/directory/or/file/ -f /path/to/app.yaml,/path/to/policy.yaml,/path/to/workflow.yaml

Additionally, if the provided policy and workflow files are not referenced by application file, warning message will show up
and those files will be ignored. You can use "merge" flag to make those standalone files effective:
	vela dry-run -d /definition/directory/or/file/ -f /path/to/app.yaml,/path/to/policy.yaml,/path/to/workflow.yaml --merge

Limitation:
	1. Only support one object per file(yaml) for "-f" flag. More support will be added in the future improvement.
	2. Dry Run with policy and workflow will only take override/topology policies and deploy workflow step into considerations. Other workflow step will be ignored.

* [vela live-diff](vela_live-diff)	 - Compare application and revisions.
* [vela logs](vela_logs)	 - Tail logs for vela application.
* [vela port-forward](vela_port-forward)	 - Forward local ports to container/service port of vela application.
* [vela exec](vela_exec)	 - Execute command inside container based vela application.
* [vela revision](vela_revision)	 - Manage KubeVela Application Revisions
* [vela debug](vela_debug)	 - Debug running application with debug policy.

## Continuous Delivery

* [vela workflow](vela_workflow)	 - Operate the Workflow during Application Delivery. Note that workflow command is both valid for Application Workflow and WorkflowRun(expect for [restart, rollout] command, they're only valid for Application Workflow). The command will try to find the Application first, if not found, it will try to find WorkflowRun. You can also specify the resource type by using --type flag.
* [vela adopt](vela_adopt)	 - Adopt resources into applications

 Adopt resources into a KubeVela application. This command is useful when you already have resources applied in your Kubernetes cluster. These resources could be applied natively or with other tools, such as Helm. This command will automatically find out the resources to be adopted and assemble them into a new application which won't trigger any damage such as restart on the adoption.

 There are two types of adoption supported by far, 'native' Kubernetes resources (by default) and 'helm' releases. 1. For 'native' type, you can specify a list of resources you want to adopt in the application. Only resources in local cluster are supported for now. 2. For 'helm' type, you can specify a helm release name. This helm release should be already published in the local cluster. The command will find the resources managed by the helm release and convert them into an adoption application.

 There are two working mechanism (called 'modes' here) for the adoption by far, 'read-only' mode (by default) and 'take-over' mode. 1. In 'read-only' mode, adopted resources will not be touched. You can leverage vela tools (like Vela CLI or VelaUX) to observe those resources and attach traits to add new capabilities. The adopted resources will not be recycled or updated. This mode is recommended if you still want to keep using other tools to manage resources updates or deletion, like Helm. 2. In 'take-over' mode, adopted resources are completely managed by application which means they can be modified. You can use traits or directly modify the component to make edits to those resources. This mode can be helpful if you want to migrate existing resources into KubeVela system and let KubeVela to handle the life-cycle of target resources.

 The adopted application can be customized. You can provide a CUE template file to the command and make your own assemble rules for the adoption application. You can refer to https://github.com/kubevela/kubevela/blob/master/references/cli/adopt-templates/default.cue to see the default implementation of adoption rules.

 If you want to adopt all resources with resource topology rule to Applications, you can use: 'vela adopt --all'. The resource topology rule can be customized by '--resource-topology-rule' flag.

## Managing Extensions

* [vela uischema](vela_uischema)	 - Manage UI schema for addons.
* [vela component](vela_component)	 - List component types installed and discover more in registry.
* [vela trait](vela_trait)	 - List trait types installed and discover more in registry.
* [vela def](vela_def)	 - Manage X-Definitions for extension.

## System Tools

* [vela install](vela_install)	 - The Kubevela CLI allows installing Kubevela on any Kubernetes derivative to which your kube config is pointing to.
* [vela uninstall](vela_uninstall)	 - Uninstalls KubeVela from a Kubernetes cluster.
* [vela system](vela_system)	 - Manage system, including printing the system deployment information in vela-system namespace and diagnosing the system's health.
* [vela version](vela_version)	 - Prints vela build version information.

###### Auto generated by [script in KubeVela](https://github.com/kubevela/kubevela/tree/master/hack/docgen).