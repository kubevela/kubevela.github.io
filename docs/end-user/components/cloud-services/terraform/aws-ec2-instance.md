---
title:  AWS EC2-INSTANCE
---

## Description

Terraform module which creates EC2 instance(s) on AWS

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 enable_volume_tags | Whether to enable volume tags (if enabled it conflicts with root_block_device tags) | bool | false |  
 name | Name to be used on EC2 instance created | string | false |  
 ami | ID of AMI to use for the instance | string | false |  
 ebs_block_device | Additional EBS block devices to attach to the instance | list(map(string)) | false |  
 enclave_options_enabled | Whether Nitro Enclaves will be enabled on the instance. Defaults to `false` | bool | false |  
 instance_initiated_shutdown_behavior | Shutdown behavior for the instance. Amazon defaults this to stop for EBS-backed instances and terminate for instance-store instances. Cannot be set on instance-store instance | string | false |  
 tags | A mapping of tags to assign to the resource | map(string) | false |  
 volume_tags | A mapping of tags to assign to the devices created by the instance at launch time | map(string) | false |  
 spot_wait_for_fulfillment | If set, Terraform will wait for the Spot Request to be fulfilled, and will throw an error if the timeout of 10m is reached | bool | false |  
 spot_type | If set to one-time, after the instance is terminated, the spot request will be closed. Default `persistent` | string | false |  
 spot_instance_interruption_behavior | Indicates Spot instance behavior when it is interrupted. Valid values are `terminate`, `stop`, or `hibernate` | string | false |  
 associate_public_ip_address | Whether to associate a public IP address with an instance in a VPC | bool | false |  
 host_id | ID of a dedicated host that the instance will be assigned to. Use when an instance is to be launched on a specific dedicated host | string | false |  
 launch_template | Specifies a Launch Template to configure the instance. Parameters configured on this resource will override the corresponding parameters in the Launch Template | map(string) | false |  
 tenancy | The tenancy of the instance (if the instance is running in a VPC). Available values: default, dedicated, host. | string | false |  
 user_data_base64 | Can be used instead of user_data to pass base64-encoded binary data directly. Use this instead of user_data whenever the value is not a valid UTF-8 string. For example, gzip-encoded user data must be base64-encoded and passed via this argument to avoid corruption. | string | false |  
 vpc_security_group_ids | A list of security group IDs to associate with | list(string) | false |  
 spot_block_duration_minutes | The required duration for the Spot instances, in minutes. This value must be a multiple of 60 (60, 120, 180, 240, 300, or 360) | number | false |  
 spot_valid_until | The end date and time of the request, in UTC RFC3339 format(for example, YYYY-MM-DDTHH:MM:SSZ) | string | false |  
 availability_zone | AZ to start the instance in | string | false |  
 instance_type | The type of instance to start | string | false |  
 spot_valid_from | The start date and time of the request, in UTC RFC3339 format(for example, YYYY-MM-DDTHH:MM:SSZ) | string | false |  
 create | Whether to create an instance | bool | false |  
 get_password_data | If true, wait for password data to become available and retrieve it. | bool | false |  
 hibernation | If true, the launched EC2 instance will support hibernation | bool | false |  
 placement_group | The Placement Group to start the instance in | string | false |  
 user_data | The user data to provide when launching the instance. Do not pass gzip-compressed data via this argument; see user_data_base64 instead. | string | false |  
 disable_api_termination | If true, enables EC2 Instance Termination Protection | bool | false |  
 ipv6_address_count | A number of IPv6 addresses to associate with the primary network interface. Amazon EC2 chooses the IPv6 addresses from the range of your subnet | number | false |  
 ipv6_addresses | Specify one or more IPv6 addresses from the range of the subnet to associate with the primary network interface | list(string) | false |  
 key_name | Key name of the Key Pair to use for the instance; which can be managed using the `aws_key_pair` resource | string | false |  
 metadata_options | Customize the metadata options of the instance | map(string) | false |  
 monitoring | If true, the launched EC2 instance will have detailed monitoring enabled | bool | false |  
 secondary_private_ips | A list of secondary private IPv4 addresses to assign to the instance's primary network interface (eth0) in a VPC. Can only be assigned to the primary network interface (eth0) attached at instance creation, not a pre-existing network interface i.e. referenced in a `network_interface block` | list(string) | false |  
 create_spot_instance | Depicts if the instance is a spot instance | bool | false |  
 spot_launch_group | A launch group is a group of spot instances that launch together and terminate together. If left empty instances are launched and terminated individually | string | false |  
 ephemeral_block_device | Customize Ephemeral (also known as Instance Store) volumes on the instance | list(map(string)) | false |  
 network_interface | Customize network interfaces to be attached at instance boot time | list(map(string)) | false |  
 ebs_optimized | If true, the launched EC2 instance will be EBS-optimized | bool | false |  
 private_ip | Private IP address to associate with the instance in a VPC | string | false |  
 root_block_device | Customize details about the root block device of the instance. See Block Devices below for details | list(any) | false |  
 source_dest_check | Controls if traffic is routed to the instance when the destination address does not match the instance. Used for NAT or VPNs. | bool | false |  
 cpu_core_count | Sets the number of CPU cores for an instance. | number | false |  
 spot_price | The maximum price to request on the spot market. Defaults to on-demand price | string | false |  
 capacity_reservation_specification | Describes an instance's Capacity Reservation targeting option | any | false |  
 cpu_credits | The credit option for CPU usage (unlimited or standard) | string | false |  
 iam_instance_profile | IAM Instance Profile to launch the instance with. Specified as the name of the Instance Profile | string | false |  
 subnet_id | The VPC Subnet ID to launch in | string | false |  
 timeouts | Define maximum timeout for creating, updating, and deleting EC2 instance resources | map(string) | false |  
 cpu_threads_per_core | Sets the number of CPU threads per core for an instance (has no effect unless cpu_core_count is also set). | number | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
