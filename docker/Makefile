# File: /docker/Makefile
# Project: example-nestjs
# File Created: 24-06-2021 04:03:49
# Author: Clay Risser <email@clayrisser.com>
# -----
# Last Modified: 30-08-2021 17:41:38
# Modified By: Clay Risser <email@clayrisser.com>
# -----
# Silicon Hills LLC (c) Copyright 2021
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

NAME := $(shell node -e "console.log(require('../package.json').name)")
REGISTRY := $(shell node -e "console.log(require('../package.json').docker.registry)")
VERSION := $(shell node -e "console.log(require('../package.json').version)")
IMAGE := $(REGISTRY)/$(NAME)

include docker.mk

.PHONY: ~%
~%:
	@$(MAKE) -s $(shell echo $@ | $(SED) 's/^~//g') ARGS="-d"

.PHONY: %
%: ;
