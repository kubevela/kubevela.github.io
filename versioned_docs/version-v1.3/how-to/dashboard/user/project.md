---
title: Project management
---

Project provides a logical separation of applications、environments and delivery targets, this is helpful when VelaUX is used by multiple teams. Project can provide the following features:

* restrict where applications may be deployed to (target clusters and namespaces).
* restrict what integration configs can be use(trusted Helm repositories, docker registries or cloud providers).
* restrict the different permission of each user, provide a multiple-level permission control skill (RBAC).

## The Default Project

Once installed VelaUX has one default project with name `Default` owned by the `admin` user. At the same time, the default delivery target and environment are also generated automatically and bound to the project.

## Creating Projects

Users with project management permissions can go to `Platform/Projects` page for settings，in this page you could create and delete project.

![project-list](https://static.kubevela.net/images/1.3/project-list.jpg)

Click the `New Project` button for creating a project. Each project should set name and owner, the owner user will be granted the project admin role automatically after the project created.

## Updating Projects

Project owner, alias, and description fields can be updated. Click the project name and go to the project detail page, you can manage the members and roles in this project.

## Deleting Projects

If there are applications and environments living in one project, then deleting the project is not allowed. You must clean up the applications, environments, and targets in the project before you can delete.
