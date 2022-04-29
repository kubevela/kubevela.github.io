---
title: Generate top 50 popular resources of AWS using 100 lines of code
author: Avery Qi (Tongji University) Zhengxi Zhou (Alibaba Cloud)
author_title: KubeVela Team
author_url: https://github.com/kubevela/kubevela
author_image_url: https://kubevela.io/img/logo.svg
tags: [ Terraform ]
description: ""
hide_table_of_contents: false
---

KubeVela currently supports AWS, Azure, GCP,  AliCloud, Tencent Cloud, Baidu Cloud, UCloud and other cloud vendors, and also provides [a quick and easy command line tool](https://kubevela.io/docs/next/platform-engineers/components/component-terraform) to introduce cloud resources from cloud providers. But supporting cloud resources from cloud providers one by one in KubeVela is not conducive to quickly satisfying users' needs for cloud resources. This doc provides a solution to quickly introduce the top 50 most popular cloud resources from AWS in less than 100 lines of code.

We also expect users to be inspired by this article to contribute cloud resources for other cloud providers.


## Where are the most popular cloud resources on AWS?

The official Terraform website provides Terraform modules for each cloud provider, for example, [AWS cloud resource Terraform modules](https://registry.terraform.io/namespaces/terraform-aws-modules). And the cloud resources are sorted by popularity of usage (downloads), for example, AWS VPC has 18.7 million downloads.

Through a simple analysis, we found that the data for the top 50 popular Terraform modules for AWS can be obtained by requesting [https://registry.terraform.io/v2/modules?filter%5Bprovider%5D=aws&include=latest-version&page%5Bsize%5D=50&page%5Bnumber%5D=1](https://registry.terraform.io/v2/modules?filter%5Bprovider%5D=aws&include=latest-version&page%5Bsize%5D=50&page%5Bnumber%5D=1).



## Prerequisites

The code accepts two parameters.

* provider Name
* The URL of the Terraform Modules corresponding to the provider

For AWS, Provider Name should be “aws”，corresponding Terraform modules URL is[Terraform Modules json API](https://registry.terraform.io/v2/modules?filter%5Bprovider%5D=aws&include=latest-version&page%5Bsize%5D=50&page%5Bnumber%5D=1)(Searching top 50 popular resources for provider aws in [Terraform Registry](https://registry.terraform.io/)).

You need to make sure the providerName(aws) and Modules links are correct before executing the code.


## Executing the code

Then you can quickly bring in the top 50 most popular AWS cloud resources in bulk with the following 100 lines of code (filename gen.go).

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


Executing the following command:


```
go run gen.go aws "https://registry.terraform.io/v2/modules?filter%5Bprovider%5D=aws&include=latest-version&page%5Bsize%5D=50&page%5Bnumber%5D=1"
```



## Explanation for the code


### Unmarshal the json data for the resources

Access the URL passed in by the user and parse the returned json data into the Go structure.

The json format corresponding to the resource is as follows.


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


In the json data corresponding to Modules, we only care about two key-value pairs, viz.

* data: A list containing the names and properties of Modules
* Included: Information about the specific version of Modules filtered out

In this case, for each Module element in data, resolve its attributes, Id and the id corresponding to the latest-version in relationship; for each Module version element in Included, resolve its attributes and Id.

The attributes are further resolved as follows five items: 

* Name
* Downloads
* Source
* Description
* Verified

The Go structure is named as `TFDownload `, The http library gets the json data and then parses the structure of the Terraform modules through the `json.Unmarshal`.


### generating ComponentDefinitions in batch

1. creating directory and component definitions

After parsing, create a new folder in the current directory and name the folder as \<provider name\>.

Iterate through the parsed data, and for each Module element, perform the following operations to generate the corresponding definition and documentation for it.

2. Generate definition files

Generate the definition file by reading the corresponding information from the module's github repository using the following vela command.


```
vela def init {ModuleName} --type component --provider {providerName} --git {gitURL} --desc {description} -o {yamlFileName}
```


Several items to be filled in the instruction are passed in from the parsed Module structure.

* gitURL: 	{Module.Attributes.Source}.git
* description: If there are elements in `Included` which have the same ID with relationship.latest-version.ID, set the description as the corresponding description in `Included` elements, otherwise set the description as providerName+ModuleName. 
* yamlFileName：terraform-{providerName}-{Module.Attributes.Name}.yaml



## Have a try?

There are also a number of cloud providers that offer a wealth of Terraform modules, such as

GCP: [https://registry.terraform.io/namespaces/terraform-google-modules](https://registry.terraform.io/namespaces/terraform-google-modules)

Alibaba Cloud: [https://registry.terraform.io/namespaces/terraform-alicloud-modules](https://registry.terraform.io/namespaces/terraform-alicloud-modules)

Do you want to extend cloud resources for your current or favorite cloud provider for KubeVela as well?
