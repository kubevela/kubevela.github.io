---
title: Pyroscope
---

Pyroscope 是一个开源平台，由服务器和代理组成。 它允许用户以 CPU 和磁盘高效的方式收集、存储和查询分析数据。这个插件基于 [Pyroscope](https://github.com/pyroscope-io/pyroscope) 构建。

##  安装插件

```shell
vela addon enable pyroscope
```

在成功启用 pyroscope 之后，你可以执行下面的命令来暴露`4040`端口以提供控制台界面访问。

```shell
vela port-forward addon-pyroscope -n vela-system
```

## 如何使用 pyroscope trait

使用一个 webservice 组件来开始，将下面的声明保存到 pyroscope-demo.yaml，并运行 vela up -f app-demo.yaml 来启动。

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: pyroscope-app
  namespace: fourier
spec:
  components:
    - name: pyroscope-comp-01
      type: webservice
      properties:
        image: nginx:latest
        ports:
          - expose: true
            port: 80
            protocol: TCP
        imagePullPolicy: IfNotPresent
      traits:
        - type: pyroscope
          properties:
            server: "http://pyroscope-server:9084"
            logger: "pyroscope.StandardLogger"
            appName: "pyroscope-test"
        - type: scaler
          properties:
            replicas: 1
```
`appName`参数是一个可选字段，默认值是这个组件的名字。

## 如何使用 pyroscope 客户端
### 在 Golang 应用中使用 Pyroscope

- 为了在 Go 应用中启用分析，你需要在你的应用中导入 Pyroscope 模块。
```shell
# make sure you also upgrade pyroscope server to version 0.3.1 or higher
go get github.com/pyroscope-io/client/pyroscope
```
- 然后，在你的应用中添加如下代码：
```go
package main

import "github.com/pyroscope-io/client/pyroscope"

func main() {
  pyroscope.Start(pyroscope.Config{
    ApplicationName: "simple.golang.app",
    // 将这个地址替换为你的 pyroscope 服务端地址
    ServerAddress:   "http://pyroscope-server:4040",
    // 你可以通过设置值为 nil 来禁用日志
    Logger:          pyroscope.StandardLogger,

    // 如果 pyroscope 服务端启用了认证，需要指定 API 密钥：
    // AuthToken: os.Getenv("PYROSCOPE_AUTH_TOKEN"),

    // 默认启用所有的分析器，但是你也可以指定你想要启用的分析器：
    ProfileTypes: []pyroscope.ProfileType{
      pyroscope.ProfileCPU,
      pyroscope.ProfileAllocObjects,
      pyroscope.ProfileAllocSpace,
      pyroscope.ProfileInuseObjects,
      pyroscope.ProfileInuseSpace,
    },
  })

  // your code goes here
}
```
- 查看 [示例代码](https://github.com/pyroscope-io/pyroscope/tree/main/examples/golang-push) 目录来获取更多使用示例。

###  在 Java 应用中使用 Pyroscope

- Java 集成是通过一个名叫 pyroscope.jar 的 jar 包分发的。它包含了原生的 async-profile 库。
- 要开始分析一个 Java 应用，通过使用 pyroscope.jar 的 javaagent 来启动你的程序：
```shell
export PYROSCOPE_APPLICATION_NAME=my.java.app
export PYROSCOPE_SERVER_ADDRESS=http://pyroscope-server:4040

# 如果 pyroscope 服务端启用了认证，需要指定 API 密钥：
# export PYROSCOPE_AUTH_TOKEN={YOUR_API_KEY}

java -javaagent:pyroscope.jar -jar app.jar
```
- 查看 [示例代码](https://github.com/pyroscope-io/pyroscope/tree/main/examples/java) 目录来获取更多使用示例。

### 在.NET 应用中使用 Pyroscope

- 要开始分析容器里的 .NET 应用，你需要用 pyroscope exec 来包装你的应用程序作为镜像的 entrypoint。你需要在你的 Dockerfile 中使用 COPY --from 将 pyroscope 可执行二进制拷贝到你的容器里。
下面的 Dockerfile 演示了如何构建这个镜像：

```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:5.0

WORKDIR /dotnet

COPY --from=pyroscope/pyroscope:latest /usr/bin/pyroscope /usr/bin/pyroscope
ADD my-app .
RUN dotnet publish -o . -r $(dotnet --info | grep RID | cut -b 6- | tr -d ' ')

# 你可以像设置 pyroscope 服务地址一样设置其他的配置选项。
ENV PYROSCOPE_SERVER_ADDRESS=http://pyroscope-server:4040
ENV PYROSCOPE_APPLICATION_NAME=my.dotnet.app
ENV PYROSCOPE_LOG_LEVEL=debug

CMD ["pyroscope", "exec", "dotnet", "/dotnet/my-app.dll"]
```
- 如果你正在使用 Docker Compose，那么你可以使用下面的配置同时运行 pyroscope 服务端和客户端。
```yaml
---
version: "3.9"
services:
  pyroscope-server:
    image: "pyroscope/pyroscope:latest"
    ports:
      - "4040:4040"
    command:
      - "server"
  app:
    image: "my-app:latest"
    environment:
      PYROSCOPE_APPLICATION_NAME: my.dotnet.app
      PYROSCOPE_SERVER_ADDRESS: http://pyroscope-server:4040
      PYROSCOPE_LOG_LEVEL: debug
      ASPNETCORE_URLS: http://*:5000
    ports:
      - "5000:5000"
    cap_add:
      - SYS_PTRACE
```
- 查看 [示例代码](https://github.com/pyroscope-io/pyroscope/tree/main/examples/dotnet) 目录来获取更多使用示例。

### 在 Python 应用中使用 Pyroscope

- 首先，安装 pyroscope-io 的 pip 包：
```shell
pip install pyroscope-io
```
- 然后在你的应用中添加下面的代码。这些代码将会初始化 pyroscope 分析器并且启动分析：
```shell
import pyroscope

pyroscope.configure(
  app_name       = "my.python.app", # 将这里替换为你的应用名称
  server_address = "http://my-pyroscope-server:4040", # 将这个地址替换为你的 pyroscope 服务端地址
# auth_token     = "{YOUR_API_KEY}", # 如果 pyroscope 服务端启用了认证，需要指定 API 密钥
)
```
-  查看 pyroscope 仓库中的 [python 项目中的 pyroscope 示例](https://github.com/pyroscope-io/pyroscope/tree/main/examples/python) 来获取更多使用示例。

### 在 PHP 应用中使用 Pyroscope

- 要开始分析容器里的 PHP 应用，你需要用 pyroscope exec 来包装你的应用程序作为镜像的 entrypoint。你需要在你的 Dockerfile 中使用 COPY --from 将 pyroscope 可执行二进制拷贝到你的容器里。
下面的 Dockerfile 演示了如何构建这个镜像：

```dockerfile
FROM php:7.3.27

WORKDIR /var/www/html

# 这条命令从 pyroscope 镜像中拷贝 pyroscope 二进制文件到你的镜像
COPY --from=pyroscope/pyroscope:latest /usr/bin/pyroscope /usr/bin/pyroscope
COPY main.php ./main.php

# 通常你可以像设置 app name 一样来设置 pyroscope 服务端地址，请确保更新下面的配置：
ENV PYROSCOPE_APPLICATION_NAME=my.php.app
ENV PYROSCOPE_SERVER_ADDRESS=http://pyroscope:4040/

# 通过下面的命令来启动一个带 pyroscope 分析器的应用程序，请务必修改 "php" 和 "main.php" 为实际的命令。
CMD ["pyroscope", "exec", "php", "main.php"]
```
- 如果你正在使用 Docker Compose，那么你可以使用下面的配置同时运行 pyroscope 服务端和客户端。
```yaml
---
services:
  pyroscope-server:
    image: "pyroscope/pyroscope:latest"
    ports:
      - "4040:4040"
    command:
      - "server"
  app:
    image: "my-app:latest"
    env:
      PYROSCOPE_SERVER_ADDRESS: http://pyroscope-server:4040
      PYROSCOPE_APPLICATION_NAME: my.php.app
    cap_add:
      - SYS_PTRACE
```
- 查看 [示例代码](https://github.com/pyroscope-io/pyroscope/tree/main/examples/php) 目录来获取更多使用示例。

### 在 NodeJS 应用中使用 Pyroscope

- 要在一个 NodeJS 项目中启用 pyroscope 分析器，你需要使用 npm 来导入模块：
```shell
npm install @pyroscope/nodejs

# 或者
yarn add @pyroscope/nodejs
```
- 然后，在你的应用中添加下面的代码：
```js
const Pyroscope = require('@pyroscope/nodejs');

Pyroscope.init({
  serverAddress: 'http://pyroscope:4040',
  appName: 'myNodeService'
});

Pyroscope.start()
```
- 查看 [示例代码](https://github.com/pyroscope-io/pyroscope/tree/main/examples/nodejs) 目录来获取更多使用示例。


## 卸载插件

```shell
vela addon disable pyroscope
```
