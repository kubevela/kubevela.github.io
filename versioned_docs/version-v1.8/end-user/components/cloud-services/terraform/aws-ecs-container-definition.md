---
title:  AWS ECS-CONTAINER-DEFINITION
---

## Description

Terraform module to generate well-formed JSON documents (container definitions) that are passed to the  aws_ecs_task_definition Terraform resource

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 command | The command that is passed to the container | list(string) | false |  
 container_cpu | The number of CPU units to reserve for the container. This is optional for tasks using Fargate launch type and the total amount of container_cpu of all containers in a task will need to be lower than the task-level CPU value. | number | false |  
 container_definition | Container definition overrides which allows for extra keys or overriding existing keys. | map(any) | false |  
 container_depends_on | The dependencies defined for container startup and shutdown. See Container Dependencies Schema section below. | list | false |
 container_image | The image used to start the container. Images in the Docker Hub registry available by default. | string | true |  
 container_memory | The amount of memory (in MiB) to allow the container to use. This is a hard limit, if the container attempts to exceed the container_memory, the container is killed. This field is optional for Fargate launch type and the total amount of container_memory of all containers in a task will need to be lower than the task memory value. | number | false |  
 container_memory_reservation | The amount of memory (in MiB) to reserve for the container. If container needs to exceed this threshold, it can do so up to the set container_memory hard limit. | number | false |  
 container_name | The name of the container. Up to 255 characters (\[a-z\], \[A-Z\], \[0-9\], -, _ allowed) | string | true |  
 disable_networking | When this parameter is true, networking is disabled within the container. | bool | false |  
 dns_search_domains | Container DNS search domains. A list of DNS search domains that are presented to the container. | list(string) | false |  
 dns_servers | Container DNS servers. This is a list of strings specifying the IP addresses of the DNS servers. | list(string) | false |  
 docker_labels | The configuration options to send to the `docker_labels` | map(string) | false |  
 docker_security_options | A list of strings to provide custom labels for SELinux and AppArmor multi-level security systems. | list(string) | false |  
 entrypoint | The entry point that is passed to the container | list(string) | false |  
 environment | The environment variables to pass to the container. See Environment Variables Schema section below. | list | false |
 environment_files | One or more files containing environment variables. See Environment Files Schema section below. | list | false |
 essential | Determines whether all other containers in a task are stopped, if this container fails or stops for any reason. Due to how Terraform type casts booleans in json it is required to double quote this value | bool | false |  
 extra_hosts | A list of hostnames and IP address mappings. See Extra Hosts Schema section below. | list | false |
 firelens_configuration | The FireLens configuration for the container. This is used to specify and configure a log router for container logs. For more details, see [FireLensConfiguration](https://docs.aws.amazon.com/AmazonECS/latest/APIReference/API_FirelensConfiguration.html) | `map(string)` | false | 
 healthcheck | A map containing command (string), timeout, interval (duration in seconds), retries (1-10, number of times to retry before marking container unhealthy), and startPeriod (0-300, optional grace period to wait, in seconds, before failed healthchecks count toward retries) | `map(any)` | false | 
 hostname | The hostname to use for your container. | string | false |  
 interactive | When this parameter is true, this allows you to deploy containerized applications that require stdin or a tty to be allocated. | bool | false |  
 links | List of container names this container can communicate with without port mappings | list(string) | false |  
 linux_parameters | Linux-specific modifications. See Linux Parameters Schema section below. | object | false |
 log_configuration | Log configuration options to send to a custom log driver for the container. For more details, see [LogConfiguration](https://docs.aws.amazon.com/AmazonECS/latest/APIReference/API_LogConfiguration.html) | `map(any)` | false | 
 map_environment | The environment variables to pass to the container. This overrides the environment variable. | map(string) | false |  
 map_secrets | The secret variables to pass to the container. This overrides the secrets. | map(string) | false |  
 mount_points | Container mount points. See Mount Points Schema section below. | list | false |
 port_mappings | The port mappings to configure for the container. See Port Mappings Schema section below. | list | false |
 privileged | When this variable is `true`, the container is given elevated privileges on the host container instance (similar to the root user). This parameter is not supported for Windows containers or tasks using the Fargate launch type. | bool | false |  
 pseudo_terminal | When this parameter is true, a TTY is allocated.  | bool | false |  
 readonly_root_filesystem | Determines whether a container is given read-only access to its root filesystem. Due to how Terraform type casts booleans in json it is required to double quote this value | bool | false |  
 repository_credentials | Container repository credentials; required when using a private repo.  This map currently supports a single key; "credentialsParameter", which should be the ARN of a Secrets Manager's secret holding the credentials | map(string) | false |  
 resource_requirements | The type and amount of a resource to assign to a container. See Resource Requirements Schema section below. | list | false |
 secrets | The secrets to pass to the container. See Secrets Schema section below. | list | false |
 start_timeout | Time duration (in seconds) to wait before giving up on resolving dependencies for a container | number | false |  
 stop_timeout | Time duration (in seconds) to wait before the container is forcefully killed if it doesn't exit normally on its own | number | false |  
 system_controls | A list of namespaced kernel parameters to set in the container, mapping to the --sysctl option to docker run. This is a list of maps: { namespace = "", value = ""} | list(map(string)) | false |  
 ulimits | Container ulimit settings. See Ulimits Schema section below. | list | false |
 user | The user to run as inside the container. Can be any of these formats: user, user:group, uid, uid:gid, user:gid, uid:group. The default (null) will use the container's configured `USER` directive or root if not set. | string | false |  
 volumes_from | A list of volume mappings from other containers. See Volumes From Schema section below. | list | false |
 working_directory | The working directory to run commands inside the container | string | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


### Schema Definitions

#### Container Dependencies Schema

```hcl
list(object({
  containerName = string
  condition     = string  // START, COMPLETE, SUCCESS, or HEALTHY
}))
```

#### Environment Variables Schema

```hcl
list(object({
  name  = string
  value = string
}))
```

#### Environment Files Schema

```hcl
list(object({
  value = string
  type  = string
}))
```

#### Extra Hosts Schema

```hcl
list(object({
  ipAddress = string
  hostname  = string
}))
```

#### Linux Parameters Schema

```hcl
object({
  capabilities = object({
    add  = list(string)
    drop = list(string)
  })
  devices = list(object({
    containerPath = string
    hostPath      = string
    permissions   = list(string)
  }))
  initProcessEnabled = bool
  maxSwap            = number
  sharedMemorySize   = number
  swappiness         = number
  tmpfs = list(object({
    containerPath = string
    mountOptions  = list(string)
    size          = number
  }))
})
```

#### Mount Points Schema

```hcl
list(object({
  containerPath = string
  sourceVolume  = string
  readOnly      = bool
}))
```

#### Port Mappings Schema

```hcl
list(object({
  containerPort = number
  hostPort      = number
  protocol      = string  // "tcp" or "udp"
}))
```

#### Resource Requirements Schema

```hcl
list(object({
  type  = string  // e.g., "GPU"
  value = string
}))
```

#### Secrets Schema

```hcl
list(object({
  name      = string
  valueFrom = string  // ARN of the secret
}))
```

#### Ulimits Schema

```hcl
list(object({
  name      = string
  hardLimit = number
  softLimit = number
}))
```

#### Volumes From Schema

```hcl
list(object({
  sourceContainer = string
  readOnly        = bool
}))
```

#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
