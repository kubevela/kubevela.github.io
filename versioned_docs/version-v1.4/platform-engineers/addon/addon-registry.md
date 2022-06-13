---
title: Build your addon registry
---

An addon registry can be used for discovering and  distributing addon. Currently,KubeVela has supported two types registry: git and helm repo.

## Git as registry

A directory contains some sub-directories stored in git repository can be used as an addon registry.

The git type registry  type has  supported github, gitlab and gitee.

A typical git addon registry is like [catalog](https://github.com/kubevela/catalog/tree/master/addons). You can clone this repo to your local path and then push to your own git repository.

Then you can use this command to add your addon registry.

```yaml
vela addon registry add my-repo --type git --endpoint=<URL> --path=<ptah> --gitToken=<git token>
```

## Helm repository as registry

A helm repository can be used store addon package. If you already have a helm repo, you can add it as addon registry by this command:

```yaml
vela addon registry add my-repo --type helm --endpoint=<URL>
```

If your helm repo setup with http basic auth, you can set the username and password by:

```yaml
vela addon registry add my-repo --type helm --endpoint=<URL> --username=<username> --password=<passwor>
```

A helm repo type registry can store addon's multi-versions of an addon. In the future we will support chart-museum addon, and provide an  easier way to build your own versioned addon registry.







