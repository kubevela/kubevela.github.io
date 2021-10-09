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

GREEN="\033[32m"
RED="\033[31m"
GREEN_BOLD="\033[1;32m"
RESET="\033[0m";


function success() { echo "${GREEN}[ok]: ${1} ${RESET}"; }
function error() { echo "${RED_BOLD}[error]: ${RED}${1} ${RESET}"; }
function info() { echo "${GREEN_BOLD}[info]: ${1} ${RESET}"; }