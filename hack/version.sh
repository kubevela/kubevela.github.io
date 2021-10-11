#!/bin/bash -l
#
# Copyright 2021. The KubeVela Authors.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

source ./hack/color_print.sh

# get version name
version=$1

if [ ${#version} == 0 ]
then
  error "version name shouldn't be empty"
  info "example usage: make update-version version=v1.1"
  exit 1
fi

# 1 remove latestVersion's sidebars.json
rm -rf ./versioned_sidebars/version-"${version}"-sidebars.json
success "remove ./versioned_sidebars/version-${version}-sidebars.json"

# 2 remove ./version_docs/version-${version}
rm -rf ./versioned_docs/version-"${version}"
success "remove ./versioned_docs/version-${version}"

# 3 remove ${version} in versions.json
sed -i.bak "/${version}/d" versions.json
rm -rf versions.json.bak
success "update versions.json"

# 4 update docusaurus.config.js
sed -i.bak "s#lastVersion: '${version}'#lastVersion: 'current'#g" docusaurus.config.js
rm -rf docusaurus.config.js.bak
success "update docusaurus.config.js"

# 5 generate versioned docs
yarn run docusaurus docs:version "${version}"
sed -i.bak "s#lastVersion: 'current'#lastVersion: '${version}'#g" docusaurus.config.js
rm -rf docusaurus.config.js.bak
success "generate versioned docs"

# 6 update i18n docs
rm -rf ./i18n/zh/docusaurus-plugin-content-docs/version-"${version}"
cp -r ./i18n/zh/docusaurus-plugin-content-docs/current ./i18n/zh/docusaurus-plugin-content-docs/version-"${version}"
success "update i18n docs"