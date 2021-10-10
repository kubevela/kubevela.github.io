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
				if strings.HasPrefix(s, "http://") || strings.HasPrefix(s, "https://") || strings.HasPrefix(s, "#") {
					continue
				}
				d := strings.Index(s, ")")
				subStr := s[:d]
				targetFilePath := filepath.Clean(targetDir + "/" + subStr)
				//fmt.Println(path, subStr, "=>", targetFilePath)
				if _, err1 := os.Stat(targetFilePath); err1 != nil {
					if _, err2 := os.Stat(targetFilePath + ".md"); err2 != nil {
						ss := strings.LastIndex(targetFilePath, "#")
						if ss != -1 {
							targetFilePath = targetFilePath[:ss]
						}
						ww := strings.LastIndex(targetFilePath, "?")
						if ww != -1 {
							targetFilePath = targetFilePath[:ww]
						}
						if _, err3 := os.Stat(targetFilePath + ".md"); err3 != nil {
							if _, err4 := os.Stat(targetFilePath + ".mdx"); err4 != nil {
								fmt.Println("file:", path, "refer to a non-existent doc:", subStr, "search path:", targetFilePath)
								os.Exit(1)
							}
						}
					}
				}
			}

		}
		cnt++
		return nil
	})
	fmt.Printf("%d total files effected\n", cnt)
}
