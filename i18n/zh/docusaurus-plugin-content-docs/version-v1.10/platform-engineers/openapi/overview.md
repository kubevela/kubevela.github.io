---
title: VelaUX OpenAPI
---

本节将介绍如何集成 VelaUX OpenAPI，请确保您已启用 `velaux` 插件。 让我们使用端口转发来公开以下演示的端点。

```bash
vela port-forward addon-velaux -n vela-system 8000:80
```

## 身份验证和 API 示例

### 登录并获取令牌

VelaUX 引入了 [Json Web Token](https://jwt.io/) 进行授权。 因此，您需要调用登录接口来完成认证并获取token。 以下示例使用默认管理员帐户。

```bash
curl -H Content-Type:application/json -X POST -d '{"username": "admin", "password":"VelaUX12345"}' http://127.0.0.1:8000/api/v1/auth/login
```

> `http://127.0.0.1:8000` 这是演示地址，您应该将其替换为真实地址。 如果您更改了密码，请将其替换为真实密码。

预期的输出应该是这样的：

```json
{
 "user": {
  "createTime": "0001-01-01T00:00:00Z",
  "lastLoginTime": "0001-01-01T00:00:00Z",
  "name": "admin",
  "email": "barnett.zqg@gmail.com",
  "disabled": false
 },
 "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluIiwiZ3JhbnRUeXBlIjoiYWNjZXNzIiwiZXhwIjoxNjU2NTE0ODcyLCJpc3MiOiJ2ZWxhLWlzc3VlciIsIm5iZiI6MTY1NjUxMTI3Mn0.IqRWglW5cYMn8KJcbkoG55os9g-YTo_9UWFvbpZBKiY",
 "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluIiwiZ3JhbnRUeXBlIjoicmVmcmVzaCIsImV4cCI6MTY1NjU5NzY3MiwiaXNzIjoidmVsYS1pc3N1ZXIiLCJuYmYiOjE2NTY1MTEyNzJ9.mUjXj1BQ2c3MaVyYnMYefgH2g8Y-swgjyCAzH-GbZu8"
}
```

* accessToken: 这是请求其他API的token，一个小时后就会过期。
* refreshToken: 这是刷新访问令牌的令牌。

### 请求其他API

* 创建一个应用程序

```bash
curl -H Content-Type:application/json -H "Authorization: Bearer <accessToken>" -X POST -d '{"name":"first-vela-app", "project": "default", "alias": "Demo App", "envBinding": [{"name": "default"}], "component": {"name":"express-server","componentType":"webservice", "properties": "{\"image\":\"oamdev/hello-world\"}"}}' http://127.0.0.1:8000/api/v1/applications
```

> 请将 `<accessToken>` 替换为上一步的响应。

预期的输出应该是这样的：

```json
{
 "name": "first-vela-app",
 "alias": "Demo App",
 "project": {
  "name": "default",
  "alias": "Default",
  "description": "Default project is created by velaux system automatically.",
  "createTime": "2022-06-24T14:41:42.237565+08:00",
  "updateTime": "2022-06-24T14:41:42.237565+08:00",
  "owner": {
   "name": "admin",
   "alias": "Administrator"
  }
 },
 "description": "",
 "createTime": "2022-06-29T22:18:53.699216+08:00",
 "updateTime": "2022-06-29T22:18:53.699217+08:00",
 "icon": ""
}
```

* 部署应用程序

```bash
curl -H Content-Type:application/json -H "Authorization: Bearer <accessToken>" -X POST -d '{"workflowName":"workflow-default","triggerType":"api"}' http://127.0.0.1:8000/api/v1/applications/first-vela-app/deploy
```

预期的输出应该是这样的：

```json
{
 "createTime": "2022-06-29T22:24:25.735085+08:00",
 "version": "20220629222425586",
 "status": "running",
 "deployUser": {
  "name": "admin",
  "alias": "Administrator"
 },
 "note": "",
 "envName": "default",
 "triggerType": "api"
}
```

* 使用VelaQL查询应用程序pod列表

```bash
curl -H "Authorization: Bearer <accessToken>" -G \
    "http://127.0.0.1:8000/api/v1/query" \
    --data-urlencode 'velaql=component-pod-view{appNs=default,appName=first-vela-app}.status'
```

预期的输出应该是这样的：

```json
{
 "podList": [
  {
   "cluster": "local",
   "component": "express-server",
   "metadata": {
    "creationTime": "2022-06-29T14:24:26Z",
    "name": "express-server-6f58ff895b-4gqvs",
    "namespace": "default",
    "version": {
     "deployVersion": "20220629222425586",
     "publishVersion": "workflow-default-20220629222425602"
    }
   },
   "status": {
    "hostIP": "172.18.0.2",
    "nodeName": "cloudshell-control-plane",
    "phase": "Running",
    "podIP": "10.244.0.25"
   },
   "workload": {
    "apiVersion": "apps/v1",
    "kind": "Deployment",
    "name": "express-server",
    "namespace": "default"
   }
  }
 ]
}
```

更多关于 VelaQL 的使用案例，请参考 [VelaQL](../system-operation/velaql.md)

### 刷新令牌

```bash
curl -H Content-Type:application/json -X GET -H RefreshToken:<refreshToken> http://127.0.0.1:8000/api/v1/auth/refresh_token
```

预期的输出应该是这样的：

```json
{
 "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluIiwiZ3JhbnRUeXBlIjoiYWNjZXNzIiwiZXhwIjoxNjU2NTE2OTExLCJpc3MiOiJ2ZWxhLWlzc3VlciIsIm5iZiI6MTY1NjUxMzMxMX0.zsUW_ME5mxTQxP-UFxQa4F8QDI-69RWpcfIFkn_WFSg",
 "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluIiwiZ3JhbnRUeXBlIjoicmVmcmVzaCIsImV4cCI6MTY1NjU5NzY3MiwiaXNzIjoidmVsYS1pc3N1ZXIiLCJuYmYiOjE2NTY1MTEyNzJ9.mUjXj1BQ2c3MaVyYnMYefgH2g8Y-swgjyCAzH-GbZu8"
}
```

## API Document

最新的swagger配置文件： [https://github.com/kubevela/velaux/blob/main/docs/apidoc/swagger.json](https://github.com/kubevela/velaux/blob/main/docs/apidoc/swagger.json)

### 1.7

参考 [KubeVela API 1.7](https://kubevela.stoplight.io/docs/kubevela/b8aer09sc4q9e-kube-vela-api-1-7)

### 1.6

参考 [KubeVela API 1.6](https://kubevela.stoplight.io/docs/kubevela/178jb51mk763f-kube-vela-api-1-6)

### 1.5

参考 [KubeVela API 1.5](https://kubevela.stoplight.io/docs/kubevela/pi1st0zdzoejp-kube-vela-api-1-5)


### 1.4

参考 [KubeVela API 1.4](https://kubevela.stoplight.io/docs/kubevela/uz7fzdxthv175-kube-vela-api-1-4)

### 1.3

参考 [KubeVela API 1.3](https://kubevela.stoplight.io/docs/kubevela/1d086db94299e-kube-vela-api-1-3)
