/**
 * File: /src/types/integrationOperator.ts
 * Project: keycloak-socket
 * File Created: 30-08-2021 16:00:32
 * Author: Clay Risser <email@clayrisser.com>
 * -----
 * Last Modified: 08-10-2022 03:47:14
 * Modified By: Clay Risser
 * -----
 * Risser Labs LLC (c) Copyright 2021
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Var } from 'kustomize-operator';
import k8s from '@kubernetes/client-node';

export interface Socket extends k8s.KubernetesObject {
  spec?: SocketSpec; // SocketSpec `json:"spec,omitempty"`
}

export interface Plug extends k8s.KubernetesObject {
  spec?: PlugSpec; // PlugSpec `json:"spec,omitempty"`
}

export interface PlugSpec {
  apparatus?: Apparatus; // *SpecApparatus `json:"apparatus,omitempty"`
  config?: Record<string, string>; // map[string]string `json:"config,omitempty"`
  configConfigMapName?: string; // string `json:"configConfigMapName,omitempty"`
  configMapper?: Record<string, string>; // map[string]string `json:"configMapper,omitempty"`
  configSecretName?: string; // string `json:"configSecretName,omitempty"`
  data?: Record<string, string>; // map[string]string `json:"data,omitempty"`
  dataConfigMapName?: string; // string `json:"dataConfigMapName,omitempty"`
  dataSecretName?: string; // string `json:"dataSecretName,omitempty"`
  interface?: NamespacedName; // NamespacedName `json:"interface,omitempty"`
  interfaceVersions?: string; // string `json:"interfaceVersions,omitempty"`
  namespaceScope?: string; // string `json:"namespaceScope,omitempty"`
  resources?: Resource[]; // []*Resource `json:"resources,omitempty"`
  socket?: NamespacedName; // NamespacedName `json:"socket,omitempty"`
  vars?: Var[]; // []kustomizeTypes.Var `json:"vars,omitempty" yaml:"vars,omitempty"`
}

export interface SocketSpec {
  apparatus?: Apparatus; // *SpecApparatus `json:"apparatus,omitempty"`
  config?: Record<string, string>; // map[string]string `json:"config,omitempty"`
  configConfigMapName?: string; // string `json:"configConfigMapName,omitempty"`
  configMapper?: Record<string, string>; // map[string]string `json:"configMapper,omitempty"`
  configSecretName?: string; // string `json:"configSecretName,omitempty"`
  data?: Record<string, string>; // map[string]string `json:"data,omitempty"`
  dataConfigMapName?: string; // string `json:"dataConfigMapName,omitempty"`
  dataSecretName?: string; // string `json:"dataSecretName,omitempty"`
  interface?: NamespacedName; // NamespacedName `json:"interface,omitempty"`
  interfaceVersions?: string; // string `json:"interfaceVersions,omitempty"`
  namespaceScope?: string; // string `json:"namespaceScope,omitempty"`
  resources?: Resource[]; // []*Resource `json:"resources,omitempty"`
  vars?: Var[]; // []kustomizeTypes.Var `json:"vars,omitempty" yaml:"vars,omitempty"`
}

export interface Apparatus {
  containers?: k8s.V1Container[]; // []*v1.Container `json:"containers,omitempty"`
  endpoint?: string; // string `json:"endpoint,omitempty"`
}

export interface NamespacedName {
  name?: string; // string `json:"name"`
  namespace?: string; // string `json:"namespace,omitempty"`
}

export interface Resource {
  do?: Do; // Do `json:"do,omitempty"`
  resource?: string; // string `json:"resource,omitempty"`
  when?: When; // When `json:"when,omitempty"`
}

export enum Do {
  Apply = 'apply',
  Delete = 'delete',
}

export enum When {
  Broken = 'broken',
  Coupled = 'coupled',
  Created = 'created',
  Decoupled = 'decoupled',
  Deleted = 'deleted',
  Updated = 'updated',
}
