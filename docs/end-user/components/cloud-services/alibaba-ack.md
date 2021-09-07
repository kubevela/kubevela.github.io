---
title:  Alibaba Cloud ACK
---



## Description

Terraform configuration for Alibaba Cloud ACK cluster

## Sample

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: ack-cloud-source
spec:
  components:
    - name: ack-cluster
      type: alibaba-ack
      properties:
        writeConnectionSecretToRef:
          name: ack-conn
          namespace: vela-system

```

## Specification


### Properties

Name | Description | Type | Required | Default
------------ | ------------- | ------------- | ------------- | ------------- 
k8s_worker_number | The number of worker nodes in kubernetes cluster. | number | false |
zone_id | Availability Zone ID | string | false |
node_cidr_mask | The node cidr block to specific how many pods can run on single node. Valid values: [24-28]. | number | false |
proxy_mode | Proxy mode is option of kube-proxy. Valid values: 'ipvs','iptables'. Default to 'iptables'. | string | false |
password | The password of ECS instance. | string | false |
k8s_version | The version of the kubernetes version.  Valid values: '1.16.6-aliyun.1','1.14.8-aliyun.1'. Default to '1.16.6-aliyun.1'. | string | false |
memory_size | Memory size used to fetch instance types. | number | false |
vpc_cidr | The cidr block used to launch a new vpc when 'vpc_id' is not specified. | string | false |
vswitch_cidrs | List of cidr blocks used to create several new vswitches when 'vswitch_ids' is not specified. | list | false |
master_instance_types | The ecs instance types used to launch master nodes. | list | false |
worker_instance_types | The ecs instance types used to launch worker nodes. | list | false |
install_cloud_monitor | Install cloud monitor agent on ECS. | bool | false |
k8s_service_cidr | The kubernetes service cidr block. It cannot be equals to vpc's or vswitch's or pod's and cannot be in them. | string | false |
cpu_core_count | CPU core count is used to fetch instance types. | number | false |
vpc_name | The vpc name used to create a new vpc when 'vpc_id' is not specified. Default to variable `example_name` | string | false |
vswitch_name_prefix | The vswitch name prefix used to create several new vswitches. Default to variable 'example_name'. | string | false |
number_format | The number format used to output. | string | false |
vswitch_ids | List of existing vswitch id. | list | false |
k8s_name_prefix | The name prefix used to create several kubernetes clusters. Default to variable `example_name` | string | false |
new_nat_gateway | Whether to create a new nat gateway. In this template, a new nat gateway will create a nat gateway, eip and server snat entries. | bool | false |
enable_ssh | Enable login to the node through SSH. | bool | false |
cpu_policy | kubelet cpu policy. Valid values: 'none','static'. Default to 'none'. | string | false |
k8s_pod_cidr | The kubernetes pod cidr block. It cannot be equals to vpc's or vswitch's and cannot be in them. | string | false |
writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |


#### writeConnectionSecretToRef

Name | Description | Type | Required | Default
------------ | ------------- | ------------- | ------------- | ------------- 
name | The secret name which the cloud resource connection will be written to | string | false |
namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
