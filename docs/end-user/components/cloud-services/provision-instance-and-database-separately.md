---
title: Provision Instance and Database Separately
---

In the guide [Provision and Binding Cloud Resources](../../../tutorials/consume-cloud-services) and [Provision a Database and Import a SQL File for initialization](./provision-and-initiate-database),
We create an RDS instance and a database together. However, you can create an RDS instance and more than one database on it.
This pattern is useful when you want to save costs of creating multiple instances. 

This guide will take Alibaba Cloud RDS as an example to show how to create an RDS instance more than one database separately.

## Prerequisites

1. `terraform` addon has been enabled
2. `terraform-alibaba` addon has been enabled, version >= 1.0.3 
3. Credentials have been configured using `vela provider add terraform-alibaba`
If you have problems, you can follow to this [instruction](../../../reference/addons/terraform) to setup.

## Steps

### Provision the RDS instance

Using the following Application to create an RDS instance.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: app-rds-instance
spec:
  components:
    - name: rds-instance
      type: alibaba-rds-instance
      properties:
        instance_name: test_single_instance
```

Now you can get the RDS instance ID by running the following command:

```shell
kubectl get configuration -n default rds-instance -ojson | jq -r .status.apply.outputs.instance_id.value
```

The result will be like
    
```shell
rm-bp1du0wif7kXXXXX
```


### Provision the RDS database

Using the following Application to create an RDS database. Remember to replace `<your-region>` and `<your-instance-id>` with the real values.

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: app-db-1
spec:
  components:
    - name: demo-database-1
      type: alibaba-rds-database
      properties:
        region: <your-region>
        existing_instance_id: <your-instance-id>
        database_name: first_database
        password: fake_password
        account_name: first_db_account
```

About 2 minutes later, you can check the app status by running `vela status`:

```shell
vela status app-db-1 -n default
```

## Conclusion

You have learnt how to create an RDS instance and a database with different applications. As a platform engineer, you can 
use this pattern to provide database sharing the same instance to your users. When the business is growing, you can migrate
database to an exclusive instance.