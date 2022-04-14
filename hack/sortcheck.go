package main

import (
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"
)

func parseMarkdownFile(content string) (bool, error) {
	lines := strings.Split(content, "\n")
	// linesBeforeProperties
	propertiesStartIndex := 0
	for i, line := range lines {
		if strings.Contains(line, "### Properties") || strings.Contains(line, "### 属性") {
			propertiesStartIndex = i
			break
		}
	}
	headers := ""
	prevPropertyName := ""
	//properties
	for i := propertiesStartIndex + 1; i < len(lines); i++ {
		// empty line
		if !strings.Contains(lines[i], "|") {
			if headers == "" {
				continue
			}
			break
		}
		// header line
		if headers == "" {
			headers = lines[i]
			continue
		}
		// border line
		if strings.Contains(lines[i], "--") {
			continue
		}
		// properties
		attributes := strings.Split(lines[i], "|")
		if len(attributes) == 0 {
			return false, fmt.Errorf("lines %v:%v contains no property name", i, lines[i])
		}
		propertyName := attributes[0]
		if propertyName < prevPropertyName {
			return false, nil
		}
		prevPropertyName = propertyName
	}
	return true, nil
}

func checkComponentDocsPropertiesSort(dirpath string) error {
	files, err := ioutil.ReadDir(filepath.Clean(dirpath))
	if err != nil {
		fmt.Printf("[checkComponentDocsPropertiesSort] read dir %v error: %v\n", dirpath, err)
		return err
	}
	for _, file := range files {
		if !strings.HasSuffix(file.Name(), ".md") {
			continue
		}
		path := filepath.Join(dirpath, file.Name())
		data, err := ioutil.ReadFile(path)
		if err != nil {
			fmt.Printf("[checkComponentDocsPropertiesSort] read file %v error: %v\n", path, err)
			return err
		}
		validate, err := parseMarkdownFile(string(data))
		if err != nil {
			fmt.Printf("[checkComponentDocsPropertiesSort] parse file %v error: %v\n", path, err)
			return err
		}
		if !validate {
			fmt.Printf("[checkComponentDocsPropertiesSort] properties in file %v needs sorting in alphabetical order\n", path)
			return fmt.Errorf("[checkComponentDocsPropertiesSort] properties in file %v needs sorting in alphabetical order\n", path)
		}
	}
	return nil
}

func main() {
	latestVersion := ""
	dirEntries, err := os.ReadDir("./versioned_docs")
	if err != nil {
		fmt.Printf("err when read dir ./versioned_docs: %v\n", err)
		os.Exit(1)
	}
	for i := len(dirEntries) - 1; i >= 0; i-- {
		if strings.Contains(dirEntries[i].Name(), "version-v") {
			latestVersion = dirEntries[i].Name()
			break
		}
	}
	if len(latestVersion) == 0 {
		fmt.Printf("couldn't find latest version\n")
		os.Exit(1)
	}

	componentDocsFolders := [4]string{
		"./docs/end-user/components/cloud-services/terraform",
		"./versioned_docs/" + latestVersion + "/end-user/components/cloud-services/terraform",
		"./i18n/zh/docusaurus-plugin-content-docs/current/end-user/components/cloud-services/terraform",
		"./i18n/zh/docusaurus-plugin-content-docs/" + latestVersion + "/end-user/components/cloud-services/terraform",
	}
	for _, dirpath := range componentDocsFolders {
		if err := checkComponentDocsPropertiesSort(dirpath); err != nil {
			fmt.Printf("err in checkComponentDocsPropertiesSort(%v):%v", dirpath, err)
			os.Exit(1)
		}
	}
	fmt.Printf("all folders checked\n")
}
