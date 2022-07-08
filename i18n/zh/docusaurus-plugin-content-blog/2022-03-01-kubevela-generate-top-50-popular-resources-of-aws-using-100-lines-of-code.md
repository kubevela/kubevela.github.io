---
title: 如何用 100 行代码快速引入 AWS 最受欢迎的 50 种云资源
author: Avery Qi（同济大学） 周正喜（阿里云)
author_title: KubeVela Team
author_url: https://github.com/kubevela/kubevela
author_image_url: https://kubevela.io/img/logo.svg
tags: [ Terraform ]
description: ""
hide_table_of_contents: false
---

KubeVela 目前已经支持了 AWS、Azure、GCP、阿里云、腾讯云、百度云、UCloud 等云厂商，也提供了[简单快捷的命令行工具](https://kubevela.io/docs/next/platform-engineers/components/component-terraform)引入云服务商的云资源，但是在 KubeVela 里一个一个地支持云服务商的云资源不利于快速满足用户对于云资源的需求，本文提供了一个方案，用不到 100 行代码快速引入 AWS 前 50 最受欢迎的云资源。

同时，我们也期望用户受到本文的启发，贡献其他云服务商的云资源。

<!--truncate-->

## AWS 最受欢迎的云资源在哪里？

Terraform 官网提供了各个云服务商的 Terraform modules，比如 [AWS 的云资源 Terraform modules](https://registry.terraform.io/namespaces/terraform-aws-modules)。其中，云资源按照受欢迎的使用程度（下载量）排序，比如 AWS VPC 下载量为 1870 万次。

通过简单分析，我们发现 AWS 前 50 Terraform modules 的数据可以通过请求 [https://registry.terraform.io/v2/modules?filter%5Bprovider%5D=aws&include=latest-version&page%5Bsize%5D=50&page%5Bnumber%5D=1](https://registry.terraform.io/v2/modules?filter%5Bprovider%5D=aws&include=latest-version&page%5Bsize%5D=50&page%5Bnumber%5D=1) 获取。


## 开始之前

代码接受两个用户传入参数：

* provider 的名称
* 该 provider 对应的 Terraform Modules 的 URL

对于 AWS 来说，Provider名称为 “aws”，对应的 Terraform modules为[Terraform Modules json格式接口](https://registry.terraform.io/v2/modules?filter%5Bprovider%5D=aws&include=latest-version&page%5Bsize%5D=50&page%5Bnumber%5D=1)（即在[Terraform Registry](https://registry.terraform.io/)中搜索provider为aws时最受欢迎的50种云资源）。

在执行代码之前需要确认providerName(aws)和Modules链接无误。


## 执行代码

那么你就可以通过以下 100 行左右的代码（文件名 gen.go）来批量地快速引入 AWS 最受欢迎的前 50 种云资源。


```
import (
  "encoding/json"
  "fmt"
  "io"
  "log"
  "net/http"
  "os"
  "os/exec"
  "path/filepath"
  "strings"

  "github.com/pkg/errors"
)

type TFDownload struct {
  Data     []DataItem     `json:"data"`
  Included []IncludedItem `json:"included"`
}

type IncludedItem struct {
  Id         string     `json:"id"`
  Attributes Attributes `json:"attributes"`
}

type DataItem struct {
  Attributes    Attributes    `json:"attributes"`
  Relationships Relationships `json:"relationships"`
}

type Relationships struct {
  LatestVersion RelationshipLatestVersion `json:"latest-version"`
}

type RelationshipLatestVersion struct {
  Data RelationshipData `json:"data"`
}

type RelationshipData struct {
  Id string `json:"id"`
}

var errNoVariables = errors.New("failed to find main.tf or variables.tf in Terraform configurations")

type Attributes struct {
  Name        string `json:"name"`
  Downloads   int    `json:"downloads"`
  Source      string `json:"source"`
  Description string `json:"description"`
  Verified    bool   `json:"verified"`
}

func main() {
  if len(os.Args) < 2 {
     fmt.Println("Please provide the cloud provider name and an official Terraform modules URL")
     os.Exit(1)
  }
  providerName := os.Args[1]
  terraformModulesUrl := os.Args[2]
  resp, err := http.Get(terraformModulesUrl)
  if err != nil {
     log.Fatal(err)
  }
  defer resp.Body.Close()
  body, err := io.ReadAll(resp.Body)
  if err != nil {
     log.Fatal(err)
  }

  var modules TFDownload
  if err := json.Unmarshal(body, &modules); err != nil {
     fmt.Println(err.Error())
     os.Exit(1)
  }

  if _, err = os.Stat(providerName); err == nil {
     if err := os.RemoveAll(providerName); err != nil {
        log.Fatal(err)
     }
     fmt.Printf("Successfully deleted existed directory %s\n", providerName)
  }
  if _, err = os.Stat(providerName); os.IsNotExist(err) {
     if err := os.Mkdir(providerName, 0755); err != nil {
        if !os.IsExist(err) {
           log.Fatal(err)
        }
        fmt.Printf("Successfully created directory %s\n", providerName)
     }
  }

  for _, module := range modules.Data {
     var description string
     for _, attr := range modules.Included {
        if module.Relationships.LatestVersion.Data.Id == attr.Id {
           description = attr.Attributes.Description
        }
     }
     if description == "" {
        description = strings.ToUpper(providerName) + " " + strings.Title(module.Attributes.Name)
     }

     outputFile := fmt.Sprintf("%s/terraform-%s-%s.yaml", providerName, providerName, module.Attributes.Name)
     if _, err := os.Stat(outputFile); !os.IsNotExist(err) {
        continue
     }
     if providerName == "aws" && (module.Attributes.Name == "rds" || module.Attributes.Name == "s3-bucket" ||
        module.Attributes.Name == "subnet" || module.Attributes.Name == "vpc") {
        continue
     }
     if err := generateDefinition(providerName, module.Attributes.Name, module.Attributes.Source, "", description); err != nil {
        fmt.Println(err.Error())
        os.Exit(1)
     }
  }
}

func generateDefinition(provider, name, gitURL, path, description string) error {
  defYaml := filepath.Join(provider, fmt.Sprintf("terraform-%s-%s.yaml", provider, name))

  cmd := fmt.Sprintf("vela def init %s --type component --provider %s --git %s.git --desc \"%s\" -o %s",
     name, provider, gitURL, description, defYaml)
  if path != "" {
     cmd = fmt.Sprintf("%s --path %s", cmd, path)
  }
  fmt.Println(cmd)
  stdout, err := exec.Command("bash", "-c", cmd).CombinedOutput()
  if err != nil {
     return errors.Wrap(err, string(stdout))
  }
  fmt.Println(string(stdout))
  return nil
}
```


执行命令：


```
go run gen.go aws "https://registry.terraform.io/v2/modules?filter%5Bprovider%5D=aws&include=latest-version&page%5Bsize%5D=50&page%5Bnumber%5D=1"
```



## 代码简要说明


### 解析云资源数据

访问用户传入的URL，将返回的json数据解析为Go中的结构体。

资源对应的json格式如下：


```
{
  "data": [
    {
      "type": "modules",
      "id": "23",
      "attributes": {
        "downloads": 18440513,
        "full-name": "terraform-aws-modules/vpc/aws",
        "name": "vpc",
        "namespace": "terraform-aws-modules",
        "owner-name": "",
        "provider-logo-url": "/images/providers/aws.png",
        "provider-name": "aws",
        "source": "https://github.com/terraform-aws-modules/terraform-aws-vpc",
        "verified": true
      },
      "relationships": {
        "latest-version": {
          "data": {
            "id": "142143",
            "type": "module-versions"
          }
        }
      },
      "links": {
        "self": "/v2/modules/23"
      }
    },
    ...
  ],
  "included": [
    {
      "type": "module-versions",
      "id": "36806",
      "attributes": {
        "created-at": "2020-01-03T11:35:36Z",
        "description": "Terraform module Terraform module for creating AWS IAM Roles with heredocs",
        "downloads": 260030,
        "published-at": "2020-02-06T06:26:08Z",
        "source": "",
        "tag": "v2.0.0",
        "updated-at": "2022-02-22T00:45:44Z",
        "version": "2.0.0"
      },
      "links": {
        "self": "/v2/module-versions/36806"
      }
    },
    ...
  ],
  ...
}
```


在Modules对应的json数据中，我们只关心两个键值对，即：

* data：包含Modules名称及属性的列表
* Included：筛选出的特定版本的Modules具体信息

其中，对于data中的每个Module元素，解析它的属性，Id和relationship中的latest-version对应的id；对于Included中的每个Module版本元素，解析它的属性和Id。

属性又解析如下五项：

* Name
* Downloads
* Source
* Description
* Verified

结构体定义在结构体 `TFDownload `中，通过 http 库获取 json 数据，再通过 `json.Unmarshal` 解析出 Terraform modules 的结构体。


### 批量生成云资源

1. 新建目录，生成资源所需文件

解析完毕后，在当前目录下新建文件夹，文件夹命名为provider名称。

遍历解析后的data，对于其中每个Module元素，执行下述操作，为其生成相应配置文件，定义和相应文档。

2. 生成定义文件

通过下述 vela 指令从模块对应的github仓库读取相应信息生成定义文件。


```
vela def init {ModuleName} --type component --provider {providerName} --git {gitURL} --desc {description} -o {yamlFileName}
```


指令中需要填入的几项由解析好的Module结构体传入。

* gitURL: 	{Module.Attributes.Source}.git
* description:	如果Included中存在元素ID与模块relationship中latest-version对应ID相同，则description为Included中对应元素属性的description;否则description为providerName与模块名称的拼接
* yamlFileName：terraform-{providerName}-{Module.Attributes.Name}.yaml


## 你也来试试？

还有不少云服务商也提供了丰富的 Terraform modules，比如

GCP：[https://registry.terraform.io/namespaces/terraform-google-modules](https://registry.terraform.io/namespaces/terraform-google-modules)

阿里云：[https://registry.terraform.io/namespaces/terraform-alicloud-modules](https://registry.terraform.io/namespaces/terraform-alicloud-modules)

你要不要也为 KubeVela 引入你正在使用的、或喜欢的云服务商的云资源？

