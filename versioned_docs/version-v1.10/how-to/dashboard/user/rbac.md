---
title: VelaUX RBAC
---

The RBAC feature enabled restriction of access to VelaUX resources. The UI and API could strict permission verification. We designed platform-scope roles and project-scope roles, Each role can be bound to a set of permission policies, and users can obtain corresponding permissions when they are bound to the role.

## Built-in permissions

A permission allows or denies a set of actions on a set of resources. VelaUX ships these.

Platform scope:

| Permission | Resources | Allows |
| --- | --- | --- |
| Admin | `*` | Everything. |
| Cluster Management | `cluster:*/*` | Add, change and remove clusters. |
| Project Management | `project:*` | Create, change and delete any project. |
| Project List | `project:*` | List every project (`list` only). |
| Addon Management | `addon:*`, `addonRegistry:*` | Enable and disable addons, and manage addon registries. |
| Target Management | `target:*`, `cluster:*/namespace:*` | Manage delivery targets and their namespaces. |
| User Management | `user:*` | Manage users. |
| Platform Role Management | `role:*`, `permission:*` | Manage platform roles and permissions. |
| Config Management | `config:*/*` | Manage platform configs. |
| Disable CloudShell | `cloudshell` | Denies CloudShell. |

Project scope, where `{projectName}` is the project the role belongs to:

| Permission | Resources | Allows |
| --- | --- | --- |
| Project View | the project and its configs, providers, roles, members, permissions, environments, applications and pipelines | Read them (`detail` and `list` only). |
| App Management | `project:{projectName}/application:*/*` | Manage the project's applications. |
| Environment Management | `project:{projectName}/environment:*` | Manage the project's environments. |
| Role Management | `project:{projectName}/role:*`, `project:{projectName}/projectUser:*`, `project:{projectName}/permission:*` | Manage the project's roles, members and permissions. |
| Config Management | `project:{projectName}/config:*`, `project:{projectName}/provider:*` | Manage the project's configs and cloud providers. |
| Pipeline Management | `project:{projectName}/pipeline:*/*` | Manage the project's pipelines. |

## Built-in roles

| Role | Scope | Permissions |
| --- | --- | --- |
| Admin | platform | Admin. |
| App Developer | project | Project View, App Management, Environment Management, Config Management, Pipeline Management. |
| Project Admin | project | Everything App Developer has, plus Role Management. |
| Project Viewer | project | Project View. |

Every new project gets its own App Developer, Project Admin and Project Viewer roles, and its owner is a Project Admin.

## Custom roles

You can customize the list of roles for a platform or project based on your business or team needs.

### platform scope role

Go to `Platform/Roles` page，you can get all platform-scope roles。

![role list](https://kubevela.io/images/1.3/role-dashboard.jpg)

Click the `New Role` button, you can open the drawer page for creating a role, you should input some required info, such as the role's name, alias and permissions. Click the `Create` button then complete.

### project scope role

First you need to go to the project details page, If users with project list query permission can enter through the project list, If not, you can enter through the application detail page.

![role list](https://kubevela.io/images/1.3/project-dashboard.jpg)

Switch to the role management page on the project details page to add or modify role information under the project.

![role list](https://kubevela.io/images/1.3/project-role.jpg)

## User bound role

* Platform-scope roles need to be bound to users on the user management page. One user can be bound to multiple platform-scope roles.

* Project-scope roles need to be set in the project member management page, and roles need to be bound when users are added to the project, or modify the existing users' roles.


## Working with Kubernetes RBAC

The VelaUX User will be projected into the underlying Kubernetes User when you configured the FeatureGates of the VelaUX apiserver through `--feature-gates=EnableImpersonation=true`. In this way, the application of VelaUX will use the idenity of the Project and the VelaUX User, which means it is possible for system operators to restrict the user's access through Kubernetes RBAC mechanism behind VelaUX.