---
title: VelaUX OpenAPI
---

This section will introduce how to integrate VelaUX OpenAPI, please make sure you have enabled the `velaux` addon. Let's use port-forward to expose the endpoint for the following demo.

```bash
vela port-forward addon-velaux -n vela-system 8000:80
```

## Authentication and API Example

### Login and get the token

VelaUX has introduced [Json Web Token](https://jwt.io/) for authorization. As a result, you need to call the login API to complete the authentication and get the token. The following example is with the default admin account.

```bash
curl -H Content-Type:application/json -X POST -d '{"username": "admin", "password":"VelaUX12345"}' http://127.0.0.1:8000/api/v1/auth/login
```

> `http://127.0.0.1:8000` This is demo address, you should replace it with the real address. If you changed the password, replace it with the real password.

The expected output should be like this:

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

* accessToken: This is the token to request other APIs, which will expire in an hour.
* refreshToken: This is the token to refresh the access token.

### Request other APIs

* Create an application

```bash
curl -H Content-Type:application/json -H "Authorization: Bearer <accessToken>" -X POST -d '{"name":"first-vela-app", "project": "default", "alias": "Demo App", "envBinding": [{"name": "default"}], "component": {"name":"express-server","componentType":"webservice", "properties": "{\"image\":\"oamdev/hello-world\"}"}}' http://127.0.0.1:8000/api/v1/applications
```

> Please replace `<accessToken>` with the response from the previous step.

The expected output should be like this:

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

* Deploy an application

```bash
curl -H Content-Type:application/json -H "Authorization: Bearer <accessToken>" -X POST -d '{"workflowName":"workflow-default","triggerType":"api"}' http://127.0.0.1:8000/api/v1/applications/first-vela-app/deploy
```

The expected output should be like this:

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

* Using VelaQL to Query the application pod list

```bash
curl -H "Authorization: Bearer <accessToken>" -G \
    "http://127.0.0.1:8000/api/v1/query" \
    --data-urlencode 'velaql=component-pod-view{appNs=default,appName=first-vela-app}.status'
```

The expected output should be like this:

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

For more use cases about VelaQL, Please refer to [VelaQL](../system-operation/velaql)

### Refresh the token

```bash
curl -H Content-Type:application/json -X GET -H RefreshToken:<refreshToken> http://127.0.0.1:8000/api/v1/auth/refresh_token
```

The expected output should be like this:

```json
{
 "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluIiwiZ3JhbnRUeXBlIjoiYWNjZXNzIiwiZXhwIjoxNjU2NTE2OTExLCJpc3MiOiJ2ZWxhLWlzc3VlciIsIm5iZiI6MTY1NjUxMzMxMX0.zsUW_ME5mxTQxP-UFxQa4F8QDI-69RWpcfIFkn_WFSg",
 "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluIiwiZ3JhbnRUeXBlIjoicmVmcmVzaCIsImV4cCI6MTY1NjU5NzY3MiwiaXNzIjoidmVsYS1pc3N1ZXIiLCJuYmYiOjE2NTY1MTEyNzJ9.mUjXj1BQ2c3MaVyYnMYefgH2g8Y-swgjyCAzH-GbZu8"
}
```

## API Document

### 1.3

Refer to [Kubevela API 1.3](https://kubevela.stoplight.io/docs/kubevela/1d086db94299e-kube-vela-api-1-3)

### 1.4

Refer to [Kubevela API 1.4](https://kubevela.stoplight.io/docs/kubevela/uz7fzdxthv175-kube-vela-api-1-4)

### 1.5

Refer to [KubeVela API 1.5](https://kubevela.stoplight.io/docs/kubevela/pi1st0zdzoejp-kube-vela-api-1-5)

