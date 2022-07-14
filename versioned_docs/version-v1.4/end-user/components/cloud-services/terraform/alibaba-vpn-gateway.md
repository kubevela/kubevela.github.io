---
title:  Alibaba Cloud VPN-GATEWAY
---

## Description

Create VPN resources on AliCloud based on Terraform module

## Specification


 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 cgw_description | The description of the VPN customer gateway instance. | string | false |  
 cgw_id | The customer gateway id used to connect with vpn gateway. | string | false |  
 cgw_ip_address | The IP address of the customer gateway. | string | false |  
 cgw_name | The name of the VPN customer gateway. Defaults to null. | string | false |  
 ike_auth_alg | The authentication algorithm of phase-one negotiation. Valid value: md5 | sha1. Default value: sha1. | string | false |  
 ike_enc_alg | The encryption algorithm of phase-one negotiation. Valid value: aes | aes192 | aes256 | des | 3des. Default Valid value: aes. | string | false |  
 ike_lifetime | The SA lifecycle as the result of phase-one negotiation. The valid value of n is [0, 86400], the unit is second and the default value is 86400. | number | false |  
 ike_local_id | The identification of the VPN gateway. | string | false |  
 ike_mode | The negotiation mode of IKE V1. Valid value: main (main mode) | aggressive (aggressive mode). Default value: main. | string | false |  
 ike_pfs | The Diffie-Hellman key exchange algorithm used by phase-one negotiation. Valid value: group1 | group2 | group5 | group14 | group24. Default value: group2. | string | false |  
 ike_remote_id | The identification of the customer gateway. | string | false |  
 ike_version | The version of the IKE protocol. Valid value: ikev1 | ikev2. Default value: ikev1. | string | false |  
 ipsec_auth_alg | The authentication algorithm of phase-two negotiation. Valid value: md5 | sha1. Default value: sha1. | string | false |  
 ipsec_connection_name | The name of the IPsec connection. | string | false |  
 ipsec_effect_immediately | Whether to delete a successfully negotiated IPsec tunnel and initiate a negotiation again. Valid value:true,false. | bool | false |  
 ipsec_enc_alg | The encryption algorithm of phase-two negotiation. Valid value: aes | aes192 | aes256 | des | 3des. Default value: aes. | string | false |  
 ipsec_lifetime | The SA lifecycle as the result of phase-two negotiation. The valid value is [0, 86400], the unit is second and the default value is 86400. | number | false |  
 ipsec_local_subnet | The CIDR block of the VPC to be connected with the local data center. This parameter is used for phase-two negotiation. | list(string) | false |  
 ipsec_pfs | The Diffie-Hellman key exchange algorithm used by phase-two negotiation. Valid value: group1 | group2 | group5 | group14 | group24. Default value: group2. | string | false |  
 ipsec_remote_subnet | The CIDR block of the local data center. This parameter is used for phase-two negotiation. | list(string) | false |  
 psk | Used for authentication between the IPsec VPN gateway and the customer gateway. | string | false |  
 region | (Deprecated from version 1.2.0) The region used to launch this module resources. | string | false |  
 ssl_cipher | The encryption algorithm used by the SSL-VPN server. Valid value: AES-128-CBC (default)| AES-192-CBC | AES-256-CBC | none. | string | false |  
 ssl_client_cert_names | The names of the client certificates. | list(string) | false |  
 ssl_client_ip_pool | The CIDR block from which access addresses are allocated to the virtual network interface card of the client. | string | false |  
 ssl_compress | Specify whether to compress the communication. Valid value: true (default) | false. | bool | false |  
 ssl_local_subnet | The CIDR block to be accessed by the client through the SSL-VPN connection. | string | false |  
 ssl_port | The port used by the SSL-VPN server. The default value is 1194.The following ports cannot be used: [22, 2222, 22222, 9000, 9001, 9002, 7505, 80, 443, 53, 68, 123, 4510, 4560, 500, 4500]. | number | false |  
 ssl_protocol | The protocol used by the SSL-VPN server. Valid value: UDP(default) |TCP. | string | false |  
 ssl_vpn_server_name | The name of the SSL-VPN server. | string | false |  
 vpc_id | The VPN belongs the vpc_id, the field can't be changed. | string | false |  
 vpn_bandwidth | The value should be 10, 100, 200, 500, 1000 if the user is postpaid, otherwise it can be 5, 10, 20, 50, 100, 200, 500, 1000. | number | false |  
 vpn_charge_type | The charge type for instance. Valid value: PostPaid, PrePaid. Default to PostPaid. | string | false |  
 vpn_description | The description of the VPN instance. | string | false |  
 vpn_enable_ipsec | Enable or Disable IPSec VPN. At least one type of VPN should be enabled. | bool | false |  
 vpn_enable_ssl | Enable or Disable SSL VPN.  At least one type of VPN should be enabled. | bool | false |  
 vpn_name | Name of the VPN gateway. | string | false |  
 vpn_period | The filed is only required while the InstanceChargeType is prepaid. | number | false |  
 vpn_ssl_connections | The max connections of SSL VPN. Default to 5. This field is ignored when enable_ssl is false. | number | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
