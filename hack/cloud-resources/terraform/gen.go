package main

import (
	"bytes"
	"fmt"
	"io/fs"
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"

	"github.com/olekukonko/tablewriter"
)

const (
	Terraform      = "Terraform"
	targetOutputEn = "../docs/end-user/components/cloud-services/cloud-resources-list.md"
	targetOutputZh = "../i18n/zh/docusaurus-plugin-content-docs/current/end-user/components/cloud-services/cloud-resources-list.md"
	Zh             = "zh"
	En             = "en"
)

type I18N struct {
	Language   string `json:"language"`
	TargetFile *os.File
}

func main() {
	terraformPath := "../docs/end-user/components/cloud-services/terraform"
	infos, err := ioutil.ReadDir(terraformPath)

	f, err := os.OpenFile(targetOutputEn, os.O_APPEND|os.O_RDWR|os.O_CREATE|os.O_TRUNC, 0644)
	if err != nil {
		panic(err)
	}
	i18n := I18N{Language: En, TargetFile: f}
	i18n.createTitle()
	i18n.createTable(terraformPath, infos)

	f2, err := os.OpenFile(targetOutputZh, os.O_APPEND|os.O_RDWR|os.O_CREATE|os.O_TRUNC, 0644)
	if err != nil {
		panic(err)
	}
	i18n = I18N{Language: Zh, TargetFile: f2}
	i18n.createTitle()
	i18n.createTable(terraformPath, infos)

	//i18n.createSidebar(infos)
}

func (i18n I18N) createTable(defDocPath string, infos []fs.FileInfo) {
	var out = &bytes.Buffer{}
	table := tablewriter.NewWriter(out)
	table.SetColWidth(200)
	switch i18n.Language {
	case En:
		table.SetHeader([]string{"Orchestration Type", "Cloud Provider", "Cloud Resource", "Description"})
	case Zh:
		table.SetHeader([]string{"编排类型", "云服务商", "云资源", "描述"})
	}
	table.SetCenterSeparator("|")
	table.SetBorders(tablewriter.Border{Left: true, Top: false, Right: true, Bottom: false})
	table.SetAutoMergeCells(true)
	table.SetAutoFormatHeaders(false)

	for _, info := range infos {
		var cloud string

		name := strings.Replace(info.Name(), ".md", "", -1)
		provider := strings.Split(name, "-")[0]
		resource := strings.ReplaceAll(strings.Replace(name, provider+"-", "", 1), "-", " ")
		switch provider {
		case "aws":
			cloud = "AWS"
		case "azure":
			cloud = "Azure"
		case "alibaba":
			cloud = "Alibaba Cloud"
			if i18n.Language == Zh {
				cloud = "阿里云"
			}
		case "tencent":
			cloud = "Tencent Cloud"
			if i18n.Language == Zh {
				cloud = "腾讯云"
			}
		case "gcp":
			cloud = "Google Cloud Platform"
			if i18n.Language == Zh {
				cloud = "Google Cloud Platform"
			}
		case "baidu":
			cloud = "Baidu Cloud"
			if i18n.Language == Zh {
				cloud = "百度云"
			}
		default:
			panic("Not supported Cloud Provider: " + provider)
		}
		resourceLink := fmt.Sprintf("[%s](./terraform/%s)", resource, info.Name())
		data, err := ioutil.ReadFile(filepath.Join(defDocPath, info.Name()))
		if err != nil {
			panic(err)
		}
		lines := strings.Split(string(data), "\n")

		for i, line := range lines {
			var description string
			if strings.Contains(line, "Description") {
				for j := i + 1; j < len(lines); j++ {
					if strings.TrimSpace(lines[j]) == "" {
						continue
					}
					description = lines[j]
					break
				}
				table.Append([]string{Terraform, cloud, resourceLink, description})
				break
			}
		}
	}
	table.Render()

	if _, err := i18n.TargetFile.WriteString(out.String()); err != nil {
		panic(err)
	}
}

func (i18n I18N) createSidebar(infos []fs.FileInfo) {
	var (
		sidebar string
	)
	for _, info := range infos {
		name := strings.Replace(info.Name(), ".md", "", -1)
		sidebar += fmt.Sprintf("            \"end-user/components/cloud-services/terraform/%s\",\n", name)
	}

	if _, err := i18n.TargetFile.WriteString("\n# Sidebar\n\n" + sidebar); err != nil {
		panic(err)
	}

}

func (i18n I18N) createTitle() {
	var title string
	switch i18n.Language {
	case En:
		title = "---\ntitle: Supported Cloud Resource list\n---\n\n"
	case Zh:
		title = "---\ntitle: 云资源列表\n---\n\n"
	}

	if _, err := i18n.TargetFile.WriteString(title); err != nil {
		panic(err)
	}
}
