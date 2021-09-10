---
title:  阿里云 ACK

---

## 描述

用于部署阿里云 ACK 集群的组件说明

## 示例

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

## 参数说明


### Properties

名字 | 描述 | 类型 | 是否必须 | 默认值
------------ | ------------- | ------------- | ------------- | ------------- 
k8s_worker_number | Worker 节点数 | number | 否 |
zone_id | Availability Zone ID | string | 否 |
node_cidr_mask | 节点 IP 数量，通过指定网络的 CIDR 来确定IP的数量，只对于 Flannel 网络类型集群生效 | number | 否 |
proxy_mode | kube-proxy 代理模式，支持 'ipvs'、'iptables'，默认是 'iptables'. | string | 否 |
password | ECS 示例的 SSH 登录密码 | string | 否 |
k8s_version | 集群版本，与 Kubernetes 社区基线版本保持一致。建议选择最新版本，若不指定，默认使用最新版本 | string | 否 |
memory_size | 实例规格的内存大小 | number | 否 |
vpc_cidr | VPC CIDR | string | 否 |
vswitch_cidrs | VSwitch CIDR 列表 | list | 否 |
master_instance_types | Master 节点实例类型 | list | 否 |
worker_instance_types | Worker 节点实例类型 | list | 否 |
install_cloud_monitor | 是否在 ECS 上安装云监控 agent | bool | 否 |
k8s_service_cidr | Kubernetes Service CIDR，不能与 VPC、VSwitch 或 Pod 的一样或是他们的子集 | string | 否 |
cpu_core_count | 实例规格的 CPU 核数 | number | 否 |
vpc_name | VPC 名字 | string | 否 |
vswitch_name_prefix | VSwitch 名字前缀 | string | 否 |
number_format | 数字的类型，用于给多个集群命名 | string | 否 |
vswitch_ids | VSwitch ID 列表 | list | 否 |
k8s_name_prefix | Kubernetes 集群名字前缀 | string | 否 |
new_nat_gateway | 是否创建新的 NAT 网关 | bool | 否 |
enable_ssh | 是否启用 SSH 登陆 | bool | 否 |
cpu_policy | 节点 CPU 管理策略。当集群版本在1.12.6及以上时支持以下两种策略：'static'、'none'，默认是 'none' | string | 否 |
k8s_pod_cidr | Kubernetes pod CIDR，不能与 VPC、VSwitch 的一样或是他们的子集 | string | 否 |
writeConnectionSecretToRef | 云资源连接信息即将写入的 secret 的信息 | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | 否 |


#### writeConnectionSecretToRef

名字 | 描述 | 类型 | 是否必须 | 默认值
------------ | ------------- | ------------- | ------------- | ------------- 
name | 云资源连接信息即将写入的 secret 的名字 | string | 是 |
namespace | 云资源连接信息即将写入的 secret 的 namespace | string | 否 |

## 输出

如果设置了 `writeConnectionSecretToRef`，一个 Kubernetes Secret 将会被创建，并且，它的数据里有这些键（key）。

名字 | 描述
------------ | -------------
name | ACK Kubernetes 集群名字 |
kubeconfig | ACK Kubernetes 集群 KubeConfig 的字符串 |
