---
title:  基础入门
---

CUE 是 KubeVela 的核心依赖，也是用户实现自定义扩展的主要方式。本章节将详细介绍 CUE 的基础知识，帮助你更好地使用 KubeVela。

## 概述

KubeVela 将 CUE 作为应用交付核心依赖和扩展方式的原因如下：：

- **CUE 本身就是为大规模配置而设计。** CUE 能够感知非常复杂的配置文件，并且能够安全地更改可修改配置中成千上万个对象的值。这非常符合 KubeVela 的目标，即以可编程的方式，去定义和交付生产级别的应用程序。
-  **CUE 支持一流的代码生成和自动化。** CUE 原生支持与现有工具以及工作流进行集成，反观其他工具则需要自定义复杂的方案才能实现。例如，需要手动使用 Go 代码生成 OpenAPI 模式。KubeVela 也是依赖 CUE 该特性进行构建开发工具和 GUI 界面的。
- **CUE 与 Go 完美集成。** KubeVela 像 Kubernetes 系统中的大多数项目一样使用 GO 进行开发。CUE 已经在 Go 中实现并提供了丰富的 API。KubeVela 以 CUE 为核心实现 Kubernetes 控制器。借助 CUE，KubeVela 可以轻松处理数据约束问题。

> 更多细节请查看 [The Configuration Complexity Curse](https://blog.cedriccharly.com/post/20191109-the-configuration-complexity-curse/) 以及 [The Logic of CUE](https://cuelang.org/docs/concepts/logic/)。

## 前提

请确保你的环境中已经安装如下命令行：
* [`cue` v0.2.2](https://cuelang.org/docs/install/) 目前 KubeVela 暂时只支持 CUE v0.2.2 版本，将在后续迭代中升级支持新的 CUE 版本。
* [`vela` >= v1.1.0](../../install#3-get-kubevela-cli)

## 学习 CUE 命令行

CUE 是 JSON 的超集， 我们可以像使用 JSON 一样使用 CUE，并具备以下特性：

* C 语言风格的注释
* 字段名称可以用双引号括起来，注意字段名称中不可以带特殊字符
* 可选字段末尾是否有逗号
* 允许数组中最后一个元素末尾带逗号
* 外大括号可选

请先复制以下信息，保存为一个 `first.cue` 文件：

```
a: 1.5
a: float
b: 1
b: int
d: [1, 2, 3]
g: {
	h: "abc"
}
e: string
```

接下来，我们以上面这个文件为例子，来学习 CUE 命令行的相关指令：

* 如何格式化 CUE 文件。（如果你使用 Goland 或者类似 JetBrains IDE，
  可以参考该文章配置自动格式化插件 [使用 Goland 设置 cuelang 的自动格式化](https://wonderflow.info/posts/2020-11-02-goland-cuelang-format/)。）
  
  该命令不仅可以格式化 CUE 文件，还能提示错误的模型，相当好用的命令。
    ```shell
    cue fmt first.cue
    ```

* 如何校验模型。除了 `cue fmt`，你还可以使用 `cue vet` 来校验模型。
    ```shell
    $ cue vet first.cue
    some instances are incomplete; use the -c flag to show errors or suppress this message
    
    $ cue vet first.cue -c
    e: incomplete value string

    ```
  提示我们：这个文件里的 e 这个变量，有数据类型 `string` 但并没有赋值。

* 如何计算/渲染结果。 `cue eval` 可以计算 CUE 文件并且渲染出最终结果。
  我们看到最终结果中并不包含 `a: float` 和 `b: int`，这是因为这两个变量已经被计算填充。
  其中 `e: string` 没有被明确的赋值, 故保持不变.
    ```shell
   $ cue eval first.cue
    a: 1.5
    b: 1
    d: [1, 2, 3]
    g: {
    h: "abc"
    }
    e: string
    ```

* 如何指定渲染的结果。例如，我们仅想知道文件中 `b` 的渲染结果，则可以使用该参数 `-e`。
    ```shell
    $ cue eval -e b first.cue
    1
    ```

* 如何导出渲染结果。 `cue export` 可以导出最终渲染结果。如果一些变量没有被定义执行该命令将会报错。
    ```shell
    $ cue export first.cue
    e: incomplete value string  
    ```
  我们更新一下 `first.cue` 文件，给 `e` 赋值：
    ```shell
    a: 1.5
    a: float
    b: 1
    b: int
    d: [1, 2, 3]
    g: {
      h: "abc"
    }
    e: string
    e: "abc"
    ```
  然后，该命令就可以正常工作。默认情况下, 渲染结果会被格式化为 JSON 格式。
    ```shell
    $ cue export first.cue
    {
        "a": 1.5,
        "b": 1,
        "d": [
            1,
            2,
            3
        ],
        "g": {
            "h": "abc"
        },
        "e": "abc"
    }
    ```

* 如何导出 YAML 格式的渲染结果。
    ```shell
    $ cue export first.cue --out yaml
    a: 1.5
    b: 1
    d:
    - 1
    - 2
    - 3
    g:
      h: abc
    e: abc
    ```

* 如何导出指定变量的结果。
    ```shell
    $ cue export -e g first.cue
    {
        "h": "abc"
    }
    ```

以上, 你已经学习完所有常用的 CUE 命令行指令。

## 学习 CUE 语言

在熟悉完常用 CUE 命令行指令后，我们来进一步学习 CUE 语言。

先了解 CUE 的数据类型。以下是它的基础数据类型：

```shell
// float
a: 1.5

// int
b: 1

// string
c: "blahblahblah"

// array
d: [1, 2, 3, 1, 2, 3, 1, 2, 3]

// bool
e: true

// struct
f: {
	a: 1.5
	b: 1
	d: [1, 2, 3, 1, 2, 3, 1, 2, 3]
	g: {
		h: "abc"
	}
}

// null
j: null
```

如何自定义 CUE 类型？使用 `#` 符号来指定一些表示 CUE 类型的变量。

```
#abc: string
```

我们将上述内容保存到 `second.cue` 文件。 执行 `cue export` 不会报 `#abc` 是一个类型不完整的值。

```shell
$ cue export second.cue
{}
```

你还可以定义更复杂的自定义结构，比如：

```
#abc: {
  x: int
  y: string
  z: {
    a: float
    b: bool
  }
}
```

自定义结构在 KubeVela 中被广泛用于模块定义（X-Definitions）和进行验证。

## 定义一个 CUE 模板

下面，我们开始尝试利用刚刚学习到的知识，来定义 CUE 模版。

1. 定义结构体变量 `parameter`.

```shell
parameter: {
	name: string
	image: string
}
```

保存上述变量到文件 `deployment.cue`.

2. 定义更复杂的结构变量 `template` 同时引用变量 `parameter`.

```
template: {
	apiVersion: "apps/v1"
	kind:       "Deployment"
	spec: {
		selector: matchLabels: {
			"app.oam.dev/component": parameter.name
		}
		template: {
			metadata: labels: {
				"app.oam.dev/component": parameter.name
			}
			spec: {
				containers: [{
					name:  parameter.name
					image: parameter.image
				}]
			}}}
}
```

熟悉 Kubernetes 的你可能已经知道，这是 Kubernetes Deployment 的模板。 `parameter` 为模版的参数部分。

添加上述内容到文件 `deployment.cue`.

3. 随后, 我们通过更新以下内容来完成变量赋值:

```
parameter:{
   name: "mytest"
   image: "nginx:v1"
}
```

4. 最后, 导出渲染结果为 YAML 格式:

```shell
$ cue export deployment.cue -e template --out yaml

apiVersion: apps/v1
kind: Deployment
spec:
  selector:
    matchLabels:
      app.oam.dev/component: mytest
  template:
    metadata:
      labels:
        app.oam.dev/component: mytest
    spec:
      containers:
      - name: mytest
        image: nginx:v1
```

以上，你就得到了一个 Kubernetes Deployment 类型的模板。

## CUE 的更多用法

* 设计开放的结构体和数组。如果在数组或者结构体中使用 `...`，则说明该对象为开放的。
   -  数组对象 `[...string]` ，说明该对象可以容纳多个字符串元素。
      如果不添加 `...`, 该对象 `[string]` 说明数组只能容纳一个类型为 `string` 的元素。
   -  如下所示的结构体说明可以包含未知字段。
      ```
      {
        abc: string   
        ...
      }
      ```

* 使用运算符  `|` 来表示两种类型的值。如下所示，变量 `a` 表示类型可以是字符串或者整数类型。

```shell
a: string | int
```

* 使用符号 `*` 定义变量的默认值。通常它与符号 `|` 配合使用，
  代表某种类型的默认值。如下所示，变量 `a` 类型为 `int`，默认值为 `1`。

```shell
a: *1 | int
```

* 让一些变量可被选填。 某些情况下，一些变量不一定被使用，这些变量就是可选变量，我们可以使用 `?:` 定义此类变量。
  如下所示, `a` 是可选变量, 自定义 `#my` 对象中 `x` 和 `z` 为可选变量， 而 `y` 为必填字段。

```
a ?: int

#my: {
x ?: string
y : int
z ?:float
}
```

选填变量可以被跳过，这经常和条件判断逻辑一起使用。
具体来说，如果某些字段不存在，则 CUE 语法为 `if _variable_！= _ | _` ，如下所示：

```
parameter: {
    name: string
    image: string
    config?: [...#Config]
}
output: {
    ...
    spec: {
        containers: [{
            name:  parameter.name
            image: parameter.image
            if parameter.config != _|_ {
                config: parameter.config
            }
        }]
    }
    ...
}
```

* 使用运算符 `&` 来运算两个变量。

```shell
a: *1 | int
b: 3
c: a & b
```

保存上述内容到 `third.cue` 文件。

你可以使用 `cue eval` 来验证结果：

```shell
$ cue eval third.cue
a: 1
b: 3
c: 3
```

* 需要执行条件判断。当你执行一些级联操作时，不同的值会影响不同的结果，条件判断就非常有用。
  因此，你可以在模版中执行 `if..else` 的逻辑。

```shell
price: number
feel: *"good" | string
// Feel bad if price is too high
if price > 100 {
    feel: "bad"
}
price: 200
```

保存上述内容到 `fourth.cue` 文件。

你可以使用 `cue eval` 来验证结果：

```shell
$ cue eval fourth.cue
price: 200
feel:  "bad"
```

另一个示例是将布尔类型作为参数。

```
parameter: {
    name:   string
    image:  string
    useENV: bool
}
output: {
    ...
    spec: {
        containers: [{
            name:  parameter.name
            image: parameter.image
            if parameter.useENV == true {
                env: [{name: "my-env", value: "my-value"}]
            }
        }]
    }
    ...
}
```


* 使用 For 循环。 我们为了避免减少重复代码，常常使用 For 循环。
  - 映射遍历。
    ```cue
    parameter: {
        name:  string
        image: string
        env: [string]: string
    }
    output: {
        spec: {
            containers: [{
                name:  parameter.name
                image: parameter.image
                env: [
                    for k, v in parameter.env {
                        name:  k
                        value: v
                    },
                ]
            }]
        }
    }
    ```
  - 类型遍历。
    ```
    #a: {
        "hello": "Barcelona"
        "nihao": "Shanghai"
    }
    
    for k, v in #a {
        "\(k)": {
            nameLen: len(v)
            value:   v
        }
    }
    ```
  - 切片遍历。
    ```cue
    parameter: {
        name:  string
        image: string
        env: [...{name:string,value:string}]
    }
    output: {
      ...
         spec: {
            containers: [{
                name:  parameter.name
                image: parameter.image
                env: [
                    for _, v in parameter.env {
                        name:  v.name
                        value: v.value
                    },
                ]
            }]
        }
    }
    ```

另外，可以使用 `"\( _my-statement_ )"` 进行字符串内部计算，比如上面类型循环示例中，获取值的长度等等操作。

## 导入 CUE 内部包

CUE 有很多 [internal packages](https://pkg.go.dev/cuelang.org/go@v0.2.2/pkg) 可以被 KubeVela 使用，这样可以满足更多的开发需求。

比如，使用 `strings.Join` 方法将字符串数组拼接成字符串。

```cue
import ("strings")

parameter: {
	outputs: [{ip: "1.1.1.1", hostname: "xxx.com"}, {ip: "2.2.2.2", hostname: "yyy.com"}]
}
output: {
	spec: {
		if len(parameter.outputs) > 0 {
			_x: [ for _, v in parameter.outputs {
				"\(v.ip) \(v.hostname)"
			}]
			message: "Visiting URL: " + strings.Join(_x, "")
		}
	}
}
```

## 导入 Kubernetes 包

KubeVela 会从 Kubernetes 集群中读取 OpenAPI，并将 Kubernetes 所有资源自动构建为内部包。

你可以在 KubeVela 的 CUE 模版中通过 `kube/<apiVersion>` 导入这些包，就像使用 CUE 内部包一样。

比如，`Deployment` 可以这样使用：

```cue
import (
   apps "kube/apps/v1"
)

parameter: {
    name:  string
}

output: apps.#Deployment
output: {
    metadata: name: parameter.name
}
```

`Service` 可以这样使用（无需使用别名导入软件包）：

```cue
import ("kube/v1")

output: v1.#Service
output: {
	metadata: {
		"name": parameter.name
	}
	spec: type: "ClusterIP",
}

parameter: {
	name:  "myapp"
}
```

甚至已经安装的 CRD 也可以导入使用：

```
import (
  oam  "kube/core.oam.dev/v1alpha2"
)

output: oam.#Application
output: {
	metadata: {
		"name": parameter.name
	}
}

parameter: {
	name:  "myapp"
}
```

## 下一步

* 了解如何统一使用 CUE 来[管理自定义 OAM 模块](./definition-edit)。