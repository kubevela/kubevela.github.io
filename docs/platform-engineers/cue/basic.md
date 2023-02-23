---
title: CUE Basic
---

In this section, we will explain more about how KubeVela use CUE to encapsulate and abstract a given capability in Kubernetes in detail.

We'll start from some basic CUE knowledge first, if you don't have any idea of [KubeVela Concept](../../getting-started/core-concept), don't worry! This doc is available for anyone who want to learn how to use CUE in practice quickly.

## Overview

The reasons for KubeVela supports CUE as a first-class solution to design abstraction can be concluded as below:

- **CUE is designed for large scale configuration.** CUE has the ability to understand a
 configuration worked on by engineers across a whole company and to safely change a value that modifies thousands of objects in a configuration. This aligns very well with KubeVela's original goal to define and ship production level applications at web scale.
- **CUE supports first-class code generation and automation.** CUE can integrate with existing tools and workflows naturally while other tools would have to build complex custom solutions. For example, generate OpenAPI schemas with Go code. This is how KubeVela build developer tools and GUI interfaces based on the CUE templates.
- **CUE integrates very well with Go.**
 KubeVela is built with GO just like most projects in Kubernetes system. CUE is also implemented in and exposes a rich API in Go. KubeVela integrates with CUE as its core library and works as a Kubernetes controller. With the help of CUE, KubeVela can easily handle data constraint problems.

> Pleas also check [The Configuration Complexity Curse](https://blog.cedriccharly.com/post/20191109-the-configuration-complexity-curse/) and [The Logic of CUE](https://cuelang.org/docs/concepts/logic/) for more details.

## Prerequisites

Please make sure below CLIs are present in your environment:
* [`cue` v0.2.2+](https://cuelang.org/docs/install/).
* [`vela` v1.0.0+](../../install).

:::caution
Versions prior to KubeVela 1.6.0 use the v0.2.2 version of CUE, KubeVela 1.6.0+ uses the v0.5.0-alpha.1 version of CUE. Please use the CUE tool that matches your KubeVela version.
:::

## CUE CLI Basic

Below is the basic CUE data, you can define both schema and value in the same file with the almost same format:

```cue
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

CUE is a superset of JSON, we can use it like json with following convenience:

* C style comments,
* quotes may be omitted from field names without special characters,
* commas at the end of fields are optional,
* comma after last element in list is allowed,
* outer curly braces are optional.

CUE has powerful CLI commands. Let's keep the data in a file named `first.cue` and try. 

* Format the CUE file. If you're using Goland or similar JetBrains IDE,
  you can [configure save on format](https://wonderflow.info/posts/2020-11-02-goland-cuelang-format/) instead.
  This command will not only format the CUE, but also point out the wrong schema. That's very useful.
    ```shell
    cue fmt first.cue
    ```

* Schema Check, besides `cue fmt`, you can also use `cue vet` to check schema.
    ```shell
    cue vet first.cue
    ```

* Calculate/Render the result. `cue eval` will calculate the CUE file and render out the result.
  You can see the results don't contain `a: float` and `b: int`, because these two variables are calculated.
  While the `e: string` doesn't have definitive results, so it keeps as it is.
    ```shell
    cue eval first.cue
    ```
    ```cue
    a: 1.5
    b: 1
    d: [1, 2, 3]
    g: {
    h: "abc"
    }
    e: string
    ```

* Render for specified result. For example, we want only know the result of `b` in the file, then we can specify the parameter `-e`.
    ```shell
    cue eval -e b first.cue
    ```
    ```console
    1
    ```

* Export the result. `cue export` will export the result with final value. It will report an error if some variables are not definitive.
    ```shell
    cue export first.cue
    ```
    ```console
    e: cannot convert incomplete value "string" to JSON:
        ./first.cue:9:4
    ```
  We can complete the value by giving a value to `e`, for example:
    ```shell
    echo "e: \"abc\"" >> first.cue
    ```
  Then, the command will work. By default, the result will be rendered in json format.
    ```shell
    cue export first.cue
    ```
    ```json
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

* Export the result in YAML format.
    ```shell
    cue export first.cue --out yaml
    ```
    ```yaml
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

* Export the result for specified variable.
    ```shell
    cue export -e g first.cue
    ```
    ```cue
    {
        "h": "abc"
    }
    ```

For now, you have learned all useful CUE cli operations.

## CUE Language Basic

* Data structure: Below is the basic data structure of CUE.

```cue
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

// byte
g: `byte`

// null
j: null
```

* Define a custom CUE type. You can use a `#` symbol to specify some variable represents a CUE type.

```
#abc: string
```

Let's name it `second.cue`. Then the `cue export` won't complain as the `#abc` is a type not incomplete value.

```shell
cue export second.cue
```
```json
{}
```

You can also define a more complex custom struct, such as:

```cue
#abc: {
  x: int
  y: string
  z: {
    a: float
    b: bool
  }
}
```

It's widely used in KubeVela to define templates and do validation.

## CUE Templating and References

Let's try to define a CUE template with the knowledge just learned.

1. Define a struct variable `parameter`.

```cue
parameter: {
	name: string
	image: string
}
```

Let's save it in a file called `deployment.cue`.

2. Define a more complex struct variable `template` and reference the variable `parameter`.

```cue
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

People who are familiar with Kubernetes may have understood that is a template of K8s Deployment. The `parameter` part
is the parameters of the template.

Add it into the `deployment.cue`.

3. Then, let's add the value by adding following code block:

```cue
parameter:{
   name: "mytest"
   image: "nginx:v1"
}
```

4. Finally, let's export it in yaml:

```shell
cue export deployment.cue -e template --out yaml
```
```yaml
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
      - name: mytest
        image: nginx:v1
    metadata:
      labels:
        app.oam.dev/component: mytest
  selector:
    matchLabels:
      app.oam.dev/component: mytest
```

## Advanced CUE Schematic

* Using the `(key)` to use the value of the object as the new object name.

```
hello: "world"

(hello): "world2"
"my-\(hello)": "world3"
```

:::caution
In CUE v0.2.2, you need to use `"\(hello)"` to refer to objects. In high versions of CUE, it can be simplified to `(hello)`.
:::

* Open struct and list. Using `...` in a list or struct means the object is open.

   -  A list like `[...string]` means it can hold multiple string elements.
      If we don't add `...`, then `[string]` means the list can only have one `string` element in it.
   -  A struct like below means the struct can contain unknown fields. 
      ```cue
      {
        abc: string   
        ...
      }
      ```

* Operator  `|`, it represents a value could be both case. Below is an example that the variable `a` could be in string or int type.
  ```cue
  a: string | int
  ```

* Default Value, we can use `*` symbol to represent a default value for variable. That's usually used with `|`,
  which represents a default value for some type. Below is an example that variable `a` is `int` and it's default value is `1`.
  ```cue
  a: *1 | int
  ```

* Optional Variable. In some cases, a variable could not be used, they're optional variables, we can use `?:` to define it.
  In the below example, `a` is an optional variable, `x` and `z` in `#my` is optional while `y` is a required variable.
  ```cue
  a ?: int

  #my: {
    x ?: string
    y : int
    z ?:float
  }
  ```

:::caution
Note that `?:` and `*` cannot be used at the same time. If a variable has been specified as an optional variable, its default value will no longer take effect.
:::

Optional variables can be skipped, that usually works together with conditional logic.
Specifically, if some field does not exist, the CUE grammar is `if _variable_ != _|_`, the example is like below:
  ```cue
  #Config: {
    name:  string
    value: string
  }

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

* Operator  `&`, it used to calculate two variables.

```cue
a: *1 | int
b: 3
c: a & b
```

Saving it in `third.cue` file.

You can evaluate the result by using `cue eval`:

```shell
cue eval third.cue
```
```cue
a: 1
b: 3
c: 3
```

* Conditional statement, it's really useful when you have some cascade operations that different value affects different results.
  So you can do `if..else` logic in the template.

```cue
price: number
feel: *"good" | string
// Feel bad if price is too high
if price > 100 {
    feel: "bad"
}
price: 200
```

Saving it in `fourth.cue` file.

You can evaluate the result by using `cue eval`:

```shell
cue eval fourth.cue
```
```cue
price: 200
feel:  "bad"
```

Another example is to use bool type as parameter.

```cue
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


* For Loop: if you want to avoid duplicate, you may want to use for loop.
  - Loop for Map
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
  - Loop for type
    ```cue
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
    Note that we use `"\( _my-statement_ )"` for inner calculation in string, it's very useful!
  -  Loop for Slice
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
  - If clause in Loop {}
  ```cue
  parameter: [
	{
		name: "empty"
	}, {
		name: "xx1"
	},
  ]

  dataFrom: [ for _, v in parameter {
	if v.name != "empty" {
		name: v.name
	}
  }]
  ```
  the result is:
  ```console
  cue eval ../blog/a.cue -e dataFrom
  [{}, {
    name: "xx1"
  }]
  ```
  - If clause in Loop with condition
  ```cue
  parameter: [
	{
		name: "empty"
	}, {
		name: "xx1"
	},
  ]

  dataFrom: [ for _, v in parameter if v.name != "empty" {
	name: v.name
  }]
  ```
  the result is:
  ```console
  cue eval ../blog/a.cue -e dataFrom
  [{
    name: "xx1"
  }]
  ```

## Import CUE Internal Packages

CUE has many [internal packages](https://pkg.go.dev/cuelang.org/go@v0.2.2/pkg) which also can be used in KubeVela.

Below is an example that use `strings.Join` to `concat` string list to one string. 

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
            message: "Visiting URL:\n" + strings.Join(_x, "\n")
        }
    }
}
```

Great, now you've learned all of the basic skills and best practices about how to use CUE! 

If you want to learn more details of CUE, you can refer to [the CUE official documentation](https://cuelang.org/) or [the well documented tutorials](https://cuetorials.com/introduction/).


In the following sections, we'll start to learn how KubeVela use CUE to glue resources. Make sure you have learned the [core concepts](../../getting-started/core-concept) of KubeVela before that.

## Next

* Learn how to use CUE to extend KubeVela by [Managing Definition](./definition-edit).
