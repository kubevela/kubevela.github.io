---
title:  AWS ECS-CONTAINER-DEFINITION
---

## Description

Terraform module to generate well-formed JSON documents (container definitions) that are passed to the  aws_ecs_task_definition Terraform resource

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 container_name | The name of the container. Up to 255 characters ([a-z], [A-Z], [0-9], -, _ allowed) | string | true |  
 container_memory | The amount of memory (in MiB) to allow the container to use. This is a hard limit, if the container attempts to exceed the container_memory, the container is killed. This field is optional for Fargate launch type and the total amount of container_memory of all containers in a task will need to be lower than the task memory value | number | false |  
 working_directory | The working directory to run commands inside the container | string | false |  
 docker_security_options | A list of strings to provide custom labels for SELinux and AppArmor multi-level security systems. | list(string) | false |  
 container_depends_on | The dependencies defined for container startup and shutdown. A container can contain multiple dependencies. When a dependency is defined for container startup, for container shutdown it is reversed. The condition can be one of START, COMPLETE, SUCCESS or HEALTHY | list(object({
    containerName = string
    condition     = string
  })) | false |  
 start_timeout | Time duration (in seconds) to wait before giving up on resolving dependencies for a container | number | false |  
 stop_timeout | Time duration (in seconds) to wait before the container is forcefully killed if it doesn't exit normally on its own | number | false |  
 disable_networking | When this parameter is true, networking is disabled within the container. | bool | false |  
 healthcheck | A map containing command (string), timeout, interval (duration in seconds), retries (1-10, number of times to retry before marking container unhealthy), and startPeriod (0-300, optional grace period to wait, in seconds, before failed healthchecks count toward retries) | object({
    command     = list(string)
    retries     = number
    timeout     = number
    interval    = number
    startPeriod = number
  }) | false |  
 map_environment | The environment variables to pass to the container. This is a map of string: {key: value}. map_environment overrides environment | map(string) | false |  
 linux_parameters | Linux-specific modifications that are applied to the container, such as Linux kernel capabilities. For more details, see https://docs.aws.amazon.com/AmazonECS/latest/APIReference/API_LinuxParameters.html | object({
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
  }) | false |  
 mount_points | Container mount points. This is a list of maps, where each map should contain `containerPath`, `sourceVolume` and `readOnly` | list(object({
    containerPath = string
    sourceVolume  = string
    readOnly      = bool
  })) | false |  
 system_controls | A list of namespaced kernel parameters to set in the container, mapping to the --sysctl option to docker run. This is a list of maps: { namespace = "", value = ""} | list(map(string)) | false |  
 repository_credentials | Container repository credentials; required when using a private repo.  This map currently supports a single key; "credentialsParameter", which should be the ARN of a Secrets Manager's secret holding the credentials | map(string) | false |  
 resource_requirements | The type and amount of a resource to assign to a container. The only supported resource is a GPU. | list(object({
    type  = string
    value = string
  })) | false |  
 docker_labels | The configuration options to send to the `docker_labels` | map(string) | false |  
 hostname | The hostname to use for your container. | string | false |  
 container_memory_reservation | The amount of memory (in MiB) to reserve for the container. If container needs to exceed this threshold, it can do so up to the set container_memory hard limit | number | false |  
 container_definition | Container definition overrides which allows for extra keys or overriding existing keys. | map(any) | false |  
 essential | Determines whether all other containers in a task are stopped, if this container fails or stops for any reason. Due to how Terraform type casts booleans in json it is required to double quote this value | bool | false |  
 secrets | The secrets to pass to the container. This is a list of maps | list(object({
    name      = string
    valueFrom = string
  })) | false |  
 volumes_from | A list of VolumesFrom maps which contain "sourceContainer" (name of the container that has the volumes to mount) and "readOnly" (whether the container can write to the volume) | list(object({
    sourceContainer = string
    readOnly        = bool
  })) | false |  
 user | The user to run as inside the container. Can be any of these formats: user, user:group, uid, uid:gid, user:gid, uid:group. The default (null) will use the container's configured `USER` directive or root if not set. | string | false |  
 links | List of container names this container can communicate with without port mappings | list(string) | false |  
 pseudo_terminal | When this parameter is true, a TTY is allocated.  | bool | false |  
 container_image | The image used to start the container. Images in the Docker Hub registry available by default | string | true |  
 port_mappings | The port mappings to configure for the container. This is a list of maps. Each map should contain "containerPort", "hostPort", and "protocol", where "protocol" is one of "tcp" or "udp". If using containers in a task with the awsvpc or host network mode, the hostPort can either be left blank or set to the same value as the containerPort | list(object({
    containerPort = number
    hostPort      = number
    protocol      = string
  })) | false |  
 map_secrets | The secrets variables to pass to the container. This is a map of string: {key: value}. map_secrets overrides secrets | map(string) | false |  
 environment_files | One or more files containing the environment variables to pass to the container. This maps to the --env-file option to docker run. The file must be hosted in Amazon S3. This option is only available to tasks using the EC2 launch type. This is a list of maps | list(object({
    value = string
    type  = string
  })) | false |  
 readonly_root_filesystem | Determines whether a container is given read-only access to its root filesystem. Due to how Terraform type casts booleans in json it is required to double quote this value | bool | false |  
 log_configuration | Log configuration options to send to a custom log driver for the container. For more details, see https://docs.aws.amazon.com/AmazonECS/latest/APIReference/API_LogConfiguration.html | any | false |  
 container_cpu | The number of cpu units to reserve for the container. This is optional for tasks using Fargate launch type and the total amount of container_cpu of all containers in a task will need to be lower than the task-level cpu value | number | false |  
 command | The command that is passed to the container | list(string) | false |  
 environment | The environment variables to pass to the container. This is a list of maps. map_environment overrides environment | list(object({
    name  = string
    value = string
  })) | false |  
 extra_hosts | A list of hostnames and IP address mappings to append to the /etc/hosts file on the container. This is a list of maps | list(object({
    ipAddress = string
    hostname  = string
  })) | false |  
 dns_search_domains | Container DNS search domains. A list of DNS search domains that are presented to the container | list(string) | false |  
 interactive | When this parameter is true, this allows you to deploy containerized applications that require stdin or a tty to be allocated. | bool | false |  
 entrypoint | The entry point that is passed to the container | list(string) | false |  
 firelens_configuration | The FireLens configuration for the container. This is used to specify and configure a log router for container logs. For more details, see https://docs.aws.amazon.com/AmazonECS/latest/APIReference/API_FirelensConfiguration.html | object({
    type    = string
    options = map(string)
  }) | false |  
 dns_servers | Container DNS servers. This is a list of strings specifying the IP addresses of the DNS servers | list(string) | false |  
 ulimits | Container ulimit settings. This is a list of maps, where each map should contain "name", "hardLimit" and "softLimit" | list(object({
    name      = string
    hardLimit = number
    softLimit = number
  })) | false |  
 privileged | When this variable is `true`, the container is given elevated privileges on the host container instance (similar to the root user). This parameter is not supported for Windows containers or tasks using the Fargate launch type. | bool | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
