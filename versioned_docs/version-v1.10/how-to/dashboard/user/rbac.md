---
title: VelaUX RBAC
---

The RBAC feature enabled restriction of access to VelaUX resources. The UI and API could strict permission verification. We designed platform-scope roles and project-scope roles, Each role can be bound to a set of permission policies, and users can obtain corresponding permissions when they are bound to the role.

## Built-in permission policies

A permission policy consists of resources、action and effect, there are some built-in permission policies, including:

```
* Cluster Management （resource:[cluster:*/*] action:* effect:allow scope:platform）
* Project Management （resource:[project:*] action:* effect:allow scope:platform）
* Addon Management   （resource:[addon:*,addonRegistry:*] action:* effect:allow scope:platform）
* Target Management  （resource:[target:*,cluster:*/namespace:*] action:* effect:allow scope:platform）
* User Management    （resource:[user:*] action:* effect:allow scope:platform）
* Platform Role Management （resource:[role:*, permission:*] action:* effect:allow scope:platform）
* Admin              （resource:[*:*] action:* effect:allow scope:platform）

* Project Read       （resource:[project:{projectName}] action:detail effect:allow scope:project）
* App Management     （resource:[project:{projectName}/application:*/*, definition:* ] action:* effect:allow scope:platform）
* Environment Management （resource:[project:{projectName}/environment:*] action:* effect:allow scope:platform）
* Role Management    （resource:[project:{projectName}/role:*,project:{projectName}/projectUser:*,project:{projectName}/permission:*] action:* effect:allow scope:project)
```

Currently, built-in permission policies cover all resources. It is conceivable that these permissions can be flexibly customized, we will provide the API and UI page to manage the custom permission.

## Built-in roles

A role consists of a role name and the set of permissions it contains, we have built in some common roles:

* Admin：platform scope role，include the `Admin` permission，that all operation rights of all resources。
* App Developer：project scope role，include permissions required for app development.
* Project Admin：project scope role，including administrative rights for all resources under the project.

## Custom roles

You can customize the list of roles for a platform or project based on your business or team needs.

### platform scope role

Go to `Platform/Roles` page，you can get all platform-scope roles。

![role list](https://static.kubevela.net/images/1.3/role-dashboard.jpg)

Click the `New Role` button, you can open the drawer page for creating a role, you should input some required info, such as the role's name, alias and permissions. Click the `Create` button then complete.

### project scope role

First you need to go to the project details page, If users with project list query permission can enter through the project list, If not, you can enter through the application detail page.

![role list](https://static.kubevela.net/images/1.3/project-dashboard.jpg)

Switch to the role management page on the project details page to add or modify role information under the project.

![role list](https://static.kubevela.net/images/1.3/project-role.jpg)

## User bound role

* Platform-scope roles need to be bound to users on the user management page. One user can be bound to multiple platform-scope roles.

* Project-scope roles need to be set in the project member management page, and roles need to be bound when users are added to the project, or modify the existing users' roles.


## Working with Kubernetes RBAC

The VelaUX User will be projected into the underlying Kubernetes User when you configured the FeatureGates of the VelaUX apiserver through `--feature-gates=EnableImpersonation=true`. In this way, the application of VelaUX will use the idenity of the Project and the VelaUX User, which means it is possible for system operators to restrict the user's access through Kubernetes RBAC mechanism behind VelaUX.