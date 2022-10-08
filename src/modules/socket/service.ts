/**
 * File: /src/modules/socket/service.ts
 * Project: keycloak-socket
 * File Created: 30-08-2021 18:07:12
 * Author: Clay Risser <email@clayrisser.com>
 * -----
 * Last Modified: 08-10-2022 03:47:15
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

import * as k8s from '@kubernetes/client-node';
import KcAdminClient from '@keycloak/keycloak-admin-client';
import chalk from 'chalk';
import { AxiosError } from 'axios';
import { HttpService } from '@nestjs/axios';
import { Logger, Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export default class SocketService {
  private readonly kubeConfig: k8s.KubeConfig;
  private readonly coreV1Api: k8s.CoreV1Api;
  private readonly logger = new Logger(SocketService.name);

  timeout = 5000;

  constructor(private readonly httpService: HttpService) {
    this.kubeConfig = new k8s.KubeConfig();
    this.kubeConfig.loadFromDefault();
    this.coreV1Api = this.kubeConfig.makeApiClient(k8s.CoreV1Api);
  }

  async ready(baseUrl: string, timeout = 1000 * 60 * 5, retry = 5000) {
    try {
      await firstValueFrom(this.httpService.get(`${baseUrl}/auth`));
    } catch (err) {
      if (timeout < 0) throw err;
      const error = err as AxiosError;
      this.logger[(error.response?.status || 500) < 500 ? 'warn' : 'error'](
        error
      );
      await new Promise((r) => setTimeout(r, retry));
      return this.ready(baseUrl, timeout - retry);
    }
  }

  async createClient(
    options: CreateClientOptions
  ): Promise<CreateClientResult> {
    const {
      adminPassword,
      adminUsername,
      attributes,
      authorizationServicesEnabled,
      baseUrl,
      clientId,
      clientSecret,
      consentRequired,
      description,
      directAccessGrantsEnabled,
      implicitFlowEnabled,
      name,
      protocol,
      realmName,
      redirectUris,
      serviceAccountsEnabled
    }: CreateClientOptions = {
      adminUsername: 'admin',
      attributes: {},
      authorizationServicesEnabled: true,
      baseUrl: '/',
      consentRequired: false,
      description: '',
      directAccessGrantsEnabled: true,
      implicitFlowEnabled: true,
      protocol: 'openid-connect',
      realmName: 'master',
      redirectUris: ['*'],
      serviceAccountsEnabled: true,
      ...options
    };
    await this.ready(baseUrl);
    const keycloakAdmin = new KcAdminClient({ baseUrl: `${baseUrl}/auth` });
    await keycloakAdmin.auth({
      clientId: 'admin-cli',
      grantType: 'password',
      password: adminPassword,
      username: adminUsername
    });
    keycloakAdmin.setConfig({ realmName });
    const client = (await keycloakAdmin!.clients.find({ clientId }))?.[0];
    const result: CreateClientResult = {
      adminPassword,
      adminUsername,
      attributes,
      description,
      authorizationServicesEnabled,
      baseUrl,
      clientId,
      clientSecret,
      consentRequired,
      directAccessGrantsEnabled,
      implicitFlowEnabled,
      name,
      realmName,
      redirectUris,
      serviceAccountsEnabled
    };
    if (client) {
      this.logger.log(`client ${clientId} already exists`);
      return result;
    }
    await keycloakAdmin!.clients.create({
      attributes,
      clientId,
      consentRequired,
      description,
      directAccessGrantsEnabled,
      enabled: true,
      implicitFlowEnabled,
      name: name || clientId,
      protocol,
      publicClient: !clientSecret?.length,
      redirectUris,
      ...(clientSecret?.length
        ? {
            authorizationServicesEnabled,
            secret: clientSecret,
            serviceAccountsEnabled
          }
        : {})
    });
    this.logger.log(`created client ${clientId}`);
    return result;
  }

  async applySecret(
    name: string,
    ns: string,
    stringData: Record<string, string> = {},
    data: Record<string, string> = {},
    owner?: k8s.KubernetesObject
  ) {
    const secretStringData = {
      ...stringData,
      ...Object.entries(data).reduce(this.base64DecodeMap, {})
    };
    try {
      let secret = (await this.coreV1Api.readNamespacedSecret(name, ns)).body;
      secret = (
        await this.coreV1Api.patchNamespacedSecret(
          name,
          ns,
          [
            {
              op: 'replace',
              path: '/data',
              value: Object.entries({
                ...(secret.stringData || {}),
                ...Object.entries(secret.data || {}).reduce(
                  this.base64DecodeMap,
                  {}
                ),
                ...secretStringData
              }).reduce(this.base64EncodeMap, {})
            }
          ],
          undefined,
          undefined,
          undefined,
          undefined,
          {
            headers: { 'Content-Type': 'application/json-patch+json' }
          }
        )
      ).body;
      this.logger.log(
        `updated ${this.getFullName({
          resource: secret
        })}`
      );
      return secret;
    } catch (err) {
      const error = err as { statusCode: number };
      if (error.statusCode !== 404) throw err;
      const secret = (
        await this.coreV1Api.createNamespacedSecret(ns, {
          metadata: {
            name,
            namespace: ns,
            ...(typeof owner !== 'undefined' && owner.metadata?.namespace === ns
              ? {
                  ownerReferences: [this.getOwnerReference(owner, ns)]
                }
              : {})
          },
          data: Object.entries(secretStringData).reduce(
            this.base64EncodeMap,
            {}
          )
        })
      ).body;
      this.logger.log(
        `created ${this.getFullName({
          resource: secret
        })}`
      );
      return secret;
    }
  }

  getOwnerReference(
    owner: k8s.KubernetesObject,
    childNamespace: string
  ): k8s.V1OwnerReference {
    const ownerNamespace = owner.metadata?.namespace;
    if (!childNamespace) {
      throw new Error(
        `cluster-scoped resource must not have a namespace-scoped owner, owner's namespace ${ownerNamespace}`
      );
    }
    if (ownerNamespace !== childNamespace) {
      throw new Error(
        `cross-namespace owner references are disallowed, owner's namespace ${ownerNamespace}, obj's namespace ${childNamespace}`
      );
    }
    return {
      apiVersion: owner?.apiVersion!,
      blockOwnerDeletion: true,
      controller: true,
      kind: owner?.kind!,
      name: owner?.metadata?.name!,
      uid: owner?.metadata?.uid!
    };
  }

  private base64EncodeMap(
    data: Record<string, string>,
    [key, value]: [string, string]
  ): Record<string, string> {
    data[key] = Buffer.from(value, 'utf-8').toString('base64');
    return data;
  }

  private base64DecodeMap(
    stringData: Record<string, string>,
    [key, value]: [string, string]
  ): Record<string, string> {
    stringData[key] = Buffer.from(value, 'base64').toString('utf-8');
    return stringData;
  }

  private getFullName({
    apiVersion,
    group,
    hideGroup,
    kind,
    name,
    ns,
    resource
  }: {
    apiVersion?: string;
    group?: string;
    hideGroup?: boolean;
    kind?: string;
    name?: string;
    ns?: string;
    resource?: k8s.KubernetesObject;
  }) {
    if (typeof hideGroup === 'undefined') hideGroup = true;
    if (resource) {
      ({ kind, apiVersion } = resource);
      name = resource.metadata?.name;
      ns = resource.metadata?.namespace;
    }
    if (apiVersion) {
      const splitApiVersion = apiVersion.split('/');
      group = splitApiVersion.length > 1 ? splitApiVersion[0] : undefined;
    }
    if (hideGroup) group = undefined;
    return `${chalk.yellow.bold(
      `${kind ? `${this.getFullType(kind, group)}/` : ''}${name}`
    )}${ns ? ` in ns ${chalk.blueBright.bold(ns)}` : ''}`;
  }

  private getFullType(kind: string, group?: string): string {
    return `${this.kind2plural(kind)}${group ? `.${group}` : ''}`;
  }

  private kind2plural(kind: string) {
    let lowercasedKind = kind.toLowerCase();
    if (lowercasedKind[lowercasedKind.length - 1] === 's') {
      return lowercasedKind;
    }
    if (lowercasedKind[lowercasedKind.length - 1] === 'o') {
      lowercasedKind = `${lowercasedKind}e`;
    }
    return `${lowercasedKind}s`;
  }
}

export interface CreateClientOptions {
  adminPassword: string;
  adminUsername?: string;
  attributes?: Record<string, string>;
  authorizationServicesEnabled?: boolean;
  baseUrl?: string;
  clientId: string;
  clientSecret?: string;
  consentRequired?: boolean;
  description?: string;
  directAccessGrantsEnabled?: boolean;
  implicitFlowEnabled?: boolean;
  name?: string;
  protocol?: 'openid-connect' | 'saml';
  realmName?: string;
  redirectUris?: string[];
  serviceAccountsEnabled?: boolean;
}

export type CreateClientResult = CreateClientOptions;
