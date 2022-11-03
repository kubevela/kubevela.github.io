---
title: 分别配置实例和数据库
---

在文档[创建和使用云资源](../../../tutorials/consume-cloud-services)和[数据库创建和初始化](./provision-and-initiate-database)中，我们创建了一个 RDS 实例和一个数据库。 但是，你也可以创建一个 RDS 实例，并在上面创建多个数据库。
当你想节省创建多个实例的成本时，此模式很有用。

本指南将以阿里云 RDS 为例，介绍如何创建有多个数据库的 RDS 实例。

## 先决条件

1. `terraform` 插件已经启用
2. `terraform-alibaba` 插件已经启用，版本 >= 1.0.3
3. 已经使用 `vela config create -t terraform-alibaba` 配置了云厂商账号。

如有疑问，可以按照这个[指导](../../../reference/addons/terraform) 进行设置。

## 步骤

### 配置 RDS 实例

使用以下应用创建一个 RDS 实例。

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

现在你可以通过执行以下命令获取 RDS 实例 ID：

```shell
kubectl get configuration -n default rds-instance -ojson | jq -r .status.apply.outputs.instance_id.value
```

结果类似下面这样
    
```shell
rm-bp1du0wif7kXXXXX
```

### 配置 RDS 数据库

使用以下应用来创建 RDS 数据库。记得将 `<your-region>` 和 `<your-instance-id>` 替换为你的实际值。

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

大约 2 分钟之后，执行 `vela status` 可以检查应用状态：

```shell
vela status app-db-1 -n default
```

## 结论

你已经学习了如何使用不同的应用创建 RDS 实例和数据库。作为平台工程师，你可以使用此模式为你的用户提供共享相同实例的数据库。 当业务增长时，你可以将数据库迁移到独占的实例中。
