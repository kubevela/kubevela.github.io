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
		if !(strings.HasSuffix(path, ".md") || strings.HasSuffix(path, ".mdx")) ||
			strings.Contains(path, "node_modules/") ||
			strings.Contains(path, "version-v1.0") ||
			strings.HasSuffix(path, "introduction.md") ||
			strings.HasSuffix(path, "README.md") {
			return nil
		}
		data, err := os.ReadFile(path)
		if err != nil {
			fmt.Printf("readfile %s err %v\n", path, err)
			return nil
		}
		targetDir := filepath.Dir(path)
		buff := bytes.NewBuffer(data)
		fixedBuff := strings.Builder{}
		fixed := false
		for {
			line, err := buff.ReadString('\n')
			if err != nil && len(line) == 0 {
				break
			}
			sections := strings.Split(line, "](")
			if len(sections) <= 1 {
				fixedBuff.WriteString(line)
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
				link := s[:d]
				suffix := s[d:]
				targetFilePath := filepath.Clean(targetDir + "/" + link)

				var suffix1, suffix2 string
				targetFilePath, suffix1 = splitSuffix(targetFilePath, "#")
				targetFilePath, suffix2 = splitSuffix(targetFilePath, "?")
				linkSuffix := suffix2 + suffix1
				link, _ = splitSuffix(link, "#")
				link, _ = splitSuffix(link, "?")

				if _, err = os.Stat(targetFilePath); err == nil {
					continue
				}
				for _, ext := range []string{".md", ".mdx"} {
					if _, err = os.Stat(targetFilePath + ext); err == nil {
						fixedSection := fixSection(link, ext, linkSuffix, suffix)
						sections[idx] = fixedSection
						fixed = true
						break
					}
				}
			}

			fixedBuff.WriteString(strings.Join(sections, "]("))
		}

		if fixed {
			err = os.WriteFile(path, []byte(fixedBuff.String()), 0644)
			if err != nil {
				fmt.Printf("writefile %s err %v\n", path, err)
				return nil
			}
			fmt.Printf("fixed %s\n", path)
		}
		cnt++
		return nil
	})
	fmt.Printf("%d total files checked\n", cnt)
}

func splitSuffix(s string, targetChar string) (string, string) {
	ss := strings.LastIndex(s, targetChar)
	if ss != -1 {
		return s[:ss], s[ss:]
	}
	return s, ""
}

func fixSection(link, fileExt, linkSuffix, suffix string) string {
	return link + fileExt + linkSuffix + suffix
}
