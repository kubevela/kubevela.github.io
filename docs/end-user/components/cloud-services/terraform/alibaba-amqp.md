---
title:  Alibaba Cloud AMQP
---

## Description

Terraform configuration for Alibaba Cloud AMQP(RabbitMQ)

## Specification


### Properties

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 argument | The specification of the argument. | string | false |  
 auto_delete_state | Specifies whether the Auto Delete attribute is configured. Valid values: true: The Auto Delete attributeis configured. If the last queue that is bound to an exchange is unbound, the exchange is automatically deleted. false: The Auto Delete attribute is not configured. If the last queue that is bound to an exchange is unbound, the exchange is not automatically deleted. | bool | false |  
 binding_type | The specification of the binding type. Valid values: EXCHANGE, QUEUE. | string | false |  
 create | Whether to create instance. If false, you can specify an existing instance by setting 'instance_id'. | bool | false |  
 exchange_type | The specification of the exchange type. Valid values: FANOUT, DIRECT, TOPIC, HEADERS | string | false |  
 instance_id | The instance_id used to RabbitMQ. If set, the 'create' will be ignored. | string | false |  
 instance_type | The specification of the instance type. Valid values: professional, vip. | string | false |  
 internal | The specification of the internal. | bool | false |  
 max_eip_tps | The specification of the max eip tps. It is valid when support_eip is true. The valid value is [128, 45000] with the step size 128 | number | false |  
 max_tps | The specification of the peak TPS traffic. The smallest valid value is 1000 and the largest value is 100,000. | number | false |  
 name | The specification of module name. | string | false |  
 payment_type | The specification of the payment type. | string | false |  
 period | The specification of the period. Valid values: 1, 12, 2, 24, 3, 6. | number | false |  
 queue_capacity | The specification of the queue capacity. The smallest value is 50 and the step size 5. | number | false |  
 support_eip | The specification of support EIP. | bool | false |  
 writeConnectionSecretToRef | The secret which the cloud resource connection will be written to | [writeConnectionSecretToRef](#writeConnectionSecretToRef) | false |  


#### writeConnectionSecretToRef

 Name | Description | Type | Required | Default 
 ------------ | ------------- | ------------- | ------------- | ------------- 
 name | The secret name which the cloud resource connection will be written to | string | true |  
 namespace | The secret namespace which the cloud resource connection will be written to | string | false |  
