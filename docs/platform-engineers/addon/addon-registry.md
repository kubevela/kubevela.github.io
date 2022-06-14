---
title: Build your addon registry
---

An addon registry can be used for discovering and distributing addon. Currently,KubeVela has supported two types
registry: git and helm repo.

## Git as registry

A directory contains some sub-directories stored in git repository can be used as an addon registry.

The git type registry type has supported github, gitlab and gitee.

A typical git addon registry is like [catalog](https://github.com/kubevela/catalog/tree/master/addons). You can clone
this repo to your local path and then push to your own git repository.

If your repository type is github, you can use this command to add your addon registry.

```yaml
vela addon registry add my-repo --type git --endpoint=<URL> --path=<ptah> --gitToken=<git token>
```

If is gitee, you can use:

```yaml
vela addon registry add my-repo --type gitee --endpoint=<URL> --path=<ptah> --gitToken=<git token>
```

If is gitlab, you can use:

```yaml
vela addon registry add my-repo --type gitlab --gitRepoName=<repoName> --endpoint=<URL> --path=<ptah> --gitToken=<git token>
```

## Helm chart repository as registry

A [helm chart repository](https://helm.sh/docs/topics/chart_repository/) can be used to store addon package.

You can build your own helm repository follow
this [tutorial](https://helm.sh/docs/topics/chart_repository/#hosting-chart-repositories).

If you already have one, you can add it as addon registry by this command:

```yaml
vela addon registry add my-repo --type helm --endpoint=<URL>
```

If your helm repo must be accessed with username and password. You can set them by:

```yaml
vela addon registry add my-repo --type helm --endpoint=<URL> --username=<username> --password=<passwor>
```

A helm repo type registry can store addon's multi-versions of an addon. In the future we will
support [chart-museum](https://chartmuseum.com/docs/) addon, and provide an easier way to build your own versioned addon
registry.







