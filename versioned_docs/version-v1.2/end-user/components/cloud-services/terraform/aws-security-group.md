---
title:  AWS SECURITY-GROUP
---

## Description

Terraform module which creates EC2-VPC security groups on AWS

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 ingress_with_self | List of ingress rules to create where 'self' is defined | list(map(string)) | false |  
 ingress_ipv6_cidr_blocks | List of IPv6 CIDR ranges to use on all ingress rules | list(string) | false |  
 computed_ingress_with_source_security_group_id | List of computed ingress rules to create where 'source_security_group_id' is used | list(map(string)) | false |  
 number_of_computed_ingress_with_ipv6_cidr_blocks | Number of computed ingress rules to create where 'ipv6_cidr_blocks' is used | number | false |  
 egress_ipv6_cidr_blocks | List of IPv6 CIDR ranges to use on all egress rules | list(string) | false |  
 egress_prefix_list_ids | List of prefix list IDs (for allowing access to VPC endpoints) to use on all egress rules | list(string) | false |  
 computed_egress_with_cidr_blocks | List of computed egress rules to create where 'cidr_blocks' is used | list(map(string)) | false |  
 vpc_id | ID of the VPC where to create security group | string | false |  
 computed_ingress_rules | List of computed ingress rules to create by name | list(string) | false |  
 egress_with_cidr_blocks | List of egress rules to create where 'cidr_blocks' is used | list(map(string)) | false |  
 putin_khuylo | Do you agree that Putin doesn't respect Ukrainian sovereignty and territorial integrity? More info: https://en.wikipedia.org/wiki/Putin_khuylo! | bool | false |  
 create_timeout | Time to wait for a security group to be created | string | false |  
 tags | A mapping of tags to assign to security group | map(string) | false |  
 ingress_with_ipv6_cidr_blocks | List of ingress rules to create where 'ipv6_cidr_blocks' is used | list(map(string)) | false |  
 computed_ingress_with_ipv6_cidr_blocks | List of computed ingress rules to create where 'ipv6_cidr_blocks' is used | list(map(string)) | false |  
 number_of_computed_ingress_with_source_security_group_id | Number of computed ingress rules to create where 'source_security_group_id' is used | number | false |  
 egress_with_self | List of egress rules to create where 'self' is defined | list(map(string)) | false |  
 computed_egress_rules | List of computed egress rules to create by name | list(string) | false |  
 number_of_computed_egress_with_cidr_blocks | Number of computed egress rules to create where 'cidr_blocks' is used | number | false |  
 security_group_id | ID of existing security group whose rules we will manage | string | false |  
 number_of_computed_egress_with_source_security_group_id | Number of computed egress rules to create where 'source_security_group_id' is used | number | false |  
 create_sg | Whether to create security group | bool | false |  
 name | Name of security group - not required if create_sg is false | string | false |  
 computed_ingress_with_self | List of computed ingress rules to create where 'self' is defined | list(map(string)) | false |  
 egress_rules | List of egress rules to create by name | list(string) | false |  
 egress_with_ipv6_cidr_blocks | List of egress rules to create where 'ipv6_cidr_blocks' is used | list(map(string)) | false |  
 egress_with_source_security_group_id | List of egress rules to create where 'source_security_group_id' is used | list(map(string)) | false |  
 create | Whether to create security group and all rules | bool | false |  
 ingress_with_source_security_group_id | List of ingress rules to create where 'source_security_group_id' is used | list(map(string)) | false |  
 ingress_cidr_blocks | List of IPv4 CIDR ranges to use on all ingress rules | list(string) | false |  
 ingress_prefix_list_ids | List of prefix list IDs (for allowing access to VPC endpoints) to use on all ingress rules | list(string) | false |  
 computed_ingress_with_cidr_blocks | List of computed ingress rules to create where 'cidr_blocks' is used | list(map(string)) | false |  
 number_of_computed_ingress_with_self | Number of computed ingress rules to create where 'self' is defined | number | false |  
 use_name_prefix | Whether to use name_prefix or fixed name. Should be true to able to update security group name after initial creation | bool | false |  
 revoke_rules_on_delete | Instruct Terraform to revoke all of the Security Groups attached ingress and egress rules before deleting the rule itself. Enable for EMR. | bool | false |  
 ingress_rules | List of ingress rules to create by name | list(string) | false |  
 ingress_with_cidr_blocks | List of ingress rules to create where 'cidr_blocks' is used | list(map(string)) | false |  
 egress_cidr_blocks | List of IPv4 CIDR ranges to use on all egress rules | list(string) | false |  
 computed_egress_with_ipv6_cidr_blocks | List of computed egress rules to create where 'ipv6_cidr_blocks' is used | list(map(string)) | false |  
 number_of_computed_egress_rules | Number of computed egress rules to create by name | number | false |  
 number_of_computed_egress_with_self | Number of computed egress rules to create where 'self' is defined | number | false |  
 description | Description of security group | string | false |  
 computed_egress_with_source_security_group_id | List of computed egress rules to create where 'source_security_group_id' is used | list(map(string)) | false |  
 number_of_computed_egress_with_ipv6_cidr_blocks | Number of computed egress rules to create where 'ipv6_cidr_blocks' is used | number | false |  
 computed_egress_with_self | List of computed egress rules to create where 'self' is defined | list(map(string)) | false |  
 number_of_computed_ingress_rules | Number of computed ingress rules to create by name | number | false |  
 number_of_computed_ingress_with_cidr_blocks | Number of computed ingress rules to create where 'cidr_blocks' is used | number | false |  
 delete_timeout | Time to wait for a security group to be deleted | string | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
