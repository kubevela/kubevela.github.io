---
title: Update Reference Docs
---

This guide is an introduction of how to generate docs automatically from Golang scripts.

## CLI Reference

This section introduce how to update [CLI reference doc](../cli/vela) in the website.
The whole process was done by script automatically. You need to follow this guide to build your environment.

1. step up these two projects in the same folder.

```shell
$ tree -L 1
.
├── kubevela
└── kubevela.io
```

2. Run generate command in kubevela root dir.

```shell
cd kubevela/
go run ./hack/docgen/cli/gen.go
```

3. Update more docs such as i18n zh

```shell
$ go run ./hack/docgen/cli/gen.go ../kubevela.io/i18n/zh/docusaurus-plugin-content-docs/current/cli
scanning rootPath of CLI docs for replace:  ../kubevela.io/i18n/zh/docusaurus-plugin-content-docs/current/cli
```

4. Then you can check the difference in kubevela.io.

```shell
cd ../kubevela.io
git status
```

5. Check in the changes and send pull request.

## Built-in Definition Reference

This section introduce how to definition reference docs in the website, including:

- [component definition reference doc](../end-user/components/references).
- [trait definition reference doc](../end-user/traits/references).
- [policy definition reference doc](../end-user/policies/references).
- [workflow step definition reference doc](../end-user/workflow/built-in-workflow-defs).

Most of the steps are done by script automatically. You need to follow this guide to build your environment.

1. step up these two projects in the same folder.

```shell
$ tree -L 1
.
├── kubevela
└── kubevela.io
```

2. Run generate command in kubevela root dir.

```shell
cd kubevela/
go run hack/docgen/def/gen.go
```

3. Then you can check the difference in kubevela.io.

```shell
cd ../kubevela.io
git status
```

4. Check in the changes and send pull request.


## Terraform Based Cloud Resource Reference

This section introduce how to update [terraform based cloud resource reference doc](../end-user/components/cloud-services/cloud-resources-list) in the website.

Most of the steps are done by script automatically. You need to follow this guide to build your environment.

1. step up these two projects in the same folder.

```shell
$ tree -L 1
.
├── kubevela
└── kubevela.io
```

2. Run generate command in kubevela root dir.

```shell
cd kubevela/
go run ./hack/docgen/terraform/generate.go
```

3. Update the list if there're new cloud resources
  - `kubevela.io/docs/end-user/components/cloud-services/cloud-resources-list.md`
  - I18n/zh: `kubevela.io/i18n/zh/docusaurus-plugin-content-docs/current/end-user/components/cloud-services/cloud-resources-list.md`

4. Then you can check the difference in kubevela.io.

```shell
cd ../kubevela.io
git status
```

5. Check in the changes and send pull request.