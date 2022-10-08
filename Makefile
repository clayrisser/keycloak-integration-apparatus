# File: /Makefile
# Project: keycloak-socket
# File Created: 15-03-2022 05:37:32
# Author: Clay Risser
# -----
# Last Modified: 08-10-2022 03:41:49
# Modified By: Clay Risser
# -----
# Risser Labs LLC (c) Copyright 2021 - 2022
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

include mkpm.mk
ifneq (,$(MKPM_READY))
include $(MKPM)/gnu
include $(MKPM)/mkchain
include $(MKPM)/yarn
include $(MKPM)/envcache
include $(MKPM)/dotenv

export BABEL ?= $(call yarn_binary,babel)
export BABEL_NODE ?= $(call yarn_binary,babel-node)
export CLOC ?= cloc
export CSPELL ?= $(call yarn_binary,cspell)
export ESLINT ?= $(call yarn_binary,eslint)
export JEST ?= $(call yarn_binary,jest)
export NODEMON ?= $(call yarn_binary,nodemon)
export PRETTIER ?= $(call yarn_binary,prettier)
export TSC ?= $(call yarn_binary,tsc)

ACTIONS += install
$(ACTION)/install: package.json
	@$(YARN) install $(ARGS)
	@$(call done,install)

ACTIONS += format~install ##
$(ACTION)/format: $(call git_deps,\.((json)|(md)|([jt]sx?))$$)
	-@$(call prettier,$?,$(ARGS))
	@$(call done,format)

ACTIONS += spellcheck~format ##
$(ACTION)/spellcheck: $(call git_deps,\.(md)$$)
	-@$(call cspell,$?,$(ARGS))
	@$(call done,spellcheck)

ACTIONS += lint~spellcheck ##
$(ACTION)/lint: $(call git_deps,\.([jt]sx?)$$)
	-@$(call eslint,$?,$(ARGS))
	@$(call done,lint)

ACTIONS += test~lint ##
$(ACTION)/test: $(call git_deps,\.([jt]sx?)$$)
	@$(MKDIR) -p node_modules/.tmp
	-@$(call jest,$?,$(ARGS))
	@$(call done,test)

ACTIONS += build~test ##
BUILD_TARGET := dist/main.js
dist/main.js:
	@$(call reset,build)
$(ACTION)/build: $(call git_deps,\.([jt]sx?)$$)
	@$(BABEL) --env-name umd src -d dist --extensions '.js,.jsx,.ts,.tsx' --source-maps
	@$(BABEL) --env-name esm src -d es --extensions '.js,.jsx,.ts,.tsx' --source-maps
	@$(TSC) -p tsconfig.build.json -d
	@$(call done,build)

.PHONY: start +start
start: | ~install +start ##
+start:
	@$(NODEMON) --exec $(BABEL_NODE) --extensions .ts src/main.ts $(ARGS)

COLLECT_COVERAGE_FROM := ["src/**/*.{js,jsx,ts,tsx}"]
.PHONY: coverage +coverage
coverage: | ~lint +coverage
+coverage:
	@$(JEST) --coverage --collectCoverageFrom='$(COLLECT_COVERAGE_FROM)' $(ARGS)

.PHONY: prepare
prepare: ;

.PHONY: upgrade
upgrade:
	@$(YARN) upgrade-interactive

.PHONY: inc
inc:
	@$(NPM) version patch --git=false $(NOFAIL)

.PHONY: count
count:
	@$(CLOC) $(shell $(GIT) ls-files)

.PHONY: publish +publish
publish: build
	@$(MAKE) -s +publish
+publish:
	@$(NPM) publish

.PHONY: pack +pack
pack: build
	@$(MAKE) -s +pack
+pack:
	@$(NPM) pack

.PHONY: docker-%
docker-%:
	@$(MAKE) -sC docker $(subst docker-,,$@) ARGS=$(ARGS)

.PHONY: clean
clean: docker-down ##
	-@$(MKCACHE_CLEAN)
	-@$(JEST) --clearCache $(NOFAIL)
	-@$(GIT) clean -fXd \
		$(MKPM_GIT_CLEAN_FLAGS) \
		$(YARN_GIT_CLEAN_FLAGS) \
		$(NOFAIL)

-include $(call actions)

CACHE_ENVS += \
	BABEL \
	BABEL_NODE \
	CLOC \
	CSPELL \
	ESLINT \
	JEST \
	PRETTIER \
	TSC

endif
