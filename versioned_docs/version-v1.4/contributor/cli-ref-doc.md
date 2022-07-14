---
title: Update Reference Docs
---

Here're introduction of how to generate docs automatically from Golang scripts.

## CLI Reference

This guide introduce how to update [CLI reference doc](../cli/vela) in the website.
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
ga .
git push
```