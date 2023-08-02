---
title: vela adopt
---

Adopt resources into new application.

### Synopsis

Adopt resources into applications

 Adopt resources into a KubeVela application. This command is useful when you already have resources applied in your Kubernetes cluster. These resources could be applied natively or with other tools, such as Helm. This command will automatically find out the resources to be adopted and assemble them into a new application which won't trigger any damage such as restart on the adoption.

 There are two types of adoption supported by far, 'native' Kubernetes resources (by default) and 'helm' releases. 1. For 'native' type, you can specify a list of resources you want to adopt in the application. Only resources in local cluster are supported for now. 2. For 'helm' type, you can specify a helm release name. This helm release should be already published in the local cluster. The command will find the resources managed by the helm release and convert them into an adoption application.

 There are two working mechanism (called 'modes' here) for the adoption by far, 'read-only' mode (by default) and 'take-over' mode. 1. In 'read-only' mode, adopted resources will not be touched. You can leverage vela tools (like Vela CLI or VelaUX) to observe those resources and attach traits to add new capabilities. The adopted resources will not be recycled or updated. This mode is recommended if you still want to keep using other tools to manage resources updates or deletion, like Helm. 2. In 'take-over' mode, adopted resources are completely managed by application which means they can be modified. You can use traits or directly modify the component to make edits to those resources. This mode can be helpful if you want to migrate existing resources into KubeVela system and let KubeVela to handle the life-cycle of target resources.

 The adopted application can be customized. You can provide a CUE template file to the command and make your own assemble rules for the adoption application. You can refer to https://github.com/kubevela/kubevela/blob/master/references/cli/adopt-templates/default.cue to see the default implementation of adoption rules.

 If you want to adopt all resources with resource topology rule to Applications, you can use: 'vela adopt --all'. The resource topology rule can be customized by '--resource-topology-rule' flag.

```
vela adopt [flags]
```

### Examples

```
  # Native Resources Adoption
  
  ## Adopt resources into new application
  
  ## Adopt all resources to Applications with resource topology rule
  ## Use: vela adopt <resources-type> --all
  vela adopt --all
  vela adopt deployment --all --resource-topology-rule myrule.cue
  
  ## Use: vela adopt <resources-type>[/<resource-cluster>][/<resource-namespace>]/<resource-name> <resources-type>[/<resource-cluster>][/<resource-namespace>]/<resource-name> ...
  vela adopt deployment/my-app configmap/my-app
  
  ## Adopt resources into new application with specified app name
  vela adopt deployment/my-deploy configmap/my-config --app-name my-app
  
  ## Adopt resources into new application in specified namespace
  vela adopt deployment/my-app configmap/my-app -n demo
  
  ## Adopt resources into new application across multiple namespace
  vela adopt deployment/ns-1/my-app configmap/ns-2/my-app
  
  ## Adopt resources into new application with take-over mode
  vela adopt deployment/my-app configmap/my-app --mode take-over
  
  ## Adopt resources into new application and apply it into cluster
  vela adopt deployment/my-app configmap/my-app --apply
  
  -----------------------------------------------------------
  
  # Helm Chart Adoption
  
  ## Adopt all helm releases to Applications with resource topology rule
  ## Use: vela adopt <resources-type> --all
  vela adopt --all --type helm
  vela adopt my-chart --all --resource-topology-rule myrule.cue --type helm
  
  ## Adopt resources in a deployed helm chart
  vela adopt my-chart -n my-namespace --type helm
  
  ## Adopt resources in a deployed helm chart with take-over mode
  vela adopt my-chart --type helm --mode take-over
  
  ## Adopt resources in a deployed helm chart in an application and apply it into cluster
  vela adopt my-chart --type helm --apply
  
  ## Adopt resources in a deployed helm chart in an application, apply it into cluster, and recycle the old helm release after the adoption application successfully runs
  vela adopt my-chart --type helm --apply --recycle
  
  -----------------------------------------------------------
  
  ## Customize your adoption rules
  vela adopt my-chart -n my-namespace --type helm --adopt-template my-rules.cue
```

### Options

```
      --adopt-template string           The CUE template for adoption. If not provided, the default template will be used when --auto is switched on.
      --all                             Adopt all resources in the namespace
      --app-name string                 The name of application for adoption. If empty for helm type adoption, it will inherit the helm chart's name.
      --apply                           If true, the application for adoption will be applied. Otherwise, it will only be printed.
  -d, --driver string                   The storage backend of helm adoption. Only take effect when --type=helm.
  -e, --env string                      The environment name for the CLI request
  -h, --help                            help for adopt
  -m, --mode string                     The mode of adoption. Available values: [read-only, take-over] (default "read-only")
  -n, --namespace string                If present, the namespace scope for this CLI request
      --recycle                         If true, when the adoption application is successfully applied, the old storage (like Helm secret) will be recycled.
      --resource-topology-rule string   The CUE template for specify the rule of the resource topology. If not provided, the default rule will be used.
  -t, --type string                     The type of adoption. Available values: [native, helm] (default "native")
  -y, --yes                             Skip confirmation prompt
```

### Options inherited from parent commands

```
  -V, --verbosity Level   number for the log level verbosity
```

### SEE ALSO



#### Go Back to [CLI Commands](vela) Homepage.


###### Auto generated by [spf13/cobra script in KubeVela](https://github.com/kubevela/kubevela/tree/master/hack/docgen).
