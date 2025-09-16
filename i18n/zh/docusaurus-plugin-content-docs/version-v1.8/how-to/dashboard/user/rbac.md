---
title: RBAC 授权
---

RBAC 功能可以限制对 KubeVela 资源的访问。UI 和 API 都会进行严格的权限校验。我们设计了平台级角色和项目级角色，每一个角色可绑定一组权限策略，用户绑定到角色即获取对应的权限。

## 内置权限策略

一个权限策略核心由资源+动作+控制策略组成，我们目前内置了部分权限策略，包括：

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

目前提供的默认权限定义覆盖了所有的资源，可想而知的是，这些权限都可以灵活的自定义，后续根据需要提供对应的 API 和管理页面。

## 内置角色

角色由角色名称和包含的权限集组成，我们内置了一些常用角色：

* Admin：系统级角色，包含 Admin 权限，即所有资源的所有操作权。
* App Developer：项目级角色，包括应用开发所需的权限。
* Project Admin：项目级角色，包括项目下所有资源的管理权限。

## 自定义角色

你可以根据企业或团队需求自定义平台或项目的角色列表。

### 平台角色

进入 Platform/Roles 页面，即可查询和管理平台级角色。

![role list](https://kubevela.io/images/1.3/role-dashboard.jpg)

点击右上方的 `添加角色` 按钮即可进入添加页面，填写角色名称选择包含的权限即可。

### 项目角色

首先需要进入项目的详情页面，如果有项目列表查询权限的用户可通过项目列表进入，如果没有列表查询权限的用户可通过应用页面中所属项目入口进入到项目详情页面。

![role list](https://kubevela.io/images/1.3/project-dashboard.jpg)

在项目详情页面中切换到角色管理页面，即可添加或修改项目下的角色信息。

![role list](https://kubevela.io/images/1.3/project-role.jpg)

## 用户绑定角色

* 平台级角色需要在用户管理页面中进行用户绑定，一个用户可绑定多个平台级角色。

* 项目级角色需要在项目详情页/成员管理中进行设置，需要将用户添加到项目时进行角色绑定，或修改已有用户的角色。
