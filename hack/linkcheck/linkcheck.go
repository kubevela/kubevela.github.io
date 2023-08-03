package main

import (
	"bytes"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
)

func main() {
	var cnt int
	filepath.Walk(".", func(path string, info fs.FileInfo, err error) error {
		if !strings.HasSuffix(path, ".md") || strings.Contains(path, "node_modules/") || strings.Contains(path, "version-v1.0") || strings.HasSuffix(path, "introduction.md") || strings.HasSuffix(path, "README.md") {
			return nil
		}
		data, err := os.ReadFile(path)
		if err != nil {
			fmt.Printf("readfile %s err %v\n", path, err)
			return nil
		}
		if !strings.Contains(string(data), "](../") {
			return nil
		}
		targetDir := filepath.Dir(path)
		buff := bytes.NewBuffer(data)
		for {
			line, err := buff.ReadString('\n')
			if err != nil {
				break
			}
			sections := strings.Split(line, "](")
			if len(sections) <= 1 {
				continue
			}

			for idx, s := range sections {
				if idx < 1 {
					continue
				}
				if strings.HasPrefix(s, "http://") || strings.HasPrefix(s, "https://") || strings.HasPrefix(s, "#") || strings.HasPrefix(s, "/blog") || strings.HasPrefix(s, "/img") || strings.HasPrefix(s, "/zh/blog") {
					continue
				}
				d := strings.Index(s, ")")
				subStr := s[:d]
				targetFilePath := filepath.Clean(targetDir + "/" + subStr)

				targetFilePath = trimSuffix(targetFilePath, "#")
				targetFilePath = trimSuffix(targetFilePath, "?")

				if _, err = os.Stat(targetFilePath); err == nil {
					continue
				}
				if _, err = os.Stat(targetFilePath + ".md"); err == nil {
					continue
				}
				if _, err = os.Stat(targetFilePath + ".mdx"); err == nil {
					continue
				}
				fmt.Println("file:", path, "refer to a non-existent doc:", subStr, "search path:", targetFilePath)
				if strings.Contains(targetFilePath, "reference/addons/") {
					continue
				}
				os.Exit(1)
			}
		}
		cnt++
		return nil
	})
	fmt.Printf("%d total files checked\n", cnt)
}

func trimSuffix(s string, targetChar string) string {
	ss := strings.LastIndex(s, targetChar)
	if ss != -1 {
		return s[:ss]
	}
	return s
}
